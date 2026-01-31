# Deploy Firestore Security Rules

## Quick Deploy (Recommended)

To deploy **only the Firestore security rules** (fastest way to test):

```bash
firebase deploy --only firestore:rules
```

This will deploy the updated security rules from `firestore.rules` to your Firebase project.

## Verify Deployment

After deployment, you can verify the rules are active:

1. Go to [Firebase Console > Firestore > Rules](https://console.firebase.google.com/project/complens-88a4f/firestore/rules)
2. You should see your updated rules with market data and feedback collections
3. The rules should show "Last published: [current time]"

## Test the Rules

1. Try to access the app without logging in - should redirect to `/auth`
2. Create an account and log in
3. Try to save market data - should work
4. Try to submit feedback - should work
5. Check Firestore console to see data is saved under `users/{userId}/`

## Full Deployment

If you want to deploy everything (hosting + rules):

```bash
npm run deploy:all
```

Or deploy individually:

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy hosting (requires build first)
npm run build:firebase
firebase deploy --only hosting
```

## Troubleshooting

**If deployment fails:**
- Make sure you're logged in: `firebase login`
- Check your project: `firebase projects:list`
- Verify `.firebaserc` has the correct project ID

**If rules don't work:**
- Check Firebase Console for rule syntax errors
- Verify you're testing with an authenticated user
- Check browser console for Firestore permission errors










