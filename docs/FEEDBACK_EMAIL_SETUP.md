# Professional Feedback Email Setup

## Overview

Feedback is now routed through Firebase Cloud Functions, which automatically sends professional email notifications to your email address when users submit feedback.

## How It Works (Google-Style)

1. **User submits feedback** → Saved to Firestore `feedback` collection
2. **Cloud Function triggers** → Automatically detects new feedback
3. **Email sent** → Professional HTML email sent to admin (wherdzik@gmail.com)
4. **Feedback stored** → Also saved in user's personal collection for history

## Setup Instructions

### Step 1: Install Functions Dependencies

```bash
cd functions
npm install
```

### Step 2: Set Environment Variables

Set your Resend API key for Cloud Functions:

```bash
firebase functions:config:set resend.api_key="re_xxxxxxxxxxxxx"
```

Or create `functions/.env` file:
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### Step 3: Build Functions

```bash
cd functions
npm run build
```

### Step 4: Deploy Functions

```bash
firebase deploy --only functions
```

## Email Features

### Professional Design
- ✅ Google-style HTML email template
- ✅ Branded header with gradient
- ✅ Clean, modern layout
- ✅ Mobile-responsive
- ✅ Professional typography
- ✅ Clear feedback details card
- ✅ Direct link to Firebase Console

### Email Content
- User name and email
- Page where feedback was submitted
- Timestamp
- Full feedback message
- User ID (if available)
- Direct link to view in Firebase Console

### Free Tier Compatibility
- ✅ Firebase Functions: 2M invocations/month (free)
- ✅ Firestore: 20K writes/day (free)
- ✅ Resend: 3,000 emails/month (free tier)

## Viewing Feedback

### Option 1: Email Notifications
- Automatic email sent to: **wherdzik@gmail.com**
- Reply-to set to user's email (if provided)
- Professional HTML format

### Option 2: Firebase Console
1. Go to: https://console.firebase.google.com/project/complens-88a4f/firestore/data
2. Navigate to `feedback` collection
3. View all feedback submissions

### Option 3: User's Personal Collection
- Each user's feedback is also saved to: `users/{userId}/feedback/{feedbackId}`
- Users can view their own feedback history

## Customization

### Change Admin Email

Edit `functions/src/index.ts`:
```typescript
const ADMIN_EMAIL = 'your-email@gmail.com';
```

### Customize Email Template

Edit the `emailHtml` variable in `functions/src/index.ts` to match your branding.

### Update Email From Address

Once you have a custom domain:
```typescript
from: 'CompLens Feedback <feedback@yourdomain.com>'
```

## Troubleshooting

### Email Not Sending
1. Check `RESEND_API_KEY` is set correctly
2. Check Firebase Functions logs: `firebase functions:log`
3. Verify Resend API key is valid

### Function Not Triggering
1. Verify feedback is being saved to `feedback` collection
2. Check Firestore rules allow writes
3. Check function deployment: `firebase functions:list`

## Security

- ✅ Only authenticated users can submit feedback
- ✅ Users can only read their own feedback
- ✅ Admin email is hardcoded in function (secure)
- ✅ Resend API key stored in Firebase config (encrypted)

