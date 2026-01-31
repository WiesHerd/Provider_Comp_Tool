# 🎯 Quick Guide: Set Environment Variables

## Step 1: Open Google Cloud Console

**Direct link to your functions:**
👉 https://console.cloud.google.com/functions/list?project=complens-88a4f

## Step 2: Click on the First Function

Click on **`createCheckoutSession`** (the first function in the list)

## Step 3: Edit the Function

1. Click the **"EDIT"** button at the top of the page
2. Scroll down to find **"Runtime, build, connections and security settings"**
3. Click to **expand** that section
4. Look for **"Runtime environment variables"** or **"Environment variables"**

## Step 4: Add the 3 Variables

Click **"ADD VARIABLE"** or **"ADD ENVIRONMENT VARIABLE"** and add these one by one:

### Variable 1:
- **Name:** `STRIPE_SECRET_KEY`
- **Value:** Get from Stripe Dashboard → API Keys → Reveal test key (`sk_test_...`)

### Variable 2:
- **Name:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Value:** Get from Stripe Dashboard → API Keys (`pk_test_...`)

### Variable 3:
- **Name:** `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`
- **Value:** Get from Stripe Dashboard → Products (`price_...`)

## Step 5: Deploy

Click **"DEPLOY"** or **"NEXT"** → **"DEPLOY"** at the bottom
Wait 1-2 minutes for deployment

## Step 6: Repeat for Other Functions

Go back to the functions list and repeat Steps 2-5 for:
- `createDonationSession`
- `stripeWebhook`

(You can skip `onFeedbackCreated` - it doesn't need Stripe keys)

## ✅ Test It!

After setting variables for all 3 functions:
1. Go to: https://complens-88a4f.web.app/pricing
2. Click "Upgrade to Pro"
3. Should work! 🎉




