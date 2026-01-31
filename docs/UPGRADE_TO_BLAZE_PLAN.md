# 🔥 How to Upgrade to Blaze Plan (Free Tier)

## ✅ What is Blaze Plan?

**Blaze Plan** is Firebase's pay-as-you-go plan with a **generous free tier**:
- ✅ **2 million function invocations/month** - FREE
- ✅ **400,000 GB-seconds compute time/month** - FREE  
- ✅ **5 GB storage** - FREE
- ✅ **20 GB network egress/day** - FREE

**You likely won't pay anything** unless you get significant traffic!

---

## 📋 Step-by-Step Upgrade

### Step 1: Go to Firebase Console

1. **Visit**: https://console.firebase.google.com/project/complens-88a4f/usage/details
2. Or navigate: Firebase Console → Your Project → Usage and Billing → Upgrade

### Step 2: Click "Upgrade"

1. You'll see a page explaining the Blaze plan
2. **Click the "Upgrade" button** (usually blue/prominent)
3. You may see a message about enabling billing

### Step 3: Enable Billing (Required)

1. **Add a payment method** (credit card)
   - ⚠️ **Don't worry!** You won't be charged unless you exceed the free tier
   - The free tier is very generous for most apps
   - You can set **spending limits** to prevent unexpected charges

2. **Review the free tier limits**:
   - 2M function invocations/month
   - 400K GB-seconds compute time
   - 5 GB storage
   - 20 GB network egress/day

3. **Click "Continue"** or "Enable Billing"

### Step 4: Set Up Billing Account

1. **Select or create** a Google Cloud billing account
2. **Enter payment information**
3. **Review and confirm**

### Step 5: Set Spending Limits (Recommended)

1. **Go to**: Firebase Console → Usage and Billing → Budgets & Alerts
2. **Set a budget** (e.g., $10/month) to get alerts
3. **Set spending limits** to prevent unexpected charges

---

## ✅ After Upgrade

Once upgraded, you can:

1. **Deploy Firebase Functions**:
   ```powershell
   cd functions
   npm run build
   cd ..
   firebase deploy --only functions
   ```

2. **Set Environment Variables**:
   - Go to: Firebase Console → Functions → Configuration
   - Add your Stripe keys and Price ID

3. **Deploy Everything**:
   ```powershell
   firebase deploy
   ```

---

## 💰 Cost Estimates

**For typical usage (under free tier):**
- Function invocations: $0 (under 2M/month)
- Compute time: $0 (under 400K GB-seconds)
- Storage: $0 (under 5 GB)
- Network: $0 (under 20 GB/day)

**If you exceed free tier:**
- Function invocations: $0.40 per million
- Compute time: $0.0000025 per GB-second
- Storage: $0.026 per GB/month
- Network: $0.12 per GB

**Example**: Even with 10M function calls/month, you'd pay about $3.20/month.

---

## 🛡️ Safety Tips

1. **Set spending limits** in Firebase Console
2. **Monitor usage** in the dashboard
3. **Set up alerts** for when you approach limits
4. **Review billing** monthly

---

## 🆘 Need Help?

- **Firebase Support**: https://firebase.google.com/support
- **Billing FAQ**: https://firebase.google.com/pricing
- **Free Tier Details**: https://firebase.google.com/pricing#blaze

---

## 📝 Quick Checklist

- [ ] Go to Firebase Console → Usage and Billing
- [ ] Click "Upgrade" to Blaze plan
- [ ] Add payment method (required, but won't charge unless you exceed free tier)
- [ ] Set spending limits (recommended)
- [ ] Verify upgrade complete
- [ ] Deploy functions: `firebase deploy --only functions`

---

## ✅ You're Done!

Once upgraded, you can deploy your Stripe functions and everything will work! 🎉




