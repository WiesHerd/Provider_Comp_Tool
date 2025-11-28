'use client';

import { Provider, NonClinicalCompensation } from '@/types/provider-mix';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';
import { NumberInput } from '@/components/ui/number-input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { calculateNonClinicalCompensation } from '@/lib/utils/provider-mix';

interface NonClinicalCompensationProps {
  providers: Provider[];
  basePay: number;
  onProvidersChange: (providers: Provider[]) => void;
}

export function NonClinicalCompensationInput({
  providers,
  basePay,
  onProvidersChange,
}: NonClinicalCompensationProps) {
  const handleUpdateNonClinicalComp = (
    providerId: string,
    updates: Partial<NonClinicalCompensation>
  ) => {
    onProvidersChange(
      providers.map((p) => {
        if (p.id === providerId) {
          const existing = p.nonClinicalCompensation || {
            providerId: p.id,
            calculationMethod: 'manual' as const,
          };
          return {
            ...p,
            nonClinicalCompensation: { ...existing, ...updates },
          };
        }
        return p;
      })
    );
  };

  const getCalculatedAmount = (provider: Provider): number => {
    return calculateNonClinicalCompensation(provider, basePay);
  };

  if (providers.length === 0) {
    return (
      <Card className="border-2">
        <CardContent className="p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Configure providers above to set non-clinical compensation.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          Non-Clinical Compensation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {providers.map((provider) => {
            const config = provider.nonClinicalCompensation || {
              providerId: provider.id,
              calculationMethod: 'manual' as const,
            };
            const calculatedAmount = getCalculatedAmount(provider);

            return (
              <div
                key={provider.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {provider.name || `Provider ${provider.id.slice(-4)}`}
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Calculated: ${calculatedAmount.toLocaleString('en-US', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Calculation Method</Label>
                    <Select
                      value={config.calculationMethod}
                      onValueChange={(value: NonClinicalCompensation['calculationMethod']) =>
                        handleUpdateNonClinicalComp(provider.id, { calculationMethod: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual Input</SelectItem>
                        <SelectItem value="formula-admin-fte">Admin FTE × Base Salary</SelectItem>
                        <SelectItem value="formula-stipend">Fixed Stipend</SelectItem>
                        <SelectItem value="role-based">Role-Based Stipend</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {config.calculationMethod === 'manual' && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Non-Clinical Compensation</Label>
                      <CurrencyInput
                        value={config.manualAmount || 0}
                        onChange={(value) =>
                          handleUpdateNonClinicalComp(provider.id, { manualAmount: value })
                        }
                        min={0}
                        showDecimals={true}
                      />
                    </div>
                  )}

                  {config.calculationMethod === 'formula-admin-fte' && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Formula: Admin FTE ({provider.adminFTE}) × Base Salary (${basePay.toLocaleString()}) = ${calculatedAmount.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {config.calculationMethod === 'formula-stipend' && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Stipend Amount</Label>
                      <CurrencyInput
                        value={config.stipendAmount || 0}
                        onChange={(value) =>
                          handleUpdateNonClinicalComp(provider.id, { stipendAmount: value })
                        }
                        min={0}
                        showDecimals={true}
                      />
                    </div>
                  )}

                  {config.calculationMethod === 'role-based' && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Role-Based Stipend</Label>
                      <CurrencyInput
                        value={config.roleStipendAmount || 0}
                        onChange={(value) =>
                          handleUpdateNonClinicalComp(provider.id, { roleStipendAmount: value })
                        }
                        min={0}
                        showDecimals={true}
                      />
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Role: {provider.role}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}


