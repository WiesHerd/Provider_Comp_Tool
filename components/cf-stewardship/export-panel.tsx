'use client';

import { useState } from 'react';
import { StewardshipComparison } from '@/types/cf-stewardship';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSpreadsheet, Download } from 'lucide-react';

interface ExportPanelProps {
  comparisons: StewardshipComparison[];
  specialty: string;
  modelYear: number;
}

export function ExportPanel({ comparisons, specialty, modelYear }: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleCSVExport = () => {
    if (comparisons.length === 0) {
      alert('No data to export. Please configure CF models and generate comparisons first.');
      return;
    }

    setIsExporting(true);
    try {
      const headers = [
        'Scenario',
        'wRVUs',
        'Current CF - Incentive Pay',
        'Current CF - Survey TCC',
        'Proposed CF - Incentive Pay',
        'Proposed CF - Survey TCC',
        'Percentile Match',
        'Alignment Status',
      ];

      const rows = comparisons.map((comp) => [
        comp.scenario.name,
        comp.scenario.wrvus.toString(),
        comp.currentIncentivePay.toString(),
        comp.currentSurveyTCC.toString(),
        comp.proposedIncentivePay.toString(),
        comp.proposedSurveyTCC.toString(),
        comp.percentileMatch.toFixed(1),
        comp.alignmentStatus,
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CF_Stewardship_${specialty || 'Report'}_${modelYear}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          Export Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Export the stewardship comparison table for committee review, finance, legal, or physician education.
          </p>
          <Button
            onClick={handleCSVExport}
            disabled={isExporting || comparisons.length === 0}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {isExporting ? (
              <>
                <Download className="w-4 h-4 mr-2 animate-pulse" />
                Exporting...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export CSV
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}



