# Quick Setup: Feedback Email Function

## Step 1: Get Your Resend API Key

If you don't have one yet:
1. Go to: https://resend.com/api-keys
2. Sign up or log in (free account)
3. Click "Create API Key"
4. Copy the key (it starts with `re_`)

## Step 2: Set the API Key in Firebase

Run this command (replace `re_xxxxx` with your actual key):

```bash
firebase functions:config:set resend.api_key="re_xxxxx"
```

## Step 3: Deploy the Function

```bash
firebase deploy --only functions
```

## Step 4: Test It!

1. Submit feedback through the app
2. Check your email: **wherdzik@gmail.com**
3. Check Firebase Console: https://console.firebase.google.com/project/complens-88a4f/firestore/data/~2Ffeedback

## That's It! 🎉

Once deployed, every feedback submission will:
- ✅ Save to Firestore (you can see it in console)
- ✅ Send professional email to wherdzik@gmail.com
- ✅ Work automatically (no manual steps needed)

## Troubleshooting

**If email doesn't arrive:**
- Check spam folder
- Verify API key is set: `firebase functions:config:get`
- Check function logs: `firebase functions:log`

**If function doesn't deploy:**
- Make sure you're in the project root
- Check you're logged in: `firebase login`
- Verify project: `firebase projects:list`





