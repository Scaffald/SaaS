/**
 * BulkImportUI Component
 * REQ-2, TASK-17: Bulk import interface with preview and validation
 *
 * Features:
 * - File upload (CSV/JSON) or direct data paste
 * - Preview with validation results
 * - Row-level error/warning display
 * - Import execution with progress
 * - Download templates
 */

import { useState, useCallback, useRef } from 'react';
import { trpc } from '../../lib/trpc';
import Button from '../Common/Button';

// =============================================================================
// Types
// =============================================================================

export interface BulkImportUIProps {
  /** Organization ID */
  organizationId: string;
  /** Callback when import completes successfully */
  onImportComplete?: (createdIds: string[]) => void;
  /** Callback to close the import dialog */
  onClose?: () => void;
}

type ImportStep = 'upload' | 'preview' | 'result';
type ImportFormat = 'json' | 'csv';

interface ValidationIssue {
  field: string;
  message: string;
  code: string;
}

interface PreviewRow {
  rowIndex: number;
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  data?: Record<string, unknown>;
  normalizedData?: Record<string, unknown>;
}

interface ImportPreviewData {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  warningRows: number;
  duplicateCodes: string[];
  canProceed: boolean;
  rows: PreviewRow[];
}

interface ImportResultData {
  success: boolean;
  totalAttempted: number;
  successfulImports: number;
  failedImports: number;
  createdIds: string[];
  errors: Array<{ rowIndex: number; code: string; message: string }>;
}

// =============================================================================
// Component
// =============================================================================

