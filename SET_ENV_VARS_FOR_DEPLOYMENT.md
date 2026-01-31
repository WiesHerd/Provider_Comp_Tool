# ✅ Set Environment Variables for Firebase Functions

Your functions are deployed! Now set the Stripe environment variables.

## Quick Method: Google Cloud Console

1. **Go to**: https://console.cloud.google.com/functions/list?project=complens-88a4f

2. **For each function** (`createCheckoutSession`, `createDonationSession`, `stripeWebhook`):
   - Click on the function name
   - Click **"EDIT"** button at the top
   - Scroll to **"Runtime, build, connections and security settings"**
   - Expand it
   - Find **"Runtime environment variables"**
   - Click **"ADD VARIABLE"** for each:

     **Variable 1:**
     - Name: `STRIPE_SECRET_KEY`
     - Value: Get from Stripe Dashboard → API Keys (`sk_test_...`)

     **Variable 2:**
     - Name: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
     - Value: Get from Stripe Dashboard → API Keys (`pk_test_...`)

     **Variable 3:**
     - Name: `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`
     - Value: Get from Stripe Dashboard → Products (`price_...`)

   - Click **"DEPLOY"** to save

## Alternative: Firebase Console (if available)

1. **Go to**: https://console.firebase.google.com/project/complens-88a4f/functions/config
2. Click **"Add variable"** for each variable above
3. Click **"Save"**

## Test After Setting Variables

1. Go to: https://complens-88a4f.web.app/pricing
2. Click "Upgrade to Pro"
3. Should redirect to Stripe Checkout (no more 500 errors!)

## Current Status

✅ **Deployed:**
- Hosting: https://complens-88a4f.web.app
- Functions: All 4 functions deployed successfully

⏳ **Next Step:**
- Set environment variables (see above)




