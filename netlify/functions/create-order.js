// Netlify function: POST /.netlify/functions/create-order (exposed as /api/create-order)
// Creates a Razorpay order. KEY_SECRET never leaves this file.
require('dotenv').config();
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const MIN_AMOUNT_PAISE = 100;

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

  const { amount, currency = 'INR', receipt } = payload;

  if (!amount || Number(amount) < MIN_AMOUNT_PAISE) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Amount must be at least 100 paise (₹1.00)' }),
    };
  }

  try {
    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount)),
      currency,
      receipt: receipt || `nexa_${Date.now()}`,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
      }),
    };
  } catch (err) {
    console.error('Razorpay create order error:', err.message);

    // Razorpay API errors carry a statusCode (e.g. 401 for bad credentials)
    if (err.statusCode === 401) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Razorpay authentication failed' }),
      };
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to create Razorpay order' }),
    };
  }
};
