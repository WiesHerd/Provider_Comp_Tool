'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Activity, TrendingUp } from 'lucide-react';

export function MetricSelector() {
  const metrics = [
    {
      id: 'tcc',
      title: 'TCC Calculator',
      description: 'Total Cash Compensation',
      icon: DollarSign,
      href: '/fmv-calculator/tcc',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 'wrvu',
      title: 'wRVU Calculator',
      description: 'Work Relative Value Units',
      icon: Activity,
      href: '/fmv-calculator/wrvu',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      id: 'cf',
      title: 'CF Calculator',
      description: 'Conversion Factor ($/wRVU)',
      icon: TrendingUp,
      href: '/fmv-calculator/cf',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Link key={metric.id} href={metric.href}>
            <Card className="hover:shadow-md transition-all duration-150 cursor-pointer h-full min-h-[200px] flex flex-col group">
              <CardHeader className="flex-1 flex flex-col items-center text-center space-y-4 pb-4">
                {/* Circular Icon Container - Apple-style */}
                <div className={`w-20 h-20 rounded-full ${metric.iconBg} flex items-center justify-center transition-transform duration-150 group-hover:scale-105`}>
                  <Icon className={`w-10 h-10 ${metric.iconColor}`} strokeWidth={2} />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl font-semibold">{metric.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {metric.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm text-primary font-semibold text-center group-hover:translate-x-1 transition-transform duration-150 inline-flex items-center gap-1 w-full justify-center">
                  Calculate Percentile
                  <span className="text-primary">→</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

