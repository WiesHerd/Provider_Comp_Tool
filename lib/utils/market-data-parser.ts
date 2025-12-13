/**
 * Market Data Parser Utility
 * 
 * Parses CSV/Excel files containing market benchmark data.
 * Supports two formats:
 * 1. Wide format: One row per specialty with all metrics
 * 2. Long format: Multiple rows per specialty with MetricType column
 */

import * as XLSX from 'xlsx';
import { SavedMarketData } from './market-data-storage';
import { MarketBenchmarks } from '@/types';
import { logger } from './logger';

export interface ParsedMarketDataRow {
  specialty: string;
  geographicRegion?: string;
  tcc?: { p25?: number; p50?: number; p75?: number; p90?: number };
  wrvu?: { p25?: number; p50?: number; p75?: number; p90?: number };
  cf?: { p25?: number; p50?: number; p75?: number; p90?: number };
  rowNumber: number;
  errors?: string[];
}

export interface ParseResult {
  data: ParsedMarketDataRow[];
  errors: string[];
  format: 'wide' | 'long' | 'unknown';
  variableMapping?: Map<string, 'tcc' | 'wrvu' | 'cf' | null>; // For manual mapping
  uniqueVariables?: string[]; // Unique variable names found in file
}

export interface VariableMapping {
  [variableName: string]: 'tcc' | 'wrvu' | 'cf' | null;
}

/**
 * Extract unique variable names from a file (for manual mapping)
 */
export async function extractVariablesFromFile(file: File): Promise<{ variables: string[]; headers: string[] }> {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];

    if (jsonData.length < 2) {
      return { variables: [], headers: [] };
    }

    const headers = (jsonData[0] as string[]).map((h) => String(h).trim());
    const format = detectFormat(headers.map(h => h.toLowerCase()));

    if (format !== 'long') {
      return { variables: [], headers };
    }

    // Find variable/metricType column
    const metricTypeIndex = headers.findIndex((h) => h.toLowerCase().includes('metric') && h.toLowerCase().includes('type'));
    const variableIndex = headers.findIndex((h) => h.toLowerCase().includes('variable') && !h.toLowerCase().includes('type'));
    const metricColumnIndex = metricTypeIndex !== -1 ? metricTypeIndex : variableIndex;

    if (metricColumnIndex === -1) {
      return { variables: [], headers };
    }

    // Extract unique variables
    const variablesSet = new Set<string>();
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      const variable = String(row[metricColumnIndex] || '').trim();
      if (variable) {
        variablesSet.add(variable);
      }
    }

    return {
      variables: Array.from(variablesSet).sort(),
      headers,
    };
  } catch (error) {
    logger.error('Error extracting variables:', error);
    return { variables: [], headers: [] };
  }
}

/**
 * Parse a market data file (CSV or Excel)
 * Optionally accepts a custom variable mapping for manual assignment
 */
export async function parseMarketDataFile(
  file: File,
  variableMapping?: VariableMapping
): Promise<ParseResult> {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];

    if (jsonData.length < 2) {
      return {
        data: [],
        errors: ['File must have at least a header row and one data row.'],
        format: 'unknown',
      };
    }

    // Detect format
    const headers = (jsonData[0] as string[]).map((h) => String(h).toLowerCase().trim());
    const format = detectFormat(headers);

    if (format === 'unknown') {
      return {
        data: [],
        errors: [
          'Unable to detect file format. Expected either:\n' +
          '1. Wide format: Specialty, TCC_25, TCC_50, TCC_75, TCC_90, wRVU_25, wRVU_50, wRVU_75, wRVU_90, CF_25, CF_50, CF_75, CF_90\n' +
          '2. Long format: Specialty, MetricType (or Variable), P25, P50, P75, P90\n' +
          '   Supported variables: "Total Compensation", "Work RVUs", "Compensation to Work RVUs Ratio"',
        ],
        format: 'unknown',
      };
    }

    if (format === 'wide') {
      return parseWideFormat(jsonData, headers);
    } else {
      return parseLongFormat(jsonData, headers, variableMapping);
    }
  } catch (error) {
    logger.error('Error parsing market data file:', error);
    return {
      data: [],
      errors: [`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`],
      format: 'unknown',
    };
  }
}

