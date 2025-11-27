'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2 } from 'lucide-react';
import { CallPayContext, CallTier, CallPayImpact, CallPayBenchmarks } from '@/types/call-pay';
import { generateCompliancePDF } from '@/lib/utils/compliance-documentation';
import { ComplianceMetadata } from '@/types/call-pay';

interface ComplianceExportProps {
  context: CallPayContext;
  tiers: CallTier[];
  impact: CallPayImpact;
  benchmarks?: CallPayBenchmarks;
  complianceMetadata?: ComplianceMetadata;
}

export function ComplianceExport({
  context,
  tiers,
  impact,
  benchmarks,
  complianceMetadata,
}: ComplianceExportProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async () => {
    setIsGenerating(true);
    try {
      const pdfBytes = await generateCompliancePDF({
        context,
        tiers,
        impact,
        benchmarks,
        complianceMetadata,
      });

      // Create download link
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Call_Pay_Compliance_${context.specialty}_${context.modelYear}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating compliance PDF:', error);
      alert('Error generating compliance documentation. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isGenerating}
      variant="outline"
      className="w-full sm:w-auto min-h-[44px] touch-target"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <FileText className="w-4 h-4 mr-2" />
          Export Compliance PDF
        </>
      )}
    </Button>
  );
}



