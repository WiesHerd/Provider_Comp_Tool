'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Download } from 'lucide-react';
import { generateCFModelExcelReport, CFModelReportData } from '@/lib/utils/cf-model-report-generator';
import { CFModelReportView } from './cf-model-report-view';

interface CFModelReportExportProps {
  reportData: CFModelReportData;
}

export function CFModelReportExport({ reportData }: CFModelReportExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    try {
      generateCFModelExcelReport(reportData);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Error exporting report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      <CFModelReportView reportData={reportData} />
      <Button
        onClick={handleExport}
        disabled={isExporting}
        className="w-full sm:w-auto min-h-[44px] touch-target"
        variant="outline"
      >
        {isExporting ? (
          <>
            <Download className="w-4 h-4 mr-2 animate-spin flex-shrink-0" />
            Exporting...
          </>
        ) : (
          <>
            <FileSpreadsheet className="w-4 h-4 mr-2 flex-shrink-0" />
            Excel
          </>
        )}
      </Button>
    </div>
  );
}

