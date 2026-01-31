# ⚡ Quick Fix: Stripe Mode Mismatch Error

## 🎯 The Problem

You're seeing this error:
```
No such price: 'price_1SdxpyHe5rsxCfoQfYrXQSOu'; 
a similar object exists in live mode, but a test mode key was used.
```

**Translation**: Your Price ID is from **Live Mode**, but you're using **Test Mode** keys.

---

## ✅ The Solution (5 Steps)

### 1️⃣ Create Test Mode Product (2 min)
- Go to: https://dashboard.stripe.com/test/products
- Make sure toggle says **"Test mode"** (top-right)
- Click "Add product"
- Name: `CompLens Pro`, Price: `$99.00`, Billing: **Yearly**
- Copy the **Price ID** (starts with `price_...`)

### 2️⃣ Get Test Mode Keys (1 min)
- Go to: https://dashboard.stripe.com/test/apikeys
- Copy **Publishable key** (`pk_test_...`)
- Copy **Secret key** (`sk_test_...`)

### 3️⃣ Update `.env.local` (1 min)
Create/update `.env.local`:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_YOUR_TEST_PRICE_ID
```

### 4️⃣ Set Firebase Functions Variables (3 min)
**Option A**: Firebase Console → Functions → Configuration
**Option B**: Google Cloud Console → Functions → Edit each function

Set the same 3 variables as Step 3.

### 5️⃣ Test (1 min)
```powershell
npm run dev
```
Go to: `http://localhost:3002/pricing`
Click "Upgrade to Pro"
Use test card: `4242 4242 4242 4242`

---

## 📚 Detailed Guides

- **Full Setup**: `STRIPE_TEST_MODE_SETUP_NOW.md`
- **Firebase Functions**: `FIREBASE_FUNCTIONS_ENV_SETUP.md`
- **Helper Script**: `setup-stripe-test-mode.ps1`

---

## ✅ Success Checklist

- [ ] Created Test Mode product in Stripe
- [ ] Got Test Mode Price ID
- [ ] Got Test Mode API keys
- [ ] Updated `.env.local`
- [ ] Set Firebase Functions variables
- [ ] Tested locally - works!

---

## 💡 Key Point

**Test Mode keys** → **Test Mode Price ID**  
**Live Mode keys** → **Live Mode Price ID**

Never mix modes!