/**
 * Detect file format based on headers
 */
function detectFormat(headers: string[]): 'wide' | 'long' | 'unknown' {
  // Check for wide format indicators
  const hasSpecialty = headers.some((h) => h.includes('specialty'));
  const hasTccColumns = headers.some((h) => h.includes('tcc') && (h.includes('25') || h.includes('50')));
  const hasWrvuColumns = headers.some((h) => (h.includes('wrvu') || h.includes('rvu')) && (h.includes('25') || h.includes('50')));
  const hasCfColumns = headers.some((h) => h.includes('cf') && (h.includes('25') || h.includes('50')));

  // Check for long format indicators
  const hasMetricType = headers.some((h) => h.includes('metric') && h.includes('type'));
  const hasVariable = headers.some((h) => h.includes('variable') && !h.includes('type'));
  const hasPercentileColumns = headers.some((h) => h.includes('p25') || h.includes('25'));

  if (hasSpecialty && (hasTccColumns || hasWrvuColumns || hasCfColumns)) {
    return 'wide';
  }

  if (hasSpecialty && (hasMetricType || hasVariable) && hasPercentileColumns) {
    return 'long';
  }

  return 'unknown';
}

/**
 * Parse wide format: One row per specialty with all metrics
 */
function parseWideFormat(jsonData: any[][], headers: string[]): ParseResult {
  const errors: string[] = [];
  const parsedRows: ParsedMarketDataRow[] = [];

  // Find column indices
  const specialtyIndex = headers.findIndex((h) => h.includes('specialty'));
  if (specialtyIndex === -1) {
    return {
      data: [],
      errors: ['Required column "Specialty" not found.'],
      format: 'wide',
    };
  }

  // Find geographic region column (optional)
  const geographicRegionIndex = headers.findIndex((h) => 
    h.includes('geographic') || h.includes('region') || h.includes('geo')
  );

  // Find metric columns
  const findColumn = (pattern: string): number => {
    return headers.findIndex((h) => h.toLowerCase().includes(pattern.toLowerCase()));
  };

  const tcc25Index = findColumn('tcc_25') !== -1 ? findColumn('tcc_25') : findColumn('tcc25');
  const tcc50Index = findColumn('tcc_50') !== -1 ? findColumn('tcc_50') : findColumn('tcc50');
  const tcc75Index = findColumn('tcc_75') !== -1 ? findColumn('tcc_75') : findColumn('tcc75');
  const tcc90Index = findColumn('tcc_90') !== -1 ? findColumn('tcc_90') : findColumn('tcc90');

  const wrvu25Index = findColumn('wrvu_25') !== -1 ? findColumn('wrvu_25') : findColumn('wrvu25') !== -1 ? findColumn('wrvu25') : findColumn('rvu_25');
  const wrvu50Index = findColumn('wrvu_50') !== -1 ? findColumn('wrvu_50') : findColumn('wrvu50') !== -1 ? findColumn('wrvu50') : findColumn('rvu_50');
  const wrvu75Index = findColumn('wrvu_75') !== -1 ? findColumn('wrvu_75') : findColumn('wrvu75') !== -1 ? findColumn('wrvu75') : findColumn('rvu_75');
  const wrvu90Index = findColumn('wrvu_90') !== -1 ? findColumn('wrvu_90') : findColumn('wrvu90') !== -1 ? findColumn('wrvu90') : findColumn('rvu_90');

  const cf25Index = findColumn('cf_25') !== -1 ? findColumn('cf_25') : findColumn('cf25');
  const cf50Index = findColumn('cf_50') !== -1 ? findColumn('cf_50') : findColumn('cf50');
  const cf75Index = findColumn('cf_75') !== -1 ? findColumn('cf_75') : findColumn('cf75');
  const cf90Index = findColumn('cf_90') !== -1 ? findColumn('cf_90') : findColumn('cf90');

  // Parse data rows
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    const rowErrors: string[] = [];

    // Get specialty
    const specialty = String(row[specialtyIndex] || '').trim();
    if (!specialty) {
      rowErrors.push('Missing specialty name');
      if (row.some((cell) => cell !== '' && cell !== null && cell !== undefined)) {
        errors.push(`Row ${i + 1}: Missing specialty name`);
      }
      continue;
    }

    // Get geographic region (optional)
    const geographicRegion = geographicRegionIndex !== -1 
      ? String(row[geographicRegionIndex] || '').trim() || undefined
      : undefined;

    const parsedRow: ParsedMarketDataRow = {
      specialty,
      geographicRegion,
      rowNumber: i + 1,
    };

    // Parse TCC
    const tcc25 = parseNumber(row[tcc25Index]);
    const tcc50 = parseNumber(row[tcc50Index]);
    const tcc75 = parseNumber(row[tcc75Index]);
    const tcc90 = parseNumber(row[tcc90Index]);

    if (tcc25 !== null || tcc50 !== null || tcc75 !== null || tcc90 !== null) {
      parsedRow.tcc = {};
      if (tcc25 !== null) parsedRow.tcc.p25 = tcc25;
      if (tcc50 !== null) parsedRow.tcc.p50 = tcc50;
      if (tcc75 !== null) parsedRow.tcc.p75 = tcc75;
      if (tcc90 !== null) parsedRow.tcc.p90 = tcc90;

      // Validate percentile order
      const tccValues = [tcc25, tcc50, tcc75, tcc90].filter((v) => v !== null) as number[];
      if (tccValues.length > 1 && !isAscending(tccValues)) {
        rowErrors.push('TCC percentiles should be in ascending order (25th < 50th < 75th < 90th)');
      }
    }

    // Parse wRVU
    const wrvu25 = parseNumber(row[wrvu25Index]);
    const wrvu50 = parseNumber(row[wrvu50Index]);
    const wrvu75 = parseNumber(row[wrvu75Index]);
    const wrvu90 = parseNumber(row[wrvu90Index]);

    if (wrvu25 !== null || wrvu50 !== null || wrvu75 !== null || wrvu90 !== null) {
      parsedRow.wrvu = {};
      if (wrvu25 !== null) parsedRow.wrvu.p25 = wrvu25;
      if (wrvu50 !== null) parsedRow.wrvu.p50 = wrvu50;
      if (wrvu75 !== null) parsedRow.wrvu.p75 = wrvu75;
      if (wrvu90 !== null) parsedRow.wrvu.p90 = wrvu90;

      const wrvuValues = [wrvu25, wrvu50, wrvu75, wrvu90].filter((v) => v !== null) as number[];
      if (wrvuValues.length > 1 && !isAscending(wrvuValues)) {
        rowErrors.push('wRVU percentiles should be in ascending order (25th < 50th < 75th < 90th)');
      }
    }

    // Parse CF
    const cf25 = parseNumber(row[cf25Index]);
    const cf50 = parseNumber(row[cf50Index]);
    const cf75 = parseNumber(row[cf75Index]);
    const cf90 = parseNumber(row[cf90Index]);

    if (cf25 !== null || cf50 !== null || cf75 !== null || cf90 !== null) {
      parsedRow.cf = {};
      if (cf25 !== null) parsedRow.cf.p25 = cf25;
      if (cf50 !== null) parsedRow.cf.p50 = cf50;
      if (cf75 !== null) parsedRow.cf.p75 = cf75;
      if (cf90 !== null) parsedRow.cf.p90 = cf90;

      const cfValues = [cf25, cf50, cf75, cf90].filter((v) => v !== null) as number[];
      if (cfValues.length > 1 && !isAscending(cfValues)) {
        rowErrors.push('CF percentiles should be in ascending order (25th < 50th < 75th < 90th)');
      }
    }

    // Check if at least one metric type has data
    if (!parsedRow.tcc && !parsedRow.wrvu && !parsedRow.cf) {
      rowErrors.push('No market data found for this specialty');
    }

    if (rowErrors.length > 0) {
      parsedRow.errors = rowErrors;
      errors.push(`Row ${i + 1} (${specialty}): ${rowErrors.join('; ')}`);
    }

    parsedRows.push(parsedRow);
  }

  return {
    data: parsedRows,
    errors,
    format: 'wide',
  };
}

