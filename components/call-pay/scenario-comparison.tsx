'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, TrendingDown, Minus, X } from 'lucide-react';
import { ProviderScenario } from '@/types';
import { ScenarioData, compareScenarios, compareMultipleScenarios, formatVariance } from '@/lib/utils/scenario-comparison';
import { CallPayContext, CallTier, CallPayImpact } from '@/types/call-pay';
import { cn } from '@/lib/utils/cn';

interface ScenarioComparisonProps {
  scenarios: ProviderScenario[];
  onClose?: () => void;
}

export function ScenarioComparison({ scenarios, onClose }: ScenarioComparisonProps) {
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>([]);
  const maxScenarios = 4;

  // Filter to call-pay scenarios only
  const callPayScenarios = useMemo(() => {
    return scenarios.filter(s => s.scenarioType === 'call-pay' && s.callPayData);
  }, [scenarios]);

  // Convert ProviderScenario to ScenarioData
  const convertToScenarioData = (scenario: ProviderScenario): ScenarioData | null => {
    if (!scenario.callPayData) return null;

    return {
      id: scenario.id,
      name: scenario.name,
      context: scenario.callPayData.context,
      tiers: scenario.callPayData.tiers,
      impact: scenario.callPayData.impact,
    };
  };

  // Get comparison result
  const comparison = useMemo(() => {
    if (selectedScenarioIds.length < 2) return null;

    const selectedScenarios = selectedScenarioIds
      .map(id => callPayScenarios.find(s => s.id === id))
      .filter((s): s is ProviderScenario => s !== undefined)
      .map(convertToScenarioData)
      .filter((s): s is ScenarioData => s !== null);

    if (selectedScenarios.length < 2) return null;

    if (selectedScenarios.length === 2) {
      return compareScenarios(selectedScenarios[0], selectedScenarios[1]);
    } else {
      return compareMultipleScenarios(selectedScenarios);
    }
  }, [selectedScenarioIds, callPayScenarios]);

  const handleScenarioSelect = (index: number, scenarioId: string) => {
    const newSelection = [...selectedScenarioIds];
    newSelection[index] = scenarioId;
    setSelectedScenarioIds(newSelection.filter(id => id !== ''));
  };

  const removeScenario = (index: number) => {
    const newSelection = selectedScenarioIds.filter((_, i) => i !== index);
    setSelectedScenarioIds(newSelection);
  };

  const addScenario = () => {
    if (selectedScenarioIds.length < maxScenarios) {
      setSelectedScenarioIds([...selectedScenarioIds, '']);
    }
  };

  const getVarianceColor = (variancePercent: number) => {
    if (Math.abs(variancePercent) < 1) return 'text-gray-600 dark:text-gray-400';
    if (variancePercent > 0) return 'text-red-600 dark:text-red-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getVarianceIcon = (variancePercent: number) => {
    if (Math.abs(variancePercent) < 1) {
      return <Minus className="w-4 h-4" />;
    }
    if (variancePercent > 0) {
      return <TrendingUp className="w-4 h-4" />;
    }
    return <TrendingDown className="w-4 h-4" />;
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Scenario Comparison
          </CardTitle>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Compare up to {maxScenarios} call pay scenarios side-by-side
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scenario Selection */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold">Select Scenarios to Compare</Label>
          <div className="space-y-3">
            {selectedScenarioIds.map((scenarioId, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1">
                  <Select
                    value={scenarioId}
                    onValueChange={(value) => handleScenarioSelect(index, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Scenario ${index + 1}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {callPayScenarios.map((scenario) => (
                        <SelectItem
                          key={scenario.id}
                          value={scenario.id}
                          disabled={selectedScenarioIds.includes(scenario.id) && scenario.id !== scenarioId}
                        >
                          {scenario.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedScenarioIds.length > 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeScenario(index)}
                    className="min-w-[44px]"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            {selectedScenarioIds.length < maxScenarios && callPayScenarios.length > selectedScenarioIds.length && (
              <Button variant="outline" onClick={addScenario} className="w-full">
                Add Scenario
              </Button>
            )}
          </div>
        </div>

        {/* Comparison Results */}
        {comparison && (
          <div className="space-y-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                Comparison Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Total Budget Variance
                  </div>
                  <div className={cn('text-2xl font-bold', getVarianceColor(comparison.totalBudgetVariancePercent))}>
                    {formatVariance(comparison.totalBudgetVariance)}
                  </div>
                  <div className={cn('text-sm', getVarianceColor(comparison.totalBudgetVariancePercent))}>
                    {formatVariance(comparison.totalBudgetVariancePercent, true)}
                  </div>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Average Pay Variance
                  </div>
                  <div className={cn('text-2xl font-bold', getVarianceColor(comparison.averagePayVariancePercent))}>
                    {formatVariance(comparison.averagePayVariance)}
                  </div>
                  <div className={cn('text-sm', getVarianceColor(comparison.averagePayVariancePercent))}>
                    {formatVariance(comparison.averagePayVariancePercent, true)}
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Variances */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                Detailed Comparison
              </h3>
              <div className="space-y-2">
                {comparison.variances.map((variance, index) => (
                  <div
                    key={index}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                          {variance.field}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          <div>
                            {comparison.scenarios[0]?.name}: {typeof variance.scenario1Value === 'number'
                              ? `$${variance.scenario1Value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : variance.scenario1Value}
                          </div>
                          {comparison.scenarios[1] && (
                            <div>
                              {comparison.scenarios[1].name}: {typeof variance.scenario2Value === 'number'
                                ? `$${variance.scenario2Value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : variance.scenario2Value}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={cn('flex items-center gap-2', getVarianceColor(variance.variancePercent))}>
                        {getVarianceIcon(variance.variancePercent)}
                        <div className="text-right">
                          <div className="font-semibold">
                            {typeof variance.variance === 'number'
                              ? formatVariance(variance.variance)
                              : variance.variance}
                          </div>
                          <div className="text-xs">
                            {formatVariance(variance.variancePercent, true)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedScenarioIds.length < 2 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Select at least 2 scenarios to compare
          </div>
        )}
      </CardContent>
    </Card>
  );
}



