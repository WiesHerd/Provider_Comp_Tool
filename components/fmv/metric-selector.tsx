'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Activity, TrendingUp, ChevronRight } from 'lucide-react';

export function MetricSelector() {
  const metrics = [
    {
      id: 'tcc',
      title: 'TCC Calculator',
      description: 'Total Cash Compensation',
      icon: DollarSign,
      href: '/fmv-calculator/tcc',
    },
    {
      id: 'wrvu',
      title: 'wRVU Calculator',
      description: 'Work Relative Value Units',
      icon: Activity,
      href: '/fmv-calculator/wrvu',
    },
    {
      id: 'cf',
      title: 'CF Calculator',
      description: 'Conversion Factor ($/wRVU)',
      icon: TrendingUp,
      href: '/fmv-calculator/cf',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 justify-items-center md:justify-items-stretch" data-tour="fmv-selector">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Link key={metric.id} href={metric.href} className="w-full max-w-sm md:max-w-none">
            <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer h-full group relative w-full">
              <CardHeader className="space-y-4">
                <div className="w-16 h-16 flex items-center justify-center">
                  <Icon className="w-8 h-8 text-primary" strokeWidth={2} />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">{metric.title}</CardTitle>
                  <CardDescription>
                    {metric.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" strokeWidth={2} />
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

