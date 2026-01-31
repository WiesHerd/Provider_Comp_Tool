# ✅ Stripe Deployment Ready!

## What I've Done

1. ✅ **Created Firebase Functions** for Stripe API routes:
   - `createCheckoutSession` - Handles subscriptions
   - `createDonationSession` - Handles donations  
   - `stripeWebhook` - Handles Stripe webhooks

2. ✅ **Updated `firebase.json`** to route API calls to functions

3. ✅ **Installed Stripe** in functions directory

4. ✅ **Added donation support** to pricing page

## 🚀 Next Steps to Deploy

### Step 1: Set Environment Variables in Firebase

**Option A: Firebase Console (Easiest)**
1. Go to: https://console.firebase.google.com/project/complens-88a4f/functions/config
2. Click "Add variable" for each:
   - `STRIPE_SECRET_KEY` = `sk_live_YOUR_SECRET_KEY_HERE`
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...` (get from Stripe Dashboard → Webhooks)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_YOUR_PUBLISHABLE_KEY_HERE`
   - `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` = `price_...` (create product in Stripe first!)

**Option B: Firebase CLI**
```powershell
firebase functions:config:set stripe.secret_key="sk_live_YOUR_SECRET_KEY_HERE"
firebase functions:config:set stripe.webhook_secret="whsec_..."
```

### Step 2: Build Functions

```powershell
cd functions
npm run build
cd ..
```

### Step 3: Deploy

```powershell
# Deploy functions first
firebase deploy --only functions

# Then deploy hosting
npm run deploy
```

**OR deploy everything at once:**
```powershell
firebase deploy
```

### Step 4: Update Stripe Webhook URL

After deployment, update webhook in Stripe:

1. Go to: https://dashboard.stripe.com/webhooks
2. Edit your webhook endpoint
3. URL: `https://us-central1-complens-88a4f.cloudfunctions.net/stripeWebhook`
4. Save

## 📝 Important Notes

- **Environment Variables**: Must be set in Firebase Console before deploying functions
- **Product Creation**: You still need to create "CompLens Pro" product in Stripe Live Mode
- **Webhook Secret**: Get this from Stripe Dashboard after creating webhook endpoint

## 🧪 Testing After Deployment

1. Go to: `https://complens-88a4f.web.app/pricing`
2. Try subscribing (will need valid Price ID)
3. Try donating (should work immediately)
4. Check Stripe Dashboard for payments
5. Check Firebase Functions logs for errors

## 📚 Full Documentation

- See `docs/DEPLOY_STRIPE_TO_FIREBASE.md` for detailed steps
- See `docs/YOUR_STRIPE_SETUP.md` for complete setup guide

## ⚠️ Before You Deploy

Make sure you have:
- ✅ Created "CompLens Pro" product in Stripe Live Mode
- ✅ Copied the Price ID
- ✅ Set all environment variables in Firebase Console
- ✅ Built functions (`cd functions && npm run build`)

Then you're ready to deploy! 🚀




