# Stripe Payment Integration Setup

This guide explains how to set up Stripe payments for CompLens™ using **test mode** (100% free for demos).

## Overview

Stripe has been integrated into the app to handle subscriptions. The integration includes:
- Pricing page (`/pricing`)
- Stripe Checkout for secure payment processing
- Webhook handler for subscription updates
- User profile subscription tracking in Firestore

## Step 1: Create Stripe Account

1. Go to https://stripe.com
2. Sign up for a free account
3. You'll automatically be in **Test Mode** (perfect for demos)

## Step 2: Get Your API Keys

1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (starts with `pk_test_...`)
3. Copy your **Secret key** (starts with `sk_test_...`)

## Step 3: Create a Product and Price

1. Go to: https://dashboard.stripe.com/test/products
2. Click **"Add product"**
3. Fill in:
   - **Name**: "CompLens Pro"
   - **Description**: "Professional subscription for CompLens"
   - **Pricing**: 
     - Model: Recurring
     - Price: $29.00
     - Billing period: Monthly
4. Click **"Save product"**
5. Copy the **Price ID** (starts with `price_...`)

## Step 4: Set Environment Variables

Add these to your `.env.local` file:

```env
# Stripe Test Mode Keys (Free!)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Stripe Price ID for Pro plan
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...

# Stripe Webhook Secret (optional for local testing)
# Get this from: https://dashboard.stripe.com/test/webhooks
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Step 5: Update Pricing Page

The pricing page is already set up at `/app/pricing/PricingClient.tsx`. 

If you need to update the price ID, edit this line:
```typescript
priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_test_pro',
```

## Step 6: Test the Integration

### Test Card Numbers (Stripe Test Mode)

Use these test cards (no real charges):

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires 3D Secure**: `4000 0025 0000 3155`

**For all test cards:**
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

### Testing Steps

1. Start your dev server: `npm run dev`
2. Navigate to `/pricing`
3. Click "Upgrade to Pro"
4. Use test card: `4242 4242 4242 4242`
5. Complete checkout
6. You should be redirected back with a success message

## Step 7: Set Up Webhooks (Optional for Production)

Webhooks update subscription status in Firestore when payments succeed/fail.

### For Local Development

Use Stripe CLI to forward webhooks:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:3002/api/webhooks/stripe
```

This will give you a webhook secret to add to `.env.local`.

### For Production (Firebase Hosting)

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. URL: `https://your-domain.com/api/webhooks/stripe`
4. Events to send:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Signing secret** and add to Firebase environment variables

## How It Works

1. **User clicks "Upgrade to Pro"** → Creates Stripe Checkout session
2. **User completes payment** → Stripe redirects to success page
3. **Webhook fires** → Updates user profile in Firestore with subscription status
4. **App checks subscription** → Can gate features based on `user.subscription.status`

## Subscription Status in Firestore

User profiles now include subscription data:

```typescript
{
  subscription: {
    status: 'active' | 'canceled' | 'past_due' | 'trialing',
    plan: 'free' | 'pro' | 'enterprise',
    currentPeriodEnd: '2024-12-31T23:59:59Z',
    stripeCustomerId: 'cus_...',
    stripeSubscriptionId: 'sub_...',
  }
}
```

## Free Tier Notes

- ✅ **Stripe Test Mode is 100% free** - no charges ever
- ✅ **No credit card required** for test mode
- ✅ **Perfect for demos and show-and-tell**
- ⚠️ **Switch to Live Mode** only when ready for real payments

## Troubleshooting

### "Failed to create checkout session"
- Check that `STRIPE_SECRET_KEY` is set correctly
- Verify the price ID exists in Stripe Dashboard

### "Webhook signature verification failed"
- Make sure `STRIPE_WEBHOOK_SECRET` matches your webhook endpoint
- For local dev, use Stripe CLI to get the correct secret

### Subscription not updating in Firestore
- Check webhook is configured correctly
- Verify Firebase security rules allow updates to `users/{userId}`
- Check browser console and server logs for errors

## Next Steps

1. Test the full checkout flow
2. Verify subscription status updates in Firestore
3. Add feature gating based on subscription (e.g., limit scenarios for free users)
4. When ready for production, switch to Live Mode in Stripe Dashboard

## Resources

- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)





