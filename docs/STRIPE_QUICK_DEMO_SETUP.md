# Quick Stripe Demo Setup (No Business Required!)

## ✅ You Don't Need a Business for Test Mode!

Since you're in **Test Mode (Sandbox)**, you can:
- ✅ Skip business verification
- ✅ Use fake business info
- ✅ Create test products
- ✅ Process test payments
- ✅ **All 100% free!**

## Quick Setup Steps (5 minutes)

### Step 1: Get Your API Keys (Already Done!)

You can see them in the right panel:
- **Publishable key:** `pk_test_51SdultHss1Jom...` ✅
- **Secret key:** `sk_test_51SdultHss1Jom...` ✅

Copy these to your `.env.local` file.

### Step 2: Create a Test Product (For Demo)

1. In Stripe Dashboard, click **"Product catalog"** in the left sidebar
2. Click **"Add product"** button
3. Fill in (use fake info - it's just for demo):
   - **Name:** `CompLens Pro`
   - **Description:** `Professional subscription for CompLens`
   - **Pricing:**
     - Model: **Recurring**
     - Price: `$29.00`
     - Billing period: **Monthly**
   - Click **"Save product"**

4. **Copy the Price ID** (starts with `price_...`)
   - You'll see it after creating the product
   - Add it to `.env.local` as `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`

### Step 3: Skip Business Verification

- **You can skip "Verify your business"** - it's not needed for test mode
- Test mode doesn't require any business verification
- You can add it later if you decide to go live

### Step 4: Add Keys to Your App

Add to `.env.local`:

```env
# Stripe Test Keys (from your dashboard)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SdultHss1Jom...
STRIPE_SECRET_KEY=sk_test_51SdultHss1Jom...

# Price ID (after creating product)
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
```

### Step 5: Test It!

1. Restart your dev server: `npm run dev`
2. Go to `/pricing` in your app
3. Click "Upgrade to Pro"
4. Use test card: `4242 4242 4242 4242`
5. Any future expiry date, any CVC

## What You're Skipping (For Now)

- ❌ Business verification (not needed for test mode)
- ❌ Bank account (not needed for test mode)
- ❌ Tax information (not needed for test mode)
- ❌ Legal entity (not needed for test mode)

**All of this is only required when you switch to Live Mode** (which you control).

## For Show and Tell

You can say:
- "This is a fully functional payment system"
- "Users can subscribe to Pro plans"
- "Built with Stripe's secure checkout"
- "Currently in test mode for demonstration"

**You don't need to mention:**
- Business verification status
- Whether it's a real business
- Test mode vs live mode (unless asked)

## When You're Ready for Real Business

If you decide to make this a real business later:
1. Switch to Live Mode in Stripe
2. Complete business verification
3. Add bank account
4. Start accepting real payments

**But for now, test mode is perfect for show-and-tell!** 🎉





