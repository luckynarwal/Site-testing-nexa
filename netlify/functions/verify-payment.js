// Netlify function: POST /.netlify/functions/verify-payment (exposed as /api/verify-payment)
// Verifies Razorpay payment signature. KEY_SECRET never leaves this file.
require('dotenv').config();
const crypto = require('crypto');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed. Use POST.' }),
    };
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Razorpay not configured on server' }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature' }),
    };
  }

  // HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  // Constant-time comparison
  const valid = crypto.timingSafeEqual(
    Buffer.from(expected, 'utf8'),
    Buffer.from(razorpay_signature, 'utf8')
  );

  if (!valid) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Signature mismatch — payment not verified', verified: false }),
    };
  }

  // Confirm the payment actually exists and is captured via Razorpay API
  try {
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    if (payment.status !== 'captured') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Payment not captured', verified: false, status: payment.status }),
      };
    }
  } catch (err) {
    console.error('Razorpay fetch payment error:', err.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to verify payment with Razorpay' }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      verified: true,
      razorpay_payment_id,
      razorpay_order_id,
      amount: payment ? payment.amount : null,
      currency: payment ? payment.currency : null,
    }),
  };
};
