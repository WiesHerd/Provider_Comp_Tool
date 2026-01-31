# ✅ Your Stripe Price ID Setup

## 🎯 Your Price ID

**Price ID:** Get from Stripe Dashboard → Products (e.g. `price_...`)

This is for your **$99/year** CompLens Pro subscription.

---

## 📝 Step 1: Update Local Environment (`.env.local`)

Open your `.env.local` file and add/update this line:

```env
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_YOUR_PRICE_ID_HERE
```

**Make sure you also have your Live Mode keys** (from Stripe Dashboard → API Keys):
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
```

---

## 🔥 Step 2: Update Firebase Functions Environment Variables

1. **Go to**: [Firebase Console](https://console.firebase.google.com/)
2. **Select your project**: `complens-88a4f`
3. **Navigate to**: Functions → Configuration → Environment Variables
4. **Add or update**:
   - `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` = `price_YOUR_PRICE_ID_HERE`
   - `STRIPE_SECRET_KEY` = `sk_live_YOUR_SECRET_KEY_HERE`
   - `STRIPE_WEBHOOK_SECRET` = (get from Stripe webhook setup)

---

## 🧪 Step 3: Test Locally

1. **Restart your dev server**:
   ```powershell
   npm run dev
   ```

2. **Go to**: `http://localhost:3002/pricing`

3. **Verify**:
   - ✅ Shows "$99/year" for Pro plan
   - ✅ "Save 72% vs monthly billing" message appears
   - ✅ Only "Free" and "Pro" plans are shown

4. **Test checkout** (use a test card):
   - Click "Upgrade to Pro"
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date, any CVC

---

## 🚀 Step 4: Deploy to Firebase

Once local testing works:

```powershell
# Build functions
cd functions
npm run build
cd ..

# Deploy everything
firebase deploy
```

---

## ✅ Checklist

- [x] Product created in Stripe: "CompLens"
- [x] Price set: $99/year
- [x] Price ID obtained: `price_1SdxpyHe5rsxCfoQfYrXQ5Ou`
- [ ] Updated `.env.local` with Price ID
- [ ] Updated Firebase Functions environment variables
- [ ] Tested locally
- [ ] Deployed to Firebase
- [ ] Set up production webhook in Stripe Dashboard

---

## 🔗 Quick Links

- **Stripe Dashboard**: https://dashboard.stripe.com/products
- **Firebase Console**: https://console.firebase.google.com/project/complens-88a4f
- **Your Product**: https://dashboard.stripe.com/products/prod_TbAAHTk5vhDIKh

---

## 🆘 Need Help?

If checkout doesn't work:
1. Check browser console for errors
2. Verify environment variables are loaded (restart dev server)
3. Check Firebase Functions logs: `firebase functions:log`
4. Verify Stripe webhook is set up correctly




