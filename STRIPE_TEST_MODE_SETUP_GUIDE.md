# 🧪 Stripe Test Mode Setup - Complete Guide

## Problem Fixed: Mode Mismatch

Your error was: **"No such price: 'price_1SdxpyHe5rsxCfoQfYrXQSOu'; a similar object exists in live mode, but a test mode key was used."**

This means you had a **Live Mode Price ID** but **Test Mode API keys**. We're fixing this by using Test Mode for everything.

---

## Step 1: Create Test Mode Product in Stripe ⚠️ MANUAL STEP

1. **Go to**: https://dashboard.stripe.com/test/products
2. **VERIFY you're in Test Mode** - Look at the toggle in the top-right corner. It should say **"Test mode"** (not "Live mode")
3. **Click**: **"Add product"** button
4. **Fill in the product details**:
   - **Name**: `CompLens Pro`
   - **Description**: `Annual subscription for CompLens Pro features`
   - **Pricing section**:
     - Model: **Recurring** (not one-time)
     - Price: `99.00`
     - Currency: `USD`
     - Billing period: **Yearly** or **Annually** (NOT Monthly)
5. **Click**: **"Save product"** or **"Add product"**
6. **IMPORTANT**: After saving, you'll see the product page. Look for the **Price ID** - it starts with `price_...`
   - Example: `price_1Se0XdHe5rsxCfoQbkBtu2vv`
   - **COPY THIS PRICE ID** - you'll need it in Step 3

---

## Step 2: Get Test Mode API Keys ⚠️ MANUAL STEP

1. **Go to**: https://dashboard.stripe.com/test/apikeys
2. **VERIFY you're in Test Mode** - Toggle should say **"Test mode"**
3. **Copy your keys**:
   - **Publishable key**: Starts with `pk_test_...`
     - This is visible immediately
     - Example: `pk_test_...` (copy from Stripe Dashboard)
   - **Secret key**: Starts with `sk_test_...`
     - Click **"Reveal test key"** if it's hidden
     - Example: `sk_test_...` (copy from Stripe Dashboard)
   - **COPY BOTH KEYS** - you'll need them in Step 3

---

## Step 3: Update Local Environment Variables ✅ AUTOMATED

I've created/updated your `.env.local` file with a template. You need to:

1. **Open**: `.env.local` in your project root
2. **Replace the placeholder values** with your actual Test Mode values from Steps 1 & 2:
   - Replace `pk_test_YOUR_PUBLISHABLE_KEY_HERE` with your actual publishable key
   - Replace `sk_test_YOUR_SECRET_KEY_HERE` with your actual secret key
   - Replace `price_YOUR_TEST_PRICE_ID_HERE` with your actual Test Mode Price ID

3. **Save the file**

4. **Restart your dev server**:
   ```powershell
   npm run dev
   ```

---

## Step 4: Update Firebase Functions Environment Variables ⚠️ MANUAL STEP

Since your app uses static export, API routes are handled by Firebase Functions. You need to set environment variables there.

### Option A: Firebase Console (Recommended - if available)

1. **Go to**: https://console.firebase.google.com/project/complens-88a4f/functions/config
2. **Click**: **"Add variable"** (or edit existing ones)
3. **Add these 3 variables** (use your Test Mode values from Steps 1 & 2):
   - **Name**: `STRIPE_SECRET_KEY`
     - **Value**: `sk_test_...` (your Test Mode secret key)
   - **Name**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
     - **Value**: `pk_test_...` (your Test Mode publishable key)
   - **Name**: `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`
     - **Value**: `price_...` (your Test Mode Price ID)
4. **Click**: **"Save"**

### Option B: Google Cloud Console (If Firebase Console doesn't show Configuration tab)

