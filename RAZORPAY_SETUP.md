================================================================================
NEXASOCIAL — RAZORPAY APPLICATION DOCUMENT
================================================================================

This document contains everything you need to submit to Razorpay for account
verification and to get your payment gateway approved.

================================================================================
1. BUSINESS OVERVIEW
================================================================================

Business Name: NexaSocial
Business Type: Social Media Marketing Agency (Service-Based)
Industry: Digital Marketing / Social Media Management
Country: India
Business Model: Service-based B2B / B2C — monthly retainer packages and
one-time trial services for social media marketing

WE DO NOT:
- Sell fake followers, likes, views, or bot engagement
- Operate an SMM panel or follower marketplace
- Promise guaranteed follower counts or viral results
- Require client account passwords or login credentials

WE DO:
- Content strategy and content calendar planning
- Community management and engagement
- Social media profile optimization
- Paid advertising campaign setup guidance
- Influencer collaboration setup
- Monthly progress reporting

================================================================================
2. WHAT TO TELL RAZORPAY SUPPORT
================================================================================

Send this message to Razorpay Support (support@razorpay.com or via your
Razorpay Dashboard → Help & Support → Contact Us):

--------------------------------------------------------------
Subject: Reactivation Request — NexaSocial — Social Media Marketing Agency

Dear Razorpay Support Team,

I am writing to request reactivation/approval of my Razorpay account for my
business, NexaSocial.

BUSINESS DETAILS:
- Business Name: NexaSocial
- Business Type: Social Media Marketing Agency (Service-Based)
- Industry: Digital Marketing / Social Media Management
- Country: India
- Website: https://nexasocialhub.netlify.app

NATURE OF BUSINESS:
NexaSocial is a legitimate social media marketing agency that provides
content strategy, community management, content calendar planning, and paid
campaign setup guidance to brands and creators. We do NOT sell fake
followers, likes, views, bots, or any form of inauthentic engagement.

We help clients improve their social media presence through:
1. Content strategy and content calendar planning
2. Community management and engagement
3. Social media profile optimization
4. Paid advertising campaign setup guidance
5. Influencer collaboration setup

All services comply with platform Terms of Service. We do not require client
account passwords or login credentials. Results vary by account, niche, and
content quality — we do not guarantee specific follower counts or engagement
numbers.

WEBSITE: https://nexasocialhub.netlify.app
- Our website clearly outlines our services, pricing, terms of service, and
  privacy policy
- We explicitly state that we do not sell fake followers or bots
- All pricing is transparent and displayed on our packages page

PREVIOUS ACCOUNT:
I previously had a Razorpay account for a different business that was not
approved. This is a completely new business (NexaSocial) with a different
business model focused on legitimate social media marketing services.

Please review our website and approve our account for payment processing.

Thank you,
[Your Name]
NexaSocial
hello@nexasocial.com
--------------------------------------------------------------

================================================================================
3. RAZORPAY KYC DOCUMENTS TO PREPARE
================================================================================

Have these ready when Razorpay asks:

A. INDIVIDUAL / SOLE PROPRIETORSHIP:
- PAN Card (Personal)
- Aadhaar Card (Personal)
- Bank Account (Current Account in business name or personal name)
- GST Registration (Optional but recommended)
- Shop & Establishment Registration / UDYAM (Optional but recommended)

B. BUSINESS DOCUMENTS:
- Business registration certificate (if registered)
- Shop & Establishment License / UDYAM Aadhaar
- GST Certificate (if applicable)
- Cancelled cheque or bank statement (business account)
- Website link: https://nexasocialhub.netlify.app

C. WEBSITE REQUIREMENTS (Already Completed ✓):
- ✓ Clear business description (Social Media Marketing Agency)
- ✓ Contact information (email, contact form, business address)
- ✓ Terms of Service page with refund policy
- ✓ Privacy Policy page
- ✓ No fake follower/engagement promises
- ✓ Transparent pricing
- ✓ Contact form (not just WhatsApp number)

================================================================================
4. RAZORPAY KEY ID SETUP
================================================================================

Once your Razorpay account is approved:

1. Log in to Razorpay Dashboard → Settings → API Keys
2. Generate Key ID (starts with "rzp_test_" for test mode)
3. Replace placeholder in packages.html line 10:
   <meta name="razorpay-key-id" content="YOUR_RAZORPAY_KEY_ID">
   Replace "YOUR_RAZORPAY_KEY_ID" with your actual key
4. Replace placeholder in test.html line 10:
   Same replacement
5. Commit and push to GitHub → Netlify auto-deploys

================================================================================
4. NEXT STEPS
================================================================================

1. Reply to Razorpay support with the message template above
2. Submit your KYC documents through the Razorpay dashboard
3. Wait for approval (typically 2-7 business days)
4. Once approved, get your Key ID from Razorpay Dashboard
5. Replace YOUR_RAZORPAY_KEY_ID in packages.html and test.html
6. Commit and push: git add -A && git commit -m "Add Razorpay key" && git push
7. Netlify auto-deploys — your payment buttons will work

================================================================================
END OF DOCUMENT
================================================================================