# Stripe Live Mode - Quick Start Checklist

## ✅ You're Already in Live Mode!

Your publishable key: `pk_live_51SduljHe5rsxCfoQVmZshOGkAzaO5YZB5GxC3tkVQAtaSmhP4hB7IsWot3hb1TI5ksAdAaFMoUr3hbSCgkJmrUPc00sdjJJMXH`

## 📋 Setup Checklist

### 1. Get Your Live Secret Key
- [ ] Go to: https://dashboard.stripe.com/apikeys
- [ ] Copy your **Secret key** (starts with `sk_live_...`)
- [ ] Add to `.env.local` as `STRIPE_SECRET_KEY`

### 2. Create Products in Live Mode
- [ ] Go to: https://dashboard.stripe.com/products
- [ ] Create "CompLens Pro" subscription ($29/month)
- [ ] Copy the Price ID (starts with `price_...`)
- [ ] Add to `.env.local` as `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`

### 3. Update Environment Variables

**`.env.local`** (for local development):
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51SduljHe5rsxCfoQVmZshOGkAzaO5YZB5GxC3tkVQAtaSmhP4hB7IsWot3hb1TI5ksAdAaFMoUr3hbSCgkJmrUPc00sdjJJMXH
STRIPE_SECRET_KEY=sk_live_... (from Step 1)
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_... (from Step 2)
```

**Firebase Hosting** (for production):
- [ ] Go to Firebase Console → Functions → Configuration
- [ ] Add all the same environment variables

### 4. Set Up Production Webhooks
- [ ] Go to: https://dashboard.stripe.com/webhooks
- [ ] Click "Add endpoint"
- [ ] URL: `https://your-domain.com/api/webhooks/stripe`
- [ ] Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `payment_intent.succeeded`
- [ ] Copy the webhook secret (starts with `whsec_...`)
- [ ] Add to environment variables as `STRIPE_WEBHOOK_SECRET`

### 5. Test It!
- [ ] Update `.env.local` with Live Mode keys
- [ ] Restart dev server: `npm run dev`
- [ ] Go to `/pricing`
- [ ] Test with a small amount ($1 subscription or $5 donation)
- [ ] Check Stripe Dashboard to see the payment

## 🎉 New Features Added

### ✅ Donation Support
- Users can now donate any amount
- Donation button on pricing page
- One-time payments (not subscriptions)
- Thank you message after donation

### ✅ Updated Checkout API
- Supports both subscriptions and one-time payments
- Automatically detects payment type
- Works with Live Mode

### ✅ Updated Webhooks
- Handles subscriptions (updates user profile)
- Handles donations (logs donation)
- Ready for production

## 📝 What You Need to Do

1. **Get your Live Secret Key** from Stripe Dashboard
2. **Create products** in Live Mode (subscription + optional donation product)
3. **Update environment variables** in `.env.local` and Firebase
4. **Set up webhooks** for production
5. **Test** with a small payment

## 🔒 Security Reminders

- ✅ Never commit live API keys to Git
- ✅ Use environment variables only
- ✅ Keep your secret key secure
- ✅ Monitor Stripe Dashboard for activity

## 📚 Full Guide

See `docs/STRIPE_LIVE_MODE_SETUP.md` for detailed instructions.

## 🆘 Troubleshooting

**"Invalid API Key"**
- Make sure you're using `pk_live_...` and `sk_live_...` keys
- Check for typos in environment variables
- Restart dev server after updating `.env.local`

**"Product not found"**
- Products must be created in Live Mode separately
- Make sure you copied the correct Price ID from Live Mode

**"Webhook not working"**
- Check webhook URL is correct (must be your production domain)
- Verify webhook secret matches
- Check Firebase logs for errors




