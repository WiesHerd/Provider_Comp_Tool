# Deploy Stripe to Firebase - Step by Step

## ✅ What's Ready

- ✅ Stripe API functions created in Firebase Functions
- ✅ Firebase configuration updated to route API calls
- ✅ Donation support added
- ✅ Webhook handler ready

## 📋 Deployment Steps

### Step 1: Install Stripe in Functions

```powershell
cd functions
npm install stripe
cd ..
```

### Step 2: Set Environment Variables in Firebase

You need to set these in Firebase Console:

1. **Go to**: Firebase Console → Your Project → Functions → Configuration → Environment Variables
2. **Add these variables** (get values from Stripe Dashboard → API Keys and Webhooks):
   - `STRIPE_SECRET_KEY` = your live secret key (`sk_live_...`)
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...` (from Stripe Dashboard → Webhooks)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = your live publishable key (`pk_live_...`)
   - `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` = `price_...` (from Stripe Dashboard → Products)

**OR use Firebase CLI:**
```powershell
firebase functions:config:set stripe.secret_key="sk_live_YOUR_SECRET_KEY_HERE"
firebase functions:config:set stripe.webhook_secret="whsec_..."
```

### Step 3: Build Functions

```powershell
cd functions
npm run build
cd ..
```

### Step 4: Deploy Everything

**Option A: Deploy hosting + functions together**
```powershell
npm run deploy:all
```

**Option B: Deploy separately**
```powershell
# Deploy functions first
firebase deploy --only functions

# Then deploy hosting
npm run deploy
```

### Step 5: Update Webhook URL in Stripe

After deployment, update your Stripe webhook URL:

1. **Go to**: https://dashboard.stripe.com/webhooks
2. **Edit** your webhook endpoint
3. **URL**: `https://us-central1-complens-88a4f.cloudfunctions.net/stripeWebhook`
   - Replace `complens-88a4f` with your actual project ID if different
4. **Save**

### Step 6: Test It!

1. **Go to**: `https://complens-88a4f.web.app/pricing`
2. **Try** subscribing or donating
3. **Check** Stripe Dashboard for payments
4. **Check** Firebase Functions logs for any errors

## 🔍 Troubleshooting

### "Function not found"
- Make sure you deployed functions: `firebase deploy --only functions`
- Check function names match in `firebase.json`

### "STRIPE_SECRET_KEY not configured"
- Set environment variables in Firebase Console
- Or use: `firebase functions:config:set stripe.secret_key="..."`

### "Webhook signature verification failed"
- Make sure `STRIPE_WEBHOOK_SECRET` is set correctly
- Check webhook URL in Stripe matches your function URL
- For local testing, use Stripe CLI

### Functions not building
```powershell
cd functions
npm install
npm run build
cd ..
```

## 📝 Quick Deploy Command

```powershell
# Install Stripe in functions
cd functions && npm install stripe && cd ..

# Build functions
cd functions && npm run build && cd ..

# Deploy everything
firebase deploy
```

## ✅ After Deployment

Your API routes will be available at:
- `https://complens-88a4f.web.app/api/create-checkout-session`
- `https://complens-88a4f.web.app/api/create-donation-session`
- `https://complens-88a4f.web.app/api/webhooks/stripe`

These will automatically route to Firebase Functions!




