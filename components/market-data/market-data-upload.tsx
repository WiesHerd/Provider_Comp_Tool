'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { parseMarketDataFile, convertToSavedMarketData, ParsedMarketDataRow, extractVariablesFromFile, VariableMapping } from '@/lib/utils/market-data-parser';
import { bulkSaveMarketData, loadAllMarketData } from '@/lib/utils/market-data-storage';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface MarketDataUploadProps {
  onUploadComplete?: () => void;
}

export function MarketDataUpload({ onUploadComplete }: MarketDataUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<ParsedMarketDataRow[] | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState<{ imported: number; skipped: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uniqueVariables, setUniqueVariables] = useState<string[]>([]);
  const [variableMapping, setVariableMapping] = useState<VariableMapping>({});
  const [showMapping, setShowMapping] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setPreviewData(null);
    setParseErrors([]);
    setUploadSuccess(null);
    setUploadError(null);
    setVariableMapping({});
    setShowMapping(false);

    try {
      // First, try to extract variables for manual mapping
      const { variables } = await extractVariablesFromFile(file);
      
      if (variables.length > 0) {
        // Show mapping step for long format files
        setSelectedFile(file);
        setUniqueVariables(variables);
        setShowMapping(true);
        setIsUploading(false);
        return;
      }

      // If no variables found, try automatic parsing (wide format)
      const result = await parseMarketDataFile(file);

      if (result.errors.length > 0) {
        setParseErrors(result.errors);
      }

      if (result.data.length === 0) {
        setUploadError('No valid data found in file. Please check the file format.');
        setIsUploading(false);
        return;
      }

      setPreviewData(result.data);
    } catch (error) {
      console.error('Error parsing file:', error);
      setUploadError(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      if (!showMapping && fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleMappingComplete = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setShowMapping(false);

    try {
      const result = await parseMarketDataFile(selectedFile, variableMapping);

      if (result.errors.length > 0) {
        setParseErrors(result.errors);
      }

      if (result.data.length === 0) {
        setUploadError('No valid data found after mapping. Please check your variable assignments.');
        setIsUploading(false);
        return;
      }

      setPreviewData(result.data);
    } catch (error) {
      console.error('Error parsing file with mapping:', error);
      setUploadError(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmImport = () => {
    if (!previewData) return;

    try {
      // Convert parsed data to SavedMarketData format
      const savedData = convertToSavedMarketData(previewData);
      
      if (savedData.length === 0) {
        setUploadError('No valid data to import. All rows have errors.');
        return;
      }

      // Bulk save to localStorage
      bulkSaveMarketData(savedData);

      // Verify the data was actually saved by checking localStorage
      const allSavedData = loadAllMarketData();
      
      // Verify that at least some of our data was saved
      const savedIds = new Set(allSavedData.map(d => d.id));
      const expectedIds = new Set(savedData.map(d => d.id));
      const actuallySaved = Array.from(expectedIds).filter(id => savedIds.has(id)).length;
      
      if (actuallySaved === 0 && savedData.length > 0) {
        throw new Error('Data was not persisted to storage. Please check your browser\'s localStorage settings.');
      }

      // Calculate stats
      const imported = savedData.length;
      const skipped = previewData.length - previewData.filter(row => !row.errors || row.errors.length === 0).length;

      setUploadSuccess({ imported, skipped });
      setPreviewData(null);
      setParseErrors([]);
      setUploadError(null);

      // Callback to refresh parent
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Error importing data:', error);
      setUploadError(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUploadSuccess(null);
    }
  };

  const handleCancel = () => {
    setPreviewData(null);
    setParseErrors([]);
    setUploadSuccess(null);
    setUploadError(null);
    setShowMapping(false);
    setSelectedFile(null);
    setUniqueVariables([]);
    setVariableMapping({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validRows = previewData?.filter(row => !row.errors || row.errors.length === 0) || [];
  const invalidRows = previewData?.filter(row => row.errors && row.errors.length > 0) || [];

  const uploadContent = (
    <CardContent className="space-y-4">
        {/* Upload Button */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
            id="market-data-upload"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="min-h-[44px] w-full sm:w-auto"
          >
            <Upload className="w-4 h-4 mr-2 flex-shrink-0" />
            {isUploading ? 'Parsing...' : 'Select File'}
          </Button>
          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
            <FileSpreadsheet className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="text-xs sm:text-sm">CSV or Excel (.xlsx, .xls)</span>
          </div>
        </div>

        {/* Success Message */}
        {uploadSuccess && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-800 dark:text-green-200">Import Successful</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">
              Successfully imported and saved {uploadSuccess.imported} market data record(s) to storage.
              {uploadSuccess.skipped > 0 && ` ${uploadSuccess.skipped} row(s) were skipped due to errors.`}
              <span className="block mt-1 text-xs">Data has been persisted and will be available after page refresh.</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {uploadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Upload Error</AlertTitle>
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        {/* Parse Errors */}
        {parseErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Validation Errors</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2 max-h-40 overflow-y-auto">
                {parseErrors.slice(0, 10).map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
                {parseErrors.length > 10 && (
                  <li className="text-sm font-semibold">... and {parseErrors.length - 10} more errors</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Preview */}
        {previewData && (
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Preview ({validRows.length} valid, {invalidRows.length} with errors)
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Review the data below before importing. Rows with errors will be skipped.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel} size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleConfirmImport} size="sm" disabled={validRows.length === 0}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Import {validRows.length} Record(s)
                </Button>
              </div>
            </div>

            {/* Preview Table */}
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Specialty</th>
                    <th className="px-4 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">TCC</th>
                    <th className="px-4 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">wRVU</th>
                    <th className="px-4 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">CF</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {previewData.slice(0, 20).map((row, index) => {
                    const hasErrors = row.errors && row.errors.length > 0;
                    return (
                      <tr
                        key={index}
                        className={hasErrors ? 'bg-red-50 dark:bg-red-900/10' : 'bg-white dark:bg-gray-900'}
                      >
                        <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                          {row.specialty}
                        </td>
                        <td className="px-4 py-2 text-center text-gray-600 dark:text-gray-400">
                          {row.tcc ? '✓' : '—'}
                        </td>
                        <td className="px-4 py-2 text-center text-gray-600 dark:text-gray-400">
                          {row.wrvu ? '✓' : '—'}
                        </td>
                        <td className="px-4 py-2 text-center text-gray-600 dark:text-gray-400">
                          {row.cf ? '✓' : '—'}
                        </td>
                        <td className="px-4 py-2">
                          {hasErrors ? (
                            <div className="text-xs text-red-600 dark:text-red-400">
                              {row.errors?.slice(0, 1).join(', ')}
                              {row.errors && row.errors.length > 1 && ` (+${row.errors.length - 1} more)`}
                            </div>
                          ) : (
                            <span className="text-xs text-green-600 dark:text-green-400">Valid</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {previewData.length > 20 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-2 text-center text-sm text-gray-500 dark:text-gray-400">
                        ... and {previewData.length - 20} more row(s)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Variable Mapping Step */}
        {showMapping && uniqueVariables.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Map Variables to Metric Types
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                Please assign each variable from your file to the correct metric type (TCC, wRVU, or CF). 
                Leave as &quot;Skip&quot; if you don&apos;t want to import that variable.
              </p>
            </div>
            <div className="space-y-3">
              {uniqueVariables.map((variable) => (
                <div key={variable} className="flex items-center gap-3">
                  <Label className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 min-w-0">
                    <span className="truncate block">{variable}</span>
                  </Label>
                  <Select
                    value={variableMapping[variable] || 'skip'}
                    onValueChange={(value) => {
                      setVariableMapping(prev => ({
                        ...prev,
                        [variable]: value === 'skip' ? null : value as 'tcc' | 'wrvu' | 'cf',
                      }));
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">Skip</SelectItem>
                      <SelectItem value="tcc">TCC</SelectItem>
                      <SelectItem value="wrvu">wRVU</SelectItem>
                      <SelectItem value="cf">CF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2 flex-wrap">
              <Button variant="outline" onClick={handleCancel} size="sm">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                variant="ghost"
                onClick={async () => {
                  // Use automatic detection (no mapping)
                  if (!selectedFile) return;
                  setIsUploading(true);
                  setShowMapping(false);
                  try {
                    const result = await parseMarketDataFile(selectedFile);
                    if (result.errors.length > 0) {
                      setParseErrors(result.errors);
                    }
                    if (result.data.length === 0) {
                      setUploadError('No valid data found. Please try manual mapping.');
                      setIsUploading(false);
                      return;
                    }
                    setPreviewData(result.data);
                  } catch (error) {
                    console.error('Error parsing file:', error);
                    setUploadError(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  } finally {
                    setIsUploading(false);
                  }
                }}
                size="sm"
              >
                Use Automatic Detection
              </Button>
              <Button 
                onClick={handleMappingComplete} 
                size="sm"
                disabled={Object.values(variableMapping).filter(v => v !== null).length === 0}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Continue with Mapping
              </Button>
            </div>
          </div>
        )}

        {/* Format Help */}
        {!previewData && !showMapping && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <details className="text-sm">
              <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium">
                Expected File Format
              </summary>
              <div className="mt-2 space-y-3 text-gray-600 dark:text-gray-400">
                <div>
                  <p className="font-semibold mb-1">Wide Format (Recommended):</p>
                  <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                    Specialty | TCC_25 | TCC_50 | TCC_75 | TCC_90 | wRVU_25 | wRVU_50 | wRVU_75 | wRVU_90 | CF_25 | CF_50 | CF_75 | CF_90
                  </code>
                </div>
                <div>
                  <p className="font-semibold mb-1">Long Format (Alternative):</p>
                  <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto mb-2">
                    Specialty | MetricType | P25 | P50 | P75 | P90
                  </code>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Or with Variable column:</p>
                  <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                    Specialty | Variable | P25 | P50 | P75 | P90
                  </code>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Supported variables: &quot;Total Compensation&quot;, &quot;Work RVUs&quot;, &quot;Compensation to Work RVUs Ratio&quot;
                  </p>
                </div>
              </div>
            </details>
          </div>
        )}
      </CardContent>
  );

  // This component should not be rendered on mobile (handled by parent)
  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          Upload Market Data
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Upload a CSV or Excel file with market benchmark data. Supports wide format (one row per specialty) or long format (multiple rows per specialty).
        </p>
      </CardHeader>
      {uploadContent}
    </Card>
  );
}


