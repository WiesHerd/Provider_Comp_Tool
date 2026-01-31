# Fix Stripe 500 Errors

## Problem
You're seeing these errors in the console:
```
api/create-checkout-session:1 Failed to load resource: the server responded with a status of 500
api/create-donation-session:1 Failed to load resource: the server responded with a status of 500
```

## Root Cause
The Firebase Functions are missing the `STRIPE_SECRET_KEY` environment variable. When the functions try to initialize Stripe, they fail because the secret key is not configured.

## Solution: Set Environment Variables in Firebase

### Option 1: Firebase Console (Recommended)

1. **Go to Firebase Console:**
   - Direct link: https://console.firebase.google.com/project/complens-88a4f/functions/config
   - Or navigate: Firebase Console → Functions → Configuration tab

2. **Add Environment Variables:**
   Click "Add variable" and add these:

   **Variable 1: STRIPE_SECRET_KEY**
   - Name: `STRIPE_SECRET_KEY`
   - Value: Your Stripe secret key (starts with `sk_test_...` or `sk_live_...`)
   - Click "Add"

   **Variable 2: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY** (if needed by functions)
   - Name: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Value: Your Stripe publishable key (starts with `pk_test_...` or `pk_live_...`)
   - Click "Add"

   **Variable 3: NEXT_PUBLIC_STRIPE_PRO_PRICE_ID** (if needed)
   - Name: `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`
   - Value: Your Stripe price ID (starts with `price_...`)
   - Click "Add"

3. **Save:**
   Click "Save" at the bottom to apply changes.

4. **Redeploy Functions (if needed):**
   ```powershell
   firebase deploy --only functions
   ```

### Option 2: Firebase CLI

```powershell
# Set the Stripe secret key
firebase functions:config:set stripe.secret_key="sk_test_YOUR_KEY_HERE"

# Or if using the new environment variables format:
firebase functions:secrets:set STRIPE_SECRET_KEY
# (Then paste your key when prompted)

# Redeploy
firebase deploy --only functions
```

### Option 3: Google Cloud Console

If the Configuration tab isn't visible in Firebase Console:

1. **Go to:** https://console.cloud.google.com/functions/list?project=complens-88a4f
2. **Click on** `createCheckoutSession` function
3. **Click** "EDIT" button
4. **Scroll to** "Runtime environment variables"
5. **Add variable:**
   - Name: `STRIPE_SECRET_KEY`
   - Value: Your Stripe secret key
6. **Click** "DEPLOY"
7. **Repeat** for `createDonationSession` function

## Verify It's Working

1. **Check Function Logs:**
   - Go to: https://console.firebase.google.com/project/complens-88a4f/functions/logs
   - Look for any errors related to Stripe initialization

2. **Test the API:**
   - Open browser console
   - Try clicking "Upgrade to Pro" or making a donation
   - The 500 errors should be gone
   - If you see a different error, check the console logs for details

## Get Your Stripe Keys

### Test Mode (Free for Development)
1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (`pk_test_...`)
3. Copy your **Secret key** (`sk_test_...`)

### Live Mode (Production)
1. Go to: https://dashboard.stripe.com/apikeys
2. Copy your **Publishable key** (`pk_live_...`)
3. Copy your **Secret key** (`sk_live_...`)

## Additional Notes

- **Test vs Live Keys:** Make sure you're using test keys in test mode and live keys in production
- **Function Deployment:** After setting environment variables, you may need to redeploy functions for changes to take effect
- **Error Messages:** The improved error handling will now show more helpful messages if the key is missing

## Still Having Issues?

1. **Check Function Logs:**
   - Firebase Console → Functions → Logs
   - Look for detailed error messages

2. **Verify Function Deployment:**
   ```powershell
   firebase functions:list
   ```
   Should show: `createCheckoutSession`, `createDonationSession`, `stripeWebhook`

3. **Test Function Directly:**
   - Try calling the function URL directly with a POST request
   - Check the response for detailed error messages
