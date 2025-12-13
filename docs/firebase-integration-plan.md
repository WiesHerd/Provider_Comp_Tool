# Firebase Backend Integration Plan

## Overview

This document outlines the plan to migrate the Provider Compensation Tool from a localStorage-based architecture to Firebase, enabling multi-device sync, user authentication, and cloud-based data persistence.

## Current Architecture

### Data Storage (localStorage)
- **Provider Scenarios** (`provider_scenarios`)
- **Call Pay Scenarios** (`call-pay-scenarios`)
- **Call Programs Catalog** (`call-programs-catalog`)
- **Shift Types Catalog** (`call-shift-types-catalog`)
- **User Preferences** (`complens-user-preferences`)
- **CF Models** (`cf-models`)
- **Market Data** (`fmv_market_data`)
- **Draft States** (various keys for auto-save)

### Current API
- Single API route: `/api/feedback` (uses Resend for email)

## Firebase Services to Use

### 1. Firebase Authentication
- **Purpose**: User accounts and authentication
- **Features**:
  - Email/Password authentication
  - Google Sign-In (optional)
  - Anonymous auth for guest users (optional)
- **Benefits**: Multi-user support, data isolation, secure access

### 2. Cloud Firestore
- **Purpose**: Primary database for all application data
- **Why Firestore over Realtime Database**:
  - Better querying capabilities
  - Better scalability
  - More structured data model
  - Offline support built-in
- **Data Structure**: See below

### 3. Firebase Storage (Optional)
- **Purpose**: Store large files (PDF exports, Excel reports)
- **Use Case**: If we want to persist generated reports

### 4. Firebase Functions (Optional)
- **Purpose**: Server-side logic
- **Use Cases**:
  - Data validation
  - Scheduled tasks
  - Email notifications
  - Data aggregation

## Firestore Data Structure

### Collections

```
users/{userId}/
  ├── preferences (document)
  │   ├── activeProgramId: string | null
  │   └── modelingMode: 'quick' | 'advanced'
  │
  ├── scenarios/ (subcollection)
  │   └── {scenarioId} (document: ProviderScenario)
  │
  ├── callPayScenarios/ (subcollection)
  │   └── {scenarioId} (document: CallScenario)
  │
  ├── cfModels/ (subcollection)
  │   └── {modelId} (document: SavedCFModel)
  │
  ├── marketData/ (subcollection)
  │   └── {dataId} (document: SavedMarketData)
  │
  └── drafts/ (subcollection)
      └── {draftId} (document: DraftState)

programs/ (collection - shared or user-specific)
  └── {programId} (document: CallProgram)

shiftTypes/ (collection - shared or user-specific)
  └── {shiftTypeId} (document: ShiftType)
```

### Security Rules Example

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

## Implementation Plan

### Phase 1: Setup & Authentication

1. **Install Firebase SDK**
   ```bash
   npm install firebase
   ```

2. **Create Firebase Configuration**
   - Create `lib/firebase/config.ts`
   - Initialize Firebase app
   - Initialize Auth and Firestore

3. **Implement Authentication**
   - Create `lib/firebase/auth.ts` with auth helpers
   - Create login/signup components
   - Add auth state management (Zustand store)
   - Protect routes that require authentication

### Phase 2: Create Firebase Storage Client

1. **Create `lib/firebase/storageClient.ts`**
   - Abstract Firebase operations
   - Maintain same interface as current `storageClient.ts`
   - Support both Firebase and localStorage (fallback)
   - Implement migration helper to move localStorage data to Firebase

2. **Functions to Implement**:
   ```typescript
   // Similar interface to current storageClient
   export async function loadScenarios(userId: string): Promise<ProviderScenario[]>
   export async function saveScenario(userId: string, scenario: ProviderScenario): Promise<void>
   export async function deleteScenario(userId: string, scenarioId: string): Promise<void>
   
   // Same for other data types
   ```

### Phase 3: Update Stores

1. **Update Zustand Stores**
   - Modify stores to use Firebase client instead of localStorage
   - Add loading states
   - Add error handling
   - Implement optimistic updates

2. **Stores to Update**:
   - `scenarios-store.ts`
   - `call-pay-scenarios-store.ts`
   - `cf-models-store.ts`
   - `program-catalog-store.ts`
   - `user-preferences-store.ts`

### Phase 4: Migration & Data Sync

1. **Create Migration Utility**
   - Detect localStorage data on first login
   - Prompt user to migrate data
   - Batch upload to Firestore
   - Clear localStorage after successful migration

2. **Implement Offline Support**
   - Firestore has built-in offline persistence
   - Configure offline persistence
   - Handle sync conflicts

### Phase 5: Enhanced Features

1. **Real-time Updates**
   - Use Firestore listeners for real-time sync
   - Update UI when data changes on other devices

2. **Sharing & Collaboration** (Future)
   - Share scenarios with other users
   - Collaborative editing

## File Structure

```
lib/
  ├── firebase/
  │   ├── config.ts          # Firebase initialization
  │   ├── auth.ts             # Authentication helpers
  │   ├── storageClient.ts    # Firestore operations
  │   └── types.ts            # Firebase-specific types
  │
  ├── store/
  │   ├── auth-store.ts       # NEW: Auth state management
  │   └── [existing stores]   # Updated to use Firebase
  │
  └── utils/
      └── migration.ts         # NEW: localStorage to Firebase migration
```

## Environment Variables

Add to `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Migration Strategy

### Option 1: Big Bang Migration
- Migrate all at once
- Requires downtime
- Simpler but riskier

### Option 2: Gradual Migration (Recommended)
- Keep localStorage as fallback
- Add Firebase support alongside
- Feature flag to switch between storage methods
- Migrate data on first login
- Gradually phase out localStorage

### Option 3: Hybrid Approach
- Use Firebase for scenarios and user data
- Keep localStorage for drafts and temporary data
- Best of both worlds

## Benefits

1. **Multi-device Sync**: Access data from any device
2. **Data Backup**: Automatic cloud backup
3. **User Accounts**: Multi-user support
4. **Offline Support**: Firestore offline persistence
5. **Real-time Updates**: Live data synchronization
6. **Scalability**: Handle more data than localStorage
7. **Security**: Firebase security rules
8. **Analytics**: Firebase Analytics integration

## Challenges & Considerations

1. **Cost**: Firestore has usage-based pricing (free tier available)
2. **Migration**: Need to migrate existing localStorage data
3. **Offline First**: Ensure app works offline
4. **Data Size**: Firestore document size limits (1MB per document)
5. **Query Limits**: Complex queries may require indexes
6. **Security Rules**: Need to properly configure access control

## Next Steps

1. ✅ Create Firebase project
2. ✅ Set up Firestore database
3. ✅ Configure Authentication
4. ⬜ Install Firebase SDK
5. ⬜ Create Firebase config
6. ⬜ Implement authentication
7. ⬜ Create Firebase storage client
8. ⬜ Update stores to use Firebase
9. ⬜ Implement migration utility
10. ⬜ Test and deploy

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Next.js Firebase Integration](https://firebase.google.com/docs/web/setup)








