# 🧪 Quick Test Mode Setup

## What You Need to Do (5 minutes)

### 1. Get Test Mode Keys from Stripe

1. Go to: https://dashboard.stripe.com/test/apikeys
2. Make sure you're in **"Test mode"** (toggle in top right)
3. Copy:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...` (click "Reveal test key")

### 2. Create Test Product ($99/year)

1. Go to: https://dashboard.stripe.com/test/products
2. Click "Add product"
3. Fill in:
   - Name: `CompLens Pro`
   - Price: `$99.00`
   - Billing: **Yearly**
4. Save and copy the **Price ID** (`price_...`)

### 3. Update `.env.local`

Add these lines to your `.env.local` file:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (your test publishable key)
STRIPE_SECRET_KEY=sk_test_... (your test secret key)
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_... (your test price ID)
```

### 4. Test It!

```powershell
npm run dev
```

Then go to `http://localhost:3002/pricing` and test with card: `4242 4242 4242 4242`

---

## ✅ That's It!

- ✅ No Firebase Functions needed (uses Next.js API routes locally)
- ✅ No Blaze plan needed
- ✅ 100% free
- ✅ Perfect for testing

See `docs/STRIPE_TEST_MODE_SETUP.md` for full details.




