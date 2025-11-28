/**
 * CF Model Report Generator
 * Generate Excel reports for CF model comparisons
 */

import * as XLSX from 'xlsx';
import { ConversionFactorModel } from '@/types/cf-models';
import { MarketBenchmarks, FTE } from '@/types';
import { getCFModelSummary } from './cf-model-engine';

export interface CFModelReportData {
  models: Array<{
    id: string;
    name: string;
    model: ConversionFactorModel;
    specialty?: string;
    createdAt?: string;
  }>;
  results: Array<{
    id: string;
    name: string;
    effectiveCF: number;
    productivityIncentives: number;
    actualIncentivePay?: number;
    modeledTcc: number;
    wrvuPercentile: number;
    tccPercentile: number;
    cfPercentile: number | null;
    alignmentStatus: 'Aligned' | 'Mild Drift' | 'Risk Zone';
    alignmentDelta: number;
    fmvRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | null;
    costDelta?: number;
  }>;
  context: {
    wrvus: number;
    fte: FTE;
    fixedComp: number;
    specialty?: string;
    marketBenchmarks: MarketBenchmarks;
  };
  bestFMVModelId?: string;
  bestProductivityModelId?: string;
  bestCostEffectiveModelId?: string;
}

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

/**
 * Generate Excel report for CF model comparison
 */
