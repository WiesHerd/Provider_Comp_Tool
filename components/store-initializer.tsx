'use client';

import { useEffect } from 'react';
import { useProgramCatalogStore } from '@/lib/store/program-catalog-store';
import { useScenariosStore } from '@/lib/store/scenarios-store';
import { useCallPayScenariosStore } from '@/lib/store/call-pay-scenarios-store';
import { useUserPreferencesStore } from '@/lib/store/user-preferences-store';

/**
 * Store Initializer Component
 * 
 * Initializes all Zustand stores on app load to ensure data is loaded from storage
 * This component should be mounted once at the root of the app
 */
export function StoreInitializer() {
  const loadProgramCatalog = useProgramCatalogStore((state) => state.loadInitialData);
  const loadScenarios = useScenariosStore((state) => state.loadScenarios);
  const loadCallPayScenarios = useCallPayScenariosStore((state) => state.loadScenarios);
  const loadUserPreferences = useUserPreferencesStore((state) => state.loadPreferences);

  useEffect(() => {
    // Initialize all stores on mount
    loadProgramCatalog();
    loadScenarios();
    loadCallPayScenarios();
    loadUserPreferences();
  }, [loadProgramCatalog, loadScenarios, loadCallPayScenarios, loadUserPreferences]);

  // This component doesn't render anything
  return null;
}

