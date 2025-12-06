import { MarketBenchmarks } from '@/types';
import { safeLocalStorage } from '@/hooks/use-debounced-local-storage';
import { logger } from './logger';

export interface SavedMarketData {
  id: string;
  specialty: string;
  metricType: 'tcc' | 'wrvu' | 'cf';
  benchmarks: MarketBenchmarks;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'fmv_market_data';

/**
 * Save market data for a specialty and metric type
 */
export function saveMarketData(
  specialty: string,
  metricType: 'tcc' | 'wrvu' | 'cf',
  benchmarks: MarketBenchmarks
): void {
  const allData = loadAllMarketData();
  const id = `${specialty}-${metricType}`;
  const existingIndex = allData.findIndex(d => d.id === id);
  
  const marketData: SavedMarketData = {
    id,
    specialty,
    metricType,
    benchmarks,
    createdAt: existingIndex >= 0 ? allData[existingIndex].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  if (existingIndex >= 0) {
    allData[existingIndex] = marketData;
  } else {
    allData.push(marketData);
  }
  
  try {
    const serialized = JSON.stringify(allData);
    if (!safeLocalStorage.setItem(STORAGE_KEY, serialized)) {
      logger.error('Failed to save market data to localStorage');
      throw new Error('Failed to save market data. Storage may be full.');
    }
  } catch (error) {
    logger.error('Error saving market data:', error);
    throw error instanceof Error ? error : new Error('Failed to save market data.');
  }
}

/**
 * Load market data for a specific specialty and metric type
 */
export function loadMarketData(
  specialty: string,
  metricType: 'tcc' | 'wrvu' | 'cf'
): MarketBenchmarks | null {
  const allData = loadAllMarketData();
  const id = `${specialty}-${metricType}`;
  const data = allData.find(d => d.id === id);
  return data ? data.benchmarks : null;
}

/**
 * Load all saved market data
 */
export function loadAllMarketData(): SavedMarketData[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = safeLocalStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as SavedMarketData[];
  } catch (error) {
    logger.error('Error loading market data:', error);
    return [];
  }
}

/**
 * Get all saved specialties for a metric type
 */
export function getSavedSpecialties(metricType: 'tcc' | 'wrvu' | 'cf'): string[] {
  const allData = loadAllMarketData();
  const specialties = allData
    .filter(d => d.metricType === metricType)
    .map(d => d.specialty);
  // Remove duplicates and sort
  return [...new Set(specialties)].sort();
}

/**
 * Delete market data for a specialty and metric type
 */
export function deleteMarketData(
  specialty: string,
  metricType: 'tcc' | 'wrvu' | 'cf'
): void {
  try {
    const allData = loadAllMarketData();
    const id = `${specialty}-${metricType}`;
    const filtered = allData.filter(d => d.id !== id);
    const serialized = JSON.stringify(filtered);
    if (!safeLocalStorage.setItem(STORAGE_KEY, serialized)) {
      logger.error('Failed to delete market data from localStorage');
    }
  } catch (error) {
    logger.error('Error deleting market data:', error);
    throw new Error('Failed to delete market data. Please try again.');
  }
}

/**
 * Check if market data exists for a specialty and metric type
 */
export function hasMarketData(
  specialty: string,
  metricType: 'tcc' | 'wrvu' | 'cf'
): boolean {
  const allData = loadAllMarketData();
  const id = `${specialty}-${metricType}`;
  return allData.some(d => d.id === id);
}

/**
 * Bulk save market data (for imports)
 * Handles overwrite vs merge logic - overwrites existing data for same specialty/metricType
 */
export function bulkSaveMarketData(data: SavedMarketData[]): void {
  if (typeof window === 'undefined') return;

  if (data.length === 0) {
    return;
  }

  try {
    const allData = loadAllMarketData();

    // Process each item
    for (const newItem of data) {
      const existingIndex = allData.findIndex(d => d.id === newItem.id);
      
      if (existingIndex >= 0) {
        // Overwrite existing - preserve original createdAt, update updatedAt
        allData[existingIndex] = {
          ...newItem,
          createdAt: allData[existingIndex].createdAt, // Preserve original creation date
          updatedAt: new Date().toISOString(),
        };
      } else {
        // Add new item
        allData.push(newItem);
      }
    }

    // Save to localStorage
    const serialized = JSON.stringify(allData);
    if (!safeLocalStorage.setItem(STORAGE_KEY, serialized)) {
      logger.error('Failed to bulk save market data to localStorage');
      throw new Error('Failed to save market data. Storage may be full.');
    }
  } catch (error) {
    logger.error('Error bulk saving market data:', error);
    throw error instanceof Error ? error : new Error('Failed to bulk save market data.');
  }
}









