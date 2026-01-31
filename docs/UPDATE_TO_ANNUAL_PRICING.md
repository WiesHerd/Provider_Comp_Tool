# Update Pro Plan to $99/Year - Step by Step

## ✅ Code Updated!

I've already updated the pricing page to show **$99/year** instead of $29/month. Now you need to update Stripe.

## 📋 What You Need to Do in Stripe

### Step 1: Create New Annual Product in Stripe

1. **Go to**: https://dashboard.stripe.com/products
2. **Click**: "Add product"
3. **Fill in**:
   - **Name**: `CompLens Pro`
   - **Description**: `Professional subscription for CompLens`
   - **Pricing**: 
     - Model: **Recurring**
     - Price: `$99.00`
     - Billing period: **Yearly** (or "Annual")
4. **Click**: "Save product"
5. **Copy** the **Price ID** (starts with `price_...`)

### Step 2: Update Environment Variables

**Update your `.env.local` file:**
```env
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_... (new annual price ID from Step 1)
```

**Update Firebase Functions environment variables:**
1. Go to: Firebase Console → Functions → Configuration → Environment Variables
2. Update `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` with the new annual Price ID

### Step 3: Deploy

```powershell
# Build functions
cd functions
npm run build
cd ..

# Deploy everything
firebase deploy
```

## 💰 Pricing Comparison

- **Old**: $29/month = $348/year
- **New**: $99/year
- **Savings**: 72% discount! 🎉

## ⚠️ Important Notes

- **Existing subscribers**: If you have any existing monthly subscribers, they'll continue on their current plan until they cancel or you migrate them
- **New customers**: Will automatically get the $99/year plan
- **Test first**: Test with a small amount in Stripe test mode before going live

## ✅ What's Already Done

- ✅ Pricing page updated to show $99/year
- ✅ Removed Enterprise plan (only Free and Pro now)
- ✅ Added savings message (72% vs monthly)
- ✅ Updated layout to 2 columns instead of 3

## 🧪 Test It

1. Update `.env.local` with new Price ID
2. Restart dev server: `npm run dev`
3. Go to `/pricing`
4. Verify it shows "$99/year"
5. Test checkout flow

## 📝 Next Steps

1. Create annual product in Stripe (Step 1)
2. Update environment variables (Step 2)
3. Deploy (Step 3)
4. Test!




