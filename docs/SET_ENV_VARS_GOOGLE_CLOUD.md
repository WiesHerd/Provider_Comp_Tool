# 🔧 Set Environment Variables via Google Cloud Console

Since the Configuration tab isn't visible in Firebase Console yet, use Google Cloud Console instead.

## Step 1: Go to Google Cloud Console

**Direct link:**
https://console.cloud.google.com/functions/list?project=complens-88a4f

Or navigate:
1. Go to: https://console.cloud.google.com
2. Select project: **complens-88a4f**
3. Navigate to: **Cloud Functions** → **Functions**

## Step 2: Wait for Functions to Deploy

**Important:** Environment variables can only be set **after** functions are deployed. 

So we have two options:

### Option A: Deploy First, Then Set Variables

1. Deploy functions first (they'll fail without env vars, but that's okay)
2. Then set environment variables
3. Redeploy or update functions

### Option B: Set Variables Before Deploy (Recommended)

We can set environment variables in the function code temporarily, or use a `.env` file approach.

---

## Alternative: Use Firebase Console After Deploy

Once you deploy functions, the **Configuration** tab should appear in Firebase Console at:
- https://console.firebase.google.com/project/complens-88a4f/functions/config

---

## Easiest Solution: Deploy First

Let's deploy the functions first, then set environment variables. The functions will show errors until we add the variables, but that's fine.

**Ready to deploy?** I can deploy them now, and then we'll set the environment variables afterward.




