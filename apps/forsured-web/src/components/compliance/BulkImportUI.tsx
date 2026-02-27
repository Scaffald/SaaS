/**
 * BulkImportUI Component
 * Bulk import interface with preview and validation
 *
 * Features:
 * - File upload (CSV/JSON) or direct data paste
 * - Preview with validation results
 * - Row-level error/warning display
 * - Import execution with progress
 * - Download templates
 */

import { useState, useCallback, useRef } from 'react';
import { Stack, Row, Text, Button, Card, H3, H4 } from '@scaffald/ui';
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
    <Stack style={{ gap: '24px' }}>
      {/* Template Download Section */}
      <Card style={{ backgroundColor: 'var(--color-blue2)', borderColor: 'var(--color-blue5)', borderRadius: '8px', padding: '16px' }}>
        <H4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-blue11)', marginBottom: '8px' }}>Download Templates</H4>
        <Text style={{ fontSize: '14px', color: 'var(--color-blue10)', marginBottom: '12px' }}>
          Start with a template to ensure your data is formatted correctly.
        </Text>
        <Row style={{ gap: '12px' }}>
          <Button
            variant="outlined"
            size="sm"
            onPress={() => handleDownloadTemplate('csv')}
            disabled={!templatesQuery.data}
          >
            CSV Template
          </Button>
          <Button
            variant="outlined"
            size="sm"
            onPress={() => handleDownloadTemplate('json')}
            disabled={!templatesQuery.data}
          >
            JSON Template
          </Button>
        </Row>
      </Card>

      {/* File Upload Section */}
      <Stack>
        <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-gray11)', marginBottom: '8px' }}>
          Upload File
        </Text>
        <Card
          style={{
            borderWidth: '2px',
            borderStyle: 'dashed',
            borderColor: 'var(--color-gray6)',
            borderRadius: '8px',
            padding: '24px',
            alignItems: 'center',
            cursor: 'pointer',
          }}
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
          <Stack style={{ gap: '8px', alignItems: 'center' }}>
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
            <Text style={{ fontSize: '14px', color: 'var(--color-gray10)' }}>
              {fileName ? (
                <Text style={{ fontWeight: 500, color: 'var(--color-blue9)' }}>{fileName}</Text>
              ) : (
                <>
                  <span
                    style={{
                      color: 'var(--color-blue9)',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Click to upload
                  </span>{' '}
                  or drag and drop
                </>
              )}
            </Text>
            <Text style={{ fontSize: '12px', color: 'var(--color-gray9)' }}>CSV or JSON files up to 10MB</Text>
          </Stack>
        </Card>
      </Stack>

      {/* Or Paste Data Section */}
      <Stack style={{ position: 'relative' }}>
        <Row style={{ position: 'absolute', inset: 0, alignItems: 'center' }}>
          <Stack style={{ width: '100%', borderTopWidth: '1px', borderColor: 'var(--color-gray6)' }} />
        </Row>
        <Row style={{ position: 'relative', justifyContent: 'center' }}>
          <Text style={{ paddingLeft: '8px', paddingRight: '8px', backgroundColor: 'var(--color-background)', fontSize: '14px', color: 'var(--color-gray9)' }}>
            Or paste data directly
          </Text>
        </Row>
      </Stack>

      <Stack>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-gray11)' }}>
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
        </Row>
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
      </Stack>

      {/* Options */}
      <Row style={{ alignItems: 'center' }}>
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
        <Text style={{ marginLeft: '8px', fontSize: '14px', color: 'var(--color-gray11)' }}>
          Skip duplicate requirement codes (recommended)
        </Text>
      </Row>

      {/* Actions */}
      <Row style={{ justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTopWidth: '1px', borderColor: 'var(--color-gray6)' }}>
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
      </Row>
    </Stack>
  );

  const renderPreviewStep = () => {
    if (!previewData) return null;

    const hasErrors = previewData.invalidRows > 0;
    const hasWarnings = previewData.warningRows > 0;

    return (
      <Stack style={{ gap: '24px' }}>
        {/* Summary */}
        <Row style={{ flexWrap: 'wrap', gap: '16px' }}>
          <Card style={{ flex: 1, minWidth: '150px', backgroundColor: 'var(--color-gray2)', borderRadius: '8px', padding: '16px', alignItems: 'center' }}>
            <Text style={{ fontSize: '36px', fontWeight: 700, color: 'var(--color-gray12)' }}>{previewData.totalRows}</Text>
            <Text style={{ fontSize: '14px', color: 'var(--color-gray10)' }}>Total Rows</Text>
          </Card>
          <Card style={{ flex: 1, minWidth: '150px', backgroundColor: 'var(--color-green2)', borderRadius: '8px', padding: '16px', alignItems: 'center' }}>
            <Text style={{ fontSize: '36px', fontWeight: 700, color: 'var(--color-green9)' }}>{previewData.validRows}</Text>
            <Text style={{ fontSize: '14px', color: 'var(--color-green10)' }}>Valid</Text>
          </Card>
          <Card style={{ flex: 1, minWidth: '150px', backgroundColor: 'var(--color-red2)', borderRadius: '8px', padding: '16px', alignItems: 'center' }}>
            <Text style={{ fontSize: '36px', fontWeight: 700, color: 'var(--color-red9)' }}>{previewData.invalidRows}</Text>
            <Text style={{ fontSize: '14px', color: 'var(--color-red10)' }}>Invalid</Text>
          </Card>
          <Card style={{ flex: 1, minWidth: '150px', backgroundColor: 'var(--color-yellow2)', borderRadius: '8px', padding: '16px', alignItems: 'center' }}>
            <Text style={{ fontSize: '36px', fontWeight: 700, color: 'var(--color-yellow9)' }}>{previewData.warningRows}</Text>
            <Text style={{ fontSize: '14px', color: 'var(--color-yellow10)' }}>Warnings</Text>
          </Card>
        </Row>

        {/* Duplicate Codes Warning */}
        {previewData.duplicateCodes.length > 0 && (
          <Card style={{ backgroundColor: 'var(--color-yellow2)', borderColor: 'var(--color-yellow5)', borderRadius: '8px', padding: '16px' }}>
            <Row style={{ alignItems: 'flex-start' }}>
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
              <Stack style={{ marginLeft: '12px', flex: 1 }}>
                <H4 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-yellow11)' }}>Duplicate Codes Found</H4>
                <Text style={{ fontSize: '14px', color: 'var(--color-yellow10)', marginTop: '4px' }}>
                  {skipDuplicates
                    ? 'The following codes already exist and will be skipped:'
                    : 'The following codes already exist and may cause conflicts:'}
                </Text>
                <Row style={{ marginTop: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  {previewData.duplicateCodes.map((code) => (
                    <Text
                      key={code}
                      style={{
                        paddingLeft: '8px',
                        paddingRight: '8px',
                        paddingTop: '4px',
                        paddingBottom: '4px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: 'var(--color-yellow3)',
                        color: 'var(--color-yellow11)',
                      }}
                    >
                      {code}
                    </Text>
                  ))}
                </Row>
              </Stack>
            </Row>
          </Card>
        )}

        {/* Row Details */}
        <Stack>
          <H4 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-gray12)', marginBottom: '12px' }}>Row Details</H4>
          <Card style={{ borderColor: 'var(--color-gray5)', borderRadius: '8px', overflow: 'hidden' }}>
            <Stack style={{ maxHeight: '384px', overflowY: 'auto' }}>
              {previewData.rows.map((row, idx) => (
                <Stack
                  key={row.rowIndex}
                  style={{
                    borderBottomWidth: idx < previewData.rows.length - 1 ? '1px' : '0',
                    borderColor: 'var(--color-gray5)',
                    backgroundColor: !row.isValid
                      ? 'var(--color-red2)'
                      : row.warnings.length > 0
                        ? 'var(--color-yellow2)'
                        : 'var(--color-background)',
                  }}
                >
                  <button
                    style={{
                      width: '100%',
                      paddingLeft: '16px',
                      paddingRight: '16px',
                      paddingTop: '12px',
                      paddingBottom: '12px',
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleRowExpansion(row.rowIndex)}
                  >
                    <Row style={{ alignItems: 'center', gap: '12px' }}>
                      <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-gray9)' }}>
                        Row {row.rowIndex + 1}
                      </Text>
                      {row.isValid ? (
                        row.warnings.length > 0 ? (
                          <Text
                            style={{
                              paddingLeft: '8px',
                              paddingRight: '8px',
                              paddingTop: '4px',
                              paddingBottom: '4px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 500,
                              backgroundColor: 'var(--color-yellow3)',
                              color: 'var(--color-yellow11)',
                            }}
                          >
                            {row.warnings.length} warning(s)
                          </Text>
                        ) : (
                          <Text
                            style={{
                              paddingLeft: '8px',
                              paddingRight: '8px',
                              paddingTop: '4px',
                              paddingBottom: '4px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 500,
                              backgroundColor: 'var(--color-green3)',
                              color: 'var(--color-green11)',
                            }}
                          >
                            Valid
                          </Text>
                        )
                      ) : (
                        <Text
                          style={{
                            paddingLeft: '8px',
                            paddingRight: '8px',
                            paddingTop: '4px',
                            paddingBottom: '4px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 500,
                            backgroundColor: 'var(--color-red3)',
                            color: 'var(--color-red11)',
                          }}
                        >
                          {row.errors.length} error(s)
                        </Text>
                      )}
                      {row.normalizedData && (
                        <Text style={{ fontSize: '14px', color: 'var(--color-gray10)' }}>
                          {(row.normalizedData as { code?: string }).code} -{' '}
                          {(row.normalizedData as { name?: string }).name}
                        </Text>
                      )}
                    </Row>
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
                  </button>

                  {expandedRows.has(row.rowIndex) && (
                    <Stack style={{ paddingLeft: '16px', paddingRight: '16px', paddingBottom: '12px', gap: '12px' }}>
                      {/* Errors */}
                      {row.errors.length > 0 && (
                        <Stack style={{ gap: '4px' }}>
                          <Text style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-red10)', textTransform: 'uppercase' }}>
                            Errors
                          </Text>
                          {row.errors.map((error, errorIdx) => (
                            <Row key={errorIdx} style={{ alignItems: 'flex-start', gap: '8px' }}>
                              <Text style={{ fontSize: '14px', color: 'var(--color-red7)' }}>*</Text>
                              <Text style={{ fontSize: '14px', color: 'var(--color-red9)' }}>
                                <Text style={{ fontWeight: 600 }}>{error.field}:</Text> {error.message}
                              </Text>
                            </Row>
                          ))}
                        </Stack>
                      )}

                      {/* Warnings */}
                      {row.warnings.length > 0 && (
                        <Stack style={{ gap: '4px' }}>
                          <Text style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-yellow10)', textTransform: 'uppercase' }}>
                            Warnings
                          </Text>
                          {row.warnings.map((warning, warnIdx) => (
                            <Row key={warnIdx} style={{ alignItems: 'flex-start', gap: '8px' }}>
                              <Text style={{ fontSize: '14px', color: 'var(--color-yellow7)' }}>*</Text>
                              <Text style={{ fontSize: '14px', color: 'var(--color-yellow9)' }}>
                                <Text style={{ fontWeight: 600 }}>{warning.field}:</Text> {warning.message}
                              </Text>
                            </Row>
                          ))}
                        </Stack>
                      )}

                      {/* Raw Data */}
                      {row.data && (
                        <Stack>
                          <Text style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-gray9)', textTransform: 'uppercase', marginBottom: '4px' }}>
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
                        </Stack>
                      )}
                    </Stack>
                  )}
                </Stack>
              ))}
            </Stack>
          </Card>
        </Stack>

        {/* Cannot Proceed Warning */}
        {!previewData.canProceed && (
          <Card style={{ backgroundColor: 'var(--color-red2)', borderColor: 'var(--color-red5)', borderRadius: '8px', padding: '16px' }}>
            <Row style={{ alignItems: 'center' }}>
              <svg style={{ height: '20px', width: '20px', color: '#F87171' }} fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <Text style={{ marginLeft: '12px', fontSize: '14px', color: 'var(--color-red10)' }}>
                Cannot proceed with import. Please fix all errors and try again.
              </Text>
            </Row>
          </Card>
        )}

        {/* Actions */}
        <Row style={{ justifyContent: 'space-between', paddingTop: '16px', borderTopWidth: '1px', borderColor: 'var(--color-gray6)' }}>
          <Button variant="outlined" onPress={handleReset}>
            Back to Upload
          </Button>
          <Row style={{ gap: '12px' }}>
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
          </Row>
        </Row>
      </Stack>
    );
  };

  const renderResultStep = () => {
    if (!importResult) return null;

    return (
      <Stack style={{ gap: '24px' }}>
        {/* Success/Failure Header */}
        <Card
          style={{
            borderRadius: '8px',
            padding: '24px',
            alignItems: 'center',
            backgroundColor: importResult.success ? 'var(--color-green2)' : 'var(--color-yellow2)',
          }}
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
              <H3 style={{ marginTop: '12px', fontSize: '24px', fontWeight: 500, color: 'var(--color-green11)' }}>Import Successful!</H3>
              <Text style={{ marginTop: '4px', fontSize: '14px', color: 'var(--color-green10)' }}>
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
              <H3 style={{ marginTop: '12px', fontSize: '24px', fontWeight: 500, color: 'var(--color-yellow11)' }}>Import Partially Complete</H3>
              <Text style={{ marginTop: '4px', fontSize: '14px', color: 'var(--color-yellow10)' }}>
                {importResult.successfulImports} succeeded, {importResult.failedImports} failed.
              </Text>
            </>
          )}
        </Card>

        {/* Summary Stats */}
        <Row style={{ flexWrap: 'wrap', gap: '16px' }}>
          <Card style={{ flex: 1, minWidth: '150px', backgroundColor: 'var(--color-gray2)', borderRadius: '8px', padding: '16px', alignItems: 'center' }}>
            <Text style={{ fontSize: '36px', fontWeight: 700, color: 'var(--color-gray12)' }}>
              {importResult.totalAttempted}
            </Text>
            <Text style={{ fontSize: '14px', color: 'var(--color-gray10)' }}>Attempted</Text>
          </Card>
          <Card style={{ flex: 1, minWidth: '150px', backgroundColor: 'var(--color-green2)', borderRadius: '8px', padding: '16px', alignItems: 'center' }}>
            <Text style={{ fontSize: '36px', fontWeight: 700, color: 'var(--color-green9)' }}>
              {importResult.successfulImports}
            </Text>
            <Text style={{ fontSize: '14px', color: 'var(--color-green10)' }}>Succeeded</Text>
          </Card>
          <Card style={{ flex: 1, minWidth: '150px', backgroundColor: 'var(--color-red2)', borderRadius: '8px', padding: '16px', alignItems: 'center' }}>
            <Text style={{ fontSize: '36px', fontWeight: 700, color: 'var(--color-red9)' }}>{importResult.failedImports}</Text>
            <Text style={{ fontSize: '14px', color: 'var(--color-red10)' }}>Failed</Text>
          </Card>
        </Row>

        {/* Errors List */}
        {importResult.errors.length > 0 && (
          <Stack>
            <H4 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-gray12)', marginBottom: '12px' }}>Import Errors</H4>
            <Card style={{ borderColor: 'var(--color-red5)', borderRadius: '8px', overflow: 'hidden' }}>
              <Stack style={{ maxHeight: '256px', overflowY: 'auto' }}>
                {importResult.errors.map((error, idx) => (
                  <Stack
                    key={idx}
                    style={{
                      paddingLeft: '16px',
                      paddingRight: '16px',
                      paddingTop: '12px',
                      paddingBottom: '12px',
                      borderBottomWidth: idx < importResult.errors.length - 1 ? '1px' : '0',
                      borderColor: 'var(--color-red4)',
                      backgroundColor: 'var(--color-red2)',
                    }}
                  >
                    <Row style={{ alignItems: 'flex-start', gap: '12px' }}>
                      <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-red10)' }}>
                        Row {error.rowIndex + 1}
                      </Text>
                      <Text style={{ fontSize: '14px', color: 'var(--color-red9)' }}>
                        <Text style={{ fontWeight: 600 }}>{error.code}:</Text> {error.message}
                      </Text>
                    </Row>
                  </Stack>
                ))}
              </Stack>
            </Card>
          </Stack>
        )}

        {/* Actions */}
        <Row style={{ justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTopWidth: '1px', borderColor: 'var(--color-gray6)' }}>
          <Button variant="outlined" onPress={handleReset}>
            Import More
          </Button>
          {onClose && (
            <Button variant="solid" onPress={onClose}>
              Done
            </Button>
          )}
        </Row>
      </Stack>
    );
  };

  // =============================================================================
  // Main Render
  // =============================================================================

  return (
    <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: '8px' }}>
      {/* Header */}
      <Stack style={{ paddingLeft: '24px', paddingRight: '24px', paddingTop: '16px', paddingBottom: '16px', borderBottomWidth: '1px', borderColor: 'var(--color-gray5)' }}>
        <H3 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-gray12)' }}>Bulk Import Requirements</H3>
        <Text style={{ marginTop: '4px', fontSize: '14px', color: 'var(--color-gray9)' }}>
          Import multiple compliance requirements from a CSV or JSON file.
        </Text>
      </Stack>

      {/* Step Indicator */}
      <Stack style={{ paddingLeft: '24px', paddingRight: '24px', paddingTop: '16px', paddingBottom: '16px', borderBottomWidth: '1px', borderColor: 'var(--color-gray4)', backgroundColor: 'var(--color-gray2)' }}>
        <Row style={{ alignItems: 'center', justifyContent: 'center' }}>
          {(['upload', 'preview', 'result'] as const).map((s, idx) => (
            <Row key={s} style={{ alignItems: 'center' }}>
              {idx > 0 && (
                <Stack
                  style={{
                    width: '48px',
                    height: '2px',
                    marginLeft: '8px',
                    marginRight: '8px',
                    backgroundColor:
                      step === 'preview' || step === 'result' ? 'var(--color-blue9)' : 'var(--color-gray6)',
                  }}
                />
              )}
              <Stack style={{ alignItems: 'center' }}>
                <Stack
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '9999px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    display: 'flex',
                    fontSize: '14px',
                    fontWeight: 500,
                    backgroundColor:
                      step === s
                        ? 'var(--color-blue9)'
                        : (step === 'preview' && s === 'upload') ||
                            (step === 'result' && (s === 'upload' || s === 'preview'))
                          ? 'var(--color-green9)'
                          : 'var(--color-gray5)',
                    color:
                      step === s ||
                      (step === 'preview' && s === 'upload') ||
                      (step === 'result' && (s === 'upload' || s === 'preview'))
                        ? 'var(--color-background)'
                        : 'var(--color-gray10)',
                  }}
                >
                  {(step === 'preview' && s === 'upload') ||
                  (step === 'result' && (s === 'upload' || s === 'preview')) ? (
                    <span>&#10003;</span>
                  ) : (
                    idx + 1
                  )}
                </Stack>
                <Text style={{ marginTop: '4px', fontSize: '12px', color: 'var(--color-gray10)', textTransform: 'capitalize' }}>{s}</Text>
              </Stack>
            </Row>
          ))}
        </Row>
      </Stack>

      {/* Content */}
      <Stack style={{ padding: '24px' }}>
        {step === 'upload' && renderUploadStep()}
        {step === 'preview' && renderPreviewStep()}
        {step === 'result' && renderResultStep()}
      </Stack>
    </Card>
  );
}

export default BulkImportUI;
