# How to View Feedback in Firebase Console

## Quick Access Links

### Direct Links to Your Feedback:

1. **Global Feedback Collection** (All feedback from all users):
   https://console.firebase.google.com/project/complens-88a4f/firestore/data/~2Ffeedback

2. **Firestore Database Home**:
   https://console.firebase.google.com/project/complens-88a4f/firestore/data

3. **Project Overview**:
   https://console.firebase.google.com/project/complens-88a4f/overview

## Step-by-Step Instructions

### Method 1: View All Feedback (Admin View)

1. **Go to Firebase Console**:
   - Visit: https://console.firebase.google.com
   - Sign in with your Google account

2. **Select Your Project**:
   - Click on **"complens-88a4f"** project

3. **Navigate to Firestore**:
   - In the left sidebar, click **"Firestore Database"**
   - Or go directly: https://console.firebase.google.com/project/complens-88a4f/firestore/data

4. **View Feedback Collection**:
   - You'll see a list of collections
   - Click on **"feedback"** collection
   - You'll see all feedback submissions with:
     - Feedback ID
     - User ID
     - Name
     - Email
     - Message
     - Page
     - Created timestamp

### Method 2: View User-Specific Feedback

1. **Navigate to Users Collection**:
   - In Firestore, click on **"users"** collection
   - Click on a specific user ID (e.g., `abc123...`)
   - Click on **"feedback"** subcollection
   - You'll see all feedback from that specific user

### Method 3: View via Cloud Functions Logs

1. **Go to Functions**:
   - In Firebase Console, click **"Functions"** in left sidebar
   - Or: https://console.firebase.google.com/project/complens-88a4f/functions

2. **View Logs**:
   - Click on **"onFeedbackCreated"** function
   - Click **"Logs"** tab
   - You'll see when feedback was received and emails were sent

## What You'll See in Firestore

### Feedback Document Structure:
```
feedback/
  └── feedback-1234567890-abc123/
      ├── id: "feedback-1234567890-abc123"
      ├── userId: "user_abc123..."
      ├── name: "John Doe" (optional)
      ├── email: "user@example.com"
      ├── message: "This is super."
      ├── page: "/market-data"
      └── createdAt: Timestamp (2025-01-XX...)
```

### User Feedback Structure:
```
users/
  └── user_abc123.../
      └── feedback/
          └── feedback-1234567890-abc123/
              └── (same structure as above)
```

## Verification Checklist

To confirm feedback is saving to the cloud:

- [ ] **Submit test feedback** through the app
- [ ] **Check Firestore Console** - you should see new document in `feedback` collection
- [ ] **Check timestamp** - should show current date/time
- [ ] **Check user collection** - should also appear in `users/{userId}/feedback`
- [ ] **Check email** - you should receive email notification (if function is deployed)

## Troubleshooting

### If You Don't See Feedback:

1. **Check Firestore Rules**:
   - Go to: Firestore Database → Rules
   - Make sure rules allow authenticated users to write to `feedback` collection

2. **Check Browser Console**:
   - Open browser DevTools (F12)
   - Check Console tab for any errors
   - Look for "✅ Feedback saved to global collection" message

3. **Check Network Tab**:
   - Open DevTools → Network tab
   - Submit feedback
   - Look for Firestore write requests
   - Should see successful POST requests

4. **Verify Authentication**:
   - Make sure you're logged in
   - Check that user ID appears in feedback document

## Real-Time Monitoring

### Set Up Real-Time Listener (Optional):

You can watch feedback in real-time using Firebase Console's real-time viewer, or set up a monitoring dashboard.

## Security Note

- ✅ Only authenticated users can submit feedback
- ✅ Users can only read their own feedback
- ✅ Admin can view all feedback in `feedback` collection
- ✅ All data is encrypted and stored securely in Google Cloud

