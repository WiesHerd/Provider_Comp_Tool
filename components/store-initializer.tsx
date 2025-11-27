'use client';

import { useEffect, useState } from 'react';
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
  const [isMounted, setIsMounted] = useState(false);
  const loadProgramCatalog = useProgramCatalogStore((state) => state.loadInitialData);
  const loadScenarios = useScenariosStore((state) => state.loadScenarios);
  const loadCallPayScenarios = useCallPayScenariosStore((state) => state.loadScenarios);
  const loadUserPreferences = useUserPreferencesStore((state) => state.loadPreferences);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only initialize stores on the client side after mount
    if (!isMounted) return;
    
    // Initialize all stores on mount
    loadProgramCatalog();
    loadScenarios();
    loadCallPayScenarios();
    loadUserPreferences();
  }, [isMounted, loadProgramCatalog, loadScenarios, loadCallPayScenarios, loadUserPreferences]);

  // This component doesn't render anything
  return null;
}


