# 🔧 Set Environment Variables via Google Cloud Console

Since the Configuration tab isn't visible in Firebase Console, we'll use Google Cloud Console instead.

## Step 1: Go to Cloud Functions in Google Cloud Console

**Direct link:**
https://console.cloud.google.com/functions/list?project=complens-88a4f&supportedpurview=project

## Step 2: Select a Function

1. **Click on** `createCheckoutSession` (or any function)
2. This will open the function details page

## Step 3: Edit Environment Variables

1. **Click** the **"EDIT"** button at the top
2. **Scroll down** to **"Runtime, build, connections and security settings"**
3. **Expand** that section
4. **Look for** **"Runtime environment variables"** or **"Secrets and environment variables"**
5. **Click** **"Add variable"** or **"ADD ENVIRONMENT VARIABLE"**

## Step 4: Add Your Variables

Add these three variables:

1. **Name**: `STRIPE_SECRET_KEY`
   **Value**: `sk_test_YOUR_SECRET_KEY_HERE` (from Stripe Dashboard → API Keys)

2. **Name**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   **Value**: `pk_test_YOUR_PUBLISHABLE_KEY_HERE` (from Stripe Dashboard → API Keys)

3. **Name**: `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`
   **Value**: `price_...` (your test price ID)

## Step 5: Deploy

1. **Click** **"DEPLOY"** or **"NEXT"** → **"DEPLOY"**
2. **Wait** for deployment to complete (1-2 minutes)

## Step 6: Repeat for Other Functions

You'll need to do this for:
- `createCheckoutSession`
- `createDonationSession`
- `stripeWebhook`

(You can skip `onFeedbackCreated` if it doesn't need Stripe keys)

---

## Alternative: Update All Functions at Once

If you want to update all functions programmatically, we can modify the deployment to include environment variables. Let me know if you'd prefer that approach!




