import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, TrendingUp, Phone, FolderOpen } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-green-400 dark:from-blue-400 dark:via-purple-400 dark:to-green-300 rounded-full blur-2xl opacity-30 dark:opacity-40 animate-pulse"></div>
              <h1 className="relative text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 via-pink-500 to-green-500 dark:from-blue-400 dark:via-purple-400 dark:via-pink-400 dark:to-green-400 bg-clip-text text-transparent mb-4 tracking-tight leading-tight">
                Comp Lens<sup className="text-xs font-normal ml-0.5 opacity-70">™</sup>
              </h1>
            </div>
          </div>
          <p className="text-xl md:text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2 leading-tight">
            Provider Compensation Intelligence
          </p>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            wRVU modeling, FMV checks, and call-pay scenarios on your phone.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Link href="/wrvu-modeler">
            <Card className="hover:shadow-md transition-shadow duration-150 cursor-pointer h-full">
              <CardHeader>
                <Calculator className="w-8 h-8 text-primary mb-2" />
                <CardTitle>wRVU Modeler</CardTitle>
                <CardDescription>
                  Estimate wRVUs and productivity incentives with FTE normalization
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/fmv-calculator">
            <Card className="hover:shadow-md transition-shadow duration-150 cursor-pointer h-full">
              <CardHeader>
                <TrendingUp className="w-8 h-8 text-primary mb-2" />
                <CardTitle>FMV Quick Calculator</CardTitle>
                <CardDescription>
                  Fast FMV reasonableness checks with percentile analysis
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/call-pay-modeler">
            <Card className="hover:shadow-md transition-shadow duration-150 cursor-pointer h-full">
              <CardHeader>
                <Phone className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Call Pay Modeler</CardTitle>
                <CardDescription>
                  Model different call-pay structures with annualized outputs
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/scenarios">
            <Card className="hover:shadow-md transition-shadow duration-150 cursor-pointer h-full">
              <CardHeader>
                <FolderOpen className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Scenarios</CardTitle>
                <CardDescription>
                  Save, recall, and compare compensation scenarios
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Disclaimer - Apple-style minimal */}
        <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-12 mb-8">
          For education and planning only. Not legal or FMV advice.
        </p>
      </div>
    </div>
  );
}

