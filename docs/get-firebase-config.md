# Get Your Firebase Config Values

## Quick Steps (2 minutes)

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your CompLens project**
3. **Click the gear icon (⚙️)** next to "Project Overview"
4. **Click "Project Settings"**
5. **Scroll down to "Your apps"** section

### If you see a web app:
- Click on it
- You'll see the config values

### If you DON'T see a web app:
- Click the **Web icon** (`</>`)
- Enter nickname: **"CompLens Web"**
- Click **"Register app"**
- Copy the config values

## What You'll See:

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

## Add to .env.local

Once you have these values, I'll help you add them to your `.env.local` file!








