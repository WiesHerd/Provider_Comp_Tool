'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, TrendingUp, Phone, BarChart3 } from 'lucide-react';
import { WelcomeWalkthrough } from '@/components/layout/welcome-walkthrough';
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8 md:pb-12">
        {/* Hero Section - Apple-style minimal */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12 pt-2">
          <div className="flex justify-center items-center mb-3 sm:mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-green-400 dark:from-blue-400 dark:via-purple-400 dark:to-green-300 rounded-full blur-2xl opacity-30 dark:opacity-40 animate-pulse"></div>
              <h1 className="relative text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 via-pink-500 to-green-500 dark:from-blue-400 dark:via-purple-400 dark:via-pink-400 dark:to-green-400 bg-clip-text text-transparent tracking-tight leading-tight">
                CompLen<span className="relative inline-block bg-gradient-to-r from-blue-600 via-purple-600 via-pink-500 to-green-500 dark:from-blue-400 dark:via-purple-400 dark:via-pink-400 dark:to-green-400 bg-clip-text text-transparent">s<sup className="text-[7px] sm:text-[8px] md:text-[10px] font-bold text-gray-900 dark:text-gray-100 leading-none -ml-0.5 -mt-1 sm:-mt-1 md:-mt-1.5">TM</sup></span>
              </h1>
            </div>
          </div>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            Provider compensation modeling and FMV analysis
          </p>
        </div>

        {/* Tools Grid - Primary navigation */}
        <div className="mb-8 sm:mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Link href="/wrvu-modeler">
              <Card className="hover:shadow-md transition-all duration-150 cursor-pointer h-full group">
                <CardHeader className="space-y-4">
                  <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center transition-transform duration-150 group-hover:scale-105">
                    <Calculator className="w-7 h-7 text-primary" strokeWidth={2} />
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
              <Card className="hover:shadow-md transition-all duration-150 cursor-pointer h-full group">
                <CardHeader className="space-y-4">
                  <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center transition-transform duration-150 group-hover:scale-105">
                    <TrendingUp className="w-7 h-7 text-primary" strokeWidth={2} />
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
              <Card className="hover:shadow-md transition-all duration-150 cursor-pointer h-full group">
                <CardHeader className="space-y-4">
                  <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center transition-transform duration-150 group-hover:scale-105">
                    <Phone className="w-7 h-7 text-primary" strokeWidth={2} />
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

            <Link href="/wrvu-forecaster">
              <Card className="hover:shadow-md transition-all duration-150 cursor-pointer h-full group">
                <CardHeader className="space-y-4">
                  <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center transition-transform duration-150 group-hover:scale-105">
                    <BarChart3 className="w-7 h-7 text-primary" strokeWidth={2} />
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
        <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-12 mb-8">
          For education and planning only. Not legal or FMV advice.
        </p>
      </div>
      
      {/* Welcome Wizard */}
      <WelcomeWalkthrough />
    </div>
  );
}
