'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Download } from 'lucide-react';
import { CallPayContext, CallTier } from '@/types/call-pay';
import * as XLSX from 'xlsx';

interface DataImportExportProps {
  context: CallPayContext;
  tiers: CallTier[];
  onContextImport?: (context: CallPayContext) => void;
  onTiersImport?: (tiers: CallTier[]) => void;
}

export function DataImportExport({
  context,
  tiers,
  onContextImport,
  onTiersImport,
}: DataImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = () => {
    const workbook = XLSX.utils.book_new();

    // Context Sheet
    const contextData = [
      ['Field', 'Value'],
      ['Specialty', context.specialty],
      ['Service Line', context.serviceLine],
      ['Providers on Call', context.providersOnCall],
      ['Rotation Ratio', context.rotationRatio],
      ['Model Year', context.modelYear],
    ];
    const contextSheet = XLSX.utils.aoa_to_sheet(contextData);
    XLSX.utils.book_append_sheet(workbook, contextSheet, 'Context');

    // Tiers Sheet
    const tierHeaders = [
      'ID',
      'Name',
      'Enabled',
      'Coverage Type',
      'Payment Method',
      'Weekday Rate',
      'Weekend Rate',
      'Holiday Rate',
      'Weekday Calls/Month',
      'Weekend Calls/Month',
      'Holidays/Year',
      'Avg Callbacks/24h',
      'Avg Cases/24h',
    ];
    const tierRows = tiers.map(tier => [
      tier.id,
      tier.name,
      tier.enabled,
      tier.coverageType,
      tier.paymentMethod,
      tier.rates.weekday,
      tier.rates.weekend,
      tier.rates.holiday,
      tier.burden.weekdayCallsPerMonth,
      tier.burden.weekendCallsPerMonth,
      tier.burden.holidaysPerYear,
      tier.burden.avgCallbacksPer24h,
      tier.burden.avgCasesPer24h || 0,
    ]);
    const tierData = [tierHeaders, ...tierRows];
    const tierSheet = XLSX.utils.aoa_to_sheet(tierData);
    XLSX.utils.book_append_sheet(workbook, tierSheet, 'Tiers');

    const fileName = `Call_Pay_Data_${context.specialty}_${context.modelYear}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);

      // Read context
      const contextSheet = workbook.Sheets['Context'];
      if (contextSheet && onContextImport) {
        const contextData = XLSX.utils.sheet_to_json(contextSheet, { header: 1 }) as any[][];
        const contextMap = new Map(contextData.slice(1).map(row => [row[0], row[1]]));
        
        const importedContext: CallPayContext = {
          specialty: contextMap.get('Specialty') || context.specialty,
          serviceLine: contextMap.get('Service Line') || context.serviceLine,
          providersOnCall: Number(contextMap.get('Providers on Call')) || context.providersOnCall,
          rotationRatio: Number(contextMap.get('Rotation Ratio')) || context.rotationRatio,
          modelYear: Number(contextMap.get('Model Year')) || context.modelYear,
        };
        onContextImport(importedContext);
      }

      // Read tiers
      const tierSheet = workbook.Sheets['Tiers'];
      if (tierSheet && onTiersImport) {
        const tierData = XLSX.utils.sheet_to_json(tierSheet, { header: 1 }) as any[][];
        const headers = tierData[0] as string[];
        const rows = tierData.slice(1);

        const importedTiers: CallTier[] = rows.map(row => ({
          id: row[headers.indexOf('ID')] || '',
          name: row[headers.indexOf('Name')] || '',
          enabled: row[headers.indexOf('Enabled')] || false,
          coverageType: row[headers.indexOf('Coverage Type')] || 'In-house',
          paymentMethod: row[headers.indexOf('Payment Method')] || 'Daily / shift rate',
          rates: {
            weekday: Number(row[headers.indexOf('Weekday Rate')]) || 0,
            weekend: Number(row[headers.indexOf('Weekend Rate')]) || 0,
            holiday: Number(row[headers.indexOf('Holiday Rate')]) || 0,
          },
          burden: {
            weekdayCallsPerMonth: Number(row[headers.indexOf('Weekday Calls/Month')]) || 0,
            weekendCallsPerMonth: Number(row[headers.indexOf('Weekend Calls/Month')]) || 0,
            holidaysPerYear: Number(row[headers.indexOf('Holidays/Year')]) || 0,
            avgCallbacksPer24h: Number(row[headers.indexOf('Avg Callbacks/24h')]) || 0,
            avgCasesPer24h: Number(row[headers.indexOf('Avg Cases/24h')]) || 0,
          },
        }));
        onTiersImport(importedTiers);
      }

      alert('Data imported successfully!');
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Error importing data. Please check the file format.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          Data Import / Export
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Export your call pay configuration or import from Excel
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Export Data</Label>
            <Button onClick={handleExport} variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Export to Excel
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Export context and tier configuration to Excel for backup or editing
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Import Data</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="hidden"
              id="import-file"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              disabled={isImporting}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? 'Importing...' : 'Import from Excel'}
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Import context and tier configuration from Excel file
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



