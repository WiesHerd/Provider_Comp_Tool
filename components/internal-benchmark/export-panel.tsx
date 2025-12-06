'use client';

import { useState } from 'react';
import { ProviderRecord } from '@/types/internal-benchmark';
import { InternalPercentiles } from '@/types/internal-benchmark';
import { BlendedBenchmarks } from '@/types/internal-benchmark';
import { CFRecommendation } from '@/types/internal-benchmark';
import { MarketBenchmarks } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSpreadsheet, Download, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExportPanelProps {
  records: ProviderRecord[];
  internalPercentiles: InternalPercentiles | null;
  surveyBenchmarks: MarketBenchmarks | null;
  blendedBenchmarks: BlendedBenchmarks | null;
  recommendation: CFRecommendation | null;
  specialty: string;
  modelYear: number;
}

export function ExportPanel({
  records,
  internalPercentiles,
  surveyBenchmarks,
  blendedBenchmarks,
  recommendation,
  specialty,
  modelYear,
}: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleCSVExport = () => {
    if (records.length === 0) {
      alert('No data to export. Please upload provider data first.');
      return;
    }

    setIsExporting(true);
    try {
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Provider Records
      const providerHeaders = ['Provider Name', 'Clinical FTE', 'Annual wRVUs', 'Total Cash Compensation', 'Notes'];
      const providerRows = records.map((r) => [
        r.name,
        r.fte,
        r.wrvus,
        r.tcc,
        r.notes || '',
      ]);
      const providerData = [providerHeaders, ...providerRows];
      const providerSheet = XLSX.utils.aoa_to_sheet(providerData);
      XLSX.utils.book_append_sheet(workbook, providerSheet, 'Provider Data');

      // Sheet 2: Percentile Comparison
      if (internalPercentiles && surveyBenchmarks) {
        const percentileHeaders = [
          'Percentile',
          'Internal wRVU',
          'Survey wRVU',
          'wRVU Difference',
          'Internal TCC',
          'Survey TCC',
          'TCC Difference',
        ];
        const percentileRows = [
          ['25th', internalPercentiles.wrvu25, surveyBenchmarks.wrvu25 || 0, 
           (internalPercentiles.wrvu25 - (surveyBenchmarks.wrvu25 || 0)),
           internalPercentiles.tcc25, surveyBenchmarks.tcc25 || 0,
           (internalPercentiles.tcc25 - (surveyBenchmarks.tcc25 || 0))],
          ['50th', internalPercentiles.wrvu50, surveyBenchmarks.wrvu50 || 0,
           (internalPercentiles.wrvu50 - (surveyBenchmarks.wrvu50 || 0)),
           internalPercentiles.tcc50, surveyBenchmarks.tcc50 || 0,
           (internalPercentiles.tcc50 - (surveyBenchmarks.tcc50 || 0))],
          ['75th', internalPercentiles.wrvu75, surveyBenchmarks.wrvu75 || 0,
           (internalPercentiles.wrvu75 - (surveyBenchmarks.wrvu75 || 0)),
           internalPercentiles.tcc75, surveyBenchmarks.tcc75 || 0,
           (internalPercentiles.tcc75 - (surveyBenchmarks.tcc75 || 0))],
          ['90th', internalPercentiles.wrvu90, surveyBenchmarks.wrvu90 || 0,
           (internalPercentiles.wrvu90 - (surveyBenchmarks.wrvu90 || 0)),
           internalPercentiles.tcc90, surveyBenchmarks.tcc90 || 0,
           (internalPercentiles.tcc90 - (surveyBenchmarks.tcc90 || 0))],
        ];
        const percentileData = [percentileHeaders, ...percentileRows];
        const percentileSheet = XLSX.utils.aoa_to_sheet(percentileData);
        XLSX.utils.book_append_sheet(workbook, percentileSheet, 'Percentile Comparison');
      }

      // Sheet 3: Blended Benchmarks
      if (blendedBenchmarks) {
        const blendedHeaders = ['Percentile', 'Blended wRVU', 'Blended TCC', 'Mode', 'Internal Weight', 'Survey Weight'];
        const blendedRows = [
          ['25th', blendedBenchmarks.wrvu25, blendedBenchmarks.tcc25, blendedBenchmarks.mode,
           blendedBenchmarks.weights?.internalWeight || 0, blendedBenchmarks.weights?.surveyWeight || 0],
          ['50th', blendedBenchmarks.wrvu50, blendedBenchmarks.tcc50, blendedBenchmarks.mode,
           blendedBenchmarks.weights?.internalWeight || 0, blendedBenchmarks.weights?.surveyWeight || 0],
          ['75th', blendedBenchmarks.wrvu75, blendedBenchmarks.tcc75, blendedBenchmarks.mode,
           blendedBenchmarks.weights?.internalWeight || 0, blendedBenchmarks.weights?.surveyWeight || 0],
          ['90th', blendedBenchmarks.wrvu90, blendedBenchmarks.tcc90, blendedBenchmarks.mode,
           blendedBenchmarks.weights?.internalWeight || 0, blendedBenchmarks.weights?.surveyWeight || 0],
        ];
        const blendedData = [blendedHeaders, ...blendedRows];
        const blendedSheet = XLSX.utils.aoa_to_sheet(blendedData);
        XLSX.utils.book_append_sheet(workbook, blendedSheet, 'Blended Benchmarks');
      }

      // Sheet 4: CF Recommendation
      if (recommendation) {
        const recommendationHeaders = ['Field', 'Value'];
        const recommendationRows = [
          ['Model Year', recommendation.modelYear],
          ['Min CF', recommendation.minCF],
          ['Max CF', recommendation.maxCF],
          ['Median CF', recommendation.medianCF],
          ['Justification', recommendation.justification],
          ['Commentary', recommendation.commentary || ''],
        ];
        const recommendationData = [recommendationHeaders, ...recommendationRows];
        const recommendationSheet = XLSX.utils.aoa_to_sheet(recommendationData);
        XLSX.utils.book_append_sheet(workbook, recommendationSheet, 'CF Recommendation');
      }

      const fileName = `Internal_Benchmark_${specialty || 'Report'}_${modelYear}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Error exporting data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleTextExport = () => {
    if (!recommendation) {
      alert('No recommendation available to export. Please blend benchmarks first.');
      return;
    }

    setIsExporting(true);
    try {
      let text = `Internal Benchmark Engine Report\n`;
      text += `Specialty: ${specialty || 'Not specified'}\n`;
      text += `Model Year: ${modelYear}\n`;
      text += `Generated: ${new Date().toLocaleDateString()}\n\n`;

      text += `=== CF RECOMMENDATION ===\n\n`;
      text += `For FY${recommendation.modelYear} – Suggested CF Range: $${recommendation.minCF.toFixed(2)}–$${recommendation.maxCF.toFixed(2)}\n\n`;
      text += `${recommendation.justification}\n\n`;

      if (recommendation.commentary) {
        text += `=== ADDITIONAL COMMENTARY ===\n\n`;
        text += `${recommendation.commentary}\n\n`;
      }

      if (internalPercentiles && surveyBenchmarks) {
        text += `=== PERCENTILE COMPARISON ===\n\n`;
        text += `wRVU Percentiles:\n`;
        text += `  25th: Internal ${internalPercentiles.wrvu25.toFixed(0)} vs Survey ${(surveyBenchmarks.wrvu25 || 0).toFixed(0)}\n`;
        text += `  50th: Internal ${internalPercentiles.wrvu50.toFixed(0)} vs Survey ${(surveyBenchmarks.wrvu50 || 0).toFixed(0)}\n`;
        text += `  75th: Internal ${internalPercentiles.wrvu75.toFixed(0)} vs Survey ${(surveyBenchmarks.wrvu75 || 0).toFixed(0)}\n`;
        text += `  90th: Internal ${internalPercentiles.wrvu90.toFixed(0)} vs Survey ${(surveyBenchmarks.wrvu90 || 0).toFixed(0)}\n\n`;
        text += `TCC Percentiles:\n`;
        text += `  25th: Internal $${internalPercentiles.tcc25.toFixed(0)} vs Survey $${(surveyBenchmarks.tcc25 || 0).toFixed(0)}\n`;
        text += `  50th: Internal $${internalPercentiles.tcc50.toFixed(0)} vs Survey $${(surveyBenchmarks.tcc50 || 0).toFixed(0)}\n`;
        text += `  75th: Internal $${internalPercentiles.tcc75.toFixed(0)} vs Survey $${(surveyBenchmarks.tcc75 || 0).toFixed(0)}\n`;
        text += `  90th: Internal $${internalPercentiles.tcc90.toFixed(0)} vs Survey $${(surveyBenchmarks.tcc90 || 0).toFixed(0)}\n\n`;
      }

      if (blendedBenchmarks) {
        text += `=== BLENDED BENCHMARKS ===\n\n`;
        text += `Mode: ${blendedBenchmarks.mode}\n`;
        if (blendedBenchmarks.weights) {
          text += `Weights: ${(blendedBenchmarks.weights.internalWeight * 100).toFixed(0)}% Internal / ${(blendedBenchmarks.weights.surveyWeight * 100).toFixed(0)}% Survey\n`;
        }
        text += `\nBlended Percentiles:\n`;
        text += `  25th: wRVU ${blendedBenchmarks.wrvu25.toFixed(0)}, TCC $${blendedBenchmarks.tcc25.toFixed(0)}\n`;
        text += `  50th: wRVU ${blendedBenchmarks.wrvu50.toFixed(0)}, TCC $${blendedBenchmarks.tcc50.toFixed(0)}\n`;
        text += `  75th: wRVU ${blendedBenchmarks.wrvu75.toFixed(0)}, TCC $${blendedBenchmarks.tcc75.toFixed(0)}\n`;
        text += `  90th: wRVU ${blendedBenchmarks.wrvu90.toFixed(0)}, TCC $${blendedBenchmarks.tcc90.toFixed(0)}\n\n`;
      }

      text += `=== PROVIDER DATA ===\n\n`;
      text += `Total Providers: ${records.length}\n`;
      records.forEach((r, index) => {
        text += `${index + 1}. ${r.name} - FTE: ${r.fte}, wRVUs: ${r.wrvus.toFixed(0)}, TCC: $${r.tcc.toFixed(0)}${r.notes ? ` (${r.notes})` : ''}\n`;
      });

      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Internal_Benchmark_${specialty || 'Report'}_${modelYear}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting text:', error);
      alert('Error exporting text report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const hasData = records.length > 0 || internalPercentiles || blendedBenchmarks || recommendation;

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          Export Results
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Export executive justification packet for committee review, finance, legal, or physician education.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleCSVExport}
              disabled={isExporting || !hasData}
              variant="outline"
              className="flex-1"
            >
              {isExporting ? (
                <>
                  <Download className="w-4 h-4 mr-2 animate-pulse" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export Excel
                </>
              )}
            </Button>
            <Button
              onClick={handleTextExport}
              disabled={isExporting || !recommendation}
              variant="outline"
              className="flex-1"
            >
              {isExporting ? (
                <>
                  <Download className="w-4 h-4 mr-2 animate-pulse" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Export Text Report
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Excel export includes all data sheets. Text export includes executive summary and recommendations.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}









