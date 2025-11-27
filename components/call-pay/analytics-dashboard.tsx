'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CallTier, CallPayImpact, CallPayContext } from '@/types/call-pay';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsDashboardProps {
  tiers: CallTier[];
  impact: CallPayImpact;
  context: CallPayContext;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function AnalyticsDashboard({ tiers, impact, context: _context }: AnalyticsDashboardProps) {
  // Budget breakdown by tier
  const tierBudgetData = useMemo(() => {
    return impact.tiers.map((tierImpact, index) => ({
      name: tierImpact.tierName,
      value: tierImpact.annualPayForGroup,
      color: COLORS[index % COLORS.length],
    }));
  }, [impact.tiers]);

  // Rate comparison data (if we have benchmark data, we'd add it here)
  const rateComparisonData = useMemo(() => {
    const enabledTiers = tiers.filter(t => t.enabled);
    return enabledTiers.map(tier => ({
      tier: tier.name,
      weekday: tier.rates.weekday,
      weekend: tier.rates.weekend,
      holiday: tier.rates.holiday,
    }));
  }, [tiers]);

  // Monthly breakdown
  const monthlyBreakdown = useMemo(() => {
    return impact.tiers.map(tierImpact => ({
      tier: tierImpact.tierName,
      monthly: tierImpact.annualPayPerProvider / 12,
    }));
  }, [impact.tiers]);

  // Effective rates comparison
  const effectiveRatesData = useMemo(() => {
    return impact.tiers.map(tierImpact => ({
      tier: tierImpact.tierName,
      per24h: tierImpact.effectiveDollarsPer24h,
      perCall: tierImpact.effectiveDollarsPerCall,
    }));
  }, [impact.tiers]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Budget Breakdown by Tier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={tierBudgetData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {tierBudgetData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `$${value.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {tierBudgetData.map((entry, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-gray-700 dark:text-gray-300">{entry.name}</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${entry.value.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {rateComparisonData.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Rate Comparison by Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rateComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tier" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `$${value.toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}`}
                />
                <Legend />
                <Bar dataKey="weekday" fill="#3b82f6" name="Weekday" />
                <Bar dataKey="weekend" fill="#10b981" name="Weekend" />
                <Bar dataKey="holiday" fill="#f59e0b" name="Holiday" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {monthlyBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Monthly Pay per Provider by Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tier" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `$${value.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                />
                <Bar dataKey="monthly" fill="#8b5cf6" name="Monthly Pay" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {effectiveRatesData.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Effective Rates Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={effectiveRatesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tier" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `$${value.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                />
                <Legend />
                <Bar dataKey="per24h" fill="#3b82f6" name="Per 24h" />
                <Bar dataKey="perCall" fill="#10b981" name="Per Call" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

