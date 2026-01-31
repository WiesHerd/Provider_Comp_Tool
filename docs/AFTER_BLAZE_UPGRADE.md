# ✅ After Blaze Plan Upgrade - Next Steps

## 🎉 Congratulations!

You've successfully upgraded to Blaze plan and claimed $300 in free credits! Now let's get your Stripe functions deployed.

---

## 📋 Step-by-Step: Deploy Stripe Functions

### Step 1: Verify Upgrade

Your project should now show "Blaze" plan in Firebase Console. You can verify at:
- https://console.firebase.google.com/project/complens-88a4f/usage/details

### Step 2: Set Environment Variables in Firebase

Before deploying functions, you need to set your Stripe keys:

1. **Go to**: https://console.firebase.google.com/project/complens-88a4f/functions/config
2. **Click**: "Add variable" for each:

   ```
   STRIPE_SECRET_KEY = sk_test_... (your test secret key)
   NEXT_PUBLIC_STRIPE_PRO_PRICE_ID = price_... (your test price ID)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_... (your test publishable key)
   ```

   ⚠️ **Note**: For now, use your **test mode** keys (starts with `pk_test_` and `sk_test_`)

3. **Click**: "Save" after adding each variable

### Step 3: Build Functions

```powershell
cd functions
npm run build
cd ..
```

### Step 4: Deploy Functions

```powershell
firebase deploy --only functions
```

This will deploy:
- `createCheckoutSession` - For subscriptions
- `createDonationSession` - For donations
- `stripeWebhook` - For handling Stripe events

### Step 5: Update Firebase Hosting Rewrites

The `firebase.json` already has rewrites configured, but let's verify they're correct. After functions deploy, the rewrites will automatically point to your functions.

### Step 6: Test It!

1. **Go to**: https://complens-88a4f.web.app/pricing
2. **Click**: "Upgrade to Pro"
3. **Use test card**: `4242 4242 4242 4242`
4. **Verify**: Checkout should work!

---

## 🔗 Function URLs (After Deployment)

Once deployed, your functions will be available at:
- Checkout: `https://us-central1-complens-88a4f.cloudfunctions.net/createCheckoutSession`
- Donation: `https://us-central1-complens-88a4f.cloudfunctions.net/createDonationSession`
- Webhook: `https://us-central1-complens-88a4f.cloudfunctions.net/stripeWebhook`

---

## 🧪 Test Mode Setup

Since you're using test mode:

1. **Get test keys** from: https://dashboard.stripe.com/test/apikeys
2. **Create test product** at: https://dashboard.stripe.com/test/products
3. **Use test cards** (no real charges):
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

---

## 📝 Quick Checklist

- [x] Upgraded to Blaze plan
- [x] Claimed $300 credits
- [ ] Set environment variables in Firebase Console
- [ ] Built functions (`cd functions && npm run build`)
- [ ] Deployed functions (`firebase deploy --only functions`)
- [ ] Tested checkout flow
- [ ] Set up Stripe webhook (optional for now)

---

## 🆘 Troubleshooting

**Functions won't deploy?**
- Check you're on Blaze plan
- Verify environment variables are set
- Check function logs: `firebase functions:log`

**Checkout not working?**
- Verify environment variables are correct
- Check browser console for errors
- Verify function URLs are correct

---

## 🎯 Next: Deploy Functions!

Ready to deploy? Run these commands:

```powershell
# 1. Set environment variables in Firebase Console first!
# 2. Then build and deploy:
cd functions
npm run build
cd ..
firebase deploy --only functions
```

Let me know when you've set the environment variables, and I can help you deploy! 🚀




