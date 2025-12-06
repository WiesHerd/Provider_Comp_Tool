'use client';

import { useState, useMemo } from 'react';
import { SavedMarketData } from '@/lib/utils/market-data-storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Search, Download } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { deleteMarketData, loadAllMarketData } from '@/lib/utils/market-data-storage';
import * as XLSX from 'xlsx';

interface MarketDataTableProps {
  onDataChange?: () => void;
}

export default function MarketDataTable({ onDataChange }: MarketDataTableProps) {
  const [allData, setAllData] = useState<SavedMarketData[]>(() => loadAllMarketData());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMetricType, setFilterMetricType] = useState<'all' | 'tcc' | 'wrvu' | 'cf'>('all');
  const [filterSpecialty, setFilterSpecialty] = useState('all');

  // Get unique specialties
  const specialties = useMemo(() => {
    const unique = new Set(allData.map(d => d.specialty));
    return Array.from(unique).sort();
  }, [allData]);

  // Filter data
  const filteredData = useMemo(() => {
    return allData.filter(item => {
      // Search filter
      if (searchTerm && !item.specialty.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Metric type filter
      if (filterMetricType !== 'all' && item.metricType !== filterMetricType) {
        return false;
      }

      // Specialty filter
      if (filterSpecialty !== 'all' && item.specialty !== filterSpecialty) {
        return false;
      }

      return true;
    });
  }, [allData, searchTerm, filterMetricType, filterSpecialty]);

  const handleDelete = (specialty: string, metricType: 'tcc' | 'wrvu' | 'cf') => {
    if (confirm(`Delete market data for ${specialty} - ${metricType.toUpperCase()}?`)) {
      try {
        deleteMarketData(specialty, metricType);
        // Reload data
        setAllData(loadAllMarketData());
        if (onDataChange) {
          onDataChange();
        }
      } catch (error) {
        console.error('Error deleting market data:', error);
        alert('Failed to delete market data. Please try again.');
      }
    }
  };

  const handleExport = () => {
    try {
      // Prepare data for export (wide format)
      const specialtyMap = new Map<string, {
        specialty: string;
        tcc25?: number;
        tcc50?: number;
        tcc75?: number;
        tcc90?: number;
        wrvu25?: number;
        wrvu50?: number;
        wrvu75?: number;
        wrvu90?: number;
        cf25?: number;
        cf50?: number;
        cf75?: number;
        cf90?: number;
      }>();

      allData.forEach(item => {
        let row = specialtyMap.get(item.specialty);
        if (!row) {
          row = { specialty: item.specialty };
          specialtyMap.set(item.specialty, row);
        }

        if (item.metricType === 'tcc') {
          row.tcc25 = item.benchmarks.tcc25;
          row.tcc50 = item.benchmarks.tcc50;
          row.tcc75 = item.benchmarks.tcc75;
          row.tcc90 = item.benchmarks.tcc90;
        } else if (item.metricType === 'wrvu') {
          row.wrvu25 = item.benchmarks.wrvu25;
          row.wrvu50 = item.benchmarks.wrvu50;
          row.wrvu75 = item.benchmarks.wrvu75;
          row.wrvu90 = item.benchmarks.wrvu90;
        } else if (item.metricType === 'cf') {
          row.cf25 = item.benchmarks.cf25;
          row.cf50 = item.benchmarks.cf50;
          row.cf75 = item.benchmarks.cf75;
          row.cf90 = item.benchmarks.cf90;
        }
      });

      const exportData = Array.from(specialtyMap.values());

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(exportData, {
        header: [
          'specialty',
          'TCC_25', 'TCC_50', 'TCC_75', 'TCC_90',
          'wRVU_25', 'wRVU_50', 'wRVU_75', 'wRVU_90',
          'CF_25', 'CF_50', 'CF_75', 'CF_90',
        ],
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Market Data');

      // Download
      XLSX.writeFile(wb, `market-data-export-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };


  // Group data by specialty for display
  const groupedData = useMemo(() => {
    const groups = new Map<string, SavedMarketData[]>();
    filteredData.forEach(item => {
      const existing = groups.get(item.specialty) || [];
      existing.push(item);
      groups.set(item.specialty, existing);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredData]);

  const formatValue = (value: number | undefined, isCurrency: boolean = false): string => {
    if (value === undefined || value === null) return '—';
    if (isCurrency) {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Market Data ({filteredData.length} record{filteredData.length !== 1 ? 's' : ''})
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              View and manage saved market benchmark data by specialty
            </p>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm" className="min-h-[44px]">
            <Download className="w-4 h-4 mr-2" />
            Export to Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterMetricType} onValueChange={(value) => setFilterMetricType(value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Metrics</SelectItem>
              <SelectItem value="tcc">TCC</SelectItem>
              <SelectItem value="wrvu">wRVU</SelectItem>
              <SelectItem value="cf">CF</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by specialty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specialties</SelectItem>
              {specialties.map(spec => (
                <SelectItem key={spec} value={spec}>{spec}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {groupedData.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>No market data found.</p>
            {allData.length === 0 && (
              <p className="text-sm mt-2">Upload market data to get started.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Specialty</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">TCC</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">wRVU</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">CF</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">Updated</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {groupedData.map(([specialty, items]) => {
                  const tccItem = items.find(i => i.metricType === 'tcc');
                  const wrvuItem = items.find(i => i.metricType === 'wrvu');
                  const cfItem = items.find(i => i.metricType === 'cf');
                  const latestUpdate = items.reduce((latest, item) => {
                    return item.updatedAt > latest ? item.updatedAt : latest;
                  }, items[0].updatedAt);

                  return (
                    <tr key={specialty} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {specialty}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {tccItem ? (
                          <div className="text-xs space-y-1">
                            <div>25: {formatValue(tccItem.benchmarks.tcc25, true)}</div>
                            <div>50: {formatValue(tccItem.benchmarks.tcc50, true)}</div>
                            <div>75: {formatValue(tccItem.benchmarks.tcc75, true)}</div>
                            <div>90: {formatValue(tccItem.benchmarks.tcc90, true)}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {wrvuItem ? (
                          <div className="text-xs space-y-1">
                            <div>25: {formatValue(wrvuItem.benchmarks.wrvu25)}</div>
                            <div>50: {formatValue(wrvuItem.benchmarks.wrvu50)}</div>
                            <div>75: {formatValue(wrvuItem.benchmarks.wrvu75)}</div>
                            <div>90: {formatValue(wrvuItem.benchmarks.wrvu90)}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {cfItem ? (
                          <div className="text-xs space-y-1">
                            <div>25: {formatValue(cfItem.benchmarks.cf25, true)}</div>
                            <div>50: {formatValue(cfItem.benchmarks.cf50, true)}</div>
                            <div>75: {formatValue(cfItem.benchmarks.cf75, true)}</div>
                            <div>90: {formatValue(cfItem.benchmarks.cf90, true)}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500 dark:text-gray-400">
                        {new Date(latestUpdate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {items.map(item => (
                            <Button
                              key={item.id}
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.specialty, item.metricType)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 h-8 w-8 p-0"
                              title={`Delete ${item.specialty} - ${item.metricType.toUpperCase()}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
