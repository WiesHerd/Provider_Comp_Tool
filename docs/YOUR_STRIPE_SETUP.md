# Your Stripe Live Mode Setup

## ✅ Your API Keys

**Publishable Key (Public - Safe to expose):** Get from Stripe Dashboard → API Keys (`pk_live_...`).

**Secret Key (Private - Keep Secret!):** Get from Stripe Dashboard → API Keys (`sk_live_...`). Never commit to git.

## 📝 Update Your `.env.local` File

Add or update these lines in your `.env.local` file:

```env
# Stripe Live Mode Keys (from Stripe Dashboard → API Keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE

# Stripe Price ID (get from Step 2 below)
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_YOUR_PRICE_ID_HERE

# Stripe Webhook Secret (get from Step 3 below)
STRIPE_WEBHOOK_SECRET=whsec_... (you need to create this)
```

## 🔴 IMPORTANT: What You Still Need to Do

### Step 1: ✅ DONE - You have your API keys!

### Step 2: Create "CompLens Pro" Product in Live Mode

1. **Go to**: https://dashboard.stripe.com/products
2. **Click**: "Add product"
3. **Fill in**:
   - **Name**: `CompLens Pro`
   - **Description**: `Professional subscription for CompLens`
   - **Pricing**:
     - Model: **Recurring**
     - Price: `$29.00`
     - Billing period: **Monthly**
4. **Click**: "Save product"
5. **Copy** the **Price ID** (starts with `price_...`)
6. **Add** to `.env.local` as `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`

### Step 3: Set Up Production Webhooks

1. **Go to**: https://dashboard.stripe.com/webhooks
2. **Click**: "Add endpoint"
3. **URL**: `https://your-domain.com/api/webhooks/stripe`
   - Replace `your-domain.com` with your actual Firebase Hosting domain
   - Example: `https://complens-88a4f.web.app/api/webhooks/stripe`
4. **Events to send**:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `payment_intent.succeeded` (for donations)
5. **Click**: "Add endpoint"
6. **Copy** the "Signing secret" (starts with `whsec_...`)
7. **Add** to `.env.local` as `STRIPE_WEBHOOK_SECRET`

### Step 4: Update Firebase Environment Variables

For production, you also need to add these to Firebase:

1. **Go to**: Firebase Console → Your Project → Functions → Configuration
2. **Add** these environment variables:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_YOUR_PUBLISHABLE_KEY_HERE`
   - `STRIPE_SECRET_KEY` = `sk_live_YOUR_SECRET_KEY_HERE`
   - `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` = `price_...` (from Step 2)
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...` (from Step 3)

### Step 5: Test It!

1. **Update** `.env.local` with all the values above
2. **Restart** your dev server: `npm run dev`
3. **Go to**: `/pricing` in your app
4. **Test** with a small amount:
   - Try subscribing for $1 (or your actual price)
   - Try donating $5
5. **Check** Stripe Dashboard → Payments to see the payment
6. **Verify** webhook is receiving events

## 🎉 What's Ready

- ✅ Live Mode API keys configured
- ✅ Donation support added
- ✅ Checkout API updated for subscriptions and donations
- ✅ Webhooks updated to handle both payment types
- ✅ Pricing page has donation button

## ⚠️ Security Reminder

**NEVER commit your `.env.local` file to Git!** It contains your secret key.

Make sure `.env.local` is in your `.gitignore` file.

## 📚 Next Steps

1. Complete Step 2 (create product) - **REQUIRED**
2. Complete Step 3 (set up webhooks) - **REQUIRED for production**
3. Complete Step 4 (Firebase env vars) - **REQUIRED for production**
4. Test everything (Step 5)

Once you complete these steps, you'll be ready to accept real payments! 🚀




