'use client';

import { Provider, ProviderRole } from '@/types/provider-mix';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { NumberInput } from '@/components/ui/number-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

interface ProviderConfigurationProps {
  providers: Provider[];
  onProvidersChange: (providers: Provider[]) => void;
}

const PROVIDER_ROLES: ProviderRole[] = ['Core PCP', 'Lead', 'Academic', 'Part-time', 'Other'];

export function ProviderConfiguration({
  providers,
  onProvidersChange,
}: ProviderConfigurationProps) {
  const handleAddProvider = () => {
    const newProvider: Provider = {
      id: `provider-${Date.now()}`,
      name: '',
      role: 'Core PCP',
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
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Provider Configuration
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleAddProvider}>
            <Plus className="w-4 h-4 mr-2" />
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
                  Role
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Clinical FTE
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Admin FTE
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Call Burden
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Actual wRVUs
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
      </CardContent>
    </Card>
  );
}

