// Razorpay Standard Checkout — NexaSocial
// KEY_ID (public) is read from the page's <meta name="razorpay-key-id"> tag.
// KEY_SECRET never reaches the frontend — it lives only in Netlify functions.

const API_PREFIX = ''; // netlify.toml rewrites /api/* to /.netlify/functions/*

function getRazorpayKeyId() {
  const meta = document.querySelector('meta[name="razorpay-key-id"]');
  return meta ? (meta.content || '').trim() : '';
}

function showPaymentMessage(text, type) {
  // Remove any existing message
  const existing = document.getElementById('nex-payment-message');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.id = 'nex-payment-message';
  el.style.position = 'fixed';
  el.style.top = '110px';
  el.style.left = '50%';
  el.style.transform = 'translateX(-50%)';
  el.style.padding = '14px 24px';
  el.style.borderRadius = '10px';
  el.style.fontSize = '0.95rem';
  el.style.fontWeight = '600';
  el.style.zIndex = '9999';
  el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
  el.style.maxWidth = '90%';
  el.style.textAlign = 'center';

  if (type === 'success') {
    el.style.background = 'rgba(34, 197, 94, 0.95)';
    el.style.color = 'white';
  } else if (type === 'warn') {
    el.style.background = 'rgba(245, 158, 11, 0.95)';
    el.style.color = 'white';
  } else {
    el.style.background = 'rgba(239, 68, 68, 0.95)';
    el.style.color = 'white';
  }
  el.textContent = text;
  document.body.appendChild(el);

  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, type === 'success' ? 5000 : 4000);
}

async function startPayment(amount, packageName) {
  const keyId = getRazorpayKeyId();
  if (!keyId || keyId === 'YOUR_RAZORPAY_KEY_ID') {
    showPaymentMessage(
      'Razorpay is not configured yet. Use the contact form to request an invoice.',
      'error'
    );
    return;
  }

  // Step 1: Create order via backend
  let order;
  try {
    const res = await fetch(`${API_PREFIX}/api/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt: `nexa_${Date.now()}`,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Order creation failed');
    order = data;
  } catch (err) {
    showPaymentMessage(err.message, 'error');
    return;
  }

  // Step 2: Open Razorpay modal with the order_id
  const options = {
    key: keyId,
    amount: order.amount,
    currency: order.currency,
    order_id: order.id,
    name: 'NexaSocial',
    description: packageName + ' — NexaSocial',
    image: 'https://nexasocialhub.narwalucky3.workers.dev/',
    prefill: {
      name: '',
      email: '',
      contact: '',
    },
    notes: {
      package: packageName,
      service: 'NexaSocial',
    },
    theme: {
      color: '#6366f1',
    },
    // Step 3: on success, verify signature with backend
    handler: async (response) => {
      await verifyPayment(response);
    },
    modal: {
      ondismiss: () => {
        showPaymentMessage('Payment cancelled — no charge was made.', 'warn');
      },
    },
  };

  const rzp = new Razorpay(options);
  rzp.open();

  // Handle payment.failed (e.g. bank decline)
  rzp.on('payment.failed', (response) => {
    const desc = response.error && response.error.description ? response.error.description : 'Payment failed';
    showPaymentMessage('Payment failed: ' + desc, 'error');
  });
}

async function verifyPayment(response) {
  try {
    const res = await fetch(`${API_PREFIX}/api/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Payment verification failed');

    showPaymentMessage(
      'Payment verified! ID: ' + response.razorpay_payment_id + ' — we will activate your service shortly.',
      'success'
    );
  } catch (err) {
    showPaymentMessage(err.message, 'error');
  }
}

// Expose globally so existing inline onclick="startPayment(...)" keeps working
window.startPayment = startPayment;
