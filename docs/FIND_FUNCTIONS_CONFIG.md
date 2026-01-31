# 🔍 How to Find Functions Configuration in Firebase Console

## Direct Link (Easiest Way)

**Click this link:**
https://console.firebase.google.com/project/complens-88a4f/functions/config

This will take you directly to the Functions Configuration page where you can add environment variables.

---

## Manual Navigation

If the link doesn't work, follow these steps:

### Step 1: Go to Functions

1. In Firebase Console, look at the **left sidebar**
2. Under "Project shortcuts", find **"Functions"** (it has a `(-)` icon)
3. **Click on "Functions"**

### Step 2: Go to Configuration Tab

1. Once you're in Functions, you'll see tabs at the top:
   - "Dashboard" 
   - "Usage"
   - **"Configuration"** ← Click this one!

2. Or look for a **gear icon** ⚙️ or **"Config"** button

### Step 3: Add Environment Variables

1. You should see a section for "Environment variables"
2. Click **"Add variable"** button
3. Add your Stripe keys

---

## Alternative: Use Firebase CLI

If you still can't find it in the console, you can set environment variables via command line:

```powershell
firebase functions:config:set stripe.secret_key="sk_test_..."
```

However, for Firebase Functions v2, you need to use the console or secrets API.

---

## Still Can't Find It?

Try this:
1. Make sure you're logged into the correct Google account
2. Make sure you're on the Blaze plan (you should be after the upgrade)
3. Try refreshing the page
4. Use the direct link: https://console.firebase.google.com/project/complens-88a4f/functions/config

---

## Quick Test

If you can see "Functions" in the left sidebar, click it. Then look for:
- A "Configuration" tab
- A gear icon ⚙️
- An "Environment variables" section

Let me know what you see when you click on "Functions"!




