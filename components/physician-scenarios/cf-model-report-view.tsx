'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { CFModelReportData } from '@/lib/utils/cf-model-report-generator';
import { getCFModelSummary } from '@/lib/utils/cf-model-engine';

interface CFModelReportViewProps {
  reportData: CFModelReportData;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercentile = (value: number) => {
  if (value >= 90) return '>90th';
  return `${Math.round(value)}th`;
};

export function CFModelReportView({ reportData }: CFModelReportViewProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="outline"
          className="w-full sm:w-auto"
        >
          Create Report
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in" />
        <Dialog.Content className="fixed top-0 left-0 right-0 bottom-0 sm:top-1/2 sm:left-1/2 sm:right-auto sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2 bg-white dark:bg-gray-900 sm:rounded-2xl p-4 sm:p-8 max-w-6xl sm:w-[calc(100vw-2rem)] sm:max-h-[85vh] overflow-y-auto z-[101] sm:shadow-2xl animate-in fade-in sm:zoom-in-95 duration-300">
          {/* Header */}
          <div className="flex items-start justify-between mb-6 sm:mb-8 pb-4 sm:pb-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex-1 pr-4">
              <Dialog.Title className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-1.5 sm:mb-2 tracking-tight">
                Model Comparison Report
              </Dialog.Title>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                {reportData.context.specialty || 'All Specialties'} • {reportData.models.length} {reportData.models.length === 1 ? 'model' : 'models'}
              </p>
            </div>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                className="h-9 w-9 p-0 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex-shrink-0 touch-target"
              >
                <X className="h-5 w-5" />
              </Button>
            </Dialog.Close>
          </div>

          {/* Context Info */}
          <div className="mb-6 sm:mb-8 pb-5 sm:pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              <div className="space-y-1">
                <div className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">wRVUs</div>
                <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white tabular-nums">
                  {reportData.context.wrvus.toLocaleString()}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">FTE</div>
                <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white tabular-nums">
                  {typeof reportData.context.fte === 'number' ? reportData.context.fte.toFixed(2) : reportData.context.fte}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fixed Comp</div>
                <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white tabular-nums">
                  {formatCurrency(reportData.context.fixedComp)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</div>
                <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white tabular-nums">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-4">
            {reportData.results.map((result) => {
              const model = reportData.models.find(m => m.id === result.id);
              
              return (
                <div
                  key={result.id}
                  className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20 transition-all"
                >
                  {/* Model Name */}
                  <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      {result.name}
                    </h3>
                  </div>

                  {/* Configuration */}
                  <div className="mb-4">
                    <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Configuration
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {model ? getCFModelSummary(model.model) : 'N/A'}
                    </div>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Total TCC
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white tabular-nums">
                        {formatCurrency(result.modeledTcc)}
                      </div>
                      {result.costDelta !== undefined && result.costDelta !== 0 && (
                        <div className={`text-xs mt-0.5 ${
                          result.costDelta > 0
                            ? 'text-gray-500 dark:text-gray-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {result.costDelta > 0 ? `+${formatCurrency(result.costDelta)}` : formatCurrency(result.costDelta)}
                        </div>
                      )}
                      {result.costDelta === 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Lowest
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Incentive Pay
                      </div>
                      <div className={`text-lg font-semibold tabular-nums ${
                        result.actualIncentivePay !== undefined && result.actualIncentivePay < 0
                          ? 'text-red-600 dark:text-red-400'
                          : result.actualIncentivePay !== undefined && result.actualIncentivePay > 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {result.actualIncentivePay !== undefined
                          ? `${result.actualIncentivePay >= 0 ? '+' : ''}${formatCurrency(result.actualIncentivePay)}`
                          : formatCurrency(result.productivityIncentives)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Effective CF
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white tabular-nums">
                        {formatCurrency(result.effectiveCF)}
                      </div>
                    </div>
                  </div>

                  {/* Percentiles */}
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                        wRVU %
                      </div>
                      <div className="text-base font-semibold text-gray-900 dark:text-white tabular-nums">
                        {formatPercentile(result.wrvuPercentile)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                        TCC %
                      </div>
                      <div className="text-base font-semibold text-gray-900 dark:text-white tabular-nums">
                        {formatPercentile(result.tccPercentile)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                        Difference
                      </div>
                      <div className={`text-base font-semibold tabular-nums ${
                        result.tccPercentile < result.wrvuPercentile
                          ? 'text-green-600 dark:text-green-400'
                          : result.tccPercentile > result.wrvuPercentile
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {result.alignmentDelta.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto -mx-8">
            <div className="inline-block min-w-full align-middle px-8">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                    <th className="text-left py-4 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Configuration
                    </th>
                    <th className="text-right py-4 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total TCC
                    </th>
                    <th className="text-right py-4 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Incentive Pay
                    </th>
                    <th className="text-right py-4 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Effective CF
                    </th>
                    <th className="text-right py-4 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      wRVU %
                    </th>
                    <th className="text-right py-4 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      TCC %
                    </th>
                    <th className="text-right py-4 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Difference
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {reportData.results.map((result) => {
                    const model = reportData.models.find(m => m.id === result.id);
                    
                    return (
                      <tr
                        key={result.id}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="py-5 px-4">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {result.name}
                          </div>
                        </td>
                        <td className="py-5 px-4">
                          <div className="text-sm text-gray-700 dark:text-gray-300 max-w-xs leading-relaxed">
                            {model ? getCFModelSummary(model.model) : 'N/A'}
                          </div>
                        </td>
                        <td className="py-5 px-4 text-right">
                          <div className="font-semibold text-gray-900 dark:text-white tabular-nums">
                            {formatCurrency(result.modeledTcc)}
                          </div>
                          {result.costDelta !== undefined && result.costDelta !== 0 && (
                            <div className={`text-xs mt-1 ${
                              result.costDelta > 0
                                ? 'text-gray-500 dark:text-gray-400'
                                : 'text-green-600 dark:text-green-400'
                            }`}>
                              {result.costDelta > 0 ? `+${formatCurrency(result.costDelta)}` : formatCurrency(result.costDelta)}
                            </div>
                          )}
                          {result.costDelta === 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Lowest
                            </div>
                          )}
                        </td>
                        <td className="py-5 px-4 text-right">
                          <div className={`font-semibold tabular-nums ${
                            result.actualIncentivePay !== undefined && result.actualIncentivePay < 0
                              ? 'text-red-600 dark:text-red-400'
                              : result.actualIncentivePay !== undefined && result.actualIncentivePay > 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {result.actualIncentivePay !== undefined
                              ? `${result.actualIncentivePay >= 0 ? '+' : ''}${formatCurrency(result.actualIncentivePay)}`
                              : formatCurrency(result.productivityIncentives)}
                          </div>
                        </td>
                        <td className="py-5 px-4 text-right">
                          <div className="font-semibold text-gray-900 dark:text-white tabular-nums">
                            {formatCurrency(result.effectiveCF)}
                          </div>
                        </td>
                        <td className="py-5 px-4 text-right">
                          <div className="font-semibold text-gray-900 dark:text-white tabular-nums">
                            {formatPercentile(result.wrvuPercentile)}
                          </div>
                        </td>
                        <td className="py-5 px-4 text-right">
                          <div className="font-semibold text-gray-900 dark:text-white tabular-nums">
                            {formatPercentile(result.tccPercentile)}
                          </div>
                        </td>
                        <td className="py-5 px-4 text-right">
                          <div className={`font-semibold tabular-nums ${
                            result.tccPercentile < result.wrvuPercentile
                              ? 'text-green-600 dark:text-green-400'
                              : result.tccPercentile > result.wrvuPercentile
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {result.alignmentDelta.toFixed(1)}%
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <Dialog.Close asChild>
              <Button variant="outline" className="w-full sm:w-auto touch-target">
                Close
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

