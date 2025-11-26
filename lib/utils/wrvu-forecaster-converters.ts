import { ProviderScenario } from '@/types';
import { WRVUForecasterScenario, WRVUForecasterInputs, ProductivityMetrics } from '@/types/wrvu-forecaster';

/**
 * Convert WRVUForecasterScenario to ProviderScenario for global store
 */
export function wrvuForecasterScenarioToProviderScenario(
  scenario: WRVUForecasterScenario
): ProviderScenario {
  return {
    id: scenario.id,
    name: scenario.name,
    scenarioType: 'wrvu-forecaster',
    providerName: scenario.providerName,
    specialty: scenario.specialty,
    fte: 1.0, // Default FTE for forecaster scenarios
    annualWrvus: scenario.metrics.estimatedAnnualWRVUs,
    tccComponents: [
      {
        id: 'base-salary',
        label: 'Base Salary',
        type: 'Base Salary',
        amount: scenario.inputs.baseSalary,
      },
      {
        id: 'productivity-incentive',
        label: 'Productivity Incentive',
        type: 'Productivity Incentive',
        amount: scenario.metrics.wrvuCompensation,
      },
    ],
    totalTcc: scenario.metrics.estimatedTotalCompensation,
    normalizedTcc: scenario.metrics.estimatedTotalCompensation,
    normalizedWrvus: scenario.metrics.estimatedAnnualWRVUs,
    wrvuForecasterData: {
      inputs: scenario.inputs,
      metrics: scenario.metrics,
    },
    createdAt: new Date(scenario.date).toISOString() || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Convert ProviderScenario to WRVUForecasterScenario
 */
export function providerScenarioToWRVUForecasterScenario(
  scenario: ProviderScenario
): WRVUForecasterScenario | null {
  if (!scenario.wrvuForecasterData) {
    return null;
  }

  return {
    id: scenario.id,
    name: scenario.name,
    providerName: scenario.providerName,
    specialty: scenario.specialty,
    inputs: scenario.wrvuForecasterData.inputs,
    metrics: scenario.wrvuForecasterData.metrics,
    date: scenario.createdAt ? new Date(scenario.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
  };
}

/**
 * Check if a ProviderScenario is a wRVU Forecaster scenario
 */
export function isWRVUForecasterScenario(scenario: ProviderScenario): boolean {
  return scenario.scenarioType === 'wrvu-forecaster' && !!scenario.wrvuForecasterData;
}

