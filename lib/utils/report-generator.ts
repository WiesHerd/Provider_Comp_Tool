/**
 * Report Generator Utilities
 * Generate various export formats (Excel, CSV, etc.)
 */

import * as XLSX from 'xlsx';
import {
  CallPayContext,
  CallTier,
  CallPayImpact,
} from '@/types/call-pay';

export interface ReportData {
  context: CallPayContext;
  tiers: CallTier[];
  impact: CallPayImpact;
}

/**
 * Generate Excel export
 */
export function generateExcelReport(data: ReportData): void {
  const workbook = XLSX.utils.book_new();

  // Executive Summary Sheet
  const summaryData = [
    ['Call Pay Modeler Report'],
    [''],
    ['Executive Summary'],
    ['Specialty', data.context.specialty],
    ['Service Line', data.context.serviceLine],
    ['Model Year', data.context.modelYear],
    ['Providers on Call', data.context.providersOnCall],
    ['Rotation Ratio', `1-in-${data.context.rotationRatio}`],
    [''],
    ['Total Annual Call Budget', data.impact.totalAnnualCallSpend],
    ['Average Call Pay per Provider', data.impact.averageCallPayPerProvider],
    ['Call Pay per 1.0 FTE', data.impact.callPayPer1FTE],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Tier Details Sheet
  const tierHeaders = [
    'Tier',
    'Coverage Type',
    'Payment Method',
    'Weekday Rate',
    'Weekend Rate',
    'Holiday Rate',
    'Annual Pay per Provider',
    'Annual Budget for Group',
    'Effective $/24h',
    'Effective $/call',
  ];

  const tierRows = data.impact.tiers.map(tierImpact => {
    const tier = data.tiers.find(t => t.id === tierImpact.tierId);
    return [
      tierImpact.tierName,
      tier?.coverageType || '',
      tier?.paymentMethod || '',
      tier?.rates.weekday || 0,
      tier?.rates.weekend || 0,
      tier?.rates.holiday || 0,
      tierImpact.annualPayPerProvider,
      tierImpact.annualPayForGroup,
      tierImpact.effectiveDollarsPer24h,
      tierImpact.effectiveDollarsPerCall,
    ];
  });

  const tierData = [tierHeaders, ...tierRows];
  const tierSheet = XLSX.utils.aoa_to_sheet(tierData);
  XLSX.utils.book_append_sheet(workbook, tierSheet, 'Tier Details');

  // Burden Assumptions Sheet
  const burdenHeaders = [
    'Tier',
    'Weekday Calls/Month',
    'Weekend Calls/Month',
    'Holidays/Year',
    'Avg Callbacks/24h',
    'Avg Cases/24h',
  ];

  const burdenRows = data.tiers
    .filter(t => t.enabled)
    .map(tier => [
      tier.name,
      tier.burden.weekdayCallsPerMonth,
      tier.burden.weekendCallsPerMonth,
      tier.burden.holidaysPerYear,
      tier.burden.avgCallbacksPer24h,
      tier.burden.avgCasesPer24h || 0,
    ]);

  const burdenData = [burdenHeaders, ...burdenRows];
  const burdenSheet = XLSX.utils.aoa_to_sheet(burdenData);
  XLSX.utils.book_append_sheet(workbook, burdenSheet, 'Burden Assumptions');

  // Generate file
  const fileName = `Call_Pay_Report_${data.context.specialty}_${data.context.modelYear}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Generate CSV export
 */
export function generateCSVReport(data: ReportData): void {
  const headers = [
    'Tier',
    'Coverage Type',
    'Payment Method',
    'Weekday Rate',
    'Weekend Rate',
    'Holiday Rate',
    'Annual Pay per Provider',
    'Annual Budget for Group',
    'Effective $/24h',
    'Effective $/call',
  ];

  const rows = data.impact.tiers.map(tierImpact => {
    const tier = data.tiers.find(t => t.id === tierImpact.tierId);
    return [
      tierImpact.tierName,
      tier?.coverageType || '',
      tier?.paymentMethod || '',
      tier?.rates.weekday || 0,
      tier?.rates.weekend || 0,
      tier?.rates.holiday || 0,
      tierImpact.annualPayPerProvider,
      tierImpact.annualPayForGroup,
      tierImpact.effectiveDollarsPer24h,
      tierImpact.effectiveDollarsPerCall,
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Call_Pay_Report_${data.context.specialty}_${data.context.modelYear}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate executive summary text
 */
export function generateExecutiveSummary(data: ReportData): string {
  return `
CALL PAY MODELER - EXECUTIVE SUMMARY

Specialty: ${data.context.specialty}
Service Line: ${data.context.serviceLine}
Model Year: ${data.context.modelYear}
Providers on Call: ${data.context.providersOnCall}
Rotation Ratio: 1-in-${data.context.rotationRatio}

TOTAL ANNUAL CALL BUDGET: $${data.impact.totalAnnualCallSpend.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}

Average Call Pay per Provider: $${data.impact.averageCallPayPerProvider.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}

Call Pay per 1.0 FTE: $${data.impact.callPayPer1FTE.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}

TIER BREAKDOWN:
${data.impact.tiers.map(tier => `
  ${tier.tierName}:
    Annual Pay per Provider: $${tier.annualPayPerProvider.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}
    Annual Budget for Group: $${tier.annualPayForGroup.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}
`).join('')}

Generated: ${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}
  `.trim();
}





