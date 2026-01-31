# Firebase Environment Variables Setup

## The Problem

If you're seeing `FirebaseError: Error (auth/invalid-api-key)`, it means your Firebase environment variables are not being loaded correctly.

## Solution

### Step 1: Verify .env.local File

Make sure you have a `.env.local` file in your project root with:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Get real values from Firebase Console > Project Settings > General > Your apps. **Do not commit real keys.**

### Step 2: Restart Dev Server

**IMPORTANT**: After creating or modifying `.env.local`, you MUST restart your Next.js dev server:

1. Stop the current dev server (Ctrl+C)
2. Start it again: `npm run dev`

Next.js only loads environment variables when the server starts.

### Step 3: Check Browser Console

Open your browser's developer console (F12) and look for:
- Firebase config check logs (in development mode)
- Any error messages about missing environment variables

### Step 4: Verify Variable Names

Make sure all variable names start with `NEXT_PUBLIC_` - this is required for Next.js to expose them to the browser.

### Common Issues

1. **File not in root**: `.env.local` must be in the project root (same level as `package.json`)
2. **Wrong file name**: Must be exactly `.env.local` (not `.env`, `.env.local.txt`, etc.)
3. **Server not restarted**: Environment variables only load on server start
4. **Missing NEXT_PUBLIC_ prefix**: Without this prefix, variables won't be available in the browser
5. **Spaces around =**: Make sure there are no spaces: `KEY=value` not `KEY = value`

### Verification

After restarting, check the browser console. You should see:
```
Firebase config check: { hasApiKey: true, hasAuthDomain: true, ... }
Firebase initialized successfully
```

If you see `hasApiKey: false`, the environment variables aren't loading.












