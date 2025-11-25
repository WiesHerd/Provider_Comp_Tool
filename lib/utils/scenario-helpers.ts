import { ProviderScenario } from '@/types';

export interface ScenarioMatchCriteria {
  scenarioType?: string;
  specialty?: string;
  providerName?: string;
}

/**
 * Find a matching scenario based on criteria
 * Matches by scenarioType + specialty/providerName combination
 */
export function findMatchingScenario(
  scenarios: ProviderScenario[],
  criteria: ScenarioMatchCriteria
): ProviderScenario | null {
  return scenarios.find(scenario => {
    // Must match scenario type if provided
    if (criteria.scenarioType && scenario.scenarioType !== criteria.scenarioType) {
      return false;
    }

    // Match specialty if provided
    const specialtyMatch = !criteria.specialty || (scenario.specialty && scenario.specialty === criteria.specialty);
    
    // Match provider name if provided
    const providerMatch = !criteria.providerName || (scenario.providerName && scenario.providerName === criteria.providerName);
    
    // If both specialty and providerName are provided, both must match
    if (criteria.specialty && criteria.providerName) {
      return specialtyMatch && providerMatch;
    }
    
    // If only specialty is provided, it must match
    if (criteria.specialty && !criteria.providerName) {
      return specialtyMatch;
    }
    
    // If only providerName is provided, it must match
    if (criteria.providerName && !criteria.specialty) {
      return providerMatch;
    }

    // If no specialty/providerName criteria, just match on scenarioType
    return true;
  }) || null;
}

