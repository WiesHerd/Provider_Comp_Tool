import { MarketBenchmarks } from '@/types';
import { safeLocalStorage } from '@/hooks/use-debounced-local-storage';
import { logger } from './logger';
import { useAuthStore } from '@/lib/store/auth-store';
import * as firebaseStorage from '@/lib/firebase/firebaseStorageClient';

export interface SavedMarketData {
  id: string;
  specialty: string;
  metricType: 'tcc' | 'wrvu' | 'cf';
  geographicRegion?: string; // Optional geographic region (e.g., "National", "Northeast", "West")
  benchmarks: MarketBenchmarks;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'fmv_market_data';

/**
 * Save market data for a specialty and metric type
 */
export async function saveMarketData(
  specialty: string,
  metricType: 'tcc' | 'wrvu' | 'cf',
  benchmarks: MarketBenchmarks,
  geographicRegion?: string
): Promise<void>;
export function saveMarketData(
  specialty: string,
  metricType: 'tcc' | 'wrvu' | 'cf',
  benchmarks: MarketBenchmarks,
  geographicRegion?: string
): void | Promise<void> {
  if (typeof window === 'undefined') return;

  const userId = useAuthStore.getState().user?.uid;
  
  const id = geographicRegion 
    ? `${specialty}-${metricType}-${geographicRegion}` 
    : `${specialty}-${metricType}`;

  // Use Firebase if configured and user is authenticated
  if (userId && firebaseStorage.shouldUseFirebase()) {
    // When Firebase is configured, loadAllMarketData always returns a Promise
    const allDataPromise = loadAllMarketData();
    
    // Type assertion: when Firebase is configured, this is always a Promise
    const allData = allDataPromise as Promise<SavedMarketData[]>;
    
    return allData.then(allDataArray => {
      const existingIndex = allDataArray.findIndex(d => d.id === id);
      
      const marketData: SavedMarketData = {
        id,
        specialty,
        metricType,
        geographicRegion,
        benchmarks,
        createdAt: existingIndex >= 0 ? allDataArray[existingIndex].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return firebaseStorage.saveMarketDataToFirebase(userId, marketData)
        .then(() => {
          // Also save to localStorage as backup
          try {
            if (existingIndex >= 0) {
              allDataArray[existingIndex] = marketData;
            } else {
              allDataArray.push(marketData);
            }
            const serialized = JSON.stringify(allDataArray);
            safeLocalStorage.setItem(STORAGE_KEY, serialized);
          } catch (error) {
            logger.error('Error saving market data backup to localStorage:', error);
          }
        })
        .catch((error) => {
          logger.error('Error saving market data to Firebase, falling back to localStorage:', error);
          // Fallback to localStorage on error
          try {
            if (existingIndex >= 0) {
              allDataArray[existingIndex] = marketData;
            } else {
              allDataArray.push(marketData);
            }
            const serialized = JSON.stringify(allDataArray);
            if (!safeLocalStorage.setItem(STORAGE_KEY, serialized)) {
              throw new Error('Failed to save market data. Storage may be full.');
            }
          } catch (e) {
            logger.error('Error saving market data to localStorage:', e);
            throw error;
          }
        });
    });
  }

  // Fallback to localStorage if Firebase not configured or user not authenticated
  try {
    const allDataResult = loadAllMarketData();
    
    // Handle async case (shouldn't happen without Firebase, but for type safety)
    if (allDataResult instanceof Promise) {
      return allDataResult.then(allData => {
        const existingIndex = allData.findIndex(d => d.id === id);
        
        const marketData: SavedMarketData = {
          id,
          specialty,
          metricType,
          geographicRegion,
          benchmarks,
          createdAt: existingIndex >= 0 ? allData[existingIndex].createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        if (existingIndex >= 0) {
          allData[existingIndex] = marketData;
        } else {
          allData.push(marketData);
        }
        
        const serialized = JSON.stringify(allData);
        if (!safeLocalStorage.setItem(STORAGE_KEY, serialized)) {
          logger.error('Failed to save market data to localStorage');
          throw new Error('Failed to save market data. Storage may be full.');
        }
      });
    }
    
    // Handle sync case (normal localStorage path)
    // Type assertion: when not a Promise, it's always SavedMarketData[]
    const allData = allDataResult as SavedMarketData[];
    const existingIndex = allData.findIndex(d => d.id === id);
    
    const marketData: SavedMarketData = {
      id,
      specialty,
      metricType,
      geographicRegion,
      benchmarks,
      createdAt: existingIndex >= 0 ? allData[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      allData[existingIndex] = marketData;
    } else {
      allData.push(marketData);
    }
    
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
 * If geographicRegion is provided, it will prefer that region, otherwise falls back to any region
 */
export async function loadMarketData(
  specialty: string,
  metricType: 'tcc' | 'wrvu' | 'cf',
  geographicRegion?: string
): Promise<MarketBenchmarks | null>;
export function loadMarketData(
  specialty: string,
  metricType: 'tcc' | 'wrvu' | 'cf',
  geographicRegion?: string
): MarketBenchmarks | null | Promise<MarketBenchmarks | null> {
  const allData = loadAllMarketData();
  
  // Handle async case
  if (allData instanceof Promise) {
    return allData.then(data => {
      // If region is specified, try to find exact match first
      if (geographicRegion) {
        const id = `${specialty}-${metricType}-${geographicRegion}`;
        const found = data.find(d => d.id === id);
        if (found) return found.benchmarks;
      }
      
      // Fall back to any region (or no region) for this specialty/metricType
      const id = `${specialty}-${metricType}`;
      const found = data.find(d => d.id === id || d.id.startsWith(`${id}-`));
      return found ? found.benchmarks : null;
    });
  }
  
  // Handle sync case (localStorage fallback)
  // TypeScript type narrowing: if allData is not a Promise, it must be SavedMarketData[]
  const allDataArray = allData as SavedMarketData[];
  
  // If region is specified, try to find exact match first
  if (geographicRegion) {
    const id = `${specialty}-${metricType}-${geographicRegion}`;
    const data = allDataArray.find(d => d.id === id);
    if (data) return data.benchmarks;
  }
  
  // Fall back to any region (or no region) for this specialty/metricType
  const id = `${specialty}-${metricType}`;
  const data = allDataArray.find(d => d.id === id || d.id.startsWith(`${id}-`));
  return data ? data.benchmarks : null;
}

/**
 * Load all saved market data
 */
export async function loadAllMarketData(): Promise<SavedMarketData[]>;
export function loadAllMarketData(): SavedMarketData[] | Promise<SavedMarketData[]> {
  if (typeof window === 'undefined') return [];

  const userId = useAuthStore.getState().user?.uid;
  
  // Use Firebase if configured and user is authenticated
  if (userId && firebaseStorage.shouldUseFirebase()) {
    return firebaseStorage.loadMarketDataFromFirebase(userId)
      .then((data) => {
        // Also update localStorage as backup
        try {
          const serialized = JSON.stringify(data);
          safeLocalStorage.setItem(STORAGE_KEY, serialized);
        } catch (error) {
          logger.error('Error updating localStorage backup:', error);
        }
        return data;
      })
      .catch((error) => {
        logger.error('Error loading market data from Firebase, falling back to localStorage:', error);
        // Fallback to localStorage on error
        try {
          const stored = safeLocalStorage.getItem(STORAGE_KEY);
          if (!stored) return [];
          return JSON.parse(stored) as SavedMarketData[];
        } catch (e) {
          logger.error('Error loading market data from localStorage:', e);
          return [];
        }
      });
  }

  // Fallback to localStorage if Firebase not configured or user not authenticated
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
export async function getSavedSpecialties(metricType: 'tcc' | 'wrvu' | 'cf'): Promise<string[]>;
export function getSavedSpecialties(metricType: 'tcc' | 'wrvu' | 'cf'): string[] | Promise<string[]> {
  const allData = loadAllMarketData();
  
  // Handle async case
  if (allData instanceof Promise) {
    return allData.then(data => {
      const specialties = data
        .filter(d => d.metricType === metricType)
        .map(d => d.specialty);
      // Remove duplicates and sort
      return [...new Set(specialties)].sort();
    });
  }
  
  // Handle sync case
  // TypeScript type narrowing: if allData is not a Promise, it must be SavedMarketData[]
  const allDataArray = allData as SavedMarketData[];
  const specialties = allDataArray
    .filter(d => d.metricType === metricType)
    .map(d => d.specialty);
  // Remove duplicates and sort
  return [...new Set(specialties)].sort();
}

/**
 * Delete market data for a specialty and metric type
 */
export async function deleteMarketData(
  specialty: string,
  metricType: 'tcc' | 'wrvu' | 'cf',
  geographicRegion?: string
): Promise<void>;
export function deleteMarketData(
  specialty: string,
  metricType: 'tcc' | 'wrvu' | 'cf',
  geographicRegion?: string
): void | Promise<void> {
  if (typeof window === 'undefined') return;

  const userId = useAuthStore.getState().user?.uid;
  const id = geographicRegion 
    ? `${specialty}-${metricType}-${geographicRegion}` 
    : `${specialty}-${metricType}`;

  // Use Firebase if configured and user is authenticated
  if (userId && firebaseStorage.shouldUseFirebase()) {
    return firebaseStorage.deleteMarketDataFromFirebase(userId, id)
      .then(() => {
        // Also update localStorage backup
        try {
          const allData = loadAllMarketData();
          if (allData instanceof Promise) {
            allData.then(data => {
              const filtered = data.filter(d => d.id !== id);
              const serialized = JSON.stringify(filtered);
              safeLocalStorage.setItem(STORAGE_KEY, serialized);
            });
          } else {
            // TypeScript type narrowing: if allData is not a Promise, it must be SavedMarketData[]
            const allDataArray = allData as SavedMarketData[];
            const filtered = allDataArray.filter(d => d.id !== id);
            const serialized = JSON.stringify(filtered);
            safeLocalStorage.setItem(STORAGE_KEY, serialized);
          }
        } catch (error) {
          logger.error('Error updating localStorage backup:', error);
        }
      })
      .catch((error) => {
        logger.error('Error deleting market data from Firebase, falling back to localStorage:', error);
        // Fallback to localStorage on error
        try {
          const allData = loadAllMarketData();
          if (allData instanceof Promise) {
            allData.then(data => {
              const filtered = data.filter(d => d.id !== id);
              const serialized = JSON.stringify(filtered);
              if (!safeLocalStorage.setItem(STORAGE_KEY, serialized)) {
                logger.error('Failed to delete market data from localStorage');
              }
            });
          } else {
            // TypeScript type narrowing: if allData is not a Promise, it must be SavedMarketData[]
            const allDataArray = allData as SavedMarketData[];
            const filtered = allDataArray.filter(d => d.id !== id);
            const serialized = JSON.stringify(filtered);
            if (!safeLocalStorage.setItem(STORAGE_KEY, serialized)) {
              logger.error('Failed to delete market data from localStorage');
            }
          }
        } catch (e) {
          logger.error('Error deleting market data from localStorage:', e);
          throw error;
        }
      });
  }

  // Fallback to localStorage if Firebase not configured or user not authenticated
  try {
    const allData = loadAllMarketData();
    if (allData instanceof Promise) {
      return allData.then(data => {
        const filtered = data.filter(d => d.id !== id);
        const serialized = JSON.stringify(filtered);
        if (!safeLocalStorage.setItem(STORAGE_KEY, serialized)) {
          logger.error('Failed to delete market data from localStorage');
        }
      });
    }
    // TypeScript type narrowing: if allData is not a Promise, it must be SavedMarketData[]
    const allDataArray = allData as SavedMarketData[];
    const filtered = allDataArray.filter(d => d.id !== id);
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
export async function hasMarketData(
  specialty: string,
  metricType: 'tcc' | 'wrvu' | 'cf',
  geographicRegion?: string
): Promise<boolean>;
export function hasMarketData(
  specialty: string,
  metricType: 'tcc' | 'wrvu' | 'cf',
  geographicRegion?: string
): boolean | Promise<boolean> {
  const allData = loadAllMarketData();
  
  // Handle async case
  if (allData instanceof Promise) {
    return allData.then(data => {
      if (geographicRegion) {
        const id = `${specialty}-${metricType}-${geographicRegion}`;
        return data.some(d => d.id === id);
      }
      const id = `${specialty}-${metricType}`;
      return data.some(d => d.id === id || d.id.startsWith(`${id}-`));
    });
  }
  
  // Handle sync case
  // TypeScript type narrowing: if allData is not a Promise, it must be SavedMarketData[]
  const allDataArray = allData as SavedMarketData[];
  if (geographicRegion) {
    const id = `${specialty}-${metricType}-${geographicRegion}`;
    return allDataArray.some(d => d.id === id);
  }
  const id = `${specialty}-${metricType}`;
  return allDataArray.some(d => d.id === id || d.id.startsWith(`${id}-`));
}

/**
 * Delete all market data (clear everything)
 */
export async function deleteAllMarketData(): Promise<void>;
export function deleteAllMarketData(): void | Promise<void> {
  if (typeof window === 'undefined') return;

  const userId = useAuthStore.getState().user?.uid;

  // Use Firebase if configured and user is authenticated
  if (userId && firebaseStorage.shouldUseFirebase()) {
    return firebaseStorage.loadMarketDataFromFirebase(userId)
      .then(async (data) => {
        // Delete all market data from Firebase
        const deletePromises = data.map(item => 
          firebaseStorage.deleteMarketDataFromFirebase(userId, item.id)
        );
        await Promise.all(deletePromises);
        
        // Also clear localStorage backup
        try {
          safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        } catch (error) {
          logger.error('Error clearing localStorage backup:', error);
        }
      })
      .catch((error) => {
        logger.error('Error deleting all market data from Firebase, falling back to localStorage:', error);
        // Fallback to localStorage on error
        try {
          if (!safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify([]))) {
            throw new Error('Failed to clear market data. Please try again.');
          }
        } catch (e) {
          logger.error('Error clearing market data from localStorage:', e);
          throw error;
        }
      });
  }

  // Fallback to localStorage if Firebase not configured or user not authenticated
  try {
    if (!safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify([]))) {
      logger.error('Failed to clear market data from localStorage');
      throw new Error('Failed to clear market data. Please try again.');
    }
  } catch (error) {
    logger.error('Error clearing market data:', error);
    throw new Error('Failed to clear market data. Please try again.');
  }
}

/**
 * Bulk save market data (for imports)
 * Handles overwrite vs merge logic - overwrites existing data for same specialty/metricType
 */
export async function bulkSaveMarketData(data: SavedMarketData[]): Promise<void>;
export function bulkSaveMarketData(data: SavedMarketData[]): void | Promise<void> {
  if (typeof window === 'undefined') return;

  if (data.length === 0) {
    return;
  }

  const userId = useAuthStore.getState().user?.uid;

  // Use Firebase if configured and user is authenticated
  if (userId && firebaseStorage.shouldUseFirebase()) {
    // Process each item to preserve createdAt for existing items
    return firebaseStorage.loadMarketDataFromFirebase(userId)
      .then((existingData) => {
        const processedData = data.map(newItem => {
          const existing = existingData.find(d => d.id === newItem.id);
          if (existing) {
            // Preserve original createdAt
            return {
              ...newItem,
              createdAt: existing.createdAt,
              updatedAt: new Date().toISOString(),
            };
          }
          return newItem;
        });
        
        return firebaseStorage.bulkSaveMarketDataToFirebase(userId, processedData);
      })
      .then(() => {
        // Also save to localStorage as backup
        try {
          const allData = loadAllMarketData();
          if (allData instanceof Promise) {
            allData.then(existing => {
              const updated = [...existing];
              for (const newItem of data) {
                const existingIndex = updated.findIndex(d => d.id === newItem.id);
                if (existingIndex >= 0) {
                  updated[existingIndex] = {
                    ...newItem,
                    createdAt: updated[existingIndex].createdAt,
                    updatedAt: new Date().toISOString(),
                  };
                } else {
                  updated.push(newItem);
                }
              }
              const serialized = JSON.stringify(updated);
              safeLocalStorage.setItem(STORAGE_KEY, serialized);
            });
          } else {
            // TypeScript type narrowing: if allData is not a Promise, it must be SavedMarketData[]
            const allDataArray = allData as SavedMarketData[];
            const updated = [...allDataArray];
            for (const newItem of data) {
              const existingIndex = updated.findIndex(d => d.id === newItem.id);
              if (existingIndex >= 0) {
                updated[existingIndex] = {
                  ...newItem,
                  createdAt: updated[existingIndex].createdAt,
                  updatedAt: new Date().toISOString(),
                };
              } else {
                updated.push(newItem);
              }
            }
            const serialized = JSON.stringify(updated);
            safeLocalStorage.setItem(STORAGE_KEY, serialized);
          }
        } catch (error) {
          logger.error('Error saving market data backup to localStorage:', error);
        }
      })
      .catch((error) => {
        logger.error('Error bulk saving market data to Firebase, falling back to localStorage:', error);
        // Fallback to localStorage on error
        try {
          const allData = loadAllMarketData();
          if (allData instanceof Promise) {
            return allData.then(existing => {
              const updated = [...existing];
              for (const newItem of data) {
                const existingIndex = updated.findIndex(d => d.id === newItem.id);
                if (existingIndex >= 0) {
                  updated[existingIndex] = {
                    ...newItem,
                    createdAt: updated[existingIndex].createdAt,
                    updatedAt: new Date().toISOString(),
                  };
                } else {
                  updated.push(newItem);
                }
              }
              const serialized = JSON.stringify(updated);
              if (!safeLocalStorage.setItem(STORAGE_KEY, serialized)) {
                throw new Error('Failed to save market data. Storage may be full.');
              }
            });
          }
          // TypeScript type narrowing: if allData is not a Promise, it must be SavedMarketData[]
          const allDataArray = allData as SavedMarketData[];
          const updated = [...allDataArray];
          for (const newItem of data) {
            const existingIndex = updated.findIndex(d => d.id === newItem.id);
            if (existingIndex >= 0) {
              updated[existingIndex] = {
                ...newItem,
                createdAt: updated[existingIndex].createdAt,
                updatedAt: new Date().toISOString(),
              };
            } else {
              updated.push(newItem);
            }
          }
          const serialized = JSON.stringify(updated);
          if (!safeLocalStorage.setItem(STORAGE_KEY, serialized)) {
            throw new Error('Failed to save market data. Storage may be full.');
          }
        } catch (e) {
          logger.error('Error bulk saving market data to localStorage:', e);
          throw error;
        }
      });
  }

  // Fallback to localStorage if Firebase not configured or user not authenticated
  try {
    const allData = loadAllMarketData();
    if (allData instanceof Promise) {
      return allData.then(existing => {
        const updated = [...existing];
        for (const newItem of data) {
          const existingIndex = updated.findIndex(d => d.id === newItem.id);
          if (existingIndex >= 0) {
            updated[existingIndex] = {
              ...newItem,
              createdAt: updated[existingIndex].createdAt,
              updatedAt: new Date().toISOString(),
            };
          } else {
            updated.push(newItem);
          }
        }
        const serialized = JSON.stringify(updated);
        if (!safeLocalStorage.setItem(STORAGE_KEY, serialized)) {
          throw new Error('Failed to save market data. Storage may be full.');
        }
      });
    }
    // TypeScript type narrowing: if allData is not a Promise, it must be SavedMarketData[]
    const allDataArray = allData as SavedMarketData[];
    const updated = [...allDataArray];
    for (const newItem of data) {
      const existingIndex = updated.findIndex(d => d.id === newItem.id);
      if (existingIndex >= 0) {
        updated[existingIndex] = {
          ...newItem,
          createdAt: updated[existingIndex].createdAt,
          updatedAt: new Date().toISOString(),
        };
      } else {
        updated.push(newItem);
      }
    }
    const serialized = JSON.stringify(updated);
    if (!safeLocalStorage.setItem(STORAGE_KEY, serialized)) {
      logger.error('Failed to bulk save market data to localStorage');
      throw new Error('Failed to save market data. Storage may be full.');
    }
  } catch (error) {
    logger.error('Error bulk saving market data:', error);
    throw error instanceof Error ? error : new Error('Failed to bulk save market data.');
  }
}