export function generateCFModelExcelReport(data: CFModelReportData): void {
  const workbook = XLSX.utils.book_new();

  const bestFMV = data.results.find(r => r.id === data.bestFMVModelId);
  const bestProductivity = data.results.find(r => r.id === data.bestProductivityModelId);
  const bestCostEffective = data.results.find(r => r.id === data.bestCostEffectiveModelId);
  const minTcc = Math.min(...data.results.map(r => r.modeledTcc));
  const maxTcc = Math.max(...data.results.map(r => r.modeledTcc));
  const avgTcc = data.results.reduce((sum, r) => sum + r.modeledTcc, 0) / data.results.length;
  const tccVariance = maxTcc - minTcc;

  // Enhanced Executive Summary Sheet
  const summaryData = [
    ['CF Model Comparison Report'],
    [''],
    ['Report Generated', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
    [''],
    ['CONTEXT'],
    ['Specialty', data.context.specialty || 'N/A'],
    ['wRVUs', data.context.wrvus.toLocaleString('en-US', { maximumFractionDigits: 0 })],
    ['FTE', data.context.fte],
    ['Fixed Compensation', formatCurrency(data.context.fixedComp)],
    [''],
    ['MODEL COMPARISON SUMMARY'],
    ['Total Models Compared', data.models.length],
    [''],
    ['TCC Analysis'],
    ['Minimum TCC', formatCurrency(minTcc)],
    ['Maximum TCC', formatCurrency(maxTcc)],
    ['Average TCC', formatCurrency(avgTcc)],
    ['TCC Variance', formatCurrency(tccVariance)],
    [''],
    ['Effective CF Analysis'],
    ['Minimum Effective CF', formatCurrency(Math.min(...data.results.map(r => r.effectiveCF)))],
    ['Maximum Effective CF', formatCurrency(Math.max(...data.results.map(r => r.effectiveCF)))],
    ['Average Effective CF', formatCurrency(data.results.reduce((sum, r) => sum + r.effectiveCF, 0) / data.results.length)],
    [''],
    ['Alignment Status Distribution'],
    ['Aligned Models', data.results.filter(r => r.alignmentStatus === 'Aligned').length],
    ['Mild Drift Models', data.results.filter(r => r.alignmentStatus === 'Mild Drift').length],
    ['Risk Zone Models', data.results.filter(r => r.alignmentStatus === 'Risk Zone').length],
    [''],
    ['FMV Risk Distribution'],
    ['FMV Safe (Low Risk)', data.results.filter(r => r.fmvRiskLevel === 'LOW').length],
    ['FMV Risk Zone (Moderate)', data.results.filter(r => r.fmvRiskLevel === 'MODERATE').length],
    ['FMV High Risk', data.results.filter(r => r.fmvRiskLevel === 'HIGH').length],
    [''],
    ['KEY INSIGHTS'],
    ['Best FMV Model', bestFMV ? bestFMV.name : 'N/A'],
    ['Best FMV - Alignment Delta', bestFMV ? `${bestFMV.alignmentDelta.toFixed(1)}%` : 'N/A'],
    ['Best FMV - TCC', bestFMV ? formatCurrency(bestFMV.modeledTcc) : 'N/A'],
    ['Best FMV - FMV Risk', bestFMV ? bestFMV.fmvRiskLevel || 'N/A' : 'N/A'],
    [''],
    ['Best Productivity Model', bestProductivity ? bestProductivity.name : 'N/A'],
    ['Best Productivity - Effective CF', bestProductivity ? formatCurrency(bestProductivity.effectiveCF) : 'N/A'],
    ['Best Productivity - TCC', bestProductivity ? formatCurrency(bestProductivity.modeledTcc) : 'N/A'],
    ['Best Productivity - Alignment', bestProductivity ? bestProductivity.alignmentStatus : 'N/A'],
    [''],
    ['Best Cost-Effective Model', bestCostEffective ? bestCostEffective.name : 'N/A'],
    ['Best Cost-Effective - Total TCC', bestCostEffective ? formatCurrency(bestCostEffective.modeledTcc) : 'N/A'],
    ['Best Cost-Effective - Cost Savings', bestCostEffective && bestCostEffective.costDelta !== undefined && bestCostEffective.costDelta < 0 
      ? formatCurrency(Math.abs(bestCostEffective.costDelta))
      : bestCostEffective ? '$0' : 'N/A'],
    ['Best Cost-Effective - FMV Risk', bestCostEffective ? bestCostEffective.fmvRiskLevel || 'N/A' : 'N/A'],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Set column widths for summary sheet
  summarySheet['!cols'] = [
    { wch: 30 }, // Column A
    { wch: 25 }, // Column B
  ];
  
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');

  // Model Comparison Sheet
  const comparisonHeaders = [
    'Model Name',
    'CF Model Type',
    'Effective CF ($/wRVU)',
    'Productivity Incentives',
    'Total TCC',
    'Cost Delta',
    'wRVU Percentile',
    'TCC Percentile',
    'CF Percentile',
    'Alignment Status',
    'Alignment Delta (%)',
    'FMV Risk Level',
    'Best FMV',
    'Best Productivity',
    'Best Cost',
  ];

  const comparisonRows = data.results.map(result => {
    const model = data.models.find(m => m.id === result.id);
    return [
      result.name,
      model ? getCFModelSummary(model.model) : 'N/A',
      result.effectiveCF,
      result.productivityIncentives,
      result.modeledTcc,
      result.costDelta !== undefined ? result.costDelta : 'N/A',
      result.wrvuPercentile,
      result.tccPercentile,
      result.cfPercentile ?? 'N/A',
      result.alignmentStatus,
      result.alignmentDelta,
      result.fmvRiskLevel ?? 'N/A',
      result.id === data.bestFMVModelId ? 'Yes' : 'No',
      result.id === data.bestProductivityModelId ? 'Yes' : 'No',
      result.id === data.bestCostEffectiveModelId ? 'Yes' : 'No',
    ];
  });

  const comparisonData = [comparisonHeaders, ...comparisonRows];
  const comparisonSheet = XLSX.utils.aoa_to_sheet(comparisonData);
  
  // Set column widths
  comparisonSheet['!cols'] = [
    { wch: 20 }, // Model Name
    { wch: 25 }, // CF Model Type
    { wch: 18 }, // Effective CF
    { wch: 20 }, // Productivity Incentives
    { wch: 15 }, // Total TCC
    { wch: 15 }, // Cost Delta
    { wch: 15 }, // wRVU Percentile
    { wch: 15 }, // TCC Percentile
    { wch: 15 }, // CF Percentile
    { wch: 18 }, // Alignment Status
    { wch: 18 }, // Alignment Delta
    { wch: 15 }, // FMV Risk Level
    { wch: 12 }, // Best FMV
    { wch: 15 }, // Best Productivity
    { wch: 12 }, // Best Cost
  ];
  
  // Freeze first row
  comparisonSheet['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' };
  
  XLSX.utils.book_append_sheet(workbook, comparisonSheet, 'Model Comparison');

  // Detailed Model Data Sheet
  const detailedHeaders = [
    'Model Name',
    'Model ID',
    'Specialty',
    'Created Date',
    'Model Configuration',
    'wRVUs',
    'FTE',
    'Fixed Compensation',
    'Productivity Incentives',
    'Total TCC',
    'Cost Delta',
    'Effective CF',
    'wRVU Percentile',
    'TCC Percentile',
    'CF Percentile',
    'Alignment Status',
    'Alignment Delta',
    'FMV Risk Level',
  ];

  const detailedRows = data.results.map(result => {
    const model = data.models.find(m => m.id === result.id);
    return [
      result.name,
      result.id,
      model?.specialty || 'N/A',
      model?.createdAt ? new Date(model.createdAt).toLocaleDateString() : 'N/A',
      model ? getCFModelSummary(model.model) : 'N/A',
      data.context.wrvus,
      data.context.fte,
      data.context.fixedComp,
      result.productivityIncentives,
      result.modeledTcc,
      result.costDelta !== undefined ? result.costDelta : 'N/A',
      result.effectiveCF,
      result.wrvuPercentile,
      result.tccPercentile,
      result.cfPercentile ?? 'N/A',
      result.alignmentStatus,
      result.alignmentDelta,
      result.fmvRiskLevel ?? 'N/A',
    ];
  });

  const detailedData = [detailedHeaders, ...detailedRows];
  const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData);
  
  // Set column widths
  detailedSheet['!cols'] = [
    { wch: 20 }, // Model Name
    { wch: 36 }, // Model ID
    { wch: 15 }, // Specialty
    { wch: 12 }, // Created Date
    { wch: 25 }, // Model Configuration
    { wch: 12 }, // wRVUs
    { wch: 8 },  // FTE
    { wch: 18 }, // Fixed Compensation
    { wch: 20 }, // Productivity Incentives
    { wch: 15 }, // Total TCC
    { wch: 15 }, // Cost Delta
    { wch: 15 }, // Effective CF
    { wch: 15 }, // wRVU Percentile
    { wch: 15 }, // TCC Percentile
    { wch: 15 }, // CF Percentile
    { wch: 18 }, // Alignment Status
    { wch: 15 }, // Alignment Delta
    { wch: 15 }, // FMV Risk Level
  ];
  
  XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed Data');

  // Recommendations Sheet
  const recommendationsData = [
    ['RECOMMENDATIONS & ANALYSIS'],
    [''],
    ['Best for FMV Compliance'],
    [''],
    ['Model Name', bestFMV ? bestFMV.name : 'N/A'],
    ['Alignment Delta', bestFMV ? `${bestFMV.alignmentDelta.toFixed(1)}%` : 'N/A'],
    ['Effective CF', bestFMV ? formatCurrency(bestFMV.effectiveCF) : 'N/A'],
    ['Total TCC', bestFMV ? formatCurrency(bestFMV.modeledTcc) : 'N/A'],
    ['wRVU Percentile', bestFMV ? formatPercentile(bestFMV.wrvuPercentile) : 'N/A'],
    ['TCC Percentile', bestFMV ? formatPercentile(bestFMV.tccPercentile) : 'N/A'],
    ['FMV Risk Level', bestFMV ? bestFMV.fmvRiskLevel || 'N/A' : 'N/A'],
    [''],
    ['Analysis'],
    [bestFMV ? (
      bestFMV.fmvRiskLevel === 'LOW' 
        ? 'This model achieves the best alignment between wRVU and TCC percentiles while maintaining TCC within the safe range (≤75th percentile). No additional FMV documentation required.'
        : bestFMV.fmvRiskLevel === 'MODERATE'
        ? 'This model achieves the best alignment but TCC is in the risk zone (75-90th percentile). Thorough FMV documentation is required to justify compensation at this level.'
        : 'This model achieves the best alignment but TCC exceeds 90th percentile - HIGH FMV RISK. Consider alternative models or provide comprehensive FMV justification.'
    ) : 'No models available for comparison.'],
    [''],
    ['Best for Productivity Motivation'],
    [''],
    ['Model Name', bestProductivity ? bestProductivity.name : 'N/A'],
    ['Effective CF', bestProductivity ? formatCurrency(bestProductivity.effectiveCF) : 'N/A'],
    ['Total TCC', bestProductivity ? formatCurrency(bestProductivity.modeledTcc) : 'N/A'],
    ['Alignment Status', bestProductivity ? bestProductivity.alignmentStatus : 'N/A'],
    ['Alignment Delta', bestProductivity ? `${bestProductivity.alignmentDelta.toFixed(1)}%` : 'N/A'],
    ['FMV Risk Level', bestProductivity ? bestProductivity.fmvRiskLevel || 'N/A' : 'N/A'],
    [''],
    ['Analysis'],
    [bestProductivity ? (
      `This model offers the highest effective CF (${formatCurrency(bestProductivity.effectiveCF)}/wRVU) while maintaining FMV compliance. ` +
      `It provides strong incentives for physician productivity with ${formatCurrency(bestProductivity.productivityIncentives)} in productivity incentives. ` +
      `Alignment status: ${bestProductivity.alignmentStatus}.`
    ) : 'N/A'],
    [''],
    ['Best for Cost Effectiveness'],
    [''],
    ['Model Name', bestCostEffective ? bestCostEffective.name : 'N/A'],
    ['Total TCC', bestCostEffective ? formatCurrency(bestCostEffective.modeledTcc) : 'N/A'],
    ['Cost Savings vs Baseline', bestCostEffective && bestCostEffective.costDelta !== undefined && bestCostEffective.costDelta < 0 
      ? formatCurrency(Math.abs(bestCostEffective.costDelta))
      : bestCostEffective ? '$0' : 'N/A'],
    ['Effective CF', bestCostEffective ? formatCurrency(bestCostEffective.effectiveCF) : 'N/A'],
    ['FMV Risk Level', bestCostEffective ? bestCostEffective.fmvRiskLevel || 'N/A' : 'N/A'],
    ['Alignment Status', bestCostEffective ? bestCostEffective.alignmentStatus : 'N/A'],
    [''],
    ['Analysis'],
    [bestCostEffective ? (
      bestCostEffective.fmvRiskLevel === 'LOW'
        ? `This model provides the lowest total cost (${formatCurrency(bestCostEffective.modeledTcc)}) while maintaining TCC within the safe range (≤75th percentile). ` +
          `No additional FMV documentation required. Ideal for CFO/VP approval and budget management.` +
          (bestCostEffective.costDelta !== undefined && bestCostEffective.costDelta < 0
            ? ` Cost savings: ${formatCurrency(Math.abs(bestCostEffective.costDelta))} vs baseline.`
            : '')
        : bestCostEffective.fmvRiskLevel === 'MODERATE'
        ? `This model provides the lowest total cost (${formatCurrency(bestCostEffective.modeledTcc)}) but TCC is in the risk zone (75-90th percentile). ` +
          `Thorough FMV documentation is required to justify compensation at this level.` +
          (bestCostEffective.costDelta !== undefined && bestCostEffective.costDelta < 0
            ? ` Cost savings: ${formatCurrency(Math.abs(bestCostEffective.costDelta))} vs baseline.`
            : '')
        : `This model provides the lowest total cost (${formatCurrency(bestCostEffective.modeledTcc)}) but TCC exceeds 90th percentile - HIGH FMV RISK. ` +
          `Consider alternative models or provide comprehensive FMV justification.`
    ) : 'N/A'],
    [''],
    ['Trade-off Analysis'],
    [''],
    ['Cost Variance Across Models', formatCurrency(tccVariance)],
    ['Average TCC', formatCurrency(avgTcc)],
    [''],
    ['Key Considerations'],
    ['1. FMV Compliance: Models with TCC ≤75th percentile require minimal documentation'],
    ['2. Productivity Incentives: Higher effective CF rates provide stronger motivation'],
    ['3. Cost Management: Lower TCC models reduce budget impact while maintaining FMV compliance'],
    ['4. Alignment: Models with alignment delta <10% are considered optimal'],
    ['5. Risk Management: Consider FMV risk level when selecting final model'],
    [''],
    ['Action Items'],
    ['1. Review recommended models above (FMV, Productivity, Cost-Effectiveness)'],
    ['2. Consider organizational priorities (FMV compliance vs productivity motivation vs cost)'],
    ['3. For CFO/VP approval: Prioritize cost-effective models with TCC ≤75th percentile'],
    ['4. Document FMV justification if selecting model with TCC >75th percentile'],
    ['5. Validate model assumptions with clinical leadership'],
    ['6. Implement selected model and monitor alignment over time'],
  ];

  const recommendationsSheet = XLSX.utils.aoa_to_sheet(recommendationsData);
  recommendationsSheet['!cols'] = [
    { wch: 30 }, // Column A
    { wch: 40 }, // Column B
  ];
  XLSX.utils.book_append_sheet(workbook, recommendationsSheet, 'Recommendations');

  // Market Benchmarks Sheet
  if (data.context.marketBenchmarks) {
    const benchmarks = data.context.marketBenchmarks;
    const benchmarkData = [
      ['Market Benchmarks'],
      [''],
      ['wRVU Percentiles'],
      ['25th Percentile', benchmarks.wrvu25 ?? 'N/A'],
      ['50th Percentile', benchmarks.wrvu50 ?? 'N/A'],
      ['75th Percentile', benchmarks.wrvu75 ?? 'N/A'],
      ['90th Percentile', benchmarks.wrvu90 ?? 'N/A'],
      [''],
      ['TCC Percentiles'],
      ['25th Percentile', benchmarks.tcc25 ?? 'N/A'],
      ['50th Percentile', benchmarks.tcc50 ?? 'N/A'],
      ['75th Percentile', benchmarks.tcc75 ?? 'N/A'],
      ['90th Percentile', benchmarks.tcc90 ?? 'N/A'],
      [''],
      ['CF Percentiles'],
      ['25th Percentile', benchmarks.cf25 ?? 'N/A'],
      ['50th Percentile', benchmarks.cf50 ?? 'N/A'],
      ['75th Percentile', benchmarks.cf75 ?? 'N/A'],
      ['90th Percentile', benchmarks.cf90 ?? 'N/A'],
    ];

    const benchmarkSheet = XLSX.utils.aoa_to_sheet(benchmarkData);
    benchmarkSheet['!cols'] = [
      { wch: 20 }, // Column A
      { wch: 20 }, // Column B
    ];
    XLSX.utils.book_append_sheet(workbook, benchmarkSheet, 'Market Benchmarks');
  }

  // Generate file
  const specialty = data.context.specialty || 'All';
  const fileName = `CF_Model_Comparison_${specialty}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

