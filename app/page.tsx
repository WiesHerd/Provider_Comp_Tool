import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, TrendingUp, Phone, FolderOpen } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Mobile Provider Compensation Companion
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400">
            wRVU modeling, FMV checks, and call-pay scenarios on your phone.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Link href="/wrvu-modeler">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
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
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
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
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
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
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
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

        {/* Disclaimer */}
        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center italic">
              For education and planning only. Not legal or FMV advice.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

