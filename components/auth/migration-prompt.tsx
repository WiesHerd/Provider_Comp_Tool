/**
 * Migration Prompt Component
 * 
 * Prompts user to migrate localStorage data to Firebase on first login
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { migrateToFirebase, hasMigrated } from '@/lib/firebase/migrateToFirebase';
import { useAuthStore } from '@/lib/store/auth-store';
import { logger } from '@/lib/utils/logger';
import { Loader2, Cloud, Database } from 'lucide-react';
import { safeLocalStorage } from '@/hooks/use-debounced-local-storage';

interface MigrationPromptProps {
  onComplete?: () => void;
}

export function MigrationPrompt({ onComplete }: MigrationPromptProps) {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{
    success: boolean;
    scenariosMigrated: number;
    callPayScenariosMigrated: number;
    cfModelsMigrated: number;
    programsMigrated: number;
    shiftTypesMigrated: number;
    errors: string[];
  } | null>(null);
  const user = useAuthStore((state) => state.user);

  // Only show the migration prompt if this browser actually has data to migrate.
  // This prevents confusing first-time users who have no local scenarios/models.
  const hasLocalDataToMigrate = (() => {
    if (typeof window === 'undefined') return false;
    const keys = [
      'provider_scenarios',
      'call-pay-scenarios',
      'cf-models',
      'call-programs-catalog',
      'call-shift-types-catalog',
    ];
    return keys.some((k) => {
      const v = safeLocalStorage.getItem(k);
      return typeof v === 'string' && v.trim().length > 0 && v.trim() !== '[]' && v.trim() !== '{}';
    });
  })();

  const handleMigrate = async () => {
    if (!user?.uid) return;

    setIsMigrating(true);
    try {
      const result = await migrateToFirebase(user.uid);
      setMigrationResult(result);
      
      if (result.success) {
        // Optionally clear localStorage after successful migration
        // clearLocalStorageAfterMigration();
        logger.log('Migration completed', result);
        setTimeout(() => {
          onComplete?.();
        }, 2000);
      }
    } catch (error) {
      logger.error('Migration error:', error);
      setMigrationResult({
        success: false,
        scenariosMigrated: 0,
        callPayScenariosMigrated: 0,
        cfModelsMigrated: 0,
        programsMigrated: 0,
        shiftTypesMigrated: 0,
        errors: [String(error)],
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSkip = () => {
    onComplete?.();
  };

  if (hasMigrated()) {
    return null;
  }

  if (!hasLocalDataToMigrate) {
    return null;
  }

  if (migrationResult?.success) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-green-600" />
            Migration Complete!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>Your data has been successfully migrated to the cloud.</p>
            {migrationResult.scenariosMigrated > 0 && (
              <p>✓ {migrationResult.scenariosMigrated} scenarios migrated</p>
            )}
            {migrationResult.callPayScenariosMigrated > 0 && (
              <p>✓ {migrationResult.callPayScenariosMigrated} call pay scenarios migrated</p>
            )}
            {migrationResult.cfModelsMigrated > 0 && (
              <p>✓ {migrationResult.cfModelsMigrated} CF models migrated</p>
            )}
            {(migrationResult.programsMigrated > 0 || migrationResult.shiftTypesMigrated > 0) && (
              <p>✓ Program catalog migrated</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          Migrate to Cloud Storage?
        </CardTitle>
        <CardDescription>
          We found data in your browser. Would you like to migrate it to the cloud for backup and multi-device access?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {migrationResult && !migrationResult.success && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm">
            <p className="font-semibold text-red-900 dark:text-red-200 mb-1">Migration had errors:</p>
            <ul className="list-disc list-inside space-y-1 text-red-800 dark:text-red-300">
              {migrationResult.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleMigrate}
            disabled={isMigrating}
            className="flex-1"
          >
            {isMigrating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Migrating...
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4 mr-2" />
                Migrate Now
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isMigrating}
          >
            Skip
          </Button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Your data will remain in your browser if you skip. You can migrate later from settings.
        </p>
      </CardContent>
    </Card>
  );
}