export function BulkImportUI({
  organizationId,
  onImportComplete,
  onClose,
}: BulkImportUIProps) {
  // State
  const [step, setStep] = useState<ImportStep>('upload');
  const [importData, setImportData] = useState<string>('');
  const [format, setFormat] = useState<ImportFormat | undefined>(undefined);
  const [fileName, setFileName] = useState<string>('');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null);
  const [importResult, setImportResult] = useState<ImportResultData | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const templatesQuery = trpc.bulkOperations.importTemplates.useQuery(
    {},
    { enabled: !!organizationId }
  );

  const previewQuery = trpc.bulkOperations.importPreview.useQuery(
    {
      organizationId,
      data: importData,
      format,
    },
    {
      enabled: false, // Manual trigger
    }
  );

  // Mutations
  const importMutation = trpc.bulkOperations.importExecute.useMutation({
    onSuccess: (result) => {
      setImportResult(result);
      setStep('result');
      if (result.success && onImportComplete) {
        onImportComplete(result.createdIds);
      }
    },
  });

  // File handling
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    // Detect format from extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'csv') {
      setFormat('csv');
    } else if (extension === 'json') {
      setFormat('json');
    } else {
      setFormat(undefined);
    }

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
    };
    reader.readAsText(file);
  }, []);

  // Preview handling
  const handlePreview = useCallback(async () => {
    if (!importData.trim()) return;

    const result = await previewQuery.refetch();
    if (result.data) {
      setPreviewData(result.data);
      setStep('preview');
    }
  }, [importData, previewQuery]);

  // Import execution
  const handleExecuteImport = useCallback(() => {
    importMutation.mutate({
      organizationId,
      data: importData,
      format,
      skipDuplicates,
    });
  }, [organizationId, importData, format, skipDuplicates, importMutation]);

  // Template download
  const handleDownloadTemplate = useCallback(
    (templateFormat: ImportFormat) => {
      const templates = templatesQuery.data;
      if (!templates) return;

      const template = templates.find((t) => t.format === templateFormat);
      if (!template) return;

      const blob = new Blob([template.template], {
        type: templateFormat === 'json' ? 'application/json' : 'text/csv',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = template.filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    [templatesQuery.data]
  );

  // Reset
  const handleReset = useCallback(() => {
    setStep('upload');
    setImportData('');
    setFormat(undefined);
    setFileName('');
    setPreviewData(null);
    setImportResult(null);
    setExpandedRows(new Set());
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Toggle row expansion
  const toggleRowExpansion = useCallback((rowIndex: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) {
        next.delete(rowIndex);
      } else {
        next.add(rowIndex);
      }
      return next;
    });
  }, []);

  // =============================================================================
  // Render Functions
  // =============================================================================

  const renderUploadStep = () => (
    <div className="space-y-6">
      {/* Template Download Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Download Templates</h4>
        <p className="text-sm text-blue-700 mb-3">
          Start with a template to ensure your data is formatted correctly.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownloadTemplate('csv')}
            disabled={!templatesQuery.data}
          >
            📄 CSV Template
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownloadTemplate('json')}
            disabled={!templatesQuery.data}
          >
            📋 JSON Template
          </Button>
        </div>
      </div>

      {/* File Upload Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload File
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="file-input"
          />
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm text-gray-600">
              {fileName ? (
                <span className="font-medium text-blue-600">{fileName}</span>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Click to upload
                  </button>{' '}
                  or drag and drop
                </>
              )}
            </p>
            <p className="text-xs text-gray-500">CSV or JSON files up to 10MB</p>
          </div>
        </div>
      </div>

      {/* Or Paste Data Section */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or paste data directly</span>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Paste CSV or JSON
          </label>
          <select
            value={format ?? ''}
            onChange={(e) =>
              setFormat(e.target.value ? (e.target.value as ImportFormat) : undefined)
            }
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="">Auto-detect format</option>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
        </div>
        <textarea
          value={importData}
          onChange={(e) => setImportData(e.target.value)}
          placeholder="Paste your CSV or JSON data here..."
          rows={10}
          className="w-full border border-gray-300 rounded-lg p-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          data-testid="import-data-textarea"
        />
      </div>

      {/* Options */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="skip-duplicates"
          checked={skipDuplicates}
          onChange={(e) => setSkipDuplicates(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="skip-duplicates" className="ml-2 text-sm text-gray-700">
          Skip duplicate requirement codes (recommended)
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button
          variant="primary"
          onClick={handlePreview}
          disabled={!importData.trim() || previewQuery.isFetching}
        >
          {previewQuery.isFetching ? 'Validating...' : 'Validate & Preview'}
        </Button>
      </div>
    </div>
  );

  const renderPreviewStep = () => {
    if (!previewData) return null;

    const hasErrors = previewData.invalidRows > 0;
    const hasWarnings = previewData.warningRows > 0;

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{previewData.totalRows}</div>
            <div className="text-sm text-gray-600">Total Rows</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{previewData.validRows}</div>
            <div className="text-sm text-green-700">Valid</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{previewData.invalidRows}</div>
            <div className="text-sm text-red-700">Invalid</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{previewData.warningRows}</div>
            <div className="text-sm text-yellow-700">Warnings</div>
          </div>
        </div>

        {/* Duplicate Codes Warning */}
        {previewData.duplicateCodes.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-yellow-400 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-yellow-800">Duplicate Codes Found</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  {skipDuplicates
                    ? 'The following codes already exist and will be skipped:'
                    : 'The following codes already exist and may cause conflicts:'}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {previewData.duplicateCodes.map((code) => (
                    <span
                      key={code}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800"
                    >
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Row Details */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Row Details</h4>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              {previewData.rows.map((row) => (
                <div
                  key={row.rowIndex}
                  className={`border-b border-gray-200 last:border-b-0 ${
                    !row.isValid
                      ? 'bg-red-50'
                      : row.warnings.length > 0
                        ? 'bg-yellow-50'
                        : 'bg-white'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleRowExpansion(row.rowIndex)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500">
                        Row {row.rowIndex + 1}
                      </span>
                      {row.isValid ? (
                        row.warnings.length > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            ⚠️ {row.warnings.length} warning(s)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            ✓ Valid
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          ✕ {row.errors.length} error(s)
                        </span>
                      )}
                      {row.normalizedData && (
                        <span className="text-sm text-gray-600">
                          {(row.normalizedData as { code?: string }).code} -{' '}
                          {(row.normalizedData as { name?: string }).name}
                        </span>
                      )}
                    </div>
                    <svg
                      className={`h-5 w-5 text-gray-400 transform transition-transform ${
                        expandedRows.has(row.rowIndex) ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {expandedRows.has(row.rowIndex) && (
                    <div className="px-4 pb-3 space-y-3">
                      {/* Errors */}
                      {row.errors.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-red-700 uppercase">
                            Errors
                          </div>
                          {row.errors.map((error, idx) => (
                            <div key={idx} className="text-sm text-red-600 flex items-start gap-2">
                              <span className="text-red-400">•</span>
                              <span>
                                <strong>{error.field}:</strong> {error.message}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Warnings */}
                      {row.warnings.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-yellow-700 uppercase">
                            Warnings
                          </div>
                          {row.warnings.map((warning, idx) => (
                            <div
                              key={idx}
                              className="text-sm text-yellow-600 flex items-start gap-2"
                            >
                              <span className="text-yellow-400">•</span>
                              <span>
                                <strong>{warning.field}:</strong> {warning.message}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Raw Data */}
                      {row.data && (
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                            Raw Data
                          </div>
                          <pre className="text-xs bg-gray-100 rounded p-2 overflow-x-auto">
                            {JSON.stringify(row.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cannot Proceed Warning */}
        {!previewData.canProceed && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="ml-3 text-sm text-red-700">
                Cannot proceed with import. Please fix all errors and try again.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="ghost" onClick={handleReset}>
            ← Back to Upload
          </Button>
          <div className="flex gap-3">
            {onClose && (
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleExecuteImport}
              disabled={!previewData.canProceed || importMutation.isPending}
            >
              {importMutation.isPending
                ? 'Importing...'
                : `Import ${previewData.validRows} Requirement${previewData.validRows !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderResultStep = () => {
    if (!importResult) return null;

    return (
      <div className="space-y-6">
        {/* Success/Failure Header */}
        <div
          className={`rounded-lg p-6 text-center ${
            importResult.success ? 'bg-green-50' : 'bg-yellow-50'
          }`}
        >
          {importResult.success ? (
            <>
              <svg
                className="mx-auto h-12 w-12 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-3 text-lg font-medium text-green-900">Import Successful!</h3>
              <p className="mt-1 text-sm text-green-700">
                {importResult.successfulImports} requirement
                {importResult.successfulImports !== 1 ? 's' : ''} imported successfully.
              </p>
            </>
          ) : (
            <>
              <svg
                className="mx-auto h-12 w-12 text-yellow-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 className="mt-3 text-lg font-medium text-yellow-900">Import Partially Complete</h3>
              <p className="mt-1 text-sm text-yellow-700">
                {importResult.successfulImports} succeeded, {importResult.failedImports} failed.
              </p>
            </>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {importResult.totalAttempted}
            </div>
            <div className="text-sm text-gray-600">Attempted</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {importResult.successfulImports}
            </div>
            <div className="text-sm text-green-700">Succeeded</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{importResult.failedImports}</div>
            <div className="text-sm text-red-700">Failed</div>
          </div>
        </div>

        {/* Errors List */}
        {importResult.errors.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Import Errors</h4>
            <div className="border border-red-200 rounded-lg overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                {importResult.errors.map((error, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-3 border-b border-red-100 last:border-b-0 bg-red-50"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-medium text-red-700">
                        Row {error.rowIndex + 1}
                      </span>
                      <span className="text-sm text-red-600">
                        <strong>{error.code}:</strong> {error.message}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="ghost" onClick={handleReset}>
            Import More
          </Button>
          {onClose && (
            <Button variant="primary" onClick={onClose}>
              Done
            </Button>
          )}
        </div>
      </div>
    );
  };

  // =============================================================================
  // Main Render
  // =============================================================================

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Bulk Import Requirements</h3>
        <p className="mt-1 text-sm text-gray-500">
          Import multiple compliance requirements from a CSV or JSON file.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-center">
          {(['upload', 'preview', 'result'] as const).map((s, idx) => (
            <div key={s} className="flex items-center">
              {idx > 0 && (
                <div
                  className={`w-12 h-0.5 mx-2 ${
                    step === 'preview' || step === 'result' ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              )}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === s
                      ? 'bg-blue-600 text-white'
                      : (step === 'preview' && s === 'upload') ||
                          (step === 'result' && (s === 'upload' || s === 'preview'))
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {(step === 'preview' && s === 'upload') ||
                  (step === 'result' && (s === 'upload' || s === 'preview')) ? (
                    '✓'
                  ) : (
                    idx + 1
                  )}
                </div>
                <span className="mt-1 text-xs text-gray-600 capitalize">{s}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {step === 'upload' && renderUploadStep()}
        {step === 'preview' && renderPreviewStep()}
        {step === 'result' && renderResultStep()}
      </div>
    </div>
  );
}

export default BulkImportUI;
