# Firebase Deployment Guide

## Overview

This guide will help you deploy your Provider Compensation Tool to Firebase Hosting with full backend support (Authentication + Firestore).

## Prerequisites

1. ✅ Firebase project created (`complens-88a4f`)
2. ✅ Firebase CLI installed (`npm install -g firebase-tools`)
3. ✅ Firebase logged in (`firebase login`)
4. ✅ Environment variables configured (`.env.local`)

## Deployment URLs

After deployment, your app will be available at:
- **Primary**: `https://complens-88a4f.web.app`
- **Alternative**: `https://complens-88a4f.firebaseapp.com`

## Step-by-Step Deployment

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Build for Firebase

```bash
npm run build:firebase
```

This creates a static export in the `out` directory.

### Step 3: Deploy to Firebase

**Deploy only hosting:**
```bash
npm run deploy
```

**Deploy everything (hosting + Firestore rules):**
```bash
npm run deploy:all
```

### Step 4: Verify Deployment

1. Visit `https://complens-88a4f.web.app`
2. You should see the login page
3. Create an account or sign in
4. Test the app functionality

## Environment Variables for Production

For production deployment, you need to set environment variables in Firebase Hosting. However, since we're using `NEXT_PUBLIC_` prefix, these are embedded in the build.

**Important**: The environment variables from `.env.local` are baked into the build during `npm run build:firebase`. Make sure your `.env.local` has the correct values before building.

## Firebase Console

Access your Firebase project:
- **Console**: https://console.firebase.google.com/project/complens-88a4f
- **Hosting**: https://console.firebase.google.com/project/complens-88a4f/hosting
- **Authentication**: https://console.firebase.google.com/project/complens-88a4f/authentication
- **Firestore**: https://console.firebase.google.com/project/complens-88a4f/firestore

## Authentication Setup

### Enable Authentication Methods

1. Go to Firebase Console > Authentication > Sign-in method
2. Enable **Email/Password**
3. Enable **Google** (optional, but recommended)
4. Configure authorized domains:
   - `complens-88a4f.web.app`
   - `complens-88a4f.firebaseapp.com`
   - Your custom domain (if configured)

## Firestore Setup

### Deploy Security Rules

```bash
firebase deploy --only firestore:rules
```

### Create Indexes (if needed)

```bash
firebase deploy --only firestore:indexes
```

## Custom Domain (Optional)

1. Go to Firebase Console > Hosting
2. Click "Add custom domain"
3. Follow the verification steps
4. Update DNS records as instructed

## Troubleshooting

### Build Fails

- Check that all environment variables are set in `.env.local`
- Ensure `FIREBASE_DEPLOY=true` is set (handled by script)
- Try: `rm -rf .next out && npm run build:firebase`

### Deployment Fails

- Verify you're logged in: `firebase login`
- Check project: `firebase projects:list`
- Verify project ID in `.firebaserc` matches your Firebase project

### App Doesn't Load

- Check Firebase Console > Hosting for deployment status
- Verify environment variables are in the build
- Check browser console for errors
- Ensure Firestore rules allow read access

### Authentication Not Working

- Verify Authentication is enabled in Firebase Console
- Check authorized domains include your hosting URL
- Ensure environment variables are correct
- Check browser console for Firebase errors

## Continuous Deployment

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build:firebase
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: complens-88a4f
```

## Post-Deployment Checklist

- [ ] App loads at hosting URL
- [ ] Login page displays correctly
- [ ] Can create new account
- [ ] Can sign in with email/password
- [ ] Can sign in with Google (if enabled)
- [ ] Data persists in Firestore
- [ ] Can access protected routes
- [ ] Logout works correctly

## Support

For issues:
1. Check Firebase Console for errors
2. Review browser console logs
3. Check Firestore rules and indexes
4. Verify environment variables

---

**Your app will be live at**: `https://complens-88a4f.web.app` 🚀








