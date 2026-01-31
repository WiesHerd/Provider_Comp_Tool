# 🧪 Stripe Test Mode - Quick Start

## ✅ Switch to Test Mode (Developer Mode)

Perfect for testing! No real payments, no credit card needed, 100% free.

---

## 📋 3 Simple Steps

### Step 1: Get Test Mode Keys from Stripe

1. **Go to**: https://dashboard.stripe.com/test/apikeys
2. **Make sure toggle says "Test mode"** (top right of Stripe Dashboard)
3. **Copy**:
   - Publishable key: `pk_test_...`
   - Secret key: `sk_test_...`

### Step 2: Create Test Product

1. **Go to**: https://dashboard.stripe.com/test/products
2. **Click**: "Add product"
3. **Fill in**:
   - Name: `CompLens Pro`
   - Price: `$99.00`
   - Billing: `Yearly`
4. **Copy the Price ID** (starts with `price_...`)

### Step 3: Update `.env.local`

```env
# Stripe Test Mode (100% Free!)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (paste your test key)
STRIPE_SECRET_KEY=sk_test_... (paste your test secret key)
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_... (paste your test price ID)
```

**Then restart**: `npm run dev`

---

## 🧪 Test It!

1. Go to `/pricing`
2. Click "Upgrade to Pro"
3. Use test card: **`4242 4242 4242 4242`**
   - Expiry: `12/34`
   - CVC: `123`
   - ZIP: `12345`

**No real charges!** ✅

---

## 🎯 Benefits of Test Mode

- ✅ **100% Free** - No charges ever
- ✅ **No credit card needed** for your Stripe account
- ✅ **Perfect for development** - Test everything safely
- ✅ **No Firebase Blaze plan needed** - Can use Spark plan
- ✅ **Full functionality** - Everything works like production

---

## 📚 Full Guide

See `docs/STRIPE_TEST_MODE_SETUP.md` for detailed instructions.

---

## 🔄 Switch to Live Mode Later

When ready for real payments:
1. Get live keys from Stripe Dashboard
2. Create product in live mode
3. Update `.env.local` with live keys

**You control when to switch!** 🎉