/**
 * Parse long format: Multiple rows per specialty with MetricType column
 * Optionally accepts a custom variable mapping for manual assignment
 */
function parseLongFormat(
  jsonData: any[][], 
  headers: string[],
  variableMapping?: VariableMapping
): ParseResult {
  const errors: string[] = [];
  const parsedRowsMap = new Map<string, ParsedMarketDataRow>();

  // Find column indices
  const specialtyIndex = headers.findIndex((h) => h.includes('specialty'));
  const metricTypeIndex = headers.findIndex((h) => h.includes('metric') && h.includes('type'));
  const variableIndex = headers.findIndex((h) => h.includes('variable') && !h.includes('type'));
  const metricColumnIndex = metricTypeIndex !== -1 ? metricTypeIndex : variableIndex;
  const geographicRegionIndex = headers.findIndex((h) => 
    h.includes('geographic') || h.includes('region') || h.includes('geo')
  );
  const p25Index = headers.findIndex((h) => h.includes('p25') || (h.includes('25') && !h.includes('50') && !h.includes('75') && !h.includes('90')));
  const p50Index = headers.findIndex((h) => h.includes('p50') || (h.includes('50') && !h.includes('25') && !h.includes('75') && !h.includes('90')));
  const p75Index = headers.findIndex((h) => h.includes('p75') || (h.includes('75') && !h.includes('25') && !h.includes('50') && !h.includes('90')));
  const p90Index = headers.findIndex((h) => h.includes('p90') || (h.includes('90') && !h.includes('25') && !h.includes('50') && !h.includes('75')));

  if (specialtyIndex === -1 || metricColumnIndex === -1) {
    return {
      data: [],
      errors: ['Required columns "Specialty" and "MetricType" (or "Variable") not found.'],
      format: 'long',
    };
  }

  // Parse data rows
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    const rowErrors: string[] = [];

    const specialty = String(row[specialtyIndex] || '').trim();
    if (!specialty) {
      if (row.some((cell) => cell !== '' && cell !== null && cell !== undefined)) {
        errors.push(`Row ${i + 1}: Missing specialty name`);
      }
      continue;
    }

    // Get geographic region (optional) - should be consistent across all rows for same specialty
    const geographicRegion = geographicRegionIndex !== -1 
      ? String(row[geographicRegionIndex] || '').trim() || undefined
      : undefined;

    const metricTypeStr = String(row[metricColumnIndex] || '').trim();
    const metricTypeStrLower = metricTypeStr.toLowerCase();
    let metricType: 'tcc' | 'wrvu' | 'cf' | null = null;

    // Use custom mapping if provided, otherwise use automatic detection
    if (variableMapping && metricTypeStr in variableMapping) {
      metricType = variableMapping[metricTypeStr];
      if (metricType === null) {
        // Explicitly skipped
        continue;
      }
    } else {
      // Automatic mapping (fallback)
      // Check CF first (most specific patterns) to avoid false matches with wRVU
      if (
        metricTypeStrLower.includes('cf') || 
        metricTypeStrLower.includes('conversion') ||
        metricTypeStrLower.includes('compensation to work rvu') ||
        metricTypeStrLower.includes('compensation to rvu') ||
        (metricTypeStrLower.includes('ratio') && metricTypeStrLower.includes('rvu')) ||
        (metricTypeStrLower.includes('ratio') && metricTypeStrLower.includes('compensation'))
      ) {
        metricType = 'cf';
      } else if (
        metricTypeStrLower.includes('tcc') || 
        metricTypeStrLower.includes('total cash') || 
        metricTypeStrLower.includes('total compensation') ||
        metricTypeStrLower === 'compensation' ||
        (metricTypeStrLower.includes('base compensation') && !metricTypeStrLower.includes('total'))
      ) {
        metricType = 'tcc';
      } else if (
        metricTypeStrLower.includes('wrvu') || 
        metricTypeStrLower.includes('work rvu') ||
        (metricTypeStrLower.includes('rvu') && !metricTypeStrLower.includes('ratio'))
      ) {
        metricType = 'wrvu';
      } else {
        // Skip rows that don't match our metric types (e.g., "ASA Units", "Total Encounters", etc.)
        continue;
      }
    }

    // metricType is now set above, or we continue if it doesn't match

    // Get or create row for this specialty and region
    // Use specialty + region as key to support multiple regions per specialty
    const specialtyKey = geographicRegion ? `${specialty}|||${geographicRegion}` : specialty;
    let parsedRow = parsedRowsMap.get(specialtyKey);
    if (!parsedRow) {
      parsedRow = {
        specialty,
        geographicRegion,
        rowNumber: i + 1,
      };
      parsedRowsMap.set(specialtyKey, parsedRow);
    }

    // Parse percentiles
    const p25 = parseNumber(row[p25Index]);
    const p50 = parseNumber(row[p50Index]);
    const p75 = parseNumber(row[p75Index]);
    const p90 = parseNumber(row[p90Index]);

    // Skip rows with no percentile data (silently - this is expected for some specialties)
    if (p25 === null && p50 === null && p75 === null && p90 === null) {
      continue;
    }

    const percentileData: { p25?: number; p50?: number; p75?: number; p90?: number } = {};
    if (p25 !== null) percentileData.p25 = p25;
    if (p50 !== null) percentileData.p50 = p50;
    if (p75 !== null) percentileData.p75 = p75;
    if (p90 !== null) percentileData.p90 = p90;

    // Only proceed if we have at least one percentile value
    const values = [p25, p50, p75, p90].filter((v) => v !== null) as number[];
    if (values.length === 0) {
      // This shouldn't happen since we check above, but double-check
      continue;
    }

    // Validate percentile order - check that percentiles are non-decreasing (p25 <= p50 <= p75 <= p90)
    // Allow equal values (which can happen in real market data)
    const percentileChecks = [
      { lower: p25, higher: p50, names: 'p25/p50' },
      { lower: p50, higher: p75, names: 'p50/p75' },
      { lower: p75, higher: p90, names: 'p75/p90' },
    ];
    
    for (const check of percentileChecks) {
      if (check.lower !== null && check.higher !== null && check.lower > check.higher) {
        rowErrors.push(
          `${metricType.toUpperCase()} ${check.names}: ${check.lower} should be <= ${check.higher}`
        );
      }
    }

    // For TCC: Prefer "Total Compensation" over "Base Compensation" if both exist
    if (metricType === 'tcc') {
      // Only overwrite if current data is empty, or if this is "Total Compensation" and existing is "Base Compensation"
      const isTotalComp = metricTypeStr.includes('total compensation') || metricTypeStr.includes('total cash');
      const existingIsBaseComp = parsedRow.tcc && Object.keys(parsedRow.tcc).length > 0 && 
        !metricTypeStr.includes('total');
      
      if (!parsedRow.tcc || Object.keys(parsedRow.tcc).length === 0 || (isTotalComp && existingIsBaseComp)) {
        parsedRow.tcc = percentileData;
      }
    } else if (metricType === 'wrvu') {
      parsedRow.wrvu = percentileData;
    } else if (metricType === 'cf') {
      parsedRow.cf = percentileData;
    }

    if (rowErrors.length > 0) {
      if (!parsedRow.errors) parsedRow.errors = [];
      parsedRow.errors.push(...rowErrors);
      errors.push(`Row ${i + 1} (${specialty}, ${metricType}): ${rowErrors.join('; ')}`);
    }
  }

  const parsedRows = Array.from(parsedRowsMap.values());

  return {
    data: parsedRows,
    errors,
    format: 'long',
  };
}

