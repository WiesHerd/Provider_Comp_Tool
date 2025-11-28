'use client';

import { useState, useRef } from 'react';
import { ProviderRecord } from '@/types/internal-benchmark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NumberInput } from '@/components/ui/number-input';
import { Upload, Plus, Trash2, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface DataUploadSectionProps {
  records: ProviderRecord[];
  onRecordsChange: (records: ProviderRecord[]) => void;
}

export function DataUploadSection({
  records,
  onRecordsChange,
}: DataUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleAddRecord = () => {
    const newRecord: ProviderRecord = {
      id: `record-${Date.now()}`,
      name: '',
      fte: 1.0,
      wrvus: 0,
      tcc: 0,
      notes: '',
    };
    onRecordsChange([...records, newRecord]);
  };

  const handleDeleteRecord = (id: string) => {
    if (records.length <= 1) {
      return; // Keep at least one record
    }
    onRecordsChange(records.filter((r) => r.id !== id));
  };

  const handleUpdateRecord = (id: string, updates: Partial<ProviderRecord>) => {
    onRecordsChange(
      records.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      if (jsonData.length < 2) {
        alert('File must have at least a header row and one data row.');
        return;
      }

      // Parse header row
      const headers = (jsonData[0] as string[]).map((h) => h.toLowerCase().trim());
      const nameIndex = headers.findIndex((h) => h.includes('name') || h.includes('provider'));
      const fteIndex = headers.findIndex((h) => h.includes('fte') || h.includes('clinical'));
      const wrvusIndex = headers.findIndex((h) => h.includes('wrvu') || h.includes('rvu'));
      const tccIndex = headers.findIndex((h) => h.includes('tcc') || h.includes('compensation') || h.includes('total'));
      const notesIndex = headers.findIndex((h) => h.includes('note') || h.includes('comment'));

      if (nameIndex === -1 || fteIndex === -1 || wrvusIndex === -1 || tccIndex === -1) {
        alert(
          'File must contain columns: Provider Name, Clinical FTE, Annual wRVUs, Total Cash Compensation'
        );
        return;
      }

      // Parse data rows
      const importedRecords: ProviderRecord[] = jsonData.slice(1).map((row, index) => {
        const name = String(row[nameIndex] || '').trim();
        const fte = parseFloat(row[fteIndex]) || 1.0;
        const wrvus = parseFloat(row[wrvusIndex]) || 0;
        const tcc = parseFloat(row[tccIndex]) || 0;
        const notes = notesIndex !== -1 ? String(row[notesIndex] || '').trim() : '';

        if (!name || wrvus <= 0 || tcc <= 0) {
          return null; // Skip invalid rows
        }

        return {
          id: `imported-${Date.now()}-${index}`,
          name,
          fte: Math.max(0, Math.min(1.0, fte)),
          wrvus,
          tcc,
          notes: notes || undefined,
        };
      }).filter((r): r is ProviderRecord => r !== null);

      if (importedRecords.length === 0) {
        alert('No valid records found in file.');
        return;
      }

      onRecordsChange(importedRecords);
      alert(`Successfully imported ${importedRecords.length} provider record(s).`);
    } catch (error) {
      console.error('Error importing file:', error);
      alert('Error importing file. Please check the file format.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const providerCount = records.filter((r) => r.name && r.wrvus > 0 && r.tcc > 0).length;
  const totalWrvus = records.reduce((sum, r) => sum + r.wrvus, 0);
  const totalTcc = records.reduce((sum, r) => sum + r.tcc, 0);

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Data Upload
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Upload CSV/Excel file or enter data manually
            </p>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="upload-file"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
              disabled={isImporting}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? 'Importing...' : 'Upload CSV/Excel'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleAddRecord}>
              <Plus className="w-4 h-4 mr-2" />
              Add Row
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          {providerCount > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400">Providers</Label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{providerCount}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400">Total wRVUs</Label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {totalWrvus.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400">Total TCC</Label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${totalTcc.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Provider Name
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Clinical FTE
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Annual wRVUs
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Total Cash Compensation
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Notes
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="py-3 px-4">
                      <Input
                        value={record.name}
                        onChange={(e) => handleUpdateRecord(record.id, { name: e.target.value })}
                        placeholder="Provider name"
                        className="w-full min-w-[150px]"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <NumberInput
                        value={record.fte}
                        onChange={(value) => handleUpdateRecord(record.id, { fte: value })}
                        min={0}
                        max={1}
                        step={0.1}
                        className="w-full"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <NumberInput
                        value={record.wrvus}
                        onChange={(value) => handleUpdateRecord(record.id, { wrvus: value })}
                        min={0}
                        step={100}
                        className="w-full"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <NumberInput
                        value={record.tcc}
                        onChange={(value) => handleUpdateRecord(record.id, { tcc: value })}
                        min={0}
                        step={1000}
                        className="w-full"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Input
                        value={record.notes || ''}
                        onChange={(e) => handleUpdateRecord(record.id, { notes: e.target.value || undefined })}
                        placeholder="Optional notes"
                        className="w-full min-w-[150px]"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      {records.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRecord(record.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {records.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Upload a CSV/Excel file or click &quot;Add Row&quot; to enter data manually.</p>
              <p className="text-sm mt-2">
                Required columns: Provider Name, Clinical FTE, Annual wRVUs, Total Cash Compensation
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


