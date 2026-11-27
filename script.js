// Mobile menu toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('active');
});

// Dropdown toggle on click
document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    const menu = toggle.nextElementSibling;
    const isOpen = menu.style.display === 'block';
    
    // Close all other dropdowns
    document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none');
    
    if (!isOpen) {
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
    navLinks.classList.remove('active');
    document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none');
  });
});

// Contact form handling (Netlify Forms)
const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const formSuccess = document.getElementById('formSuccess');

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.textContent = 'Sending...';
  submitBtn.disabled = true;

  const formData = new FormData(contactForm);

  try {
    const response = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData).toString()
    });

    if (response.ok) {
      contactForm.style.display = 'none';
      formSuccess.style.display = 'block';
    } else {
      throw new Error('Form submission failed');
    }
  } catch (err) {
    submitBtn.textContent = 'Try Again';
    submitBtn.disabled = false;
    alert('Something went wrong. Please email us directly instead.');
  }
});

// --- Auto Language Detection ---
function detectLanguage() {
  const saved = localStorage.getItem('nexa_lang');
  if (saved && translations[saved]) return saved;

  const browserLang = navigator.language || navigator.userLanguage;
  const langCode = browserLang.split('-')[0];

  if (translations[langCode]) return langCode;

  const fallbackMap = {
    'pt': 'es', 'nl': 'de', 'pl': 'ru', 'uk': 'ru', 'be': 'ru',
    'ja': 'zh', 'ko': 'zh', 'th': 'en', 'vi': 'en', 'id': 'en', 'ms': 'en',
  };
  if (fallbackMap[langCode]) return fallbackMap[langCode];

  return 'en';
}

// --- Auto Currency Detection ---
function detectCurrency() {
  const saved = localStorage.getItem('nexa_currency');
  if (saved) return saved;

  try {
    const region = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tzToCurrency = {
      'America/New_York': 'USD', 'America/Chicago': 'USD', 'America/Denver': 'USD', 'America/Los_Angeles': 'USD',
      'Europe/London': 'GBP', 'Europe/Berlin': 'EUR', 'Europe/Paris': 'EUR', 'Europe/Rome': 'EUR',
      'Europe/Moscow': 'RUB', 'Europe/Istanbul': 'TRY',
      'Asia/Kolkata': 'INR', 'Asia/Dubai': 'AED', 'Asia/Tokyo': 'JPY', 'Asia/Shanghai': 'CNY',
      'Australia/Sydney': 'AUD',
    };
    for (const [tz, cur] of Object.entries(tzToCurrency)) {
      if (region.includes(tz.split('/')[1] || tz)) return cur;
    }
  } catch (e) {}

  return 'USD';
}

const currencyRates = { INR: 1, USD: 0.012, EUR: 0.011, RUB: 1.1 };
const currencySymbols = { INR: '₹', USD: '$', EUR: '€', RUB: '₽' };
let currentCurrency = detectCurrency();

function applyCurrency(currency = currentCurrency) {
  currentCurrency = currency;
  localStorage.setItem('nexa_currency', currency);
  const rate = currencyRates[currency] || 1;
  const symbol = currencySymbols[currency] || '$';

  document.querySelectorAll('.price').forEach(el => {
    const basePrice = parseINRPrice(el);
    if (basePrice === null) return;
    const converted = basePrice * rate;
    const formatted = converted.toLocaleString(undefined, {
      minimumFractionDigits: converted % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    });
    el.innerHTML = `${symbol}${formatted}<span>/mo</span>`;
    el.setAttribute('data-currency', currency);
  });

  const testPrice = document.querySelector('.test-price');
  if (testPrice) {
    const base = 499;
    const converted = base * rate;
    const formatted = converted.toLocaleString(undefined, {
      minimumFractionDigits: converted % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    });
    testPrice.innerHTML = `${symbol}${formatted}<span>/one-time</span>`;
    testPrice.setAttribute('data-currency', currency);
  }

  const currSwitch = document.getElementById('currSwitch');
  if (currSwitch) currSwitch.value = currency;
}

function parseINRPrice(el) {
  const text = el.textContent || el.innerText;
  const match = text.match(/[\d,]+/);
  if (!match) return null;
  return parseInt(match[0].replace(/,/g, ''), 10);
}

function initAll() {
  const lang = detectLanguage();
  if (typeof setLanguage === 'function') setLanguage(lang);

  const curr = detectCurrency();
  applyCurrency(curr);

  const currSwitch = document.getElementById('currSwitch');
  if (currSwitch) {
    currSwitch.addEventListener('change', (e) => applyCurrency(e.target.value));
  }

  const privacyCheckbox = document.getElementById('profileVisibility');
  const privacyOptions = document.getElementById('privacyOptions');
  if (privacyCheckbox && privacyOptions) {
    privacyCheckbox.addEventListener('change', (e) => {
      privacyOptions.style.display = e.target.checked ? 'block' : 'none';
    });
    privacyOptions.style.display = privacyCheckbox.checked ? 'block' : 'none';
  }

  const screenshotInput = document.getElementById('screenshotInput');
  const screenshotPreview = document.getElementById('screenshotPreview');
  if (screenshotInput && screenshotPreview) {
    screenshotInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = document.createElement('img');
        img.src = ev.target.result;
        img.style.maxWidth = '100%';
        img.style.borderRadius = '8px';
        img.style.marginTop = '10px';
        screenshotPreview.innerHTML = '';
        screenshotPreview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  }

  if (typeof initI18n === 'function') {
    initI18n();
  }

  setTimeout(() => applyCurrency(currentCurrency), 100);
}

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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}