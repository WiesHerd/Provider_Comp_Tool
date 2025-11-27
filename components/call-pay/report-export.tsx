'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileSpreadsheet, FileText, File } from 'lucide-react';
import { CallPayContext, CallTier, CallPayImpact } from '@/types/call-pay';
import { generateExcelReport, generateCSVReport, generateExecutiveSummary } from '@/lib/utils/report-generator';
import { generateCompliancePDF } from '@/lib/utils/compliance-documentation';
import { ComplianceMetadata, CallPayBenchmarks } from '@/types/call-pay';

interface ReportExportProps {
  context: CallPayContext;
  tiers: CallTier[];
  impact: CallPayImpact;
  benchmarks?: CallPayBenchmarks;
  complianceMetadata?: ComplianceMetadata;
}

export function ReportExport({
  context,
  tiers,
  impact,
  benchmarks,
  complianceMetadata,
}: ReportExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv' | 'pdf' | 'summary'>('excel');

  const handleExport = async () => {
    setIsExporting(true);
    try {
      switch (exportFormat) {
        case 'excel':
          generateExcelReport({ context, tiers, impact });
          break;
        case 'csv':
          generateCSVReport({ context, tiers, impact });
          break;
        case 'pdf':
          const pdfBytes = await generateCompliancePDF({
            context,
            tiers,
            impact,
            benchmarks,
            complianceMetadata,
          });
          const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Call_Pay_Report_${context.specialty}_${context.modelYear}_${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          break;
        case 'summary':
          const summary = generateExecutiveSummary({ context, tiers, impact });
          const summaryBlob = new Blob([summary], { type: 'text/plain' });
          const summaryUrl = URL.createObjectURL(summaryBlob);
          const summaryLink = document.createElement('a');
          summaryLink.href = summaryUrl;
          summaryLink.download = `Call_Pay_Summary_${context.specialty}_${context.modelYear}_${new Date().toISOString().split('T')[0]}.txt`;
          document.body.appendChild(summaryLink);
          summaryLink.click();
          document.body.removeChild(summaryLink);
          URL.revokeObjectURL(summaryUrl);
          break;
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Error exporting report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getIcon = () => {
    switch (exportFormat) {
      case 'excel':
        return <FileSpreadsheet className="w-4 h-4 mr-2" />;
      case 'csv':
        return <FileSpreadsheet className="w-4 h-4 mr-2" />;
      case 'pdf':
        return <FileText className="w-4 h-4 mr-2" />;
      case 'summary':
        return <File className="w-4 h-4 mr-2" />;
    }
  };

  const getLabel = () => {
    switch (exportFormat) {
      case 'excel':
        return 'Export Excel';
      case 'csv':
        return 'Export CSV';
      case 'pdf':
        return 'Export PDF';
      case 'summary':
        return 'Export Summary';
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
        <SelectTrigger className="w-full sm:w-auto min-w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="excel">
            <div className="flex items-center">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </div>
          </SelectItem>
          <SelectItem value="csv">
            <div className="flex items-center">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              CSV
            </div>
          </SelectItem>
          <SelectItem value="pdf">
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </div>
          </SelectItem>
          <SelectItem value="summary">
            <div className="flex items-center">
              <File className="w-4 h-4 mr-2" />
              Text Summary
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      <Button
        onClick={handleExport}
        disabled={isExporting}
        variant="outline"
        className="w-full sm:w-auto min-h-[44px] touch-target"
      >
        {getIcon()}
        {isExporting ? 'Exporting...' : getLabel()}
      </Button>
    </div>
  );
}



