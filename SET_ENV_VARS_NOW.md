# ✅ Set Environment Variables Now

Your functions are deployed! Now set your Stripe keys.

## Step 1: Go to Functions Configuration

**Direct link:**
https://console.firebase.google.com/project/complens-88a4f/functions/config

Or navigate:
1. Go to: https://console.firebase.google.com/project/complens-88a4f/functions
2. Click the **"Configuration"** tab (should be visible now!)

## Step 2: Add Environment Variables

Click **"Add variable"** and add these three:

### Variable 1: STRIPE_SECRET_KEY
- **Name**: `STRIPE_SECRET_KEY`
- **Value**: `sk_test_YOUR_SECRET_KEY_HERE` (get from Stripe Dashboard → API Keys)
- Click "Add"

### Variable 2: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- **Name**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Value**: `pk_test_YOUR_PUBLISHABLE_KEY_HERE` (get from Stripe Dashboard → API Keys)
- Click "Add"

### Variable 3: NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
- **Name**: `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`
- **Value**: `price_...` (your test price ID - create product if needed)
- Click "Add"

## Step 3: Save

Click **"Save"** at the bottom to apply the changes.

## Step 4: Redeploy Functions (Optional)

After setting environment variables, you may need to redeploy:

```powershell
firebase deploy --only functions
```

Or the functions will pick up the new variables automatically on their next invocation.

## ✅ Test It!

Once variables are set:
1. Go to: https://complens-88a4f.web.app/pricing
2. Click "Upgrade to Pro"
3. Use test card: `4242 4242 4242 4242`

---

## Need to Create Test Product?

If you don't have a Price ID yet:
1. Go to: https://dashboard.stripe.com/test/products
2. Click "Add product"
3. Name: `CompLens Pro`
4. Price: `$99.00`
5. Billing: **Yearly**
6. Save and copy the Price ID




