'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, TrendingUp, Phone, BarChart3 } from 'lucide-react';
import { useScenariosStore } from '@/lib/store/scenarios-store';
import { Button } from '@/components/ui/button';
import { RecentScenarioCard } from '@/components/scenarios/recent-scenario-card';
import { ProviderScenario } from '@/types';

export default function Home() {
  const { scenarios, loadScenarios } = useScenariosStore();

  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  // Get recent scenarios (filter out dismissed, last 3, sorted by updatedAt)
  const recentScenarios = scenarios
    .filter((s) => {
      const scenario = s as ProviderScenario;
      return scenario.dismissedFromRecent !== true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();
      return dateB - dateA;
    })
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-6">
      <div className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto pb-6 sm:pb-8 md:pb-12">
        {/* Tools Grid - Primary navigation */}
        <div className="mb-8 sm:mb-10 pt-8 sm:pt-12" data-tour="home-tools">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <Link href="/wrvu-modeler">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer h-full group">
                <CardHeader className="space-y-4">
                  <div className="w-16 h-16 flex items-center justify-center">
                    <Calculator className="w-8 h-8 text-primary" strokeWidth={2} />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg">wRVU & Incentive Modeler</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Estimate wRVUs and productivity incentives
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/fmv-calculator">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer h-full group">
                <CardHeader className="space-y-4">
                  <div className="w-16 h-16 flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-primary" strokeWidth={2} />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg">FMV Calculator</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Fast FMV reasonableness checks and percentile analysis
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/call-pay-modeler">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer h-full group">
                <CardHeader className="space-y-4">
                  <div className="w-16 h-16 flex items-center justify-center">
                    <Phone className="w-8 h-8 text-primary" strokeWidth={2} />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg">Call Pay Modeler</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Model call-pay structures with annualized outputs
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/wrvu-forecaster" className="lg:col-start-2">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer h-full group">
                <CardHeader className="space-y-4">
                  <div className="w-16 h-16 flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-primary" strokeWidth={2} />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg">Provider Schedule & wRVU Forecaster</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Forecast annual wRVUs and compensation based on schedule
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Scenarios Section */}
        {recentScenarios.length > 0 && (
          <div className="mb-8 sm:mb-10">
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                Recent Scenarios
              </h2>
              <Link href="/scenarios">
                <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                  View All
                </Button>
              </Link>
            </div>
            <div className="space-y-4">
              {recentScenarios.map((scenario) => (
                <RecentScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  onDismiss={() => {
                    // Reload scenarios after dismiss to update the list
                    loadScenarios();
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer - Apple-style minimal */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-12 mb-8">
          For education and planning only. Not legal or FMV advice.
        </p>
      </div>
      
    </div>
  );
}
