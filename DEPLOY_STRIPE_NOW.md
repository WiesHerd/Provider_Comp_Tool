# 🚀 Deploy Stripe to Firebase - Step by Step

## ✅ What You Have Ready

- ✅ Product created: "CompLens" 
- ✅ Price: $99/year
- ✅ Price ID: `price_1SdxpyHe5rsxCfoQfYrXQ5Ou`
- ✅ Functions code ready in `functions/src/index.ts`

---

## 📋 Pre-Deployment Checklist

Before deploying, you need to set environment variables in Firebase:

### Step 1: Set Firebase Environment Variables

**Go to Firebase Console:**
1. Visit: https://console.firebase.google.com/project/complens-88a4f/functions/config
2. Click **"Add variable"** for each:

   ```
   STRIPE_SECRET_KEY = sk_live_YOUR_SECRET_KEY_HERE
   NEXT_PUBLIC_STRIPE_PRO_PRICE_ID = price_YOUR_PRICE_ID_HERE
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_YOUR_PUBLISHABLE_KEY_HERE
   ```

   ⚠️ **Note:** `STRIPE_WEBHOOK_SECRET` can be added later after you set up the webhook.

---

## 🚀 Deployment Steps

### Step 2: Build Functions

```powershell
cd functions
npm run build
cd ..
```

### Step 3: Deploy Everything

**Option A: Deploy All (Recommended)**
```powershell
firebase deploy
```

**Option B: Deploy Functions First, Then Hosting**
```powershell
# Deploy functions
firebase deploy --only functions

# Then deploy hosting
npm run build:firebase
firebase deploy --only hosting
```

---

## 🔗 Step 4: Set Up Stripe Webhook (After Deployment)

After functions are deployed, you'll get a webhook URL:

1. **Go to**: https://dashboard.stripe.com/webhooks
2. **Click**: "Add endpoint"
3. **URL**: `https://us-central1-complens-88a4f.cloudfunctions.net/stripeWebhook`
4. **Events to send**:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
5. **Click**: "Add endpoint"
6. **Copy** the "Signing secret" (starts with `whsec_...`)
7. **Add to Firebase**: Go back to Firebase Console → Functions → Config → Add `STRIPE_WEBHOOK_SECRET`

---

## ✅ Step 5: Verify Deployment

1. **Check Functions**:
   - Go to: https://console.firebase.google.com/project/complens-88a4f/functions
   - You should see:
     - ✅ `createCheckoutSession`
     - ✅ `createDonationSession`
     - ✅ `stripeWebhook`

2. **Test Your App**:
   - Visit: https://complens-88a4f.web.app/pricing
   - Click "Upgrade to Pro"
   - Should redirect to Stripe Checkout

3. **Check Function Logs**:
   ```powershell
   firebase functions:log
   ```

---

## 🧪 Test Payment Flow

1. **Go to**: https://complens-88a4f.web.app/pricing
2. **Click**: "Upgrade to Pro"
3. **Use test card** (if still in test mode):
   - Card: `4242 4242 4242 4242`
   - Any future date
   - Any CVC
4. **Complete checkout**
5. **Verify** in Stripe Dashboard → Payments

---

## ⚠️ Important Notes

- **Environment variables must be set BEFORE deploying functions**
- **Webhook secret can be added after webhook is created**
- **Functions will fail if `STRIPE_SECRET_KEY` is missing**
- **Test in Stripe test mode first if unsure**

---

## 🆘 Troubleshooting

**Functions not working?**
- Check Firebase Console → Functions → Logs
- Verify environment variables are set
- Check function URLs are correct

**Webhook not receiving events?**
- Verify webhook URL in Stripe Dashboard
- Check webhook secret matches Firebase config
- Check Firebase Functions logs

**Checkout not redirecting?**
- Verify `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` is set correctly
- Check browser console for errors
- Verify publishable key is correct

---

## 📝 Quick Reference

**Function URLs (after deployment):**
- Checkout: `https://us-central1-complens-88a4f.cloudfunctions.net/createCheckoutSession`
- Donation: `https://us-central1-complens-88a4f.cloudfunctions.net/createDonationSession`
- Webhook: `https://us-central1-complens-88a4f.cloudfunctions.net/stripeWebhook`

**Your Price ID:** Get from Stripe Dashboard → Products.

**Your Live Keys:** Get from Stripe Dashboard → API Keys (never commit real keys to git).




