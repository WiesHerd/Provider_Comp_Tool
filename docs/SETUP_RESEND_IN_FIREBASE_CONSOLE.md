# Set Resend API Key in Firebase Console

## Method 1: Firebase Console (Recommended - Easiest)

### Step 1: Go to Firebase Console
1. Visit: https://console.firebase.google.com/project/complens-88a4f/functions
2. Or navigate: Firebase Console → Your Project → Functions → Configuration

### Step 2: Add Environment Variable
1. Click on **"Configuration"** tab (or **"Environment Variables"**)
2. Click **"Add Variable"** or **"Edit"**
3. Add:
   - **Variable name**: `RESEND_API_KEY`
   - **Value**: Your Resend API key (starts with `re_`)
4. Click **"Save"**

### Step 3: Redeploy Function
After setting the variable, redeploy the function:
```bash
firebase deploy --only functions
```

## Method 2: Using .env File (Alternative)

Create `functions/.env` file:
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

Then deploy:
```bash
firebase deploy --only functions
```

## Method 3: Using Firebase CLI Config (Legacy)

```bash
firebase functions:config:set resend.api_key="re_xxxxxxxxxxxxx"
firebase deploy --only functions
```

## Get Your Resend API Key

If you don't have one:
1. Go to: https://resend.com/api-keys
2. Sign up or log in (free account)
3. Create a new API key
4. Copy it (starts with `re_`)

## Verify It's Set

After deployment, check the function logs:
```bash
firebase functions:log --only onFeedbackCreated
```

You should see the function working when feedback is submitted.

## Notes

- ✅ Environment variables set in Firebase Console are encrypted and secure
- ✅ They persist across deployments
- ✅ No need to commit secrets to git
- ✅ Can be updated anytime in the console

