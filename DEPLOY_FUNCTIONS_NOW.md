# 🚀 Deploy Functions - Step by Step

## Step 1: Set Environment Variables (Do This First!)

1. **Go to**: https://console.firebase.google.com/project/complens-88a4f/functions/config
2. **Click**: "Add variable" for each of these:

   **Variable 1:**
   - Name: `STRIPE_SECRET_KEY`
   - Value: `sk_test_...` (your Stripe test secret key)
   - Click "Add"

   **Variable 2:**
   - Name: `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`
   - Value: `price_...` (your test price ID for $99/year product)
   - Click "Add"

   **Variable 3:**
   - Name: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Value: `pk_test_...` (your Stripe test publishable key)
   - Click "Add"

3. **Click**: "Save" at the bottom

## Step 2: Get Your Stripe Test Keys

If you don't have them yet:

1. **Go to**: https://dashboard.stripe.com/test/apikeys
2. **Make sure you're in "Test mode"** (toggle in top right)
3. **Copy**:
   - Publishable key (`pk_test_...`)
   - Secret key (`sk_test_...`) - Click "Reveal test key"

## Step 3: Create Test Product (If Not Done Yet)

1. **Go to**: https://dashboard.stripe.com/test/products
2. **Click**: "Add product"
3. **Fill in**:
   - Name: `CompLens Pro`
   - Price: `$99.00`
   - Billing: **Yearly**
4. **Save** and copy the Price ID (`price_...`)

## Step 4: Deploy Functions

Once environment variables are set, run:

```powershell
cd functions
npm run build
cd ..
firebase deploy --only functions
```

## ✅ After Deployment

Your functions will be live at:
- Checkout: `https://us-central1-complens-88a4f.cloudfunctions.net/createCheckoutSession`
- Donation: `https://us-central1-complens-88a4f.cloudfunctions.net/createDonationSession`
- Webhook: `https://us-central1-complens-88a4f.cloudfunctions.net/stripeWebhook`

Then test at: https://complens-88a4f.web.app/pricing




