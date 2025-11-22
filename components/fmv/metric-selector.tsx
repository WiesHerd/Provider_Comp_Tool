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
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 'wrvu',
      title: 'wRVU Calculator',
      description: 'Work Relative Value Units',
      icon: Activity,
      href: '/fmv-calculator/wrvu',
      color: 'text-green-600 dark:text-green-400',
    },
    {
      id: 'cf',
      title: 'CF Calculator',
      description: 'Conversion Factor ($/wRVU)',
      icon: TrendingUp,
      href: '/fmv-calculator/cf',
      color: 'text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Link key={metric.id} href={metric.href}>
            <Card className="hover:shadow-lg transition-all cursor-pointer h-full min-h-[180px] flex flex-col">
              <CardHeader className="flex-1">
                <Icon className={`w-10 h-10 ${metric.color} mb-3`} />
                <CardTitle className="text-xl">{metric.title}</CardTitle>
                <CardDescription className="text-base mt-2">
                  {metric.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-primary font-semibold">
                  Calculate Percentile →
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