1. **Go to**: https://console.cloud.google.com/functions/list?project=complens-88a4f
2. **For EACH function** (`createCheckoutSession`, `createDonationSession`, `stripeWebhook`):
   - Click on the function name
   - Click **"EDIT"** button at the top
   - Scroll down to **"Runtime, build, connections and security settings"**
   - Click to **expand** that section
   - Find **"Runtime environment variables"**
   - Click **"ADD VARIABLE"** for each of the 3 variables:
     - `STRIPE_SECRET_KEY` = `sk_test_...` (your Test Mode secret key)
     - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_test_...` (your Test Mode publishable key)
     - `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` = `price_...` (your Test Mode Price ID)
   - Click **"DEPLOY"** or **"NEXT"** → **"DEPLOY"** to save
   - Wait 1-2 minutes for deployment

**Note**: You need to do this for all 3 functions. The environment variables are per-function.

---

## Step 5: Test Locally ✅

1. **Make sure** `.env.local` is updated with your Test Mode values
2. **Restart dev server**:
   ```powershell
   npm run dev
   ```
3. **Go to**: `http://localhost:3002/pricing`
4. **Verify**:
   - ✅ Shows "🧪 Test mode" indicator at the bottom of the page
   - ✅ Shows "$99/year" for Pro plan
   - ✅ "Save 72% vs monthly billing" message appears
5. **Test checkout**:
   - Click **"Upgrade to Pro"** button
   - Should redirect to Stripe Checkout page
   - Use **test card**: `4242 4242 4242 4242`
   - **Expiry**: Any future date (e.g., `12/34`)
   - **CVC**: Any 3 digits (e.g., `123`)
   - **ZIP**: Any 5 digits (e.g., `12345`)
   - Click **"Subscribe"** or **"Pay"**
   - Should show success message

**If you get an error**, check:
- Are you using Test Mode keys? (should start with `pk_test_` and `sk_test_`)
- Is your Price ID from Test Mode? (created in Test Mode dashboard)
- Did you restart the dev server after updating `.env.local`?

---

## Step 6: Deploy to Firebase (Optional)

After local testing works:

```powershell
# Build for Firebase
npm run build:firebase

# Deploy everything
firebase deploy
```

Or deploy just functions:
```powershell
firebase deploy --only functions
```

---

## ✅ Success Checklist

- [ ] Created CompLens Pro product in Stripe **Test Mode**
- [ ] Copied Test Mode Price ID (starts with `price_...`)
- [ ] Got Test Mode API keys (publishable `pk_test_...` and secret `sk_test_...`)
- [ ] Updated `.env.local` with Test Mode values
- [ ] Set environment variables in Firebase Functions (all 3 functions)
- [ ] Tested locally - checkout works with test card `4242 4242 4242 4242`
- [ ] No more "mode mismatch" errors

---

## 🔍 Troubleshooting

### Error: "No such price"
- **Cause**: Price ID doesn't match the mode of your API keys
- **Fix**: Make sure Price ID is from Test Mode if using Test Mode keys

### Error: "STRIPE_SECRET_KEY is not configured"
- **Cause**: Environment variable not set in Firebase Functions
- **Fix**: Set `STRIPE_SECRET_KEY` in Firebase Functions (Step 4)

### Error: "Failed to create checkout session"
- **Cause**: Missing or incorrect environment variables
- **Fix**: Verify all 3 variables are set correctly in Firebase Functions

### Checkout doesn't redirect
- **Cause**: API route not working (static export issue)
- **Fix**: Make sure Firebase Functions are deployed and environment variables are set

---

## 📝 Important Notes

1. **Firebase Free Tier**: The Spark (free) plan supports Cloud Functions, so you can use Stripe Test Mode without upgrading to Blaze plan.

2. **Mode Consistency**: Always ensure:
   - Test Mode keys → Test Mode Price ID
   - Live Mode keys → Live Mode Price ID

3. **Environment Variables**: Since your app uses static export (`output: 'export'` in `next.config.js`), API routes are handled by Firebase Functions via rewrites in `firebase.json`. Environment variables must be set in Firebase Functions, not just locally.

4. **Price ID Format**: Test Mode Price IDs look identical to Live Mode ones (both start with `price_...`), but they're separate objects. You must create a product in Test Mode to get a Test Mode Price ID.

---

## 🎉 You're Done!

Once all steps are complete, your Stripe payment system should work perfectly in Test Mode. You can test payments without any real charges, and everything works on Firebase free tier!

