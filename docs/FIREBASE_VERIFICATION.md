# Firebase Authentication & Database Verification Guide

## ✅ How to Verify Your App is Connected to Firebase

### 1. Check Firebase Authentication Console

1. Go to: https://console.firebase.google.com/project/complens-88a4f/authentication/users
2. You should see all users who have signed up
3. Each user will show:
   - Email address
   - User UID (unique identifier)
   - Sign-in method (Email/Password or Google)
   - Email verification status
   - Creation date
   - Last sign-in date

### 2. Check Firestore Database

1. Go to: https://console.firebase.google.com/project/complens-88a4f/firestore/data
2. Navigate to the `users` collection
3. You should see documents with user IDs as document IDs
4. Each document contains:
   - `userId`: The user's unique ID
   - `email`: User's email address
   - `createdAt`: When the account was created
   - `updatedAt`: Last update timestamp
   - `lastLoginAt`: Last login timestamp
   - `metadata.signUpMethod`: How they signed up ('email' or 'google')

### 3. Check Browser Console Logs

When you sign up or sign in, you should see logs in the browser console (F12 → Console):

**On Sign Up:**
```
🔐 Creating user account in Firebase Authentication...
✅ User account created in Firebase Authentication: {userId: "...", email: "..."}
✅ Verification email sent to: ...
✅ Creating new user profile in Firestore: {userId: "...", email: "..."}
✅ User profile saved successfully to Firestore: {userId: "...", path: "users/..."}
```

**On Sign In:**
```
🔐 Signing in with Firebase Authentication...
✅ Successfully signed in with Firebase Authentication: {userId: "...", email: "..."}
✅ Last login timestamp updated in Firestore
```

### 4. Verify Authentication is Working

1. Sign up or sign in to your app
2. Check the browser console (F12) for the logs above
3. Go to Firebase Console → Authentication → Users
4. You should see your user listed there
5. Go to Firebase Console → Firestore → Data → users collection
6. You should see a document with your user ID containing your profile data

## 📍 Where Data is Stored

### Firebase Authentication
- **Location**: Firebase Authentication service
- **Contains**: User credentials, email, password hash, authentication tokens
- **View**: https://console.firebase.google.com/project/complens-88a4f/authentication/users

### Firestore Database
- **Collection**: `users`
- **Document ID**: User's UID (from Firebase Auth)
- **Path**: `users/{userId}`
- **Contains**: User profile data, metadata, timestamps
- **View**: https://console.firebase.google.com/project/complens-88a4f/firestore/data

## 🔍 Troubleshooting

### If you don't see users in Firebase Console:

1. **Check Environment Variables**
   - Make sure `.env.local` has all `NEXT_PUBLIC_FIREBASE_*` variables
   - Restart your dev server after adding variables

2. **Check Browser Console**
   - Look for error messages
   - Check if Firebase is initialized (should see "Firebase initialized successfully")

3. **Check Firebase Project**
   - Make sure you're looking at the correct project: `complens-88a4f`
   - Verify Authentication is enabled in Firebase Console

4. **Check Firestore Rules**
   - Go to Firestore → Rules
   - Make sure rules allow authenticated users to write to `users` collection

## ✅ Verification Checklist

- [ ] User appears in Firebase Authentication console
- [ ] User profile exists in Firestore `users` collection
- [ ] Browser console shows success logs
- [ ] Email verification email was sent (check inbox)
- [ ] Can sign in with created account
- [ ] User email appears in app header when logged in

## 🔐 Security Notes

- Passwords are **never** stored in plain text (Firebase handles hashing)
- User IDs are unique and secure
- Firestore rules ensure users can only access their own data
- All authentication is handled by Firebase (industry-standard security)






