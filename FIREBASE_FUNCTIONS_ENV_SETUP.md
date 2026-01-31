# 🔥 Firebase Functions Environment Variables Setup

Since your app uses static export (`output: 'export'` in `next.config.js`), API routes are handled by Firebase Functions via rewrites in `firebase.json`. You **must** set environment variables in Firebase Functions for the payment system to work in production.

---

## 🎯 Required Environment Variables

You need to set these **3 variables** in Firebase Functions:

1. `STRIPE_SECRET_KEY` - Your Stripe Test Mode secret key (`sk_test_...`)
2. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Your Stripe Test Mode publishable key (`pk_test_...`)
3. `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` - Your Stripe Test Mode Price ID (`price_...`)

---

## 📋 Method 1: Firebase Console (Easiest - if available)

### Step 1: Navigate to Functions Configuration

**Direct link**: https://console.firebase.google.com/project/complens-88a4f/functions/config

Or navigate manually:
1. Go to: https://console.firebase.google.com/project/complens-88a4f
2. Click **"Functions"** in the left sidebar
3. Click the **"Configuration"** tab at the top

### Step 2: Add Environment Variables

1. Click **"Add variable"** or **"Edit variables"**
2. Add each variable one by one:

   **Variable 1:**
   - **Name**: `STRIPE_SECRET_KEY`
   - **Value**: `sk_test_...` (your Test Mode secret key)
   - Click **"Add"**

   **Variable 2:**
   - **Name**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Value**: `pk_test_...` (your Test Mode publishable key)
   - Click **"Add"**

   **Variable 3:**
   - **Name**: `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`
   - **Value**: `price_...` (your Test Mode Price ID)
   - Click **"Add"**

3. Click **"Save"** at the bottom

### Step 3: Verify

The functions will automatically pick up the new environment variables on their next invocation. No redeployment needed!

---

## 📋 Method 2: Google Cloud Console (If Firebase Console doesn't show Configuration)

If the Configuration tab isn't visible in Firebase Console, use Google Cloud Console instead.

### Step 1: Navigate to Cloud Functions

**Direct link**: https://console.cloud.google.com/functions/list?project=complens-88a4f

### Step 2: Update Each Function

You need to update **3 functions**:
- `createCheckoutSession`
- `createDonationSession`
- `stripeWebhook`

For each function:

1. **Click on the function name** (e.g., `createCheckoutSession`)

2. **Click the "EDIT" button** at the top of the page

3. **Scroll down** to find **"Runtime, build, connections and security settings"**

4. **Click to expand** that section

5. **Find "Runtime environment variables"** or **"Environment variables"**

6. **Click "ADD VARIABLE"** or **"ADD ENVIRONMENT VARIABLE"** for each:

   **Variable 1:**
   - **Name**: `STRIPE_SECRET_KEY`
   - **Value**: `sk_test_...` (your Test Mode secret key)

   **Variable 2:**
   - **Name**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Value**: `pk_test_...` (your Test Mode publishable key)

   **Variable 3:**
   - **Name**: `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`
   - **Value**: `price_...` (your Test Mode Price ID)

7. **Click "DEPLOY"** or **"NEXT" → "DEPLOY"** at the bottom

8. **Wait** for deployment to complete (1-2 minutes)

9. **Repeat** for the other two functions (`createDonationSession` and `stripeWebhook`)

---

## 📋 Method 3: Using PowerShell Script (Advanced)

If you have `gcloud` CLI installed and authenticated, you can use the provided script:

```powershell
# First, update the script with your actual keys
# Edit: set-stripe-env-vars.ps1

# Then run:
.\set-stripe-env-vars.ps1
```

**Note**: This method requires:
- Google Cloud SDK installed
- Authenticated with `gcloud auth login`
- Proper permissions to deploy functions

---

## ✅ Verification Steps

After setting environment variables:

1. **Test locally first** (with `.env.local`):
   ```powershell
   npm run dev
   ```
   Go to: `http://localhost:3002/pricing` and test checkout

2. **Check Firebase Functions logs**:
   - Go to: https://console.firebase.google.com/project/complens-88a4f/functions/logs
   - Look for any errors about missing `STRIPE_SECRET_KEY`

3. **Test on deployed app**:
   - Go to: https://complens-88a4f.web.app/pricing
   - Click "Upgrade to Pro"
   - Should redirect to Stripe Checkout (no 500 errors!)

---

## 🆘 Troubleshooting

### "Configuration tab not visible"
- Use Method 2 (Google Cloud Console) instead
- Or check if you have proper permissions in Firebase project

### "Functions still showing errors"
- Wait 1-2 minutes for changes to propagate
- Check Firebase Functions logs for specific error messages
- Verify you're using **Test Mode** keys with **Test Mode** Price ID

### "Environment variables not updating"
- Try redeploying functions:
  ```powershell
  firebase deploy --only functions
  ```
- Or update via Google Cloud Console (Method 2)

### "Still getting mode mismatch error"
- Double-check all 3 variables are set correctly
- Verify you're using Test Mode keys (`pk_test_...`, `sk_test_...`)
- Verify you're using a Test Mode Price ID (created in Test Mode dashboard)

---

## 📚 Related Files

- **Setup Guide**: `STRIPE_TEST_MODE_SETUP_NOW.md`
- **Local Setup Script**: `setup-stripe-test-mode.ps1`
- **Firebase Functions Code**: `functions/src/index.ts`
- **API Route Code**: `app/api/create-checkout-session/route.ts`

---

## 💡 Important Notes

1. **All 3 functions need the same variables**: `createCheckoutSession`, `createDonationSession`, and `stripeWebhook` all need these environment variables.

2. **Mode Consistency**: Make sure you're using Test Mode keys with Test Mode Price ID. Mixing modes will cause errors.

3. **No Redeployment Needed**: After setting variables in Firebase Console, functions pick them up automatically. Only Google Cloud Console method requires redeployment.

4. **Free Tier Compatible**: Firebase Spark (free) plan supports Cloud Functions, so you can use Stripe Test Mode without upgrading.


