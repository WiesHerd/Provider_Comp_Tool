import { MarketBenchmarks } from '@/types';

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
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
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
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as SavedMarketData[];
  } catch (error) {
    console.error('Error loading market data:', error);
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
  const allData = loadAllMarketData();
  const id = `${specialty}-${metricType}`;
  const filtered = allData.filter(d => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
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








