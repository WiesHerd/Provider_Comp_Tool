import { ProviderScenario } from '@/types';
import { WRVUForecasterScenario, WRVUForecasterInputs, ProductivityMetrics } from '@/types/wrvu-forecaster';
import { normalizeTcc, normalizeWrvus } from '@/lib/utils/normalization';

/**
 * Convert WRVUForecasterScenario to ProviderScenario for global store
 */
export function wrvuForecasterScenarioToProviderScenario(
  scenario: WRVUForecasterScenario
): ProviderScenario {
  const fte = scenario.inputs.fte ?? 1.0;
  const totalTcc = scenario.metrics.estimatedTotalCompensation;
  const annualWrvus = scenario.metrics.estimatedAnnualWRVUs;
  
  return {
    id: scenario.id,
    name: scenario.name,
    scenarioType: 'wrvu-forecaster',
    providerName: scenario.providerName,
    specialty: scenario.specialty,
    fte: fte,
    annualWrvus: annualWrvus,
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
    totalTcc: totalTcc,
    normalizedTcc: normalizeTcc(totalTcc, fte),
    normalizedWrvus: normalizeWrvus(annualWrvus, fte),
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


