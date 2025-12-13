# Quick Firebase Deployment Guide

## 🚀 Deploy Your App in 3 Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Build for Firebase
```bash
npm run build:firebase
```

### Step 3: Deploy
```bash
npm run deploy
```

## 📍 Your App URLs

After deployment, your app will be live at:
- **Primary**: https://complens-88a4f.web.app
- **Alternative**: https://complens-88a4f.firebaseapp.com

## 🔐 Authentication Setup

Before deploying, make sure:

1. **Enable Authentication in Firebase Console:**
   - Go to: https://console.firebase.google.com/project/complens-88a4f/authentication
   - Click "Get Started"
   - Enable **Email/Password**
   - Enable **Google** (optional but recommended)

2. **Add Authorized Domains:**
   - In Authentication > Settings > Authorized domains
   - Add: `complens-88a4f.web.app`
   - Add: `complens-88a4f.firebaseapp.com`

## ✅ What's Included

- ✅ **Frontend**: Full Next.js app deployed to Firebase Hosting
- ✅ **Backend**: Firebase Authentication + Firestore
- ✅ **Login Page**: `/auth` route with email/password and Google sign-in
- ✅ **User Management**: Header shows user email and logout button
- ✅ **Protected Routes**: Ready to use `ProtectedRoute` component

## 🎯 Next Steps After Deployment

1. Visit your app URL
2. Click "Sign In" in the header
3. Create an account
4. Test the login/logout flow
5. Your data will sync to Firestore automatically

## 🔧 Troubleshooting

**Build fails?**
- Make sure `.env.local` has all Firebase variables
- Try: `rm -rf .next out && npm run build:firebase`

**Deployment fails?**
- Check: `firebase login`
- Verify project: `firebase projects:list`
- Check `.firebaserc` has correct project ID

**Auth not working?**
- Enable Authentication in Firebase Console
- Check authorized domains
- Verify environment variables in build

---

**Ready to deploy?** Run `npm run deploy` now! 🚀








