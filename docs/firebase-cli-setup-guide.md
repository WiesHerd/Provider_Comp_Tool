# Firebase Setup Using CLI - Step by Step

## 🎯 What We're Doing

Setting up Firebase using the command line interface (CLI) - faster and more automated!

## Prerequisites

1. **Node.js installed** (you already have this)
2. **Firebase CLI installed** (we'll do this first)

---

## Step 1: Install Firebase CLI

### What to do:
Open your terminal in your project directory and run:

```bash
npm install -g firebase-tools
```

**Verify installation:**
```bash
firebase --version
```

You should see a version number like `13.0.0` or similar.

---

## Step 2: Login to Firebase

### What to do:
```bash
firebase login
```

This will:
1. Open your browser
2. Ask you to sign in with your Google account (the one you used for Firebase Console)
3. Authorize the CLI to access your Firebase projects

**Verify you're logged in:**
```bash
firebase projects:list
```

You should see your "CompLens" project listed.

---

## Step 3: Initialize Firebase in Your Project

### What to do:
```bash
firebase init
```

**You'll be asked several questions - here's what to select:**

1. **"Which Firebase features do you want to set up?"**
   - Use arrow keys to navigate
   - Press **SPACE** to select:
     - ✅ **Firestore** (for database)
     - ✅ **Authentication** (for user accounts)
   - Press **ENTER** to continue

2. **"Please select an option:"**
   - Select: **"Use an existing project"**
   - Choose: **"CompLens"** (or `complens-88a4f`)

3. **"What file should be used for Firestore Rules?"**
   - Press **ENTER** to accept default: `firestore.rules`

4. **"What file should be used for Firestore indexes?"**
   - Press **ENTER** to accept default: `firestore.indexes.json`

5. **"Do you want to set up automatic builds and deploys with GitHub?"**
   - Select: **"No"** (we can do this later)

**After this, you'll have:**
- `firebase.json` - Firebase configuration
- `firestore.rules` - Security rules file
- `.firebaserc` - Project reference

---

## Step 4: Get Your Firebase Config

### Option A: Using CLI (Recommended)
```bash
firebase apps:list
```

This shows your apps. If you need to create a web app:
```bash
firebase apps:create WEB
```

Then get the config:
```bash
firebase apps:sdkconfig WEB
```

This will output your config values!

### Option B: From Console (Alternative)
If CLI doesn't work, you can still get it from the console:
1. Go to Firebase Console → Project Settings
2. Scroll to "Your apps"
3. Copy the config values

---

## Step 5: Add Config to Your Project

### What to do:
1. **Open** `.env.local` in your project root
2. **Add** the config values (from Step 4):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=complens-88a4f.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=complens-88a4f
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=complens-88a4f.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

3. **Save** the file

---

## Step 6: Set Up Security Rules

### What to do:
1. **Open** `firestore.rules` (created by `firebase init`)
2. **Replace** the content with:

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

3. **Deploy the rules:**
```bash
firebase deploy --only firestore:rules
```

✅ **Done!** Security rules are deployed.

---

## Step 7: Enable Authentication (Still Need Console)

Unfortunately, enabling authentication methods (Email/Password, Google) still needs to be done in the console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your **CompLens** project
3. Go to **Authentication** → **Sign-in method**
4. Enable **Email/Password**:
   - Click "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"
5. (Optional) Enable **Google** sign-in

---

## Step 8: Create Firestore Database (Still Need Console)

The database creation also needs to be done in console:

1. Go to **Firestore Database**
2. Click **"Create database"**
3. Select **"Start in production mode"**
4. Choose a location (e.g., `us-central`)
5. Click **"Enable"**

---

## Step 9: Test It!

### What to do:
1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Check browser console** (F12) for errors

---

## ✅ Quick Commands Reference

```bash
# Login to Firebase
firebase login

# List your projects
firebase projects:list

# Initialize Firebase in project
firebase init

# Deploy security rules
firebase deploy --only firestore:rules

# View current rules
firebase firestore:rules:get

# Get app config
firebase apps:sdkconfig WEB
```

---

## 🆘 Troubleshooting

### "Command not found: firebase"
- Make sure you installed it globally: `npm install -g firebase-tools`
- Try: `npx firebase-tools` instead

### "Error: Not logged in"
- Run: `firebase login`

### "Error: No project selected"
- Run: `firebase use complens-88a4f` (or your project ID)

---

## 🎉 What's Done vs What Needs Console

**✅ Can do with CLI:**
- Install Firebase tools
- Initialize project
- Get config values
- Deploy security rules
- Manage project settings

**❌ Still need Console:**
- Enable Authentication methods (Email/Password, Google)
- Create Firestore database (first time)
- View/manage data in database

---

**Ready to start?** Run `npm install -g firebase-tools` and let me know when you're done!












