# 🧪 Stripe Test Mode Setup (Developer Mode)

Perfect for testing! No real payments, no Blaze plan needed, 100% free.

## ✅ What You Need

1. **Stripe Test Mode API Keys** (starts with `pk_test_` and `sk_test_`)
2. **Test Product** with $99/year pricing
3. **Test Price ID** (starts with `price_...`)

---

## 📋 Step-by-Step Setup

### Step 1: Get Your Test Mode API Keys

1. **Go to**: https://dashboard.stripe.com/test/apikeys
2. **Make sure you're in "Test mode"** (toggle in top right should say "Test mode")
3. **Copy**:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`) - Click "Reveal test key" to see it

### Step 2: Create Test Product ($99/year)

1. **Go to**: https://dashboard.stripe.com/test/products
2. **Click**: "Add product"
3. **Fill in**:
   - **Name**: `CompLens Pro`
   - **Description**: `Annual subscription for CompLens Pro features`
   - **Pricing**:
     - Model: **Recurring**
     - Price: `$99.00`
     - Billing period: **Yearly** (or "Annually")
4. **Click**: "Save product"
5. **Copy the Price ID** (starts with `price_...`) - you'll see it on the product page

### Step 3: Update `.env.local`

Create or update your `.env.local` file in the project root:

```env
# Stripe Test Mode Keys (100% Free!)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (paste your test publishable key)
STRIPE_SECRET_KEY=sk_test_... (paste your test secret key)

# Test Mode Price ID ($99/year)
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_... (paste your test price ID)

# Webhook Secret (optional for local testing)
# STRIPE_WEBHOOK_SECRET=whsec_...
```

### Step 4: Test It Locally!

1. **Restart your dev server**:
   ```powershell
   npm run dev
   ```

2. **Go to**: `http://localhost:3002/pricing`

3. **You should see**:
   - ✅ "🧪 Test mode" indicator at the bottom
   - ✅ "$99/year" for Pro plan
   - ✅ "Save 72% vs monthly billing" message

4. **Test checkout**:
   - Click "Upgrade to Pro"
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

---

## 🎯 Test Cards (No Real Charges!)

Stripe provides these test cards:

- **✅ Success**: `4242 4242 4242 4242`
- **❌ Decline**: `4000 0000 0000 0002`
- **🔒 Requires 3D Secure**: `4000 0025 0000 3155`
- **💳 Insufficient Funds**: `4000 0000 0000 9995`

**For all cards:**
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

---

## ✅ What Works in Test Mode

- ✅ **Local development** - Use Next.js API routes (no Firebase Functions needed!)
- ✅ **Test payments** - All fake, no real charges
- ✅ **Test subscriptions** - See how subscriptions work
- ✅ **Test donations** - Try the donation flow
- ✅ **100% free** - No costs, no Blaze plan needed

---

## 🚫 What Doesn't Work in Test Mode

- ❌ **Real payments** - All payments are fake
- ❌ **Production deployment** - Need Firebase Functions for production (requires Blaze plan)
- ❌ **Real webhooks** - Can test locally with Stripe CLI

---

## 🧪 Testing Webhooks Locally (Optional)

If you want to test webhooks locally:

1. **Install Stripe CLI**: https://stripe.com/docs/stripe-cli
2. **Login**: `stripe login`
3. **Forward webhooks**: `stripe listen --forward-to localhost:3002/api/webhooks/stripe`
4. **Copy the webhook secret** it gives you and add to `.env.local`

---

## 📝 Quick Checklist

- [ ] Got test mode API keys from Stripe Dashboard
- [ ] Created test product "$99/year" in Stripe
- [ ] Copied test Price ID
- [ ] Updated `.env.local` with test keys
- [ ] Restarted dev server
- [ ] Tested checkout with test card `4242 4242 4242 4242`
- [ ] Verified "Test mode" indicator shows on pricing page

---

## 🎉 You're All Set!

Your app is now in **developer/test mode**. You can:
- Test the full payment flow
- Try subscriptions
- Test donations
- See how everything works
- **All without spending a penny!**

When you're ready for real payments, you can switch to live mode later.
