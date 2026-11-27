# NexaSocial — Anonymous Social Media Growth Business

Everything you need to launch a client-acquisition system for your SMM/growth service, hosted for free, with no personal face or details required.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Main website (hero, services, packages, contact form) |
| `style.css` | Styling |
| `script.js` | Contact form handler |
| `order-tracker.html` | Client order tracker (localStorage, export CSV) |
| `outreach-scripts.md` | DM / email / WhatsApp / LinkedIn scripts |
| `packages.md` | Pricing tiers and add-ons |
| `README.md` | This file |

## Step 1: Host the Website for Free

**Option A — Netlify (recommended, includes free form handling)**

1. Go to [netlify.com](https://netlify.com) and sign up (free).
2. Drag and drop the `smm-business` folder onto Netlify's "Deploy" area.
3. Your site goes live instantly with a `*.netlify.app` domain.
4. The contact form in `index.html` uses `netlify` attribute — submissions appear in your Netlify dashboard under **Forms**. No backend code needed.

**Option B — GitHub Pages (free, but forms need a 3rd party)**

1. Push the folder to a GitHub repo.
2. Enable GitHub Pages in repo settings.
3. For the contact form, use [Formspree](https://formspree.io) (free tier): replace `<form name="contact-form" netlify>` with `<form action="https://formspree.io/f/YOUR_ID" method="POST">`.

## Step 2: Set Up the Order Tracker

1. Open `order-tracker.html` in your browser.
2. Add orders as clients sign up.
3. Data saves to your browser's localStorage — nothing goes to a server.
4. Click **Export CSV** to back up orders to Excel/Google Sheets.

## Step 3: Cold Outreach (Automation-Ready)

Scripts are in `outreach-scripts.md`. To semi-automate:

- **Instagram DMs:** Use the Instagram DM templates manually, or use a free tool like **ManyChat** (free tier) to auto-reply to story mentions/comments with your link.
- **Email:** Use a free Mailchimp or ConvertKit account to send cold emails to business lists you gather.
- **WhatsApp:** Use WhatsApp Business app (free) with saved quick-reply messages.
- **Zapier / Make.com (free tier):** Connect your website form to Google Sheets so every contact form submission auto-creates a row in your order tracker.

## Step 4: Build Trust Without Showing Your Face

You said you're a student and want to stay anonymous. Here's how clients will still trust you:

1. **Professional brand, not personal brand.** Use "NexaSocial" (or rename it), not your own name.
2. **No face photos.** Use a simple logo (can be made free on Canva).
3. **Case studies > selfies.** Post screenshots of growth results (blur client handles if needed).
4. **Written testimonials.** Collect text reviews from happy clients; display first name + handle only.
5. **Clear policies.** State "real marketing only, no bots" prominently — this differentiates you from scammy SMM panels.
6. **Communicate via WhatsApp/Email.** You never need to jump on a video call unless you want to.

## Step 5: Example Business Models to Copy

Study these legitimate agencies (search them on Instagram/LinkedIn) to see what clients expect:

- **Viral Nation** — influencer + social growth agency. High-ticket, brand-focused.
- **Social Chain** — viral content and community growth.
- **Local "social media manager" freelancers** on Instagram — look at their pricing, packages, and how they present case studies.

**What clients typically expect:**
- A clean website or Instagram portfolio
- Clear packages and prices
- Weekly/monthly reporting
- A contract or terms of service
- Proof of results (screenshots, testimonials)

## Step 6: Legal / Ethical Warning

Do **not** sell:
- Fake followers, likes, or views (bots)
- Engagement pods that violate platform terms
- "Guaranteed" verification or monetization

These get client accounts banned and will destroy your reputation. Sell real marketing: content strategy, ad management, organic outreach, and community building.

## Next Steps

1. Deploy the site (Netlify).
2. Pick 10–20 target clients (local businesses, creators in your city/niche).
3. Send 5–10 outreach messages per day using the scripts.
4. When someone replies, send them to your website contact form or WhatsApp.
5. Log every order in `order-tracker.html`.
6. Deliver, get a testimonial, raise prices, repeat.

Good luck. Start small, stay consistent.
