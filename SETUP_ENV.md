# 🔴 CRITICAL: Firebase Environment Variables Setup

## The Problem

Your Firebase is showing as "Not Configured" because the `.env.local` file is missing or not being read.

## Solution: Create `.env.local` File

**You MUST create this file manually** in your project root (same folder as `package.json`):

### Step 1: Create `.env.local` file

Create a new file named `.env.local` in the root of your project with this content:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBvtXp1ztBiRub3vPnfQYZoJbyEyP-VDk0
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=complens-88a4f.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=complens-88a4f
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=complens-88a4f.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=930349338966
NEXT_PUBLIC_FIREBASE_APP_ID=1:930349338966:web:7bd7506a1ecdce416f06f7
```

### Step 2: Rebuild and Redeploy

After creating `.env.local`, you MUST rebuild and redeploy:

```powershell
npm run build:firebase
firebase deploy --only hosting
```

### Step 3: Verify

1. Open your app: https://complens-88a4f.web.app/auth
2. The Firebase Status warning should disappear
3. Try signing up - it should work now!

## Why This Happens

- `.env.local` is in `.gitignore` (for security)
- Next.js reads environment variables at BUILD TIME for static exports
- Without `.env.local`, Firebase can't initialize
- The Firebase Status component correctly detects this and shows the warning

## Quick Fix Commands

```powershell
# Create .env.local file
@"
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBvtXp1ztBiRub3vPnfQYZoJbyEyP-VDk0
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=complens-88a4f.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=complens-88a4f
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=complens-88a4f.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=930349338966
NEXT_PUBLIC_FIREBASE_APP_ID=1:930349338966:web:7bd7506a1ecdce416f06f7
"@ | Out-File -FilePath .env.local -Encoding utf8

# Rebuild
npm run build:firebase

# Deploy
firebase deploy --only hosting
```

