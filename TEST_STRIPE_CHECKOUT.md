# ✅ Test Your Stripe Integration

## Step 1: Verify Functions Have Variables

Make sure you've added the environment variables to **all three** functions:
- ✅ `createCheckoutSession` (you just did this!)
- ⚠️ `createDonationSession` (need to add variables)
- ⚠️ `stripeWebhook` (need to add variables)

## Step 2: Test the Checkout Flow

1. **Go to**: https://complens-88a4f.web.app/pricing
2. **Click**: "Upgrade to Pro" button
3. **You should be redirected** to Stripe Checkout
4. **Use test card**: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
5. **Complete the payment**

## Step 3: Check for Errors

If something doesn't work:
- **Open browser console** (F12 → Console tab)
- **Look for errors** - they'll tell us what's wrong
- **Check function logs**: `firebase functions:log`

## Step 4: Verify Function URLs

Your functions should be accessible at:
- Checkout: https://us-central1-complens-88a4f.cloudfunctions.net/createCheckoutSession
- Donation: https://us-central1-complens-88a4f.cloudfunctions.net/createDonationSession
- Webhook: https://us-central1-complens-88a4f.cloudfunctions.net/stripeWebhook

---

## 🧪 Quick Test

**Try this now:**
1. Visit: https://complens-88a4f.web.app/pricing
2. Click "Upgrade to Pro"
3. Tell me what happens!

If you get redirected to Stripe Checkout → ✅ Success!
If you see an error → Let me know what it says!




