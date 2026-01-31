# 🚀 Deploy to Firebase - Step by Step

## The Issue
You're seeing "Site Not Found" because the app hasn't been deployed yet. Let's fix that!

## Quick Deploy (Run These Commands)

### Option 1: Use the deployment script (Recommended)
```powershell
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

### Option 2: Manual deployment
```powershell
# Step 1: Build
npm run build:firebase

# Step 2: Verify build succeeded
# Check that "out" directory exists with index.html

# Step 3: Deploy
firebase deploy --only hosting
```

### Option 3: Combined command
```powershell
npm run deploy
```

## What Should Happen

1. **Build**: Creates static files in `out/` directory
2. **Deploy**: Uploads files to Firebase Hosting
3. **Live**: Your app will be available at:
   - https://complens-88a4f.web.app
   - https://complens-88a4f.firebaseapp.com

## Troubleshooting

**If build fails:**
- Make sure `.env.local` has all Firebase variables
- Run: `npm install` to ensure dependencies are installed
- Check terminal output for specific errors

**If deploy fails:**
- Check: `firebase login` (you should be logged in)
- Verify: `firebase projects:list` shows `complens-88a4f`
- Check: `.firebaserc` has correct project ID

**If you see "Site Not Found" after deployment:**
- Wait 1-2 minutes for CDN propagation
- Clear browser cache
- Check Firebase Console > Hosting for deployment status

## After Successful Deployment

1. Visit https://complens-88a4f.web.app
2. You should see your app (not "Site Not Found")
3. Click "Sign In" to test authentication
4. Create an account and test login/logout

---

**Run the deployment now and your app will be live!** 🚀












