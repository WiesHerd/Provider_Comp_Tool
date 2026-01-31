# 🔧 Fix Stripe 401 Error (Unauthorized)

## The Problem

The function is getting a **401 Unauthorized** error from Stripe, which means:
- The `STRIPE_SECRET_KEY` environment variable is either:
  - Not set in the function
  - Not being read correctly
  - Has extra spaces or is truncated
  - Is the wrong key (test vs live)

## Solution: Verify Environment Variables

### Step 1: Check the Function in Google Cloud Console

1. **Go to**: https://console.cloud.google.com/functions/list?project=complens-88a4f
2. **Click on** `createCheckoutSession`
3. **Click** the **"Variables"** tab
4. **Verify** these three variables exist:

   - `STRIPE_SECRET_KEY` = your test secret key from Stripe Dashboard (`sk_test_...`)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = your test publishable key (`pk_test_...`)
   - `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` = your price ID from Stripe Products (`price_...`)

### Step 2: Check for Issues

**Common problems:**
- ❌ Variable name has a typo (e.g., `STRIPE_SECRET_KEY` vs `STRIPE_SECRET`)
- ❌ Value has extra spaces at the beginning or end
- ❌ Value is truncated (not the full key)
- ❌ Using live key instead of test key (or vice versa)

### Step 3: Fix and Redeploy

1. **Click "Edit"** on the function
2. **Go to "Runtime" tab**
3. **Check each variable** - make sure:
   - Name is exactly: `STRIPE_SECRET_KEY` (no typos)
   - Value is the complete key (no truncation)
   - No extra spaces
4. **Click "Deploy"** to save

### Step 4: Test Again

After redeploying, test:
1. Go to: https://complens-88a4f.web.app/pricing
2. Click "Upgrade to Pro"
3. Should redirect to Stripe Checkout

---

## Quick Check

**Your Stripe Secret Key** should be from Stripe Dashboard → API Keys (Reveal test key). It starts with `sk_test_`.

**Make sure it's:**
- ✅ No extra characters or spaces
- ✅ No spaces before or after
- ✅ Starts with `sk_test_`
- ✅ Full length (should be quite long)

Let me know what you find in the Variables tab!




