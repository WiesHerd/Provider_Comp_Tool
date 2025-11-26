'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, TrendingUp, Phone, BarChart3, ClipboardList } from 'lucide-react';

export default function Home() {

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-6">
      <div className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto pb-6 sm:pb-8 md:pb-12">
        {/* Tools Grid - Primary navigation */}
        <div className="mb-8 sm:mb-10" data-tour="home-tools">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
            <Link href="/wrvu-modeler">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer h-full group">
                <CardHeader className="space-y-4">
                  <div className="w-16 h-16 flex items-center justify-center">
                    <Calculator className="w-8 h-8 text-primary" strokeWidth={2} />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg">Productivity Incentive Calculator</CardTitle>
                    <CardDescription>
                      Calculate bonus pay based on how many patients you see. Perfect for reviewing productivity-based contracts.
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/wrvu-forecaster">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer h-full group">
                <CardHeader className="space-y-4">
                  <div className="w-16 h-16 flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-primary" strokeWidth={2} />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg">Schedule-Based Productivity Calculator</CardTitle>
                    <CardDescription>
                      See how your schedule translates to pay. Enter shifts and patient visits to forecast annual compensation.
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
                    <CardDescription>
                      Check if an offer is fair by comparing to market data. Use before signing contracts or making offers.
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
                    <CardDescription>
                      Model call pay schedules and calculate total costs. Perfect for planning call coverage compensation.
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/provider-wrvu-tracking" className="sm:col-start-1 sm:col-span-2">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer h-full group">
                <CardHeader className="space-y-4">
                  <div className="w-16 h-16 flex items-center justify-center">
                    <ClipboardList className="w-8 h-8 text-primary" strokeWidth={2} />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg">Provider Work RVU Tracking</CardTitle>
                    <CardDescription>
                      Track your daily patients and work RVUs by month. Perfect for reconciling with compensation reports.
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>

        {/* Disclaimer - Apple-style minimal */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-12 mb-8">
          For education and planning only. Not legal or FMV advice.
        </p>
      </div>
      
    </div>
  );
}
