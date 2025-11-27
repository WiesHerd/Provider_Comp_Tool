'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, FileText } from 'lucide-react';
import { useCallPayScenariosStore } from '@/lib/store/call-pay-scenarios-store';
import { mapScenarioToReportData, mapScenariosToComparisonReportData } from '@/lib/utils/report-mapper';
import { exportReportToPDF, exportComparisonReportToPDF, generateScenarioReportFilename, generateComparisonReportFilename } from '@/lib/utils/report-export';
import { ExecutiveReport } from './executive-report';
import { ExecutiveReportComparison } from './executive-report-comparison';
import { ScenarioReportData, ScenarioComparisonReportData } from '@/types/report';
import { createRoot } from 'react-dom/client';

interface ExecutiveReportExportProps {
  activeScenarioId?: string | null;
  comparisonMode?: boolean;
  selectedScenarioIds?: string[];
  className?: string;
}

export function ExecutiveReportExport({
  activeScenarioId,
  comparisonMode = false,
  selectedScenarioIds,
  className,
}: ExecutiveReportExportProps) {
  const { getScenario, scenarios } = useCallPayScenariosStore();
  const [isExporting, setIsExporting] = useState(false);
  const reportContainerRef = useRef<HTMLDivElement>(null);

  const handleExportSingle = async () => {
    if (!activeScenarioId) {
      alert('Please select a scenario to export.');
      return;
    }

    const scenario = getScenario(activeScenarioId);
    if (!scenario) {
      alert('Scenario not found.');
      return;
    }

    setIsExporting(true);
    try {
      const reportData = mapScenarioToReportData(scenario);
      const filename = generateScenarioReportFilename(reportData);

      // Create a temporary container for rendering
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      document.body.appendChild(container);

      // Render the report component
      render(<ExecutiveReport data={reportData} />, container);

      // Wait for render to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Export to PDF
      await exportReportToPDF(container, filename);

      // Cleanup
      render(null, container);
      document.body.removeChild(container);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportComparison = async () => {
    const scenariosToCompare = selectedScenarioIds 
      ? selectedScenarioIds.map(id => getScenario(id)).filter(Boolean)
      : scenarios.slice(0, 5); // Default to first 5 if none selected

    if (scenariosToCompare.length < 2) {
      alert('Please select at least 2 scenarios to compare.');
      return;
    }

    setIsExporting(true);
    try {
      const comparisonData = mapScenariosToComparisonReportData(scenariosToCompare);
      const filename = generateComparisonReportFilename(comparisonData);

      // Create a temporary container for rendering
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      document.body.appendChild(container);

      // Render the comparison report component
      render(<ExecutiveReportComparison data={comparisonData} />, container);

      // Wait for render to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Export to PDF
      await exportComparisonReportToPDF(container, filename);

      // Cleanup
      render(null, container);
      document.body.removeChild(container);
    } catch (error) {
      console.error('Error exporting comparison report:', error);
      alert('Failed to export comparison report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (comparisonMode) {
    return (
      <Button
        onClick={handleExportComparison}
        disabled={isExporting}
        variant="outline"
        className={className}
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Export Comparison Report (PDF)
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleExportSingle}
      disabled={isExporting || !activeScenarioId}
      variant="outline"
      className={className}
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <FileText className="w-4 h-4 mr-2" />
          Export Executive Report (PDF)
        </>
      )}
    </Button>
  );
}

