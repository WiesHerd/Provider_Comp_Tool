/**
 * Firebase Configuration
 * 
 * Initialize Firebase app, Auth, and Firestore
 * Get config values from Firebase Console > Project Settings > General > Your apps
 * 
 * NOTE: This file must only be imported in client components ('use client')
 */

'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { logger } from '@/lib/utils/logger';

// Get environment variables
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

// Validate configuration - throw error if critical values are missing
const missingFields: string[] = [];
if (!apiKey) missingFields.push('NEXT_PUBLIC_FIREBASE_API_KEY');
if (!authDomain) missingFields.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
if (!projectId) missingFields.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
if (!storageBucket) missingFields.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
if (!messagingSenderId) missingFields.push('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
if (!appId) missingFields.push('NEXT_PUBLIC_FIREBASE_APP_ID');

// Debug logging - ALWAYS log in browser for debugging
if (typeof window !== 'undefined') {
  console.log('🔍 Firebase Configuration Check:', {
    hasApiKey: !!apiKey,
    hasAuthDomain: !!authDomain,
    hasProjectId: !!projectId,
    hasStorageBucket: !!storageBucket,
    hasMessagingSenderId: !!messagingSenderId,
    hasAppId: !!appId,
    apiKeyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING',
    projectId: projectId || 'MISSING',
    allConfigured: missingFields.length === 0
  });
  
  if (missingFields.length > 0) {
    console.error('❌ Firebase Configuration Missing:', missingFields);
  }
}

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
};

// Only initialize Firebase if all required variables are present
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (missingFields.length === 0) {
  // All variables present - initialize Firebase
  if (getApps().length === 0) {
    try {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      console.log('✅ Firebase initialized successfully');
      if (typeof window !== 'undefined') {
        console.log('✅ Firebase Auth available:', !!auth);
        console.log('✅ Firestore available:', !!db);
      }
    } catch (error) {
      logger.error('Failed to initialize Firebase:', error);
      // Don't throw - allow app to continue without Firebase
    }
  } else {
    app = getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
  }
} else {
  // Missing variables - log warning but don't crash
  const errorMessage = `Firebase configuration is incomplete. Missing environment variables:\n${missingFields.join('\n')}\n\nPlease check your .env.local file and restart the dev server.`;
  console.error('❌ Firebase Configuration Error:', errorMessage);
  console.error('❌ Missing fields:', missingFields);
  if (typeof window !== 'undefined') {
    // Show alert in browser for production debugging
    console.error('Firebase features will be disabled until configuration is complete.');
  }
}

// Export services (may be null if Firebase not configured)
export { auth, db };

// Enable offline persistence for Firestore (client-side only)
if (typeof window !== 'undefined' && db) {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      logger.warn('Firestore offline persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      logger.warn('Firestore offline persistence not available in this browser');
    } else {
      logger.error('Firestore offline persistence error:', err);
    }
  });
}

export default app;







