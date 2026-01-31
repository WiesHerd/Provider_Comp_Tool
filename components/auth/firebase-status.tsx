'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export function FirebaseStatus() {
  const [status, setStatus] = useState<{
    authConfigured: boolean;
    dbConfigured: boolean;
    authInitialized: boolean;
    errors: string[];
  }>({
    authConfigured: false,
    dbConfigured: false,
    authInitialized: false,
    errors: [],
  });

  useEffect(() => {
    const errors: string[] = [];
    
    // Check Firebase Auth
    const authConfigured = auth !== null;
    const authInitialized = auth !== null && auth !== undefined;
    
    // Check Firestore
    const dbConfigured = db !== null;
    
    if (!authConfigured) {
      errors.push('Firebase Authentication is not configured');
    }
    
    if (!dbConfigured) {
      errors.push('Firestore Database is not configured');
    }
    
    // Try to access auth methods
    if (authConfigured && auth) {
      try {
        const currentUser = auth.currentUser;
        console.log('✅ Firebase Auth is accessible, current user:', currentUser?.email || 'none');
      } catch (e: any) {
        errors.push(`Firebase Auth error: ${e.message}`);
      }
    }
    
    setStatus({
      authConfigured,
      dbConfigured,
      authInitialized,
      errors,
    });
  }, []);

  if (status.errors.length === 0 && status.authConfigured && status.dbConfigured) {
    return null; // Don't show if everything is OK
  }

  return (
    <Card className="mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          Firebase Configuration Status
        </CardTitle>
        <CardDescription>
          Check your Firebase configuration if you're having authentication issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          {status.authConfigured ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <span>Firebase Authentication: {status.authConfigured ? 'Configured' : 'Not Configured'}</span>
        </div>
        <div className="flex items-center gap-2">
          {status.dbConfigured ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <span>Firestore Database: {status.dbConfigured ? 'Configured' : 'Not Configured'}</span>
        </div>
        {status.errors.length > 0 && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {status.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

