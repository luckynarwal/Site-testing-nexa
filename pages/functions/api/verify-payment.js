// Cloudflare Pages Function: POST /api/verify-payment
// Verifies Razorpay payment signature. KEY_SECRET never leaves this file.
// Environment variables RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET set in Cloudflare dashboard.

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    return new Response(JSON.stringify({ error: 'Razorpay not configured on server' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return new Response(JSON.stringify({ error: 'Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.RAZORPAY_KEY_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

  // Signature comparison
  const valid = expected === razorpay_signature;

  if (!valid) {
    return new Response(JSON.stringify({ error: 'Signature mismatch — payment not verified', verified: false }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Confirm the payment actually exists and is captured via Razorpay API
  const auth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);

  try {
    const res = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    const payment = await res.json();

    if (!res.ok || payment.status !== 'captured') {
      return new Response(JSON.stringify({ error: 'Payment not captured', verified: false, status: payment?.status }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      verified: true,
      razorpay_payment_id,
      razorpay_order_id,
      amount: payment.amount,
      currency: payment.currency,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Razorpay fetch payment error:', err.message);
    return new Response(JSON.stringify({ error: 'Failed to verify payment with Razorpay' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
