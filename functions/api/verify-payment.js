// Cloudflare Pages Function: POST /api/verify-payment
// Verifies Razorpay payment signature. KEY_SECRET never leaves this file.
// Env vars RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET set in Cloudflare Pages dashboard.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      return new Response(JSON.stringify({ error: 'Razorpay not configured on server' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature' }), {
        status: 400,
        headers: corsHeaders,
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

    const valid = expected === razorpay_signature;

    if (!valid) {
      return new Response(JSON.stringify({ error: 'Signature mismatch — payment not verified', verified: false }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Confirm payment captured via Razorpay API
    const auth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
    let payment;

    try {
      const res = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
        headers: { Authorization: `Basic ${auth}` },
      });
      payment = await res.json();

      if (!res.ok || payment.status !== 'captured') {
        return new Response(JSON.stringify({ error: 'Payment not captured', verified: false, status: payment?.status }), {
          status: 400,
          headers: corsHeaders,
        });
      }
    } catch (err) {
      console.error('Razorpay fetch payment error:', err.message);
      return new Response(JSON.stringify({ error: 'Failed to verify payment with Razorpay' }), {
        status: 500,
        headers: corsHeaders,
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
      headers: corsHeaders,
    });
  } catch (err) {
    console.error('Verify payment error:', err.message);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
