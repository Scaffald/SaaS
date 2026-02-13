/**
 * BulkOperationsModal Component
 * Bulk Import/Export UI
 *
 * Modal for bulk operations with:
 * - Import: File upload, format selection, preview, execute
 * - Export: Format selection, filters, download
 */

import React, { useState, useCallback, useRef } from 'react'
import {
  X,
  Upload,
  Download,
  FileText,
  Check,
  AlertCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import {
  Stack,
  Row,
  Text,
  Input,
  Button,
  H2,
} from '@scaffald/ui'
import { trpc } from '../../../lib/trpc'
import { LoadingSpinner } from '../../Common/LoadingSpinner'

// =============================================================================
// Types
// =============================================================================

interface BulkOperationsModalProps {
  organizationId: string
  isOpen: boolean
  mode: 'import' | 'export'
  onClose: () => void
}

type ImportFormat = 'csv' | 'json'
type ExportFormat = 'csv' | 'json' | 'excel'

interface PreviewRow {
  row: number
  data: Record<string, unknown>
  errors: string[]
  warnings: string[]
}

interface ImportPreview {
  totalRows: number
  validRows: number
  errorRows: number
  warningRows: number
  rows: PreviewRow[]
}

// =============================================================================
// Component
// =============================================================================

export function BulkOperationsModal({
  organizationId,
  isOpen,
  mode,
  onClose,
}: BulkOperationsModalProps) {
  // Import state
  const [importFormat, setImportFormat] = useState<ImportFormat>('csv')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)

  // Export state
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [includeDependencies, setIncludeDependencies] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // tRPC mutations
  const importPreviewMutation = trpc.bulkOperations.preview.useMutation()
  const importExecuteMutation = trpc.bulkOperations.execute.useMutation()
  const exportMutation = trpc.bulkOperations.export.useMutation()

  // Reset state on close
  const handleClose = useCallback(() => {
    setImportFile(null)
    setImportPreview(null)
    setImportError(null)
    setImportSuccess(false)
    setExportError(null)
    onClose()
  }, [onClose])

  // Handle file selection
  const handleFileSelect = useCallback(
    async (file: File) => {
      setImportFile(file)
      setImportPreview(null)
      setImportError(null)
      setImportSuccess(false)
      setIsValidating(true)

      try {
        // Read file content
        const content = await file.text()

        // Call preview endpoint
        const result = await importPreviewMutation.mutateAsync({
          organizationId,
          format: importFormat,
          content,
        })

        setImportPreview(result as ImportPreview)
      } catch (error) {
        setImportError(error instanceof Error ? error.message : 'Failed to validate file')
      } finally {
        setIsValidating(false)
      }
    },
    [organizationId, importFormat, importPreviewMutation]
  )

  // Handle import execution
  const handleImport = useCallback(async () => {
    if (!importFile) return

    setIsImporting(true)
    setImportError(null)

    try {
      const content = await importFile.text()

      await importExecuteMutation.mutateAsync({
        organizationId,
        format: importFormat,
        content,
        skipErrors: false,
      })

      setImportSuccess(true)
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Import failed')
    } finally {
      setIsImporting(false)
    }
  }, [organizationId, importFile, importFormat, importExecuteMutation])

  // Handle export
  const handleExport = useCallback(async () => {
    setIsExporting(true)
    setExportError(null)

    try {
      const result = await exportMutation.mutateAsync({
        organizationId,
        format: exportFormat,
        includeArchived,
        includeDependencies,
      })

      // Download the file
      const blob = new Blob([result.content], { type: result.mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      handleClose()
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }, [
    organizationId,
    exportFormat,
    includeArchived,
    includeDependencies,
    exportMutation,
    handleClose,
  ])

  // Download template
  const handleDownloadTemplate = useCallback(() => {
    const headers = [
      'code',
      'name',
      'type',
      'description',
      'status',
      'effective_date',
      'expiration_date',
      'per_occurrence',
      'aggregate',
      'deductible_max',
    ]

    if (importFormat === 'csv') {
      const content = headers.join(',') + '\n'
      const blob = new Blob([content], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'compliance_requirements_template.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else {
      const template = {
        requirements: [
          {
            code: 'GL-001',
            name: 'Example General Liability',
            type: 'general_liability',
            description: 'Example requirement',
            status: 'draft',
            effective_date: new Date().toISOString().split('T')[0],
            coverage_limits: {
              per_occurrence: 1000000,
              aggregate: 2000000,
            },
          },
        ],
      }
      const content = JSON.stringify(template, null, 2)
      const blob = new Blob([content], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'compliance_requirements_template.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }, [importFormat])

  if (!isOpen) return null

  return (
    <Stack
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Backdrop */}
      <Stack
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}
        onPress={handleClose}
      />

      {/* Modal */}
      <Stack
        style={{
          position: 'relative',
          backgroundColor: 'var(--color-background)',
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          width: '100%',
          maxWidth: '42rem',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        {/* Header */}
        <Row
          style={{
            position: 'sticky',
            top: 0,
            backgroundColor: 'var(--color-background)',
            borderBottom: '1px solid var(--color-border)',
            paddingLeft: 24,
            paddingRight: 24,
            paddingTop: 16,
            paddingBottom: 16,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Row style={{ alignItems: 'center', gap: 8 }}>
            {mode === 'import' ? (
              <Upload size={20} style={{ color: 'var(--color-blue-10)' }} />
            ) : (
              <Download size={20} style={{ color: 'var(--color-green-10)' }} />
            )}
            <H2 style={{ fontWeight: 600 }}>
              {mode === 'import' ? 'Import Requirements' : 'Export Requirements'}
            </H2>
          </Row>
          <Button
            variant="ghost"
            style={{ padding: 8, color: 'var(--color-gray-10)', borderRadius: 6 }}
            onPress={handleClose}
          >
            <X size={20} />
          </Button>
        </Row>

        {/* Content */}
        <Stack style={{ padding: 24 }}>
          {mode === 'import' ? (
            /* Import Mode */
            <Stack style={{ gap: 24 }}>
              {importSuccess ? (
                /* Success State */
                <Stack style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 32 }}>
                  <Stack
                    style={{
                      width: 64,
                      height: 64,
                      backgroundColor: 'var(--color-green-2)',
                      borderRadius: '50%',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <Check size={32} style={{ color: 'var(--color-green-10)' }} />
                  </Stack>
                  <Text style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-green-10)', marginBottom: 8 }}>
                    Import Successful!
                  </Text>
                  <Text style={{ color: 'var(--color-gray-11)', marginBottom: 16 }}>
                    {importPreview?.validRows} requirements have been imported.
                  </Text>
                  <Button onPress={handleClose}>Done</Button>
                </Stack>
              ) : (
                <>
                  {/* Format Selection */}
                  <Stack>
                    <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-11)', marginBottom: 8 }}>
                      File Format
                    </Text>
                    <Row style={{ gap: 16 }}>
                      {(['csv', 'json'] as ImportFormat[]).map((format) => (
                        <Button
                          key={format}
                          variant="ghost"
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            paddingLeft: 16,
                            paddingRight: 16,
                            paddingTop: 8,
                            paddingBottom: 8,
                            borderWidth: 1,
                            borderRadius: 12,
                            borderColor: importFormat === format ? 'var(--color-blue-8)' : 'var(--color-gray-8)',
                            backgroundColor: importFormat === format ? 'var(--color-blue-2)' : 'transparent',
                            cursor: 'pointer',
                          }}
                          onPress={() => setImportFormat(format)}
                        >
                          <input
                            type="radio"
                            name="importFormat"
                            value={format}
                            checked={importFormat === format}
                            onChange={() => setImportFormat(format)}
                            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                          />
                          <FileText size={18} />
                          <Text style={{ fontWeight: 600, textTransform: 'uppercase' }}>{format}</Text>
                        </Button>
                      ))}
                    </Row>
                  </Stack>

                  {/* Template Download */}
                  <Row style={{ alignItems: 'center', gap: 8, padding: 12, backgroundColor: 'var(--color-blue-2)', borderRadius: 12 }}>
                    <FileText size={18} style={{ color: 'var(--color-blue-10)' }} />
                    <Text style={{ fontSize: 14, color: 'var(--color-blue-11)' }}>
                      Need a template?{' '}
                      <Button
                        variant="ghost"
                        style={{ textDecoration: 'underline', padding: 0 }}
                        onPress={handleDownloadTemplate}
                      >
                        <Text>Download {importFormat.toUpperCase()} template</Text>
                      </Button>
                    </Text>
                  </Row>

                  {/* File Upload */}
                  <Stack>
                    <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-11)', marginBottom: 8 }}>
                      Upload File
                    </Text>
                    <Stack
                      style={{
                        borderWidth: 2,
                        borderStyle: 'dashed',
                        borderColor: 'var(--color-gray-8)',
                        borderRadius: 12,
                        padding: 32,
                        alignItems: 'center',
                        cursor: 'pointer',
                      }}
                      onPress={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={importFormat === 'csv' ? '.csv' : '.json'}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileSelect(file)
                        }}
                        style={{ display: 'none' }}
                      />
                      {importFile ? (
                        <Row style={{ alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <FileText size={24} style={{ color: 'var(--color-blue-10)' }} />
                          <Text style={{ fontWeight: 600 }}>{importFile.name}</Text>
                        </Row>
                      ) : (
                        <Stack style={{ alignItems: 'center' }}>
                          <Stack style={{ marginBottom: 8 }}>
                            <Upload size={32} style={{ color: 'var(--color-gray-10)' }} />
                          </Stack>
                          <Text style={{ color: 'var(--color-gray-11)' }}>Click to select a file or drag and drop</Text>
                          <Text style={{ fontSize: 12, color: 'var(--color-gray-10)', marginTop: 4 }}>
                            {importFormat.toUpperCase()} files only
                          </Text>
                        </Stack>
                      )}
                    </Stack>
                  </Stack>

                  {/* Validation Progress */}
                  {isValidating && (
                    <Row style={{ alignItems: 'center', gap: 8, color: 'var(--color-gray-11)' }}>
                      <Loader2 size={18} className="animate-spin" />
                      <Text>Validating file...</Text>
                    </Row>
                  )}

                  {/* Error */}
                  {importError && (
                    <Row
                      style={{
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: 16,
                        backgroundColor: 'var(--color-red-2)',
                        borderWidth: 1,
                        borderColor: 'var(--color-red-6)',
                        borderRadius: 12,
                        color: 'var(--color-red-10)',
                      }}
                    >
                      <Stack style={{ flexShrink: 0, marginTop: 2 }}>
                        <AlertCircle size={20} style={{ color: 'var(--color-red-10)' }} />
                      </Stack>
                      <Stack>
                        <Text style={{ fontWeight: 600 }}>Validation Error</Text>
                        <Text style={{ fontSize: 14 }}>{importError}</Text>
                      </Stack>
                    </Row>
                  )}

                  {/* Preview */}
                  {importPreview && (
                    <Stack style={{ gap: 16 }}>
                      <Text style={{ fontWeight: 600 }}>Preview</Text>

                      {/* Summary */}
                      <Row style={{ gap: 16, flexWrap: 'wrap' }}>
                        <Stack style={{ flex: 1, minWidth: 120, padding: 12, backgroundColor: 'var(--color-gray-2)', borderRadius: 12, alignItems: 'center' }}>
                          <Text style={{ fontSize: 28, fontWeight: 700 }}>{importPreview.totalRows}</Text>
                          <Text style={{ fontSize: 14, color: 'var(--color-gray-11)' }}>Total Rows</Text>
                        </Stack>
                        <Stack style={{ flex: 1, minWidth: 120, padding: 12, backgroundColor: 'var(--color-green-2)', borderRadius: 12, alignItems: 'center' }}>
                          <Text style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-green-10)' }}>
                            {importPreview.validRows}
                          </Text>
                          <Text style={{ fontSize: 14, color: 'var(--color-green-10)' }}>Valid</Text>
                        </Stack>
                        <Stack style={{ flex: 1, minWidth: 120, padding: 12, backgroundColor: 'var(--color-yellow-2)', borderRadius: 12, alignItems: 'center' }}>
                          <Text style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-yellow-10)' }}>
                            {importPreview.warningRows}
                          </Text>
                          <Text style={{ fontSize: 14, color: 'var(--color-yellow-10)' }}>Warnings</Text>
                        </Stack>
                        <Stack style={{ flex: 1, minWidth: 120, padding: 12, backgroundColor: 'var(--color-red-2)', borderRadius: 12, alignItems: 'center' }}>
                          <Text style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-red-10)' }}>
                            {importPreview.errorRows}
                          </Text>
                          <Text style={{ fontSize: 14, color: 'var(--color-red-10)' }}>Errors</Text>
                        </Stack>
                      </Row>

                      {/* Row Details */}
                      {importPreview.rows.filter(
                        (r) => r.errors.length > 0 || r.warnings.length > 0
                      ).length > 0 && (
                        <Stack style={{ maxHeight: '12rem', overflow: 'auto', borderWidth: 1, borderColor: 'var(--color-border)', borderRadius: 12 }}>
                          {importPreview.rows
                            .filter((r) => r.errors.length > 0 || r.warnings.length > 0)
                            .map((row) => (
                              <Stack
                                key={row.row}
                                style={{
                                  padding: 12,
                                  borderBottom: '1px solid var(--color-border)',
                                  backgroundColor: row.errors.length > 0 ? 'var(--color-red-2)' : 'var(--color-yellow-2)',
                                }}
                              >
                                <Text style={{ fontWeight: 600, fontSize: 14 }}>Row {row.row}</Text>
                                {row.errors.map((err, i) => (
                                  <Row key={i} style={{ alignItems: 'center', gap: 4, marginTop: 4 }}>
                                    <AlertCircle size={14} style={{ color: 'var(--color-red-10)' }} />
                                    <Text style={{ fontSize: 14, color: 'var(--color-red-10)' }}>{err}</Text>
                                  </Row>
                                ))}
                                {row.warnings.map((warn, i) => (
                                  <Row key={i} style={{ alignItems: 'center', gap: 4, marginTop: 4 }}>
                                    <AlertTriangle size={14} style={{ color: 'var(--color-yellow-10)' }} />
                                    <Text style={{ fontSize: 14, color: 'var(--color-yellow-10)' }}>{warn}</Text>
                                  </Row>
                                ))}
                              </Stack>
                            ))}
                        </Stack>
                      )}
                    </Stack>
                  )}
                </>
              )}
            </Stack>
          ) : (
            /* Export Mode */
            <Stack style={{ gap: 24 }}>
              {/* Format Selection */}
              <Stack>
                <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-11)', marginBottom: 8 }}>
                  Export Format
                </Text>
                <Row style={{ gap: 16 }}>
                  {(['csv', 'json', 'excel'] as ExportFormat[]).map((format) => (
                    <Button
                      key={format}
                      variant="ghost"
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        paddingLeft: 16,
                        paddingRight: 16,
                        paddingTop: 8,
                        paddingBottom: 8,
                        borderWidth: 1,
                        borderRadius: 12,
                        borderColor: exportFormat === format ? 'var(--color-green-8)' : 'var(--color-gray-8)',
                        backgroundColor: exportFormat === format ? 'var(--color-green-2)' : 'transparent',
                        cursor: 'pointer',
                      }}
                      onPress={() => setExportFormat(format)}
                    >
                      <input
                        type="radio"
                        name="exportFormat"
                        value={format}
                        checked={exportFormat === format}
                        onChange={() => setExportFormat(format)}
                        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                      />
                      <FileText size={18} />
                      <Text style={{ fontWeight: 600, textTransform: 'uppercase' }}>{format}</Text>
                    </Button>
                  ))}
                </Row>
              </Stack>

              {/* Options */}
              <Stack style={{ gap: 12 }}>
                <Row style={{ alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includeArchived}
                    onChange={(e) => setIncludeArchived(e.target.checked)}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      border: '1px solid var(--color-gray-8)',
                    }}
                  />
                  <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>Include archived requirements</Text>
                </Row>
                <Row style={{ alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includeDependencies}
                    onChange={(e) => setIncludeDependencies(e.target.checked)}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      border: '1px solid var(--color-gray-8)',
                    }}
                  />
                  <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>Include dependency relationships</Text>
                </Row>
              </Stack>

              {/* Error */}
              {exportError && (
                <Row
                  style={{
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: 16,
                    backgroundColor: 'var(--color-red-2)',
                    borderWidth: 1,
                    borderColor: 'var(--color-red-6)',
                    borderRadius: 12,
                    color: 'var(--color-red-10)',
                  }}
                >
                  <Stack style={{ flexShrink: 0, marginTop: 2 }}>
                    <AlertCircle size={20} style={{ color: 'var(--color-red-10)' }} />
                  </Stack>
                  <Stack>
                    <Text style={{ fontWeight: 600 }}>Export Error</Text>
                    <Text style={{ fontSize: 14 }}>{exportError}</Text>
                  </Stack>
                </Row>
              )}
            </Stack>
          )}
        </Stack>

        {/* Footer */}
        {!importSuccess && (
          <Row
            style={{
              position: 'sticky',
              bottom: 0,
              backgroundColor: 'var(--color-background)',
              borderTop: '1px solid var(--color-border)',
              paddingLeft: 24,
              paddingRight: 24,
              paddingTop: 16,
              paddingBottom: 16,
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 12,
            }}
          >
            <Button
              variant="ghost"
              style={{
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 8,
                paddingBottom: 8,
                color: 'var(--color-gray-12)',
                borderRadius: 12,
              }}
              onPress={handleClose}
            >
              <Text>Cancel</Text>
            </Button>
            {mode === 'import' ? (
              <Button
                onPress={handleImport}
                disabled={!importPreview || importPreview.errorRows > 0 || isImporting}
              >
                {isImporting ? (
                  <Row style={{ alignItems: 'center', gap: 8 }}>
                    <LoadingSpinner size="sm" />
                    <Text>Importing...</Text>
                  </Row>
                ) : (
                  <Row style={{ alignItems: 'center', gap: 4 }}>
                    <Upload size={16} />
                    <Text>Import {importPreview?.validRows ?? 0} Requirements</Text>
                  </Row>
                )}
              </Button>
            ) : (
              <Button onPress={handleExport} disabled={isExporting}>
                {isExporting ? (
                  <Row style={{ alignItems: 'center', gap: 8 }}>
                    <LoadingSpinner size="sm" />
                    <Text>Exporting...</Text>
                  </Row>
                ) : (
                  <Row style={{ alignItems: 'center', gap: 4 }}>
                    <Download size={16} />
                    <Text>Export Requirements</Text>
                  </Row>
                )}
              </Button>
            )}
          </Row>
        )}
      </Stack>
    </Stack>
  )
}

export default BulkOperationsModal
