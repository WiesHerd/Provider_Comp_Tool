# 🚀 Deploy to Firebase - Quick Start

## Current Status
✅ **Everything is configured and ready!**

## Deploy in 2 Commands

```bash
# 1. Build for Firebase (creates static files in 'out' directory)
npm run build:firebase

# 2. Deploy to Firebase Hosting
firebase deploy --only hosting
```

Or use the combined command:
```bash
npm run deploy
```

## Your App Will Be Live At:
- **Primary URL**: https://complens-88a4f.web.app
- **Alternative URL**: https://complens-88a4f.firebaseapp.com

## Before First Deployment

### 1. Enable Authentication
1. Go to: https://console.firebase.google.com/project/complens-88a4f/authentication
2. Click **"Get Started"** (if not already enabled)
3. Enable **Email/Password** sign-in method
4. Enable **Google** sign-in (optional but recommended)

### 2. Add Authorized Domains
1. In Authentication > Settings > Authorized domains
2. Add: `complens-88a4f.web.app`
3. Add: `complens-88a4f.firebaseapp.com`

## What Happens During Deployment

1. **Build**: Next.js creates static files in `out/` directory
2. **Upload**: Firebase CLI uploads files to Firebase Hosting
3. **Deploy**: Files go live on your URLs
4. **CDN**: Firebase serves your app from global CDN

## After Deployment

1. Visit your app URL
2. You'll see the login page at `/auth`
3. Create an account or sign in
4. Test all features

## Troubleshooting

**Build fails?**
- Check `.env.local` has all Firebase variables
- Restart terminal and try again
- Run: `rm -rf .next out && npm run build:firebase`

**Deploy fails?**
- Check: `firebase login`
- Verify: `firebase projects:list`
- Check: `.firebaserc` has correct project ID

**App doesn't load?**
- Wait 1-2 minutes for CDN propagation
- Check Firebase Console > Hosting for status
- Clear browser cache

---

**Ready?** Run `npm run deploy` now! 🚀








