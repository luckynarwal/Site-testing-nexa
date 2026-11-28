// Cloudflare Pages Function: POST /api/create-order
// Creates a Razorpay order. KEY_SECRET never leaves this file.
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

  const { amount, currency = 'INR', receipt } = payload;
  const MIN_AMOUNT_PAISE = 100;

  if (!amount || Number(amount) < MIN_AMOUNT_PAISE) {
    return new Response(JSON.stringify({ error: 'Amount must be at least 100 paise (₹1.00)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const auth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);

  try {
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
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: data.error || 'Failed to create Razorpay order' }), {
        status: res.status || 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      order_id: data.id,
      amount: data.amount,
      currency: data.currency,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Razorpay create order error:', err.message);
    return new Response(JSON.stringify({ error: 'Failed to create Razorpay order' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
