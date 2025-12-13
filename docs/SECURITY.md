# Security Documentation

## Overview

This document outlines the security architecture, authentication flow, and data isolation strategy for the CompLens Provider Compensation Tool.

## Authentication Architecture

### Authentication Flow

```
User Access → RouteGuard Check → Firebase Auth Verification → App Access
                                                              ↓
                                                    All Data Operations
                                                              ↓
                                          Firebase Storage (userId scoped)
                                                              ↓
                                          Firestore Rules (server-side validation)
```

### Authentication Methods

1. **Email/Password Authentication**
   - Users can create accounts with email and password
   - Minimum password length: 6 characters
   - User profiles are automatically created on sign-up

2. **Google Sign-In**
   - OAuth-based authentication via Google
   - User profiles are created/updated on first sign-in

### Route Protection

- **RouteGuard Component**: Wraps the entire application in `app/layout.tsx`
- **Protected Routes**: All routes except `/auth` require authentication
- **Unauthenticated Access**: Automatically redirected to `/auth`
- **Authenticated on `/auth`**: Automatically redirected to home page

## Data Isolation Strategy

### User-Scoped Collections

All user data is stored in Firestore under the user's ID:

```
users/{userId}/
  ├── profile/userProfile          # User profile and metadata
  ├── scenarios/{scenarioId}        # Provider scenarios
  ├── callPayScenarios/{scenarioId} # Call pay scenarios
  ├── cfModels/{modelId}           # CF models
  ├── marketData/{dataId}          # Market benchmark data
  ├── feedback/{feedbackId}         # User feedback submissions
  └── preferences/userPrefs        # User preferences
```

### Cross-User Collections

Some collections are shared but filtered by `userId`:

```
programs/{programId}        # Call programs (filtered by userId)
shiftTypes/{shiftTypeId}    # Shift types (filtered by userId)
```

## Firestore Security Rules

### User Data Protection

All user-specific collections enforce strict access control:

```javascript
match /users/{userId}/... {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

### Key Security Rules

1. **Authentication Required**: All operations require `request.auth != null`
2. **User ID Matching**: Users can only access data where `request.auth.uid == userId`
3. **Default Deny**: All other access is denied by default

### Collections Protected

- ✅ User profiles
- ✅ Scenarios
- ✅ Call pay scenarios
- ✅ CF models
- ✅ Market data
- ✅ Feedback
- ✅ User preferences
- ✅ Programs (filtered by userId)
- ✅ Shift types (filtered by userId)

## API Security

### Feedback API Endpoint

**Route**: `/api/feedback`

**Authentication**: Required (userId must be provided)

**Request Format**:
```json
{
  "name": "Optional name",
  "email": "Optional email",
  "message": "Required feedback message",
  "page": "Page URL",
  "userId": "Required - authenticated user ID"
}
```

**Response**:
- `401 Unauthorized`: If userId is missing or invalid
- `200 OK`: Feedback saved to Firestore and email sent (if configured)

**Data Storage**: Feedback is saved to `users/{userId}/feedback/{feedbackId}` in Firestore

## Storage Client Security

### Firebase-First Strategy

1. **Primary Storage**: Firebase Firestore (when user is authenticated)
2. **Backup Storage**: localStorage (fallback only)
3. **Security Warnings**: Logged when attempting to save without authentication

### Data Operations

All save operations:
- Check for authenticated user (`userId`)
- Use Firebase if available and user is authenticated
- Fall back to localStorage only if Firebase unavailable or user not authenticated
- Log security warnings when localStorage fallback is used

## User Profile Management

### Automatic Profile Creation

User profiles are automatically created:
- On email/password sign-up
- On Google sign-in (first time)
- Profile includes:
  - User ID
  - Email
  - Display name
  - Created timestamp
  - Last login timestamp
  - Sign-up method metadata

### Profile Location

`users/{userId}/profile/userProfile`

## Security Best Practices

### Client-Side

1. **Never store sensitive data in localStorage** without encryption
2. **Always verify userId** before data operations
3. **Use Firebase for all persistent data** when authenticated
4. **Log security warnings** when fallback storage is used

### Server-Side (Firestore Rules)

1. **Always require authentication** (`request.auth != null`)
2. **Verify userId matches** (`request.auth.uid == userId`)
3. **Default deny** all access not explicitly allowed
4. **Test rules** before deploying to production

### API Endpoints

1. **Require authentication** for all data operations
2. **Validate userId** matches authenticated user
3. **Return appropriate error codes** (401 for unauthorized)
4. **Log security events** for audit purposes

## Testing Security

### Authentication Tests

1. ✅ Unauthenticated user redirected to `/auth`
2. ✅ Cannot access app routes without login
3. ✅ Cannot access data without authentication

### Data Isolation Tests

1. ✅ User A cannot see User B's data
2. ✅ Firestore rules block cross-user access
3. ✅ All queries filtered by userId

### API Security Tests

1. ✅ Feedback API rejects unauthenticated requests
2. ✅ All API calls include userId
3. ✅ Proper error messages for auth failures

## Deployment Checklist

- [ ] Firestore security rules deployed
- [ ] All environment variables configured
- [ ] Firebase Admin SDK configured (if using server-side verification)
- [ ] Authentication providers enabled in Firebase Console
- [ ] Security rules tested in Firebase Console
- [ ] Error handling tested for auth failures
- [ ] Data isolation verified between test users

## Security Incident Response

If a security issue is discovered:

1. **Immediately review** Firestore security rules
2. **Check audit logs** in Firebase Console
3. **Verify data isolation** between users
4. **Update security rules** if vulnerability found
5. **Notify affected users** if data breach suspected

## Compliance Notes

- All user data is isolated per user
- No cross-user data access is possible
- Authentication is required for all data operations
- Server-side rules enforce security (client-side can be bypassed)
- All data operations are logged for audit purposes






