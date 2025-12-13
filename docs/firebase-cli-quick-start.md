# Firebase CLI Quick Start

## 🚀 Fast Setup (5 minutes)

### Step 1: Install & Login

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase (opens browser)
firebase login
```

**What happens:** Browser opens → Sign in with Google → Authorize CLI

---

### Step 2: Initialize Project

```bash
# Make sure you're in your project directory
cd "c:\Users\wherd\Python Projects\Provider_Comp_Tool"

# Initialize Firebase
firebase init
```

**When prompted, select:**
1. ✅ **Firestore** (press SPACE to select, then ENTER)
2. ✅ **Authentication** (press SPACE, then ENTER)
3. **Use an existing project** → Choose **CompLens**
4. Accept defaults for rules/indexes files

---

### Step 3: Get Your Config

```bash
# List your apps
firebase apps:list

# If no web app exists, create one:
firebase apps:create WEB

# Get the config
firebase apps:sdkconfig WEB
```

**Copy the output** - you'll need these values!

---

### Step 4: Add to .env.local

Open `.env.local` and add:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key_from_step_3
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=complens-88a4f.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=complens-88a4f
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=complens-88a4f.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

---

### Step 5: Set Security Rules

1. **Open** `firestore.rules` (created by `firebase init`)
2. **Replace** with the rules from `firebase-integration-plan.md`
3. **Deploy:**
   ```bash
   firebase deploy --only firestore:rules
   ```

---

### Step 6: Enable Services in Console

**Still need to do in Firebase Console:**

1. **Authentication:**
   - Go to Authentication → Sign-in method
   - Enable Email/Password
   - (Optional) Enable Google

2. **Firestore Database:**
   - Go to Firestore Database
   - Click "Create database"
   - Choose production mode
   - Select location
   - Enable

---

## ✅ Done!

Restart your dev server:
```bash
npm run dev
```

---

## 🆘 Common Issues

**"firebase: command not found"**
- Use: `npx firebase-tools` instead of `firebase`
- Or: `npm install -g firebase-tools` again

**"Not logged in"**
- Run: `firebase login` (or `npx firebase-tools login`)

**"No project selected"**
- Run: `firebase use complens-88a4f`

---

## 📝 Quick Reference

```bash
# Login
firebase login

# List projects
firebase projects:list

# Initialize
firebase init

# Get config
firebase apps:sdkconfig WEB

# Deploy rules
firebase deploy --only firestore:rules

# Use specific project
firebase use complens-88a4f
```

---

**Ready?** Start with `firebase login` and let me know what you see!