/**
 * Convert parsed rows to SavedMarketData format
 */
export function convertToSavedMarketData(parsedRows: ParsedMarketDataRow[]): SavedMarketData[] {
  const savedData: SavedMarketData[] = [];
  const now = new Date().toISOString();

  for (const row of parsedRows) {
    // Skip rows with errors (optional - could also include them)
    if (row.errors && row.errors.length > 0) {
      continue;
    }

    // Create entries for each metric type that has data
    if (row.tcc) {
      const benchmarks: MarketBenchmarks = {};
      if (row.tcc.p25 !== undefined) benchmarks.tcc25 = row.tcc.p25;
      if (row.tcc.p50 !== undefined) benchmarks.tcc50 = row.tcc.p50;
      if (row.tcc.p75 !== undefined) benchmarks.tcc75 = row.tcc.p75;
      if (row.tcc.p90 !== undefined) benchmarks.tcc90 = row.tcc.p90;

      savedData.push({
        id: row.geographicRegion 
          ? `${row.specialty}-tcc-${row.geographicRegion}` 
          : `${row.specialty}-tcc`,
        specialty: row.specialty,
        metricType: 'tcc',
        geographicRegion: row.geographicRegion,
        benchmarks,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (row.wrvu) {
      const benchmarks: MarketBenchmarks = {};
      if (row.wrvu.p25 !== undefined) benchmarks.wrvu25 = row.wrvu.p25;
      if (row.wrvu.p50 !== undefined) benchmarks.wrvu50 = row.wrvu.p50;
      if (row.wrvu.p75 !== undefined) benchmarks.wrvu75 = row.wrvu.p75;
      if (row.wrvu.p90 !== undefined) benchmarks.wrvu90 = row.wrvu.p90;

      savedData.push({
        id: row.geographicRegion 
          ? `${row.specialty}-wrvu-${row.geographicRegion}` 
          : `${row.specialty}-wrvu`,
        specialty: row.specialty,
        metricType: 'wrvu',
        geographicRegion: row.geographicRegion,
        benchmarks,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (row.cf) {
      const benchmarks: MarketBenchmarks = {};
      if (row.cf.p25 !== undefined) benchmarks.cf25 = row.cf.p25;
      if (row.cf.p50 !== undefined) benchmarks.cf50 = row.cf.p50;
      if (row.cf.p75 !== undefined) benchmarks.cf75 = row.cf.p75;
      if (row.cf.p90 !== undefined) benchmarks.cf90 = row.cf.p90;

      savedData.push({
        id: row.geographicRegion 
          ? `${row.specialty}-cf-${row.geographicRegion}` 
          : `${row.specialty}-cf`,
        specialty: row.specialty,
        metricType: 'cf',
        geographicRegion: row.geographicRegion,
        benchmarks,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return savedData;
}

/**
 * Parse a number from a cell value
 * Handles asterisks, empty strings, and other non-numeric values
 */
function parseNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const strValue = String(value).trim();
  
  // Skip asterisks and other non-numeric indicators
  // Handle asterisks with or without spaces, and other common "no data" indicators
  if (
    strValue === '*' || 
    strValue === '**' ||
    strValue.includes('*') && strValue.replace(/\*/g, '').trim() === '' ||
    strValue === 'N/A' || 
    strValue === 'n/a' || 
    strValue.toLowerCase() === 'na' ||
    strValue === '-' || 
    strValue === '—' ||
    strValue === '' ||
    strValue.toLowerCase() === 'null' ||
    strValue.toLowerCase() === 'undefined'
  ) {
    return null;
  }

  const num = typeof value === 'number' ? value : parseFloat(strValue.replace(/[,$]/g, ''));
  if (isNaN(num) || num < 0) {
    return null;
  }

  return num;
}

/**
 * Check if array of numbers is in ascending order (allows equal values)
 * For market data, percentiles should be non-decreasing (p25 <= p50 <= p75 <= p90)
 */
function isAscending(values: number[]): boolean {
  for (let i = 1; i < values.length; i++) {
    if (values[i] < values[i - 1]) {
      return false;
    }
  }
  return true;
}


