# 🧪 Stripe Test Mode Setup - Quick Action Guide

## ⚠️ Current Issue
You're getting: **"No such price: 'price_1SdxpyHe5rsxCfoQfYrXQSOu'; a similar object exists in live mode, but a test mode key was used."**

This means your Price ID is from **Live Mode** but you're using **Test Mode** keys. We need to create a Test Mode product.

---

## ✅ Step 1: Create Test Mode Product in Stripe (5 minutes)

1. **Go to**: https://dashboard.stripe.com/test/products
   - ⚠️ **IMPORTANT**: Make sure the toggle in the top-right says **"Test mode"** (not "Live mode")

2. **Click**: "Add product" button

3. **Fill in the product details**:
   - **Name**: `CompLens Pro`
   - **Description**: `Annual subscription for CompLens Pro features`
   - **Pricing**:
     - Model: **Recurring**
     - Price: `$99.00`
     - Currency: `USD` (default)
     - Billing period: **Yearly** (or "Annually") ⚠️ Make sure it's Yearly, not Monthly!

4. **Click**: "Save product" or "Add product"

5. **Copy the Price ID**:
   - After saving, you'll see the product page
   - Look for the **Price ID** - it starts with `price_...`
   - **Copy this entire Price ID** (you'll need it in Step 3)

---

## ✅ Step 2: Get Your Test Mode API Keys (2 minutes)

1. **Go to**: https://dashboard.stripe.com/test/apikeys
   - ⚠️ **IMPORTANT**: Make sure you're in **"Test mode"** (toggle in top-right)

2. **Copy your keys**:
   - **Publishable key**: Starts with `pk_test_...` (visible immediately)
   - **Secret key**: Starts with `sk_test_...` (click "Reveal test key" if needed)

---

## ✅ Step 3: Update Your `.env.local` File

Open `.env.local` in your project root and add/update these lines:

```env
# Stripe Test Mode Keys (100% Free!)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE

# Test Mode Price ID ($99/year) - Get this from Step 1
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_YOUR_TEST_PRICE_ID_HERE

# Optional: Webhook Secret (for production webhooks)
# STRIPE_WEBHOOK_SECRET=whsec_...
```

**Replace**:
- `pk_test_YOUR_KEY_HERE` with your Test Mode publishable key from Step 2
- `sk_test_YOUR_KEY_HERE` with your Test Mode secret key from Step 2
- `price_YOUR_TEST_PRICE_ID_HERE` with your Test Mode Price ID from Step 1

---

## ✅ Step 4: Set Firebase Functions Environment Variables

Since your app uses static export, API routes are handled by Firebase Functions. You need to set environment variables there too.

### Option A: Firebase Console (Recommended - if available)

1. **Go to**: https://console.firebase.google.com/project/complens-88a4f/functions/config

2. **Add/update these variables**:
   - `STRIPE_SECRET_KEY` = `sk_test_...` (your test secret key)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_test_...` (your test publishable key)
   - `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` = `price_...` (your test price ID)

3. **Click**: "Save"

### Option B: Google Cloud Console (if Firebase Console doesn't show Configuration)

1. **Go to**: https://console.cloud.google.com/functions/list?project=complens-88a4f

2. **For each function** (`createCheckoutSession`, `createDonationSession`, `stripeWebhook`):
   - Click on the function name
   - Click **"EDIT"** button at the top
   - Scroll to **"Runtime, build, connections and security settings"**
   - Expand it
   - Find **"Runtime environment variables"**
   - Click **"ADD VARIABLE"** for each:
     - `STRIPE_SECRET_KEY` = `sk_test_...`
     - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_test_...`
     - `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` = `price_...`
   - Click **"DEPLOY"** to save

---

## ✅ Step 5: Test Locally

1. **Restart your dev server**:
   ```powershell
   npm run dev
   ```

2. **Go to**: `http://localhost:3002/pricing`

3. **Verify**:
   - ✅ Shows "🧪 Test mode" indicator at bottom
   - ✅ Shows "$99/year" for Pro plan
   - ✅ "Save 72% vs monthly billing" message appears

4. **Test checkout**:
   - Click "Upgrade to Pro"
   - Should redirect to Stripe Checkout
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

---

## ✅ Step 6: Deploy to Firebase (After Local Testing Works)

```powershell
# Build and deploy
npm run build:firebase
firebase deploy
```

---

## 🎯 Success Checklist

- [ ] Created Test Mode product in Stripe Dashboard
- [ ] Got Test Mode Price ID (starts with `price_...`)
- [ ] Got Test Mode API keys (`pk_test_...` and `sk_test_...`)
- [ ] Updated `.env.local` with Test Mode keys and Price ID
- [ ] Set environment variables in Firebase Functions
- [ ] Tested locally - checkout works with test card
- [ ] Deployed to Firebase (if needed)

---

## 💡 Important Notes

1. **Mode Consistency**: Always ensure Test Mode keys are used with Test Mode Price IDs, and Live Mode keys with Live Mode Price IDs.

2. **Firebase Free Tier**: The Spark (free) plan supports Cloud Functions, so you can use Stripe Test Mode without upgrading to Blaze plan.

3. **Price ID Format**: Test Mode and Live Mode Price IDs look identical (both start with `price_...`), but they're separate objects. You must create a product in Test Mode to get a Test Mode Price ID.

4. **No Real Charges**: Test Mode is 100% free - no real credit cards are charged, perfect for development and testing.

---

## 🆘 Troubleshooting

**Still getting mode mismatch error?**
- Double-check you're using Test Mode keys with Test Mode Price ID
- Verify the toggle in Stripe Dashboard says "Test mode"
- Make sure you created the product in Test Mode (not Live Mode)

**Environment variables not working?**
- Restart your dev server after updating `.env.local`
- Check Firebase Functions logs for environment variable errors
- Verify variables are set in Firebase Functions (not just locally)

**Checkout not redirecting?**
- Check browser console for errors
- Verify API route is working: `http://localhost:3002/api/create-checkout-session`
- Check Firebase Functions logs if deployed


