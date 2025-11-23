import { ScenarioType } from '@/types';

/**
 * Maps scenarioType to the corresponding route path
 */
export function getScenarioRoute(scenarioType?: ScenarioType): string {
  switch (scenarioType) {
    case 'wrvu-modeler':
      return '/wrvu-modeler';
    case 'fmv-tcc':
      return '/fmv-calculator/tcc';
    case 'fmv-wrvu':
      return '/fmv-calculator/wrvu';
    case 'fmv-cf':
      return '/fmv-calculator/cf';
    case 'call-pay':
      return '/call-pay-modeler';
    case 'general':
    default:
      // For general or undefined types, use detail page
      return '';
  }
}

/**
 * Gets the display name for a scenario type
 */
export function getScenarioTypeLabel(scenarioType?: ScenarioType): string {
  switch (scenarioType) {
    case 'wrvu-modeler':
      return 'wRVU Modeler';
    case 'fmv-tcc':
      return 'FMV Calculator';
    case 'fmv-wrvu':
      return 'FMV Calculator';
    case 'fmv-cf':
      return 'FMV Calculator';
    case 'call-pay':
      return 'Call Pay Modeler';
    case 'general':
    default:
      return 'General Scenario';
  }
}

/**
 * Gets the full navigation URL for a scenario
 * If scenarioType is defined, navigates to the tool with query param
 * Otherwise, navigates to the detail page
 */
export function getScenarioNavigationUrl(scenarioId: string, scenarioType?: ScenarioType): string {
  const route = getScenarioRoute(scenarioType);
  if (route) {
    return `${route}?scenario=${scenarioId}`;
  }
  return `/scenarios/${scenarioId}`;
}

