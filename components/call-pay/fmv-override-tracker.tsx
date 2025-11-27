'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { FMVOverride, CallTier, CallPayBenchmarks } from '@/types/call-pay';
import { detectFMVOverrides } from '@/lib/utils/compliance-documentation';
import { Tooltip } from '@/components/ui/tooltip';

interface FMVOverrideTrackerProps {
  tiers: CallTier[];
  benchmarks?: CallPayBenchmarks;
  overrides: FMVOverride[];
  onOverridesChange: (overrides: FMVOverride[]) => void;
}

export function FMVOverrideTracker({
  tiers,
  benchmarks,
  overrides,
  onOverridesChange,
}: FMVOverrideTrackerProps) {
  const [detectedOverrides, setDetectedOverrides] = useState<FMVOverride[]>([]);
  const [editingOverride, setEditingOverride] = useState<string | null>(null);
  const [justification, setJustification] = useState('');
  const [approvedBy, setApprovedBy] = useState('');

  // Detect new overrides when tiers or benchmarks change
  useEffect(() => {
    const newOverrides = detectFMVOverrides(tiers, benchmarks);
    setDetectedOverrides(newOverrides);

    // Merge with existing overrides (keep justifications and approvals)
    const merged = newOverrides.map(newOverride => {
      const existing = overrides.find(
        o => o.tierId === newOverride.tierId && o.rateType === newOverride.rateType
      );
      return existing || newOverride;
    });

    // Only update if there are changes
    if (JSON.stringify(merged) !== JSON.stringify(overrides)) {
      onOverridesChange(merged);
    }
  }, [tiers, benchmarks]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveJustification = (override: FMVOverride) => {
    const updated = overrides.map(o =>
      o.tierId === override.tierId && o.rateType === override.rateType
        ? {
            ...o,
            justification,
            approvedBy: approvedBy || undefined,
            approvedDate: approvedBy ? new Date().toISOString() : undefined,
          }
        : o
    );
    onOverridesChange(updated);
    setEditingOverride(null);
    setJustification('');
    setApprovedBy('');
  };

  const getTierName = (tierId: string) => {
    return tiers.find(t => t.id === tierId)?.name || tierId;
  };

  const getRateValue = (tierId: string, rateType: 'weekday' | 'weekend' | 'holiday') => {
    const tier = tiers.find(t => t.id === tierId);
    if (!tier) return 0;
    return tier.rates[rateType];
  };

  if (detectedOverrides.length === 0) {
    return (
      <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">All rates are within FMV benchmarks (≤90th percentile)</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            FMV Override Tracking
          </CardTitle>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {detectedOverrides.length} rate{detectedOverrides.length > 1 ? 's' : ''} exceed{detectedOverrides.length === 1 ? 's' : ''} the 90th percentile benchmark. Justification required for compliance.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {detectedOverrides.map((override, index) => {
          const existingOverride = overrides.find(
            o => o.tierId === override.tierId && o.rateType === override.rateType
          );
          const hasJustification = existingOverride?.justification && existingOverride.justification.length > 0;
          const isApproved = !!existingOverride?.approvedBy;
          const isEditing = editingOverride === `${override.tierId}-${override.rateType}`;

          return (
            <div
              key={`${override.tierId}-${override.rateType}`}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {getTierName(override.tierId)} - {override.rateType.charAt(0).toUpperCase() + override.rateType.slice(1)} Rate
                    </span>
                    {isApproved ? (
                      <Tooltip content={`Approved by ${existingOverride.approvedBy} on ${existingOverride.approvedDate ? new Date(existingOverride.approvedDate).toLocaleDateString() : 'N/A'}`}>
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </Tooltip>
                    ) : hasJustification ? (
                      <Tooltip content="Justification provided but not yet approved">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </Tooltip>
                    ) : (
                      <Tooltip content="Justification required">
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </Tooltip>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Current Rate:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                        ${getRateValue(override.tierId, override.rateType).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">90th Percentile Benchmark:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                        ${override.benchmarkValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600 dark:text-gray-400">Exceeds by:</span>
                      <span className="ml-2 font-semibold text-red-600 dark:text-red-400">
                        ${(getRateValue(override.tierId, override.rateType) - override.benchmarkValue).toLocaleString()} (
                        {(((getRateValue(override.tierId, override.rateType) - override.benchmarkValue) / override.benchmarkValue) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {hasJustification && !isEditing && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Justification:</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {existingOverride.justification}
                  </div>
                  {isApproved && existingOverride.approvedBy && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                      Approved by {existingOverride.approvedBy}
                      {existingOverride.approvedDate && ` on ${new Date(existingOverride.approvedDate).toLocaleDateString()}`}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingOverride(`${override.tierId}-${override.rateType}`);
                      setJustification(existingOverride.justification || '');
                      setApprovedBy(existingOverride.approvedBy || '');
                    }}
                    className="mt-2"
                  >
                    Edit Justification
                  </Button>
                </div>
              )}

              {isEditing && (
                <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Justification *</Label>
                    <Textarea
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      placeholder="Explain why this rate exceeds the 90th percentile benchmark. Include factors such as market conditions, specialty demand, geographic location, trauma center status, or other relevant considerations."
                      rows={4}
                      className="resize-none"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Required for Stark Law and Anti-Kickback compliance
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Approved By (Optional)</Label>
                    <Input
                      value={approvedBy}
                      onChange={(e) => setApprovedBy(e.target.value)}
                      placeholder="Name of approver"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSaveJustification(override)}
                      disabled={!justification.trim()}
                      size="sm"
                    >
                      Save Justification
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingOverride(null);
                        setJustification('');
                        setApprovedBy('');
                      }}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {!hasJustification && !isEditing && (
                <Button
                  variant="outline"
                  onClick={() => setEditingOverride(`${override.tierId}-${override.rateType}`)}
                  className="w-full"
                >
                  Add Justification
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}



