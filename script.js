// Mobile menu toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });
}

// Dropdown toggle on click
document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    const menu = toggle.nextElementSibling;
    const isOpen = menu && menu.style.display === 'block';

    document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none');

    if (!isOpen && menu) {
      menu.style.display = 'block';
    }
  });
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.dropdown')) {
    document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none');
  }
});

// Close mobile menu when clicking a link
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    if (navLinks) navLinks.classList.remove('active');
    document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none');
  });
});

// Contact form handling (Netlify Forms)
const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const formSuccess = document.getElementById('formSuccess');

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitBtn) {
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;
    }

    const formData = new FormData(contactForm);

    try {
      const response = await fetch(window.location.pathname, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString()
      });

      if (response.ok) {
        contactForm.style.display = 'none';
        if (formSuccess) formSuccess.style.display = 'block';
      } else {
        throw new Error('Form submission failed');
      }
    } catch (err) {
      if (submitBtn) {
        submitBtn.textContent = 'Try Again';
        submitBtn.disabled = false;
      }
      alert('Something went wrong. Please email us directly instead.');
    }
  });
}

// Copy address helper
if (typeof window.copyAddress !== 'function') {
  window.copyAddress = function(id) {
    const el = document.getElementById(id);
    if (!el) return;
    navigator.clipboard.writeText(el.textContent.trim()).then(() => {
      const btn = el.parentElement.querySelector('button');
      if (btn) {
        const oldText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = oldText, 1500);
      }
    });
  };
}