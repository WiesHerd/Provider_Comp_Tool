'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { CallPayContext, CallTier, CallPayImpact } from '@/types/call-pay';
import { generateBudgetForecast, ForecastAssumptions } from '@/lib/utils/budget-forecasting';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BudgetForecasterProps {
  context: CallPayContext;
  tiers: CallTier[];
  impact: CallPayImpact;
}

export function BudgetForecaster({ context, tiers, impact }: BudgetForecasterProps) {
  const [assumptions, setAssumptions] = useState<ForecastAssumptions>({
    rateIncreasePercent: 2.5,
    providerGrowthPercent: 0,
    yearsToForecast: 3,
  });

  const forecast = useMemo(() => {
    return generateBudgetForecast(context, tiers, impact, assumptions);
  }, [context, tiers, impact, assumptions]);

  const chartData = useMemo(() => {
    return [
      {
        year: forecast.baseYear,
        budget: forecast.baseBudget,
        name: `Year ${forecast.baseYear}`,
      },
      ...forecast.forecasts.map(f => ({
        year: f.year,
        budget: f.adjustedBudget,
        name: `Year ${f.year}`,
      })),
    ];
  }, [forecast]);

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          Multi-Year Budget Forecast
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Project call pay budgets 3-5 years forward with rate increases and provider growth
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Assumptions Input */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Annual Rate Increase (%)</Label>
            <NumberInput
              value={assumptions.rateIncreasePercent}
              onChange={(value) =>
                setAssumptions((prev) => ({ ...prev, rateIncreasePercent: value }))
              }
              min={0}
              max={20}
              step={0.1}
              placeholder="2.5"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Typical: 2-4% (COLA, market adjustments)
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Annual Provider Growth (%)</Label>
            <NumberInput
              value={assumptions.providerGrowthPercent}
              onChange={(value) =>
                setAssumptions((prev) => ({ ...prev, providerGrowthPercent: value }))
              }
              min={-10}
              max={50}
              step={0.1}
              placeholder="0"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Positive for growth, negative for attrition
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Years to Forecast</Label>
            <NumberInput
              value={assumptions.yearsToForecast}
              onChange={(value) =>
                setAssumptions((prev) => ({ ...prev, yearsToForecast: value }))
              }
              min={1}
              max={5}
              step={1}
              placeholder="3"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Typically 3-5 years
            </p>
          </div>
        </div>

        {/* Forecast Chart */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Budget Projection
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `$${value.toLocaleString('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="budget"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Annual Budget"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Forecast Table */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Year-by-Year Forecast
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-2 font-semibold text-gray-900 dark:text-white">Year</th>
                  <th className="text-right p-2 font-semibold text-gray-900 dark:text-white">Budget</th>
                  <th className="text-right p-2 font-semibold text-gray-900 dark:text-white">Providers</th>
                  <th className="text-right p-2 font-semibold text-gray-900 dark:text-white">Avg Pay/Provider</th>
                  <th className="text-right p-2 font-semibold text-gray-900 dark:text-white">Rate Increase</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="p-2 font-medium text-gray-900 dark:text-white">{forecast.baseYear}</td>
                  <td className="p-2 text-right text-gray-700 dark:text-gray-300">
                    ${forecast.baseBudget.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="p-2 text-right text-gray-700 dark:text-gray-300">
                    {context.providersOnCall}
                  </td>
                  <td className="p-2 text-right text-gray-700 dark:text-gray-300">
                    ${impact.averageCallPayPerProvider.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="p-2 text-right text-gray-700 dark:text-gray-300">-</td>
                </tr>
                {forecast.forecasts.map((f) => (
                  <tr key={f.year} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="p-2 font-medium text-gray-900 dark:text-white">{f.year}</td>
                    <td className="p-2 text-right text-gray-700 dark:text-gray-300">
                      ${f.adjustedBudget.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-2 text-right text-gray-700 dark:text-gray-300">
                      {f.totalProviders}
                    </td>
                    <td className="p-2 text-right text-gray-700 dark:text-gray-300">
                      ${f.averagePayPerProvider.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-2 text-right text-gray-700 dark:text-gray-300">
                      <div className="flex items-center justify-end gap-1">
                        {f.rateIncrease > 0 && <TrendingUp className="w-4 h-4 text-green-600" />}
                        {f.rateIncrease < 0 && <TrendingDown className="w-4 h-4 text-red-600" />}
                        {f.rateIncrease.toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold bg-gray-50 dark:bg-gray-800">
                  <td className="p-2 text-gray-900 dark:text-white">Total (All Years)</td>
                  <td className="p-2 text-right text-gray-900 dark:text-white">
                    ${forecast.totalProjectedSpend.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



