# Firebase Setup Instructions for CompLens

## Step 1: Get Your Firebase Configuration Values

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your **CompLens** project
3. Click the **gear icon** (⚙️) next to "Project Overview" → **Project Settings**
4. Scroll down to **"Your apps"** section
5. If you haven't added a web app yet:
   - Click the **Web icon** (`</>`)
   - Register your app with nickname: **"CompLens Web"**
   - (Don't check "Also set up Firebase Hosting" for now)
   - Click **Register app**
6. Copy the configuration values from the `firebaseConfig` object

## Step 2: Add Environment Variables

Open your `.env.local` file and add these Firebase configuration values:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=complens-88a4f.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=complens-88a4f
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=complens-88a4f.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=1:your_sender_id:web:your_app_id_here

# Existing (keep these)
RESEND_API_KEY=your_resend_key (if using)
```

**Important**: Replace the placeholder values above with your actual Firebase config values from Step 1.

## Step 3: Enable Authentication

1. In Firebase Console, go to **Authentication** → **Get started**
2. Click **"Sign-in method"** tab
3. Enable **Email/Password**:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click **Save**
4. (Optional) Enable **Google** sign-in:
   - Click on "Google"
   - Toggle "Enable" to ON
   - Enter your project support email
   - Click **Save**

## Step 4: Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in production mode"** (we'll add security rules later)
4. Select a location (choose closest to your users, e.g., `us-central` or `us-east1`)
5. Click **"Enable"**

## Step 5: Set Up Security Rules (Important!)

1. In Firestore Database, go to **"Rules"** tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Programs and shift types can be shared or user-specific
    match /programs/{programId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (resource == null || resource.data.userId == request.auth.uid);
    }
    
    match /shiftTypes/{shiftTypeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (resource == null || resource.data.userId == request.auth.uid);
    }
  }
}
```

3. Click **"Publish"**

## Step 6: Add Authorized Domains (for localhost)

1. In Firebase Console, go to **Authentication** → **Settings**
2. Scroll to **"Authorized domains"**
3. Make sure `localhost` is listed (it should be by default)
4. For production, add your domain (e.g., `your-app.vercel.app`)

## Step 7: Test the Setup

1. Restart your Next.js dev server:
   ```bash
   npm run dev
   ```

2. Check the browser console for any Firebase errors
3. The app should now be able to connect to Firebase

## Next Steps

After completing these steps:
1. ✅ Firebase is installed and configured
2. ⬜ Create login/signup components
3. ⬜ Implement Firebase storage client
4. ⬜ Update stores to use Firebase
5. ⬜ Test authentication flow

## Troubleshooting

### "Firebase: Error (auth/unauthorized-domain)"
- Add your domain to Authentication → Settings → Authorized domains

### "Missing or insufficient permissions"
- Check Firestore security rules
- Make sure user is authenticated

### "Firebase app not initialized"
- Check that all environment variables are set correctly
- Restart your dev server after adding env vars

### Configuration values not working
- Make sure all `NEXT_PUBLIC_` variables are set
- Restart Next.js dev server after changes
- Check for typos in variable names








