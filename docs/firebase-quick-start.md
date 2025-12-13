# Firebase Integration Quick Start Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "provider-comp-tool")
4. Enable Google Analytics (optional)
5. Create project

## Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication** > **Get started**
2. Enable **Email/Password** sign-in method
3. (Optional) Enable **Google** sign-in method

## Step 3: Create Firestore Database

1. Go to **Firestore Database** > **Create database**
2. Start in **production mode** (we'll add security rules later)
3. Choose a location (closest to your users)
4. Create database

## Step 4: Set Up Security Rules

1. Go to **Firestore Database** > **Rules**
2. Paste the security rules from `firebase-integration-plan.md`
3. Publish rules

## Step 5: Get Firebase Configuration

1. Go to **Project Settings** (gear icon) > **General**
2. Scroll to "Your apps"
3. Click **Web** icon (`</>`)
4. Register app (name: "Provider Comp Tool Web")
5. Copy the Firebase configuration object

## Step 6: Install Dependencies

```bash
npm install firebase
```

## Step 7: Set Up Environment Variables

Create/update `.env.local`:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Existing
RESEND_API_KEY=your_resend_key (if using)
```

## Step 8: Create Firebase Config File

1. Copy `lib/firebase/config.example.ts` to `lib/firebase/config.ts`
2. The example file already uses environment variables, so no changes needed if env vars are set correctly

## Step 9: Implement Authentication

1. Copy `lib/firebase/auth.example.ts` to `lib/firebase/auth.ts`
2. Create auth store: `lib/store/auth-store.ts`
3. Create login/signup components
4. Add auth provider to app layout

## Step 10: Implement Firebase Storage Client

1. Copy `lib/firebase/storageClient.example.ts` to `lib/firebase/storageClient.ts`
2. Update to use actual auth store for userId
3. Update Zustand stores to use Firebase client

## Step 11: Test Migration

1. Test with new user (no localStorage data)
2. Test migration from localStorage to Firebase
3. Test offline functionality
4. Test multi-device sync

## Testing Checklist

- [ ] User can sign up
- [ ] User can sign in
- [ ] User can sign out
- [ ] Data saves to Firestore
- [ ] Data loads from Firestore
- [ ] localStorage data migrates on first login
- [ ] App works offline
- [ ] Real-time sync works across devices
- [ ] Security rules prevent unauthorized access

## Common Issues

### Issue: "Firebase: Error (auth/unauthorized-domain)"
**Solution**: Add your domain to Firebase Console > Authentication > Settings > Authorized domains

### Issue: "Missing or insufficient permissions"
**Solution**: Check Firestore security rules and ensure user is authenticated

### Issue: "Quota exceeded"
**Solution**: Check Firebase usage in console. Free tier has limits.

## Next Steps

After basic setup:
1. Implement real-time listeners for live updates
2. Add data migration utility
3. Add sharing/collaboration features
4. Set up Firebase Analytics
5. Configure Firebase Hosting (optional)

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Quickstart](https://firebase.google.com/docs/firestore/quickstart)
- [Firebase Auth Guide](https://firebase.google.com/docs/auth/web/start)
- [Next.js + Firebase](https://firebase.google.com/docs/web/setup)








