/**
 * Report Export Utilities
 * 
 * Functions to export executive reports to PDF
 */

import { ScenarioReportData, ScenarioComparisonReportData } from '@/types/report';

/**
 * Export a single scenario report to PDF
 */
export async function exportReportToPDF(
  element: HTMLElement,
  filename: string
): Promise<void> {
  // Dynamic import for client-side only library
  const html2pdf = (await import('html2pdf.js')).default;
  
  const opt = {
    margin: [0.5, 0.5, 0.5, 0.5] as [number, number, number, number],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      logging: false,
    },
    jsPDF: { 
      unit: 'in', 
      format: 'letter', 
      orientation: 'portrait',
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  };

  try {
    await html2pdf().set(opt as any).from(element).save();
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Failed to export PDF. Please try again.');
  }
}

/**
 * Export a comparison report to PDF
 */
export async function exportComparisonReportToPDF(
  element: HTMLElement,
  filename: string
): Promise<void> {
  // Same options as single report
  return exportReportToPDF(element, filename);
}

/**
 * Generate filename for single scenario report
 */
export function generateScenarioReportFilename(data: ScenarioReportData): string {
  const scenarioName = data.scenario.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const date = new Date().toISOString().split('T')[0];
  return `Call_Pay_Report_${scenarioName}_${date}.pdf`;
}

/**
 * Generate filename for comparison report
 */
export function generateComparisonReportFilename(data: ScenarioComparisonReportData): string {
  const date = new Date().toISOString().split('T')[0];
  return `Call_Pay_Comparison_${data.scenarios.length}_Scenarios_${date}.pdf`;
}

