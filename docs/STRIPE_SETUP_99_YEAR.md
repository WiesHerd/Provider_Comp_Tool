# How to Set Up $99/Year Pro Plan in Stripe

## Step-by-Step Instructions

### Step 1: Navigate to Products (Not Features)

You're currently on the "Features" tab. You need to go to **"All products"** instead:

1. **In your Stripe Dashboard**, look at the tabs at the top
2. **Click** on **"All products"** (it's the first tab, next to "Features")
3. This is where you create subscription products

### Step 2: Create the Pro Product

1. **Click** the **"+ Add product"** button (usually in the top right)
2. **Fill in the product details**:
   - **Name**: `CompLens Pro`
   - **Description**: `Annual subscription for advanced CompLens features`
   - (Optional) Add an image if you have one

### Step 3: Set Up Annual Pricing

In the **"Pricing"** section:

1. **Select**: "Standard pricing" (not usage-based)
2. **Price**: Enter `99.00`
3. **Currency**: Select `USD` (should be default)
4. **Billing period**: Select **"Yearly"** or **"Annually"**
   - ⚠️ **Important**: Make sure it says "Yearly" or "Annually", NOT "Monthly"
5. **Click**: "Add product" or "Save product"

### Step 4: Copy the Price ID

After creating the product:

1. You'll see the product details page
2. Look for the **"Price ID"** - it starts with `price_...`
3. **Copy this Price ID** - you'll need it next!

**Example**: `price_1SduljHe5rsxCfoQAbCdEfGh`

### Step 5: Update Your Environment Variables

**For Local Development (`.env.local`):**
```env
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_... (paste the Price ID you copied)
```

**For Firebase Functions (Production):**
1. Go to: Firebase Console → Functions → Configuration → Environment Variables
2. Add or update: `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` = `price_...` (your new Price ID)

### Step 6: Test It!

1. **Restart** your dev server: `npm run dev`
2. **Go to**: `/pricing` in your app
3. **Verify** it shows "$99/year"
4. **Test checkout** (use a test card if still in test mode)

## Visual Guide

### Where to Click in Stripe Dashboard:

```
Stripe Dashboard
├── Product catalog (left sidebar)
│   └── Products
│       └── All products ← CLICK HERE (not "Features")
│           └── + Add product ← CLICK THIS
```

### What the Pricing Section Should Look Like:

```
Pricing
├── Standard pricing ✓ (selected)
├── Price: 99.00
├── Currency: USD
└── Billing period: Yearly ← IMPORTANT: Must be "Yearly"!
```

## Common Mistakes to Avoid

❌ **Don't create it in "Features"** - Features are for entitlements, not products
❌ **Don't select "Monthly"** - You need "Yearly" or "Annually"
❌ **Don't forget to copy the Price ID** - You need this for your code

## Quick Checklist

- [ ] Clicked "All products" tab (not Features)
- [ ] Clicked "+ Add product"
- [ ] Named it "CompLens Pro"
- [ ] Set price to $99.00
- [ ] Selected "Yearly" billing period
- [ ] Saved the product
- [ ] Copied the Price ID (starts with `price_...`)
- [ ] Updated `.env.local` with the Price ID
- [ ] Updated Firebase environment variables
- [ ] Tested the pricing page

## Need Help?

If you can't find "All products":
- Look for tabs at the top: "All products", "Features", "Coupons", etc.
- Or go directly to: https://dashboard.stripe.com/products

If you see "Monthly" instead of "Yearly":
- Make sure you're creating a NEW product (not editing an old one)
- The billing period dropdown should have "Yearly" or "Annually" as an option

## After Setup

Once you have the Price ID:
1. ✅ Update `.env.local`
2. ✅ Update Firebase environment variables
3. ✅ Restart your dev server
4. ✅ Test the checkout flow
5. ✅ Deploy to production

Your code is already updated to show $99/year - you just need the Stripe product and Price ID!




