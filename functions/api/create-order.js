// Cloudflare Pages Function: POST /api/create-order
// Creates a Razorpay order. KEY_SECRET never leaves this file.
// Env vars RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET set in Cloudflare Pages dashboard.
// Deployed: 2026-11-28 (Cloudflare Pages migration)

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

    const { amount, currency = 'INR', receipt } = payload;
    const MIN_AMOUNT_PAISE = 100;

    if (!amount || Number(amount) < MIN_AMOUNT_PAISE) {
      return new Response(JSON.stringify({ error: 'Amount must be at least 100 paise (₹1.00)' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const auth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(Number(amount)),
        currency,
        receipt: receipt || `nexa_${Date.now()}`,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        return new Response(JSON.stringify({ error: 'Razorpay authentication failed' }), {
          status: 401,
          headers: corsHeaders,
        });
      }
      return new Response(JSON.stringify({ error: data.error || 'Failed to create Razorpay order' }), {
        status: res.status || 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({
      order_id: data.id,
      amount: data.amount,
      currency: data.currency,
    }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error('Razorpay create order error:', err.message);
    return new Response(JSON.stringify({ error: 'Failed to create Razorpay order' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
