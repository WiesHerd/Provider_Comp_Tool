/**
 * Compliance Documentation Generator
 * Creates structured compliance documentation for Stark Law and Anti-Kickback compliance
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  CallPayContext,
  CallTier,
  CallPayImpact,
  CallPayBenchmarks,
  FMVOverride,
  AuditLogEntry,
  ComplianceMetadata,
} from '@/types/call-pay';

export interface ComplianceDocumentData {
  context: CallPayContext;
  tiers: CallTier[];
  impact: CallPayImpact;
  benchmarks?: CallPayBenchmarks;
  complianceMetadata?: ComplianceMetadata;
}

/**
 * Generate PDF compliance documentation
 */
export async function generateCompliancePDF(data: ComplianceDocumentData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // US Letter size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let yPosition = 750;
  const margin = 50;
  const lineHeight = 14;
  const sectionSpacing = 20;

  // Helper function to add text
  const addText = (text: string, x: number, y: number, size: number = 10, isBold: boolean = false) => {
    page.drawText(text, {
      x,
      y,
      size,
      font: isBold ? boldFont : font,
      color: rgb(0, 0, 0),
    });
  };

  // Helper function to add wrapped text
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, size: number = 10) => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    
    for (const word of words) {
      const testLine = line + word + ' ';
      const width = font.widthOfTextAtSize(testLine, size);
      
      if (width > maxWidth && line.length > 0) {
        addText(line, x, currentY, size);
        line = word + ' ';
        currentY -= lineHeight;
      } else {
        line = testLine;
      }
    }
    addText(line, x, currentY, size);
    return currentY;
  };

  // Title
  addText('CALL PAY COMPENSATION COMPLIANCE DOCUMENTATION', margin, yPosition, 16, true);
  yPosition -= 30;

  // Executive Summary Section
  addText('EXECUTIVE SUMMARY', margin, yPosition, 12, true);
  yPosition -= lineHeight * 2;
  
  addText(`Specialty: ${data.context.specialty}`, margin, yPosition);
  yPosition -= lineHeight;
  addText(`Service Line: ${data.context.serviceLine}`, margin, yPosition);
  yPosition -= lineHeight;
  addText(`Model Year: ${data.context.modelYear}`, margin, yPosition);
  yPosition -= lineHeight;
  addText(`Providers on Call: ${data.context.providersOnCall}`, margin, yPosition);
  yPosition -= lineHeight;
  addText(`Rotation Ratio: 1-in-${data.context.rotationRatio}`, margin, yPosition);
  yPosition -= lineHeight * 2;
  
  addText(`Total Annual Call Budget: $${data.impact.totalAnnualCallSpend.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`, margin, yPosition, 11, true);
  yPosition -= lineHeight;
  addText(`Average Call Pay per Provider: $${data.impact.averageCallPayPerProvider.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`, margin, yPosition);
  yPosition -= sectionSpacing;

  // Fair Market Value Analysis
  addText('FAIR MARKET VALUE ANALYSIS', margin, yPosition, 12, true);
  yPosition -= lineHeight * 2;

  if (data.benchmarks) {
    const enabledTiers = data.tiers.filter(t => t.enabled);
    for (const tier of enabledTiers) {
      addText(`Tier ${tier.name} - ${tier.coverageType}`, margin, yPosition, 11, true);
      yPosition -= lineHeight;

      // Weekday rate analysis
      if (tier.rates.weekday > 0 && data.benchmarks.weekday) {
        const percentile = calculatePercentile(tier.rates.weekday, data.benchmarks.weekday);
        addText(`  Weekday Rate: $${tier.rates.weekday.toLocaleString()} (${percentile}th percentile)`, margin, yPosition);
        yPosition -= lineHeight;
      }

      // Weekend rate analysis
      if (tier.rates.weekend > 0 && data.benchmarks.weekend) {
        const percentile = calculatePercentile(tier.rates.weekend, data.benchmarks.weekend);
        addText(`  Weekend Rate: $${tier.rates.weekend.toLocaleString()} (${percentile}th percentile)`, margin, yPosition);
        yPosition -= lineHeight;
      }

      // Holiday rate analysis
      if (tier.rates.holiday > 0 && data.benchmarks.holiday) {
        const percentile = calculatePercentile(tier.rates.holiday, data.benchmarks.holiday);
        addText(`  Holiday Rate: $${tier.rates.holiday.toLocaleString()} (${percentile}th percentile)`, margin, yPosition);
        yPosition -= lineHeight;
      }

      yPosition -= lineHeight;
    }
  }

  yPosition -= sectionSpacing;

  // FMV Overrides Section
  if (data.complianceMetadata?.fmvOverrides && data.complianceMetadata.fmvOverrides.length > 0) {
    addText('FMV OVERRIDES AND JUSTIFICATIONS', margin, yPosition, 12, true);
    yPosition -= lineHeight * 2;

    for (const override of data.complianceMetadata.fmvOverrides) {
      addText(`Tier ${override.tierId} - ${override.rateType}`, margin, yPosition, 11, true);
      yPosition -= lineHeight;
      addText(`  Rate: $${override.rate.toLocaleString()}`, margin, yPosition);
      yPosition -= lineHeight;
      addText(`  Benchmark: $${override.benchmarkValue.toLocaleString()} (${override.benchmarkPercentile}th percentile)`, margin, yPosition);
      yPosition -= lineHeight;
      addText(`  Justification:`, margin, yPosition);
      yPosition -= lineHeight;
      yPosition = addWrappedText(override.justification, margin + 20, yPosition, 500) - lineHeight;
      if (override.approvedBy) {
        addText(`  Approved by: ${override.approvedBy} on ${override.approvedDate || 'N/A'}`, margin, yPosition);
        yPosition -= lineHeight;
      }
      yPosition -= lineHeight;
    }

    yPosition -= sectionSpacing;
  }

  // Commercial Reasonableness Statement
  addText('COMMERCIAL REASONABLENESS STATEMENT', margin, yPosition, 12, true);
  yPosition -= lineHeight * 2;

  const reasonablenessStatement = data.complianceMetadata?.commercialReasonablenessStatement || 
    `The call pay compensation structure for ${data.context.specialty} has been determined to be commercially reasonable based on:
    
1. Market benchmark data from recognized survey sources
2. Comparable compensation arrangements in similar geographic markets
3. The nature and scope of call coverage responsibilities
4. The frequency and intensity of call duties
5. The specialty-specific market rates for on-call coverage

This compensation arrangement is necessary to ensure adequate call coverage for patient care needs and is consistent with fair market value.`;

  yPosition = addWrappedText(reasonablenessStatement, margin, yPosition, 500) - sectionSpacing;

  // Benchmark Data Source
  if (data.complianceMetadata?.benchmarkDataSource) {
    addText('BENCHMARK DATA SOURCE', margin, yPosition, 12, true);
    yPosition -= lineHeight * 2;
    addText(`Source: ${data.complianceMetadata.benchmarkDataSource}`, margin, yPosition);
    yPosition -= lineHeight;
    if (data.complianceMetadata.benchmarkSurveyYear) {
      addText(`Survey Year: ${data.complianceMetadata.benchmarkSurveyYear}`, margin, yPosition);
      yPosition -= lineHeight;
    }
    yPosition -= sectionSpacing;
  }

  // Audit Trail
  if (data.complianceMetadata?.auditLog && data.complianceMetadata.auditLog.length > 0) {
    addText('AUDIT TRAIL', margin, yPosition, 12, true);
    yPosition -= lineHeight * 2;

    // Show last 10 entries
    const recentEntries = data.complianceMetadata.auditLog.slice(-10).reverse();
    for (const entry of recentEntries) {
      const date = new Date(entry.timestamp).toLocaleDateString();
      addText(`${date}: ${entry.description}`, margin, yPosition, 9);
      yPosition -= lineHeight;
      if (yPosition < 100) {
        // New page if needed
        const newPage = pdfDoc.addPage([612, 792]);
        yPosition = 750;
      }
    }
  }

  // Compliance Review Dates
  if (data.complianceMetadata?.lastComplianceReview || data.complianceMetadata?.nextComplianceReview) {
    yPosition -= sectionSpacing;
    addText('COMPLIANCE REVIEW DATES', margin, yPosition, 12, true);
    yPosition -= lineHeight * 2;
    
    if (data.complianceMetadata.lastComplianceReview) {
      addText(`Last Review: ${data.complianceMetadata.lastComplianceReview}`, margin, yPosition);
      yPosition -= lineHeight;
      if (data.complianceMetadata.reviewedBy) {
        addText(`Reviewed By: ${data.complianceMetadata.reviewedBy}`, margin, yPosition);
        yPosition -= lineHeight;
      }
    }
    
    if (data.complianceMetadata.nextComplianceReview) {
      addText(`Next Review Due: ${data.complianceMetadata.nextComplianceReview}`, margin, yPosition);
      yPosition -= lineHeight;
    }
  }

  // Footer
  const footerY = 30;
  addText(`Generated: ${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}`, margin, footerY, 9);
  addText('CompLens™ Provider Compensation Intelligence', 400, footerY, 9);

  return pdfDoc.save();
}

