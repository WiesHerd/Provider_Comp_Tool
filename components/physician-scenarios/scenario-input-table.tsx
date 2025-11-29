'use client';

import React, { useState } from 'react';
import { ProductivityScenario } from '@/types/physician-scenarios';
import { MarketBenchmarks } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyInput } from '@/components/ui/currency-input';
import { BenchmarkInputs } from '@/components/fmv/benchmark-inputs';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface ScenarioInputTableProps {
  scenarios: ProductivityScenario[];
  onScenariosChange: (scenarios: ProductivityScenario[]) => void;
}

export function ScenarioInputTable({
  scenarios,
  onScenariosChange,
}: ScenarioInputTableProps) {
  const [expandedScenarios, setExpandedScenarios] = useState<Set<string>>(new Set());
  const handleAddScenario = () => {
    const newScenario: ProductivityScenario = {
      id: `scenario-${Date.now()}`,
      name: `Scenario ${scenarios.length + 1}`,
      wrvus: 0,
      fixedComp: 0,
      marketBenchmarks: {},
      useActualProductivity: false,
    };
    onScenariosChange([...scenarios, newScenario]);
  };

  const handleDeleteScenario = (id: string) => {
    if (scenarios.length <= 1) {
      // Don't allow deleting the last scenario
      return;
    }
    onScenariosChange(scenarios.filter((s) => s.id !== id));
  };

  const handleUpdateScenario = (id: string, updates: Partial<ProductivityScenario>) => {
    onScenariosChange(
      scenarios.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const handleUpdateMarketBenchmarks = (id: string, benchmarks: MarketBenchmarks) => {
    handleUpdateScenario(id, { marketBenchmarks: benchmarks });
  };

  const toggleExpand = (id: string) => {
    setExpandedScenarios((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Productivity Scenarios
          </CardTitle>
          <Button
            variant="default"
            size="sm"
            onClick={handleAddScenario}
            className="text-sm"
          >
            <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
            Add Scenario
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Scenario Name
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  wRVUs
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Fixed Comp
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Use actual productivity?
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((scenario) => {
                const isExpanded = expandedScenarios.has(scenario.id);
                return (
                  <React.Fragment key={scenario.id}>
                    <tr
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-4">
                        <Input
                          value={scenario.name}
                          onChange={(e) =>
                            handleUpdateScenario(scenario.id, { name: e.target.value })
                          }
                          className="w-full min-w-[150px]"
                          placeholder="Scenario name"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          type="number"
                          value={scenario.wrvus || ''}
                          onChange={(e) =>
                            handleUpdateScenario(scenario.id, {
                              wrvus: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full text-right"
                          placeholder="0"
                          min={0}
                          step={0.01}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <CurrencyInput
                          value={scenario.fixedComp || 0}
                          onChange={(value) =>
                            handleUpdateScenario(scenario.id, {
                              fixedComp: value,
                            })
                          }
                          placeholder="0"
                          min={0}
                          showDecimals={false}
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center">
                          <Switch
                            checked={scenario.useActualProductivity}
                            onCheckedChange={(checked: boolean) =>
                              handleUpdateScenario(scenario.id, {
                                useActualProductivity: checked,
                              })
                            }
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(scenario.id)}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteScenario(scenario.id)}
                            disabled={scenarios.length <= 1}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="py-4 px-4 bg-gray-50 dark:bg-gray-800/50">
                          <div className="space-y-4">
                            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Market Survey Data (Enter manually for this scenario)
                            </div>
                            <div className="space-y-4">
                              <BenchmarkInputs
                                benchmarks={scenario.marketBenchmarks || {}}
                                onBenchmarksChange={(benchmarks) =>
                                  handleUpdateMarketBenchmarks(scenario.id, benchmarks)
                                }
                                type="wrvu"
                              />
                              <BenchmarkInputs
                                benchmarks={scenario.marketBenchmarks || {}}
                                onBenchmarksChange={(benchmarks) =>
                                  handleUpdateMarketBenchmarks(scenario.id, benchmarks)
                                }
                                type="tcc"
                              />
                              <BenchmarkInputs
                                benchmarks={scenario.marketBenchmarks || {}}
                                onBenchmarksChange={(benchmarks) =>
                                  handleUpdateMarketBenchmarks(scenario.id, benchmarks)
                                }
                                type="cf"
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
          Click the expand icon (↓) next to each scenario to enter market survey data (wRVU, TCC, CF percentiles).
        </p>
      </CardContent>
    </Card>
  );
}

