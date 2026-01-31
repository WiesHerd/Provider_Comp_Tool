# Switching Stripe to Live Mode - Complete Guide

## Overview

This guide walks you through switching from Test Mode to Live Mode so you can accept real payments and donations.

## ✅ Current Status: You're in Live Mode!

You've already switched to Live Mode. Now you need to:
1. Get your Live Secret Key
2. Create products in Live Mode
3. Update environment variables
4. Set up production webhooks

## Step 1: Get Your Live Secret Key

1. **Go to**: https://dashboard.stripe.com/apikeys
2. **Click** "Reveal test key" or find your **Secret key** (starts with `sk_live_...`)
3. **Copy** the secret key - you'll need this for `STRIPE_SECRET_KEY`

⚠️ **Keep this secret!** Never commit it to Git or share it publicly.

## Step 2: Create Products in Live Mode

### Create "CompLens Pro" Subscription

1. **Go to**: https://dashboard.stripe.com/products
2. **Click**: "Add product"
3. **Fill in**:
   - **Name**: "CompLens Pro"
   - **Description**: "Professional subscription for CompLens"
   - **Pricing**: 
     - Model: **Recurring**
     - Price: `$29.00`
     - Billing period: **Monthly**
4. **Click**: "Save product"
5. **Copy** the **Price ID** (starts with `price_...`)

### Create "Donation" Product (Optional)

1. **Still in**: https://dashboard.stripe.com/products
2. **Click**: "Add product"
3. **Fill in**:
   - **Name**: "Support CompLens"
   - **Description**: "One-time donation to support CompLens development"
   - **Pricing**: 
     - Model: **One-time**
     - Price: `$5.00` (or any amount - users can change it)
4. **Click**: "Save product"
5. **Copy** the **Price ID** (starts with `price_...`)

## Step 3: Update Environment Variables

### For Local Development (`.env.local`)

Update your `.env.local` file with:

```env
# Live Mode Keys (REPLACE test keys!)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51SduljHe5rsxCfoQVmZshOGkAzaO5YZB5GxC3tkVQAtaSmhP4hB7IsWot3hb1TI5ksAdAaFMoUr3hbSCgkJmrUPc00sdjJJMXH
STRIPE_SECRET_KEY=sk_live_... (get from Step 1)

# Live Mode Price IDs (from Step 2)
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_... (CompLens Pro subscription)
NEXT_PUBLIC_STRIPE_DONATION_PRICE_ID=price_... (Donation - optional)

# Production Webhook Secret (get from Step 4)
STRIPE_WEBHOOK_SECRET=whsec_...
```

### For Production (Firebase Hosting)

1. **Go to**: Firebase Console → Your Project → Functions → Configuration
2. **Add/Update** these environment variables:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_51SduljHe5rsxCfoQVmZshOGkAzaO5YZB5GxC3tkVQAtaSmhP4hB7IsWot3hb1TI5ksAdAaFMoUr3hbSCgkJmrUPc00sdjJJMXH`
   - `STRIPE_SECRET_KEY` = `sk_live_...` (from Step 1)
   - `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` = `price_...` (from Step 2)
   - `NEXT_PUBLIC_STRIPE_DONATION_PRICE_ID` = `price_...` (optional, for donations)
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...` (from Step 4)

## Step 4: Set Up Production Webhooks

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
7. **Add** to your environment variables as `STRIPE_WEBHOOK_SECRET`

## Step 5: Test with Real Payment (Small Amount First!)

1. **Update** your `.env.local` with Live Mode keys
2. **Restart** your dev server: `npm run dev`
3. **Go to**: `/pricing` in your app
4. **Test** with a small amount (e.g., $1 subscription or $5 donation)
5. **Use your own card** to verify it works
6. **Check** Stripe Dashboard → Payments to see the payment
7. **Verify** webhook is receiving events (check Stripe Dashboard → Webhooks)

## What Changed from Test Mode

| Item | Test Mode | Live Mode |
|------|-----------|-----------|
| API Keys | `pk_test_...`, `sk_test_...` | `pk_live_...`, `sk_live_...` ✅ |
| Products | Test products | Must recreate in Live Mode ⚠️ |
| Webhooks | Test webhooks | Production webhooks ⚠️ |
| Payments | Fake/test cards | Real credit cards ✅ |
| Business Info | Not required | Required ✅ |

## Important Reminders

- ✅ **Never commit live API keys to Git**
- ✅ **Products must be created separately in Live Mode** (test products don't exist here)
- ✅ **Test with small amounts first** before going live
- ✅ **Monitor Stripe Dashboard** for payments and errors
- ✅ **Keep your secret key secure** - never expose it

## Troubleshooting

### "Invalid API Key"
- Make sure you're using Live keys (`pk_live_...`, `sk_live_...`)
- Check for typos in environment variables
- Restart your dev server after updating `.env.local`

### "Product not found"
- Products must be created separately in Live Mode
- Test Mode products don't exist in Live Mode
- Make sure you copied the correct Price ID from Live Mode

### "Webhook not receiving events"
- Check webhook URL is correct (must be your production domain)
- Verify webhook secret matches in environment variables
- Check Firebase logs for errors
- Test webhook in Stripe Dashboard → Webhooks → Send test webhook

### "Payment failed"
- Check Stripe Dashboard → Payments for error details
- Verify your bank account is set up in Stripe
- Check business verification is complete

## Next Steps

1. ✅ Get Live Secret Key (Step 1)
2. ✅ Create products in Live Mode (Step 2)
3. ✅ Update environment variables (Step 3)
4. ✅ Set up production webhooks (Step 4)
5. ✅ Test with small payment (Step 5)
6. ✅ Deploy to production!

## Support

- [Stripe Live Mode Docs](https://stripe.com/docs/keys)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Dashboard](https://dashboard.stripe.com)