/**
 * Calculate percentile for a rate
 */
function calculatePercentile(rate: number, benchmarks: { p25?: number; p50?: number; p75?: number; p90?: number }): number {
  if (!benchmarks.p25 || !benchmarks.p50 || !benchmarks.p75 || !benchmarks.p90) {
    return 50; // Default if benchmarks incomplete
  }

  if (rate <= benchmarks.p25) return 25;
  if (rate <= benchmarks.p50) return 50;
  if (rate <= benchmarks.p75) return 75;
  if (rate <= benchmarks.p90) return 90;
  return 95; // Above 90th percentile
}

/**
 * Create audit log entry
 */
export function createAuditLogEntry(
  action: AuditLogEntry['action'],
  description: string,
  previousValue?: any,
  newValue?: any,
  metadata?: Record<string, any>
): AuditLogEntry {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    action,
    description,
    previousValue,
    newValue,
    metadata,
  };
}

/**
 * Detect FMV overrides (rates exceeding 90th percentile)
 */
export function detectFMVOverrides(
  tiers: CallTier[],
  benchmarks?: CallPayBenchmarks
): FMVOverride[] {
  if (!benchmarks) return [];

  const overrides: FMVOverride[] = [];

  for (const tier of tiers.filter(t => t.enabled)) {
    // Check weekday rate
    if (tier.rates.weekday > 0 && benchmarks.weekday?.p90 && tier.rates.weekday > benchmarks.weekday.p90) {
      overrides.push({
        tierId: tier.id,
        rateType: 'weekday',
        rate: tier.rates.weekday,
        benchmarkPercentile: 90,
        benchmarkValue: benchmarks.weekday.p90,
        justification: '',
      });
    }

    // Check weekend rate
    if (tier.rates.weekend > 0 && benchmarks.weekend?.p90 && tier.rates.weekend > benchmarks.weekend.p90) {
      overrides.push({
        tierId: tier.id,
        rateType: 'weekend',
        rate: tier.rates.weekend,
        benchmarkPercentile: 90,
        benchmarkValue: benchmarks.weekend.p90,
        justification: '',
      });
    }

    // Check holiday rate
    if (tier.rates.holiday > 0 && benchmarks.holiday?.p90 && tier.rates.holiday > benchmarks.holiday.p90) {
      overrides.push({
        tierId: tier.id,
        rateType: 'holiday',
        rate: tier.rates.holiday,
        benchmarkPercentile: 90,
        benchmarkValue: benchmarks.holiday.p90,
        justification: '',
      });
    }
  }

  return overrides;
}



