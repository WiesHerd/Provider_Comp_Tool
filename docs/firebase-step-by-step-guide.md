# Firebase Setup - Step by Step Guide

## 🎯 What We're Doing

We're setting up Firebase so your app can:
- Store data in the cloud (instead of just localStorage)
- Sync data across devices
- Support user accounts

## Step 1: Get Your Firebase Configuration Values

### What to do:
1. **In the Firebase Console** (where you are now):
   - Look for the **gear icon (⚙️)** near the top left, next to "Project Overview"
   - Click it → Select **"Project Settings"**

2. **Scroll down** to the section called **"Your apps"**

3. **If you see a web app already listed:**
   - Click on it to see the config values
   - Copy the values you see

4. **If you DON'T see a web app:**
   - Click the **Web icon** (`</>`) button
   - Enter nickname: **"CompLens Web"**
   - **DON'T** check "Also set up Firebase Hosting" (we'll do that later if needed)
   - Click **"Register app"**
   - You'll see a config object - copy those values

### What you'll see:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "complens-88a4f.firebaseapp.com",
  projectId: "complens-88a4f",
  storageBucket: "complens-88a4f.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

**📝 Write these down or keep this tab open** - you'll need them in a moment!

---

## Step 2: Add Configuration to Your Project

### What to do:
1. **Open your project** in your code editor
2. **Find or create** `.env.local` file in the root directory
3. **Add these lines** (replace with YOUR values from Step 1):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...your_actual_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=complens-88a4f.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=complens-88a4f
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=complens-88a4f.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_actual_app_id
```

4. **Save the file**

---

## Step 3: Enable Authentication

### What to do:
1. **In Firebase Console**, look at the **left sidebar**
2. Find **"Authentication"** (under "Build" section)
3. Click **"Authentication"**
4. Click **"Get started"** (if you see it)
5. Click the **"Sign-in method"** tab at the top
6. **Enable Email/Password:**
   - Click on **"Email/Password"**
   - Toggle the **"Enable"** switch to **ON**
   - Click **"Save"**

7. **(Optional) Enable Google Sign-in:**
   - Click on **"Google"**
   - Toggle **"Enable"** to **ON**
   - Enter your project support email
   - Click **"Save"**

✅ **Done!** Authentication is now enabled.

---

## Step 4: Create Firestore Database

### What to do:
1. **In Firebase Console**, look at the **left sidebar**
2. Find **"Firestore Database"** (under "Build" section)
3. Click **"Firestore Database"**
4. Click **"Create database"** button
5. **Choose mode:**
   - Select **"Start in production mode"** 
   - (We'll add security rules in the next step)
   - Click **"Next"**

6. **Choose location:**
   - Pick a location closest to your users
   - For US: `us-central` or `us-east1` are good choices
   - Click **"Enable"**

7. **Wait** for the database to be created (takes 30-60 seconds)

✅ **Done!** Your database is ready.

---

## Step 5: Set Up Security Rules

### What to do:
1. **Still in Firestore Database**, click the **"Rules"** tab at the top
2. **Replace** the default rules with these:

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

3. Click **"Publish"** button

✅ **Done!** Security rules are set.

---

## Step 6: Test It!

### What to do:
1. **Go back to your code editor**
2. **Restart your dev server:**
   ```bash
   npm run dev
   ```

3. **Open your app** in the browser (usually `http://localhost:3002`)
4. **Check the browser console** (F12) for any errors
5. If you see Firebase errors, double-check your `.env.local` file

---

## ✅ Checklist

- [ ] Got Firebase config values from Project Settings
- [ ] Added config to `.env.local` file
- [ ] Enabled Email/Password authentication
- [ ] Created Firestore database
- [ ] Set up security rules
- [ ] Restarted dev server
- [ ] Checked browser console for errors

---

## 🆘 Troubleshooting

### "Firebase app not initialized"
- Make sure all environment variables in `.env.local` start with `NEXT_PUBLIC_`
- Restart your dev server after adding env vars

### "Missing or insufficient permissions"
- Check that you published the security rules in Step 5
- Make sure the rules are exactly as shown

### "Firebase: Error (auth/unauthorized-domain)"
- Go to Authentication → Settings → Authorized domains
- Make sure `localhost` is listed

---

## 🎉 Next Steps

Once everything is set up:
1. Your app can now use Firebase!
2. You can test authentication with the LoginForm component
3. We'll implement the storage client next to sync your data

---

**Need help?** Check the browser console for specific error messages and let me know what you see!












