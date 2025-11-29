'use client';

import { useState } from 'react';
import { ProviderProfile } from '@/types/provider-mix';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, FileSpreadsheet } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { getCFModelSummary } from '@/lib/utils/cf-model-engine';

interface ProviderProfileExportProps {
  profiles: ProviderProfile[];
  specialty: string;
  modelYear: number;
}

export function ProviderProfileExport({
  profiles,
  specialty,
  modelYear,
}: ProviderProfileExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'text'>('csv');

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

  const generateProfileText = (profile: ProviderProfile): string => {
    const { provider, analysis } = profile;
    const cfSummary = getCFModelSummary(provider.cfModel);

    return `Provider Profile — ${provider.name}
${'='.repeat(50)}

Specialty: ${specialty}
Model Year: ${modelYear}
Clinical FTE: ${provider.clinicalFTE}
Admin FTE: ${provider.adminFTE}
Call Burden: ${provider.callBurden ? 'Yes' : 'No'}
Role: ${provider.role}

Compensation Breakdown:
- Base Pay (Clinical): ${formatCurrency(provider.basePay * provider.clinicalFTE)}
- Productivity Incentive: ${formatCurrency(analysis.clinicalIncentivePay)}
- Non-Clinical Compensation: ${formatCurrency(analysis.nonClinicalComp)}
${provider.callBurden && analysis.callPayAmount > 0 ? `- Call Pay: ${formatCurrency(analysis.callPayAmount)}` : ''}
- Total TCC: ${formatCurrency(analysis.totalTCC)}

CF Model: ${cfSummary}

Survey Comparison:
- wRVU Percentile: ${formatPercentile(analysis.wrvuPercentile)}
- TCC Percentile: ${formatPercentile(analysis.tccPercentile)}
- Alignment Status: ${analysis.alignmentStatus}

FMV Risk: ${profile.fmvRiskLevel}
${analysis.riskFactors && analysis.riskFactors.length > 0 ? `Risk Factors:\n${analysis.riskFactors.map(f => `- ${f}`).join('\n')}` : ''}

Recommendations:
${profile.recommendations.map(r => `- ${r}`).join('\n')}

${provider.notes ? `Notes: ${provider.notes}` : ''}
`;
  };

  const handleExportIndividual = (profile: ProviderProfile) => {
    setIsExporting(true);
    try {
      const text = generateProfileText(profile);
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Provider_Profile_${profile.provider.name.replace(/\s+/g, '_')}_${modelYear}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting profile:', error);
      alert('Error exporting profile. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportBatch = () => {
    if (profiles.length === 0) {
      alert('No profiles to export. Please configure providers and generate analysis first.');
      return;
    }

    setIsExporting(true);
    try {
      if (exportFormat === 'csv') {
        // CSV export
        const headers = [
          'Provider Name',
          'Role',
          'Clinical FTE',
          'Admin FTE',
          'Actual wRVUs',
          'Total TCC',
          'wRVU Percentile',
          'TCC Percentile',
          'Alignment Status',
          'FMV Risk Level',
          'Risk Factors',
        ];

        const rows = profiles.map((profile) => {
          const { provider, analysis } = profile;
          return [
            provider.name,
            provider.role,
            provider.clinicalFTE.toString(),
            provider.adminFTE.toString(),
            (provider.actualWrvus || 0).toString(),
            analysis.totalTCC.toString(),
            analysis.wrvuPercentile.toFixed(1),
            analysis.tccPercentile.toFixed(1),
            analysis.alignmentStatus,
            profile.fmvRiskLevel,
            analysis.riskFactors?.join('; ') || '',
          ];
        });

        const csvContent = [
          headers.join(','),
          ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Provider_Profiles_${specialty || 'Report'}_${modelYear}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Text export (all profiles in one file)
        const allProfiles = profiles.map(generateProfileText).join('\n\n' + '='.repeat(50) + '\n\n');
        const blob = new Blob([allProfiles], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Provider_Profiles_${specialty || 'Report'}_${modelYear}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting profiles:', error);
      alert('Error exporting profiles. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (profiles.length === 0) {
    return (
      <Card className="border-2">
        <CardContent className="p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Generate provider analysis above to export profiles.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          Export Provider Profiles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Export individual provider profiles or batch export all providers for FMV defense documentation.
          </p>

          {/* Batch Export */}
          <div className="space-y-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Batch Export All Providers</Label>
              <div className="flex items-center gap-3">
                <Select value={exportFormat} onValueChange={(value: 'csv' | 'text') => setExportFormat(value)}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleExportBatch}
                  disabled={isExporting}
                  variant="outline"
                  size="sm"
                >
                  {isExporting ? (
                    <>
                      <Download className="w-4 h-4 mr-2 animate-pulse flex-shrink-0" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4 mr-2 flex-shrink-0" />
                      Export All
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Individual Exports */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Export Individual Profiles</Label>
            <div className="space-y-2">
              {profiles.map((profile) => (
                <div
                  key={profile.provider.id}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <span className="text-sm text-gray-900 dark:text-white">
                    {profile.provider.name || `Provider ${profile.provider.id.slice(-4)}`}
                  </span>
                  <Button
                    onClick={() => handleExportIndividual(profile)}
                    disabled={isExporting}
                    variant="ghost"
                    size="sm"
                  >
                    <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                    Export
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


