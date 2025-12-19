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
import { YStack, XStack, Text, Button, Card, H3, H4, Spinner } from '@unicornlove/ui';
import { trpc } from '../../lib/trpc';

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
    <YStack gap="$6">
      {/* Template Download Section */}
      <Card backgroundColor="$blue2" borderColor="$blue5" borderRadius="$4" padding="$4">
        <H4 fontSize="$4" fontWeight="600" color="$blue11" marginBottom="$2">Download Templates</H4>
        <Text fontSize="$3" color="$blue10" marginBottom="$3">
          Start with a template to ensure your data is formatted correctly.
        </Text>
        <XStack gap="$3">
          <Button
            variant="outlined"
            size="$3"
            onPress={() => handleDownloadTemplate('csv')}
            disabled={!templatesQuery.data}
          >
            📄 CSV Template
          </Button>
          <Button
            variant="outlined"
            size="$3"
            onPress={() => handleDownloadTemplate('json')}
            disabled={!templatesQuery.data}
          >
            📋 JSON Template
          </Button>
        </XStack>
      </Card>

      {/* File Upload Section */}
      <YStack>
        <Text fontSize="$3" fontWeight="500" color="$gray11" marginBottom="$2">
          Upload File
        </Text>
        <Card
          borderWidth={2}
          borderStyle="dashed"
          borderColor="$gray6"
          borderRadius="$4"
          padding="$6"
          alignItems="center"
          hoverStyle={{ borderColor: '$gray7' }}
          cursor="pointer"
          onPress={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            data-testid="file-input"
          />
          <YStack gap="$2" alignItems="center">
            <svg
              style={{ margin: '0 auto', height: '48px', width: '48px', color: '#9CA3AF' }}
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
            <Text fontSize="$3" color="$gray10">
              {fileName ? (
                <Text fontWeight="500" color="$blue9">{fileName}</Text>
              ) : (
                <>
                  <Text
                    color="$blue9"
                    hoverStyle={{ color: '$blue10' }}
                    fontWeight="500"
                    cursor="pointer"
                    onPress={() => fileInputRef.current?.click()}
                  >
                    Click to upload
                  </Text>{' '}
                  or drag and drop
                </>
              )}
            </Text>
            <Text fontSize="$2" color="$gray9">CSV or JSON files up to 10MB</Text>
          </YStack>
        </Card>
      </YStack>

      {/* Or Paste Data Section */}
      <YStack position="relative">
        <XStack position="absolute" inset={0} alignItems="center">
          <YStack width="100%" borderTopWidth={1} borderColor="$gray6" />
        </XStack>
        <XStack position="relative" justifyContent="center">
          <Text paddingHorizontal="$2" backgroundColor="$background" fontSize="$3" color="$gray9">
            Or paste data directly
          </Text>
        </XStack>
      </YStack>

      <YStack>
        <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
          <Text fontSize="$3" fontWeight="500" color="$gray11">
            Paste CSV or JSON
          </Text>
          <select
            value={format ?? ''}
            onChange={(e) =>
              setFormat(e.target.value ? (e.target.value as ImportFormat) : undefined)
            }
            style={{
              fontSize: '14px',
              border: '1px solid #D1D5DB',
              borderRadius: '4px',
              padding: '4px 8px',
            }}
          >
            <option value="">Auto-detect format</option>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
        </XStack>
        <textarea
          value={importData}
          onChange={(e) => setImportData(e.target.value)}
          placeholder="Paste your CSV or JSON data here..."
          rows={10}
          style={{
            width: '100%',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            padding: '12px',
            fontFamily: 'monospace',
            fontSize: '14px',
          }}
          data-testid="import-data-textarea"
        />
      </YStack>

      {/* Options */}
      <XStack alignItems="center">
        <input
          type="checkbox"
          id="skip-duplicates"
          checked={skipDuplicates}
          onChange={(e) => setSkipDuplicates(e.target.checked)}
          style={{
            borderRadius: '4px',
            border: '1px solid #D1D5DB',
            accentColor: '#2563EB',
          }}
        />
        <Text marginLeft="$2" fontSize="$3" color="$gray11">
          Skip duplicate requirement codes (recommended)
        </Text>
      </XStack>

      {/* Actions */}
      <XStack justifyContent="flex-end" gap="$3" paddingTop="$4" borderTopWidth={1} borderColor="$gray6">
        {onClose && (
          <Button variant="outlined" onPress={onClose}>
            Cancel
          </Button>
        )}
        <Button
          variant="solid"
          onPress={handlePreview}
          disabled={!importData.trim() || previewQuery.isFetching}
        >
          {previewQuery.isFetching ? 'Validating...' : 'Validate & Preview'}
        </Button>
      </XStack>
    </YStack>
  );

  const renderPreviewStep = () => {
    if (!previewData) return null;

    const hasErrors = previewData.invalidRows > 0;
    const hasWarnings = previewData.warningRows > 0;

    return (
      <YStack gap="$6">
        {/* Summary */}
        <XStack flexWrap="wrap" gap="$4">
          <Card flex={1} minWidth="150px" backgroundColor="$gray2" borderRadius="$4" padding="$4" alignItems="center">
            <Text fontSize="$9" fontWeight="700" color="$gray12">{previewData.totalRows}</Text>
            <Text fontSize="$3" color="$gray10">Total Rows</Text>
          </Card>
          <Card flex={1} minWidth="150px" backgroundColor="$green2" borderRadius="$4" padding="$4" alignItems="center">
            <Text fontSize="$9" fontWeight="700" color="$green9">{previewData.validRows}</Text>
            <Text fontSize="$3" color="$green10">Valid</Text>
          </Card>
          <Card flex={1} minWidth="150px" backgroundColor="$red2" borderRadius="$4" padding="$4" alignItems="center">
            <Text fontSize="$9" fontWeight="700" color="$red9">{previewData.invalidRows}</Text>
            <Text fontSize="$3" color="$red10">Invalid</Text>
          </Card>
          <Card flex={1} minWidth="150px" backgroundColor="$yellow2" borderRadius="$4" padding="$4" alignItems="center">
            <Text fontSize="$9" fontWeight="700" color="$yellow9">{previewData.warningRows}</Text>
            <Text fontSize="$3" color="$yellow10">Warnings</Text>
          </Card>
        </XStack>

        {/* Duplicate Codes Warning */}
        {previewData.duplicateCodes.length > 0 && (
          <Card backgroundColor="$yellow2" borderColor="$yellow5" borderRadius="$4" padding="$4">
            <XStack alignItems="flex-start">
              <svg
                style={{ height: '20px', width: '20px', color: '#FBBF24', marginTop: '2px' }}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <YStack marginLeft="$3" flex={1}>
                <H4 fontSize="$3" fontWeight="500" color="$yellow11">Duplicate Codes Found</H4>
                <Text fontSize="$3" color="$yellow10" marginTop="$1">
                  {skipDuplicates
                    ? 'The following codes already exist and will be skipped:'
                    : 'The following codes already exist and may cause conflicts:'}
                </Text>
                <XStack marginTop="$2" flexWrap="wrap" gap="$2">
                  {previewData.duplicateCodes.map((code) => (
                    <Text
                      key={code}
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      borderRadius="$2"
                      fontSize="$2"
                      fontWeight="500"
                      backgroundColor="$yellow3"
                      color="$yellow11"
                    >
                      {code}
                    </Text>
                  ))}
                </XStack>
              </YStack>
            </XStack>
          </Card>
        )}

        {/* Row Details */}
        <YStack>
          <H4 fontSize="$3" fontWeight="500" color="$gray12" marginBottom="$3">Row Details</H4>
          <Card borderColor="$gray5" borderRadius="$4" overflow="hidden">
            <YStack maxHeight={384} overflowY="auto">
              {previewData.rows.map((row, idx) => (
                <YStack
                  key={row.rowIndex}
                  borderBottomWidth={idx < previewData.rows.length - 1 ? 1 : 0}
                  borderColor="$gray5"
                  backgroundColor={
                    !row.isValid
                      ? '$red2'
                      : row.warnings.length > 0
                        ? '$yellow2'
                        : '$background'
                  }
                >
                  <Button
                    unstyled
                    width="100%"
                    paddingHorizontal="$4"
                    paddingVertical="$3"
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="space-between"
                    textAlign="left"
                    hoverStyle={{ backgroundColor: '$gray2' }}
                    onPress={() => toggleRowExpansion(row.rowIndex)}
                  >
                    <XStack alignItems="center" gap="$3">
                      <Text fontSize="$3" fontWeight="500" color="$gray9">
                        Row {row.rowIndex + 1}
                      </Text>
                      {row.isValid ? (
                        row.warnings.length > 0 ? (
                          <Text
                            paddingHorizontal="$2"
                            paddingVertical="$1"
                            borderRadius="$2"
                            fontSize="$2"
                            fontWeight="500"
                            backgroundColor="$yellow3"
                            color="$yellow11"
                          >
                            ⚠️ {row.warnings.length} warning(s)
                          </Text>
                        ) : (
                          <Text
                            paddingHorizontal="$2"
                            paddingVertical="$1"
                            borderRadius="$2"
                            fontSize="$2"
                            fontWeight="500"
                            backgroundColor="$green3"
                            color="$green11"
                          >
                            ✓ Valid
                          </Text>
                        )
                      ) : (
                        <Text
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          borderRadius="$2"
                          fontSize="$2"
                          fontWeight="500"
                          backgroundColor="$red3"
                          color="$red11"
                        >
                          ✕ {row.errors.length} error(s)
                        </Text>
                      )}
                      {row.normalizedData && (
                        <Text fontSize="$3" color="$gray10">
                          {(row.normalizedData as { code?: string }).code} -{' '}
                          {(row.normalizedData as { name?: string }).name}
                        </Text>
                      )}
                    </XStack>
                    <svg
                      style={{
                        height: '20px',
                        width: '20px',
                        color: '#9CA3AF',
                        transform: expandedRows.has(row.rowIndex) ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s',
                      }}
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
                  </Button>

                  {expandedRows.has(row.rowIndex) && (
                    <YStack paddingHorizontal="$4" paddingBottom="$3" gap="$3">
                      {/* Errors */}
                      {row.errors.length > 0 && (
                        <YStack gap="$1">
                          <Text fontSize="$2" fontWeight="500" color="$red10" textTransform="uppercase">
                            Errors
                          </Text>
                          {row.errors.map((error, errorIdx) => (
                            <XStack key={errorIdx} alignItems="flex-start" gap="$2">
                              <Text fontSize="$3" color="$red7">•</Text>
                              <Text fontSize="$3" color="$red9">
                                <Text fontWeight="600">{error.field}:</Text> {error.message}
                              </Text>
                            </XStack>
                          ))}
                        </YStack>
                      )}

                      {/* Warnings */}
                      {row.warnings.length > 0 && (
                        <YStack gap="$1">
                          <Text fontSize="$2" fontWeight="500" color="$yellow10" textTransform="uppercase">
                            Warnings
                          </Text>
                          {row.warnings.map((warning, warnIdx) => (
                            <XStack key={warnIdx} alignItems="flex-start" gap="$2">
                              <Text fontSize="$3" color="$yellow7">•</Text>
                              <Text fontSize="$3" color="$yellow9">
                                <Text fontWeight="600">{warning.field}:</Text> {warning.message}
                              </Text>
                            </XStack>
                          ))}
                        </YStack>
                      )}

                      {/* Raw Data */}
                      {row.data && (
                        <YStack>
                          <Text fontSize="$2" fontWeight="500" color="$gray9" textTransform="uppercase" marginBottom="$1">
                            Raw Data
                          </Text>
                          <pre style={{
                            fontSize: '12px',
                            backgroundColor: '#F3F4F6',
                            borderRadius: '4px',
                            padding: '8px',
                            overflowX: 'auto',
                            margin: 0,
                          }}>
                            {JSON.stringify(row.data, null, 2)}
                          </pre>
                        </YStack>
                      )}
                    </YStack>
                  )}
                </YStack>
              ))}
            </YStack>
          </Card>
        </YStack>

        {/* Cannot Proceed Warning */}
        {!previewData.canProceed && (
          <Card backgroundColor="$red2" borderColor="$red5" borderRadius="$4" padding="$4">
            <XStack alignItems="center">
              <svg style={{ height: '20px', width: '20px', color: '#F87171' }} fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <Text marginLeft="$3" fontSize="$3" color="$red10">
                Cannot proceed with import. Please fix all errors and try again.
              </Text>
            </XStack>
          </Card>
        )}

        {/* Actions */}
        <XStack justifyContent="space-between" paddingTop="$4" borderTopWidth={1} borderColor="$gray6">
          <Button variant="outlined" onPress={handleReset}>
            ← Back to Upload
          </Button>
          <XStack gap="$3">
            {onClose && (
              <Button variant="outlined" onPress={onClose}>
                Cancel
              </Button>
            )}
            <Button
              variant="solid"
              onPress={handleExecuteImport}
              disabled={!previewData.canProceed || importMutation.isPending}
            >
              {importMutation.isPending
                ? 'Importing...'
                : `Import ${previewData.validRows} Requirement${previewData.validRows !== 1 ? 's' : ''}`}
            </Button>
          </XStack>
        </XStack>
      </YStack>
    );
  };

  const renderResultStep = () => {
    if (!importResult) return null;

    return (
      <YStack gap="$6">
        {/* Success/Failure Header */}
        <Card
          borderRadius="$4"
          padding="$6"
          alignItems="center"
          backgroundColor={importResult.success ? '$green2' : '$yellow2'}
        >
          {importResult.success ? (
            <>
              <svg
                style={{ margin: '0 auto', height: '48px', width: '48px', color: '#10B981' }}
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
              <H3 marginTop="$3" fontSize="$6" fontWeight="500" color="$green11">Import Successful!</H3>
              <Text marginTop="$1" fontSize="$3" color="$green10">
                {importResult.successfulImports} requirement
                {importResult.successfulImports !== 1 ? 's' : ''} imported successfully.
              </Text>
            </>
          ) : (
            <>
              <svg
                style={{ margin: '0 auto', height: '48px', width: '48px', color: '#F59E0B' }}
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
              <H3 marginTop="$3" fontSize="$6" fontWeight="500" color="$yellow11">Import Partially Complete</H3>
              <Text marginTop="$1" fontSize="$3" color="$yellow10">
                {importResult.successfulImports} succeeded, {importResult.failedImports} failed.
              </Text>
            </>
          )}
        </Card>

        {/* Summary Stats */}
        <XStack flexWrap="wrap" gap="$4">
          <Card flex={1} minWidth="150px" backgroundColor="$gray2" borderRadius="$4" padding="$4" alignItems="center">
            <Text fontSize="$9" fontWeight="700" color="$gray12">
              {importResult.totalAttempted}
            </Text>
            <Text fontSize="$3" color="$gray10">Attempted</Text>
          </Card>
          <Card flex={1} minWidth="150px" backgroundColor="$green2" borderRadius="$4" padding="$4" alignItems="center">
            <Text fontSize="$9" fontWeight="700" color="$green9">
              {importResult.successfulImports}
            </Text>
            <Text fontSize="$3" color="$green10">Succeeded</Text>
          </Card>
          <Card flex={1} minWidth="150px" backgroundColor="$red2" borderRadius="$4" padding="$4" alignItems="center">
            <Text fontSize="$9" fontWeight="700" color="$red9">{importResult.failedImports}</Text>
            <Text fontSize="$3" color="$red10">Failed</Text>
          </Card>
        </XStack>

        {/* Errors List */}
        {importResult.errors.length > 0 && (
          <YStack>
            <H4 fontSize="$3" fontWeight="500" color="$gray12" marginBottom="$3">Import Errors</H4>
            <Card borderColor="$red5" borderRadius="$4" overflow="hidden">
              <YStack maxHeight={256} overflowY="auto">
                {importResult.errors.map((error, idx) => (
                  <YStack
                    key={idx}
                    paddingHorizontal="$4"
                    paddingVertical="$3"
                    borderBottomWidth={idx < importResult.errors.length - 1 ? 1 : 0}
                    borderColor="$red4"
                    backgroundColor="$red2"
                  >
                    <XStack alignItems="flex-start" gap="$3">
                      <Text fontSize="$3" fontWeight="500" color="$red10">
                        Row {error.rowIndex + 1}
                      </Text>
                      <Text fontSize="$3" color="$red9">
                        <Text fontWeight="600">{error.code}:</Text> {error.message}
                      </Text>
                    </XStack>
                  </YStack>
                ))}
              </YStack>
            </Card>
          </YStack>
        )}

        {/* Actions */}
        <XStack justifyContent="flex-end" gap="$3" paddingTop="$4" borderTopWidth={1} borderColor="$gray6">
          <Button variant="outlined" onPress={handleReset}>
            Import More
          </Button>
          {onClose && (
            <Button variant="solid" onPress={onClose}>
              Done
            </Button>
          )}
        </XStack>
      </YStack>
    );
  };

  // =============================================================================
  // Main Render
  // =============================================================================

  return (
    <Card backgroundColor="$background" borderRadius="$4" elevation={4}>
      {/* Header */}
      <YStack paddingHorizontal="$6" paddingVertical="$4" borderBottomWidth={1} borderColor="$gray5">
        <H3 fontSize="$6" fontWeight="600" color="$gray12">Bulk Import Requirements</H3>
        <Text marginTop="$1" fontSize="$3" color="$gray9">
          Import multiple compliance requirements from a CSV or JSON file.
        </Text>
      </YStack>

      {/* Step Indicator */}
      <YStack paddingHorizontal="$6" paddingVertical="$4" borderBottomWidth={1} borderColor="$gray4" backgroundColor="$gray2">
        <XStack alignItems="center" justifyContent="center">
          {(['upload', 'preview', 'result'] as const).map((s, idx) => (
            <XStack key={s} alignItems="center">
              {idx > 0 && (
                <YStack
                  width={48}
                  height={2}
                  marginHorizontal="$2"
                  backgroundColor={
                    step === 'preview' || step === 'result' ? '$blue9' : '$gray6'
                  }
                />
              )}
              <YStack alignItems="center">
                <YStack
                  width={32}
                  height={32}
                  borderRadius={9999}
                  alignItems="center"
                  justifyContent="center"
                  fontSize="$3"
                  fontWeight="500"
                  backgroundColor={
                    step === s
                      ? '$blue9'
                      : (step === 'preview' && s === 'upload') ||
                          (step === 'result' && (s === 'upload' || s === 'preview'))
                        ? '$green9'
                        : '$gray5'
                  }
                  color={
                    step === s ||
                    (step === 'preview' && s === 'upload') ||
                    (step === 'result' && (s === 'upload' || s === 'preview'))
                      ? '$background'
                      : '$gray10'
                  }
                >
                  {(step === 'preview' && s === 'upload') ||
                  (step === 'result' && (s === 'upload' || s === 'preview')) ? (
                    '✓'
                  ) : (
                    idx + 1
                  )}
                </YStack>
                <Text marginTop="$1" fontSize="$2" color="$gray10" textTransform="capitalize">{s}</Text>
              </YStack>
            </XStack>
          ))}
        </XStack>
      </YStack>

      {/* Content */}
      <YStack padding="$6">
        {step === 'upload' && renderUploadStep()}
        {step === 'preview' && renderPreviewStep()}
        {step === 'result' && renderResultStep()}
      </YStack>
    </Card>
  );
}

export default BulkImportUI;
