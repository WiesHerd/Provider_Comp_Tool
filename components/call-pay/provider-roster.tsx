'use client';

import { CallProvider } from '@/types/call-pay-engine';
import { CallTier } from '@/types/call-pay';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface ProviderRosterProps {
  providers: CallProvider[];
  tiers: CallTier[];
  onProvidersChange: (providers: CallProvider[]) => void;
}

export function ProviderRoster({ providers, tiers, onProvidersChange }: ProviderRosterProps) {
  const enabledTiers = tiers.filter(t => t.enabled);
  const availableTiers = enabledTiers.length > 0 ? enabledTiers : tiers;

  const updateProvider = (id: string, updates: Partial<CallProvider>) => {
    const updated = providers.map(p => 
      p.id === id ? { ...p, ...updates } : p
    );
    onProvidersChange(updated);
  };

  const handleNameChange = (id: string, name: string) => {
    updateProvider(id, { name });
  };

  const handleFteChange = (id: string, fte: number) => {
    // Validate FTE: must be > 0 and <= 2.0
    const validatedFte = Math.max(0.1, Math.min(2.0, fte));
    updateProvider(id, { fte: validatedFte });
  };

  const handleTierChange = (id: string, tierId: string) => {
    updateProvider(id, { tierId });
  };

  const handleEligibleChange = (id: string, eligible: boolean) => {
    updateProvider(id, { eligibleForCall: eligible });
  };

  if (providers.length === 0) {
    return null;
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Provider Roster
          </CardTitle>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage individual provider details and call eligibility
        </p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                    Provider
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                    FTE
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                    Tier
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                    Eligible for Call
                  </th>
                </tr>
              </thead>
              <tbody>
                {providers.map((provider) => (
                  <tr
                    key={provider.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <Input
                        value={provider.name || ''}
                        onChange={(e) => handleNameChange(provider.id, e.target.value)}
                        placeholder="Provider name"
                        className="w-full min-w-[120px]"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <NumberInput
                        value={provider.fte}
                        onChange={(value) => handleFteChange(provider.id, value)}
                        min={0.1}
                        max={2.0}
                        step={0.1}
                        className="w-full min-w-[100px]"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Select
                        value={provider.tierId}
                        onValueChange={(value) => handleTierChange(provider.id, value)}
                      >
                        <SelectTrigger className="w-full min-w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTiers.map((tier) => (
                            <SelectItem key={tier.id} value={tier.id}>
                              {tier.name || tier.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <Switch
                          checked={provider.eligibleForCall}
                          onCheckedChange={(checked) => handleEligibleChange(provider.id, checked)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-4">
            {providers.map((provider) => (
              <Card key={provider.id} className="border border-gray-200 dark:border-gray-700">
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      Provider Name
                    </Label>
                    <Input
                      value={provider.name || ''}
                      onChange={(e) => handleNameChange(provider.id, e.target.value)}
                      placeholder="Provider name"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                        FTE
                      </Label>
                      <NumberInput
                        value={provider.fte}
                        onChange={(value) => handleFteChange(provider.id, value)}
                        min={0.1}
                        max={2.0}
                        step={0.1}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                        Tier
                      </Label>
                      <Select
                        value={provider.tierId}
                        onValueChange={(value) => handleTierChange(provider.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTiers.map((tier) => (
                            <SelectItem key={tier.id} value={tier.id}>
                              {tier.name || tier.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                      Eligible for Call
                    </Label>
                    <Switch
                      checked={provider.eligibleForCall}
                      onCheckedChange={(checked) => handleEligibleChange(provider.id, checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

