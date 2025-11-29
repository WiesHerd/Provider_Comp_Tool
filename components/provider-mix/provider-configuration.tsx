'use client';

import { Provider, ProviderRole } from '@/types/provider-mix';
import { ConversionFactorModel } from '@/types/cf-models';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { NumberInput } from '@/components/ui/number-input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { CFModelSelector } from '@/components/physician-scenarios/cf-model-selector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Info } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';

interface ProviderConfigurationProps {
  providers: Provider[];
  defaultBasePay: number;
  defaultCfModel: ConversionFactorModel;
  onProvidersChange: (providers: Provider[]) => void;
}

const PROVIDER_ROLES: ProviderRole[] = ['Clinical', 'Lead', 'Academic', 'Part-time', 'Other'];

export function ProviderConfiguration({
  providers,
  defaultBasePay,
  defaultCfModel,
  onProvidersChange,
}: ProviderConfigurationProps) {
  const handleAddProvider = () => {
    const newProvider: Provider = {
      id: `provider-${Date.now()}`,
      name: '',
      role: 'Clinical',
      basePay: defaultBasePay,
      cfModel: JSON.parse(JSON.stringify(defaultCfModel)), // Deep copy
      clinicalFTE: 1.0,
      adminFTE: 0,
      callBurden: false,
      actualWrvus: undefined,
      notes: '',
    };
    onProvidersChange([...providers, newProvider]);
  };

  const handleDeleteProvider = (id: string) => {
    if (providers.length <= 1) {
      return; // Keep at least one provider
    }
    onProvidersChange(providers.filter((p) => p.id !== id));
  };

  const handleUpdateProvider = (id: string, updates: Partial<Provider>) => {
    onProvidersChange(
      providers.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...updates };
          
          // Validate FTE: clinical + admin ≤ 1.0
          if (updated.clinicalFTE + updated.adminFTE > 1.0) {
            // Adjust admin FTE to fit
            updated.adminFTE = Math.max(0, 1.0 - updated.clinicalFTE);
          }
          
          return updated;
        }
        return p;
      })
    );
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Provider Configuration
            </CardTitle>
            <Tooltip content="Configure individual providers with their clinical and administrative FTE. Clinical FTE is used for CF-based compensation calculations, while admin FTE is compensated separately." side="right">
              <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
            </Tooltip>
          </div>
          <Button variant="outline" size="sm" onClick={handleAddProvider} className="min-h-[36px] touch-manipulation">
            <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
            Add Provider
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Provider Name
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-1">
                    Role
                    <Tooltip content="Clinical: Full-time clinical provider. Lead: Leadership role with admin duties. Academic: Teaching/research role. Part-time: Less than full-time clinical. Other: Custom role type." side="top">
                      <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                    </Tooltip>
                  </div>
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <div className="flex items-center justify-end gap-1">
                    Base Pay
                    <Tooltip content="Individual base pay for this provider. Used to calculate clinical compensation based on clinical FTE." side="top">
                      <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                    </Tooltip>
                  </div>
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <div className="flex items-center justify-end gap-1">
                    Clinical FTE
                    <Tooltip content="Time spent on clinical activities (0-1.0). Used for CF-based compensation calculations. Clinical FTE + Admin FTE must be ≤ 1.0." side="top">
                      <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                    </Tooltip>
                  </div>
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <div className="flex items-center justify-end gap-1">
                    Admin FTE
                    <Tooltip content="Time spent on administrative/academic activities (0-1.0). Compensated separately from clinical work. Clinical FTE + Admin FTE must be ≤ 1.0." side="top">
                      <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                    </Tooltip>
                  </div>
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Call Burden
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <div className="flex items-center justify-end gap-1">
                    Actual wRVUs
                    <Tooltip content="Optional: Enter actual wRVUs for this provider. If not provided, the median wRVU from market benchmarks will be used for calculations." side="top">
                      <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                    </Tooltip>
                  </div>
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Call Pay
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Notes
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {providers.map((provider) => (
                <tr
                  key={provider.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="py-3 px-4">
                    <Input
                      value={provider.name}
                      onChange={(e) => handleUpdateProvider(provider.id, { name: e.target.value })}
                      placeholder="Provider name"
                      className="w-full min-w-[120px]"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <Select
                      value={provider.role}
                      onValueChange={(value: ProviderRole) =>
                        handleUpdateProvider(provider.id, { role: value })
                      }
                    >
                      <SelectTrigger className="w-full min-w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVIDER_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-3 px-4">
                    <CurrencyInput
                      value={provider.basePay}
                      onChange={(value) => handleUpdateProvider(provider.id, { basePay: value })}
                      min={0}
                      showDecimals={false}
                      className="w-full"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <NumberInput
                      value={provider.clinicalFTE}
                      onChange={(value) => handleUpdateProvider(provider.id, { clinicalFTE: value })}
                      min={0}
                      max={1}
                      step={0.1}
                      className="w-full"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <NumberInput
                      value={provider.adminFTE}
                      onChange={(value) => handleUpdateProvider(provider.id, { adminFTE: value })}
                      min={0}
                      max={1 - provider.clinicalFTE}
                      step={0.1}
                      className="w-full"
                    />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Switch
                      checked={provider.callBurden}
                      onCheckedChange={(checked: boolean) =>
                        handleUpdateProvider(provider.id, { callBurden: checked })
                      }
                    />
                  </td>
                  <td className="py-3 px-4">
                    <NumberInput
                      value={provider.actualWrvus || 0}
                      onChange={(value) =>
                        handleUpdateProvider(provider.id, { actualWrvus: value > 0 ? value : undefined })
                      }
                      min={0}
                      step={100}
                      className="w-full"
                      placeholder="Optional"
                    />
                  </td>
                  <td className="py-3 px-4">
                    {provider.callBurden ? (
                      <NumberInput
                        value={provider.callPay || 0}
                        onChange={(value) =>
                          handleUpdateProvider(provider.id, { callPay: value > 0 ? value : undefined })
                        }
                        min={0}
                        step={1000}
                        className="w-full"
                        placeholder="Enter call pay"
                      />
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Input
                      value={provider.notes || ''}
                      onChange={(e) => handleUpdateProvider(provider.id, { notes: e.target.value })}
                      placeholder="Notes"
                      className="w-full min-w-[150px]"
                    />
                  </td>
                  <td className="py-3 px-4 text-center">
                    {providers.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProvider(provider.id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {providers.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <p>No providers configured. Click &quot;Add Provider&quot; to get started.</p>
          </div>
        )}

        {/* CF Model Configuration for Each Provider */}
        {providers.length > 0 && (
          <div className="mt-6 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              CF Models (Individual per Provider)
            </h3>
            {providers.map((provider) => (
              <div
                key={`cf-${provider.id}`}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                    {provider.name || `Provider ${provider.id.slice(-4)}`}
                  </Label>
                  <Tooltip content="Each provider can have their own CF model. This allows you to compare different compensation structures across providers." side="right">
                    <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                  </Tooltip>
                </div>
                <CFModelSelector
                  model={provider.cfModel}
                  onModelChange={(model) => handleUpdateProvider(provider.id, { cfModel: model })}
                  fte={provider.clinicalFTE}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

