'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useProgramCatalogStore } from '@/lib/store/program-catalog-store';
import { useScenariosStore } from '@/lib/store/scenarios-store';
import { useCallPayScenariosStore } from '@/lib/store/call-pay-scenarios-store';
import { useUserPreferencesStore } from '@/lib/store/user-preferences-store';
import { useCFModelsStore } from '@/lib/store/cf-models-store';

/**
 * Store Initializer Component
 * 
 * Lazily initializes Zustand stores only when needed based on current route
 * This prevents loading unnecessary stores on the home page
 */
export function StoreInitializer() {
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const loadProgramCatalog = useProgramCatalogStore((state) => state.loadInitialData);
  const loadScenarios = useScenariosStore((state) => state.loadScenarios);
  const loadCallPayScenarios = useCallPayScenariosStore((state) => state.loadScenarios);
  const loadUserPreferences = useUserPreferencesStore((state) => state.loadPreferences);
  const loadCFModels = useCFModelsStore((state) => state.loadModels);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only initialize stores on the client side after mount
    if (!isMounted || !pathname) return;
    
    // Always load user preferences (lightweight, needed everywhere)
    loadUserPreferences();
    
    // Load stores based on current route - lazy loading for better performance
    // Home page doesn't need any stores loaded
    if (pathname === '/') {
      return; // Skip loading stores on home page
    }
    
    // Load scenarios store for pages that use scenarios
    if (
      pathname.startsWith('/scenarios') ||
      pathname.startsWith('/wrvu-modeler') ||
      pathname.startsWith('/wrvu-forecaster') ||
      pathname.startsWith('/call-pay-modeler') ||
      pathname.startsWith('/physician-scenarios') ||
      pathname.startsWith('/fmv-calculator')
    ) {
      loadScenarios();
    }
    
    // Load call pay scenarios for call pay modeler
    if (pathname.startsWith('/call-pay-modeler')) {
      loadCallPayScenarios();
    }
    
    // Load program catalog for call pay modeler and call programs
    if (pathname.startsWith('/call-pay-modeler') || pathname.startsWith('/call-programs')) {
      loadProgramCatalog();
    }
    
    // Load CF models for CF-related pages
    if (pathname.startsWith('/physician-scenarios') || pathname.startsWith('/cf-stewardship-dashboard')) {
      loadCFModels();
    }
  }, [isMounted, pathname, loadProgramCatalog, loadScenarios, loadCallPayScenarios, loadUserPreferences, loadCFModels]);

  // This component doesn't render anything
  return null;
}


