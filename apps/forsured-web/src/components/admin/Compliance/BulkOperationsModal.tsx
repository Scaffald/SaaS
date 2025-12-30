/**
 * BulkOperationsModal Component
 * REQ-2: Bulk Import/Export UI
 *
 * Modal for bulk operations with:
 * - Import: File upload, format selection, preview, execute
 * - Export: Format selection, filters, download
 */

import { useState, useCallback, useRef } from 'react'
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
  YStack,
  XStack,
  Text,
  Input,
  Button,
  H2,
} from '@unicornlove/ui'
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
    <YStack
      position="fixed"
      inset={0}
      zIndex={50}
      alignItems="center"
      justifyContent="center"
    >
      {/* Backdrop */}
      <YStack
        position="absolute"
        inset={0}
        backgroundColor="rgba(0,0,0,0.5)"
        onPress={handleClose}
      />

      {/* Modal */}
      <YStack
        position="relative"
        backgroundColor="$background"
        borderRadius="$4"
        elevation={4}
        width="100%"
        maxWidth="42rem"
        maxHeight="90vh"
        overflow="scroll"
      >
        {/* Header */}
        <XStack
          position="sticky"
          top={0}
          backgroundColor="$background"
          borderBottomWidth={1}
          borderColor="$borderColor"
          paddingHorizontal="$6"
          paddingVertical="$4"
          alignItems="center"
          justifyContent="space-between"
        >
          <XStack alignItems="center" gap="$2">
            {mode === 'import' ? (
              <Upload size={20} style={{ color: 'var(--color-blue-10)' }} />
            ) : (
              <Download size={20} style={{ color: 'var(--color-green-10)' }} />
            )}
            <H2 fontWeight="600">
              {mode === 'import' ? 'Import Requirements' : 'Export Requirements'}
            </H2>
          </XStack>
          <Button
            unstyled
            padding="$2"
            color="$gray10"
            hoverStyle={{ color: '$gray12', backgroundColor: '$gray2' }}
            borderRadius="$2"
            onPress={handleClose}
          >
            <X size={20} />
          </Button>
        </XStack>

        {/* Content */}
        <YStack padding="$6">
          {mode === 'import' ? (
            /* Import Mode */
            <YStack gap="$6">
              {importSuccess ? (
                /* Success State */
                <YStack alignItems="center" paddingVertical="$8">
                  <YStack
                    width={64}
                    height={64}
                    backgroundColor="$green2"
                    borderRadius={9999}
                    alignItems="center"
                    justifyContent="center"
                    mb="$4"
                  >
                    <Check size={32} style={{ color: 'var(--color-green-10)' }} />
                  </YStack>
                  <Text fontSize="$5" fontWeight="600" color="$green10" mb="$2">
                    Import Successful!
                  </Text>
                  <Text color="$gray11" mb="$4">
                    {importPreview?.validRows} requirements have been imported.
                  </Text>
                  <Button onPress={handleClose}>Done</Button>
                </YStack>
              ) : (
                <>
                  {/* Format Selection */}
                  <YStack>
                    <Text fontSize="$3" fontWeight="600" color="$color11" mb="$2">
                      File Format
                    </Text>
                    <XStack gap="$4">
                      {(['csv', 'json'] as ImportFormat[]).map((format) => (
                        <Button
                          key={format}
                          unstyled
                          flexDirection="row"
                          alignItems="center"
                          gap="$2"
                          paddingHorizontal="$4"
                          paddingVertical="$2"
                          borderWidth={1}
                          borderRadius="$4"
                          borderColor={importFormat === format ? '$blue8' : '$gray8'}
                          backgroundColor={importFormat === format ? '$blue2' : 'transparent'}
                          hoverStyle={{ backgroundColor: '$gray2' }}
                          cursor="pointer"
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
                          <Text fontWeight="600" textTransform="uppercase">{format}</Text>
                        </Button>
                      ))}
                    </XStack>
                  </YStack>

                  {/* Template Download */}
                  <XStack alignItems="center" gap="$2" padding="$3" backgroundColor="$blue2" borderRadius="$4">
                    <FileText size={18} style={{ color: 'var(--color-blue-10)' }} />
                    <Text fontSize="$3" color="$blue11">
                      Need a template?{' '}
                      <Button
                        unstyled
                        textDecorationLine="underline"
                        hoverStyle={{ textDecorationLine: 'none' }}
                        onPress={handleDownloadTemplate}
                      >
                        <Text>Download {importFormat.toUpperCase()} template</Text>
                      </Button>
                    </Text>
                  </XStack>

                  {/* File Upload */}
                  <YStack>
                    <Text fontSize="$3" fontWeight="600" color="$color11" mb="$2">
                      Upload File
                    </Text>
                    <YStack
                      borderWidth={2}
                      borderStyle="dashed"
                      borderColor="$gray8"
                      borderRadius="$4"
                      padding="$8"
                      alignItems="center"
                      cursor="pointer"
                      hoverStyle={{ borderColor: '$blue8', backgroundColor: '$blue2' }}
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
                        <XStack alignItems="center" justifyContent="center" gap="$2">
                          <FileText size={24} style={{ color: 'var(--color-blue-10)' }} />
                          <Text fontWeight="600">{importFile.name}</Text>
                        </XStack>
                      ) : (
                        <YStack alignItems="center">
                          <YStack mb="$2">
                            <Upload size={32} style={{ color: 'var(--color-gray-10)' }} />
                          </YStack>
                          <Text color="$gray11">Click to select a file or drag and drop</Text>
                          <Text fontSize="$2" color="$gray10" mt="$1">
                            {importFormat.toUpperCase()} files only
                          </Text>
                        </YStack>
                      )}
                    </YStack>
                  </YStack>

                  {/* Validation Progress */}
                  {isValidating && (
                    <XStack alignItems="center" gap="$2" color="$gray11">
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      <Text>Validating file...</Text>
                    </XStack>
                  )}

                  {/* Error */}
                  {importError && (
                    <XStack
                      alignItems="flex-start"
                      gap="$3"
                      padding="$4"
                      backgroundColor="$red2"
                      borderWidth={1}
                      borderColor="$red6"
                      borderRadius="$4"
                      color="$red10"
                    >
                      <YStack flexShrink={0} mt="$0.5">
                        <AlertCircle size={20} style={{ color: 'var(--color-red-10)' }} />
                      </YStack>
                      <YStack>
                        <Text fontWeight="600">Validation Error</Text>
                        <Text fontSize="$3">{importError}</Text>
                      </YStack>
                    </XStack>
                  )}

                  {/* Preview */}
                  {importPreview && (
                    <YStack gap="$4">
                      <Text fontWeight="600">Preview</Text>

                      {/* Summary */}
                      <XStack gap="$4" flexWrap="wrap">
                        <YStack flex={1} minWidth="120px" padding="$3" backgroundColor="$gray2" borderRadius="$4" alignItems="center">
                          <Text fontSize="$9" fontWeight="700">{importPreview.totalRows}</Text>
                          <Text fontSize="$3" color="$gray11">Total Rows</Text>
                        </YStack>
                        <YStack flex={1} minWidth="120px" padding="$3" backgroundColor="$green2" borderRadius="$4" alignItems="center">
                          <Text fontSize="$9" fontWeight="700" color="$green10">
                            {importPreview.validRows}
                          </Text>
                          <Text fontSize="$3" color="$green10">Valid</Text>
                        </YStack>
                        <YStack flex={1} minWidth="120px" padding="$3" backgroundColor="$yellow2" borderRadius="$4" alignItems="center">
                          <Text fontSize="$9" fontWeight="700" color="$yellow10">
                            {importPreview.warningRows}
                          </Text>
                          <Text fontSize="$3" color="$yellow10">Warnings</Text>
                        </YStack>
                        <YStack flex={1} minWidth="120px" padding="$3" backgroundColor="$red2" borderRadius="$4" alignItems="center">
                          <Text fontSize="$9" fontWeight="700" color="$red10">
                            {importPreview.errorRows}
                          </Text>
                          <Text fontSize="$3" color="$red10">Errors</Text>
                        </YStack>
                      </XStack>

                      {/* Row Details */}
                      {importPreview.rows.filter(
                        (r) => r.errors.length > 0 || r.warnings.length > 0
                      ).length > 0 && (
                        <YStack maxHeight="12rem" overflow="scroll" borderWidth={1} borderColor="$borderColor" borderRadius="$4">
                          {importPreview.rows
                            .filter((r) => r.errors.length > 0 || r.warnings.length > 0)
                            .map((row) => (
                              <YStack
                                key={row.row}
                                padding="$3"
                                borderBottomWidth={1}
                                borderColor="$borderColor"
                                backgroundColor={row.errors.length > 0 ? '$red2' : '$yellow2'}
                              >
                                <Text fontWeight="600" fontSize="$3">Row {row.row}</Text>
                                {row.errors.map((err, i) => (
                                  <XStack key={i} alignItems="center" gap="$1" mt="$1">
                                    <AlertCircle size={14} style={{ color: 'var(--color-red-10)' }} />
                                    <Text fontSize="$3" color="$red10">{err}</Text>
                                  </XStack>
                                ))}
                                {row.warnings.map((warn, i) => (
                                  <XStack key={i} alignItems="center" gap="$1" mt="$1">
                                    <AlertTriangle size={14} style={{ color: 'var(--color-yellow-10)' }} />
                                    <Text fontSize="$3" color="$yellow10">{warn}</Text>
                                  </XStack>
                                ))}
                              </YStack>
                            ))}
                        </YStack>
                      )}
                    </YStack>
                  )}
                </>
              )}
            </YStack>
          ) : (
            /* Export Mode */
            <YStack gap="$6">
              {/* Format Selection */}
              <YStack>
                <Text fontSize="$3" fontWeight="600" color="$color11" mb="$2">
                  Export Format
                </Text>
                <XStack gap="$4">
                  {(['csv', 'json', 'excel'] as ExportFormat[]).map((format) => (
                    <Button
                      key={format}
                      unstyled
                      flexDirection="row"
                      alignItems="center"
                      gap="$2"
                      paddingHorizontal="$4"
                      paddingVertical="$2"
                      borderWidth={1}
                      borderRadius="$4"
                      borderColor={exportFormat === format ? '$green8' : '$gray8'}
                      backgroundColor={exportFormat === format ? '$green2' : 'transparent'}
                      hoverStyle={{ backgroundColor: '$gray2' }}
                      cursor="pointer"
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
                      <Text fontWeight="600" textTransform="uppercase">{format}</Text>
                    </Button>
                  ))}
                </XStack>
              </YStack>

              {/* Options */}
              <YStack gap="$3">
                <XStack alignItems="center" gap="$2" cursor="pointer">
                  <input
                    type="checkbox"
                    checked={includeArchived}
                    onChange={(e) => setIncludeArchived(e.target.checked)}
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      border: '1px solid var(--color-gray-8)',
                    }}
                  />
                  <Text fontSize="$3" color="$color11">Include archived requirements</Text>
                </XStack>
                <XStack alignItems="center" gap="$2" cursor="pointer">
                  <input
                    type="checkbox"
                    checked={includeDependencies}
                    onChange={(e) => setIncludeDependencies(e.target.checked)}
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      border: '1px solid var(--color-gray-8)',
                    }}
                  />
                  <Text fontSize="$3" color="$color11">Include dependency relationships</Text>
                </XStack>
              </YStack>

              {/* Error */}
              {exportError && (
                <XStack
                  alignItems="flex-start"
                  gap="$3"
                  padding="$4"
                  backgroundColor="$red2"
                  borderWidth={1}
                  borderColor="$red6"
                  borderRadius="$4"
                  color="$red10"
                >
                  <YStack flexShrink={0} mt="$0.5">
                    <AlertCircle size={20} style={{ color: 'var(--color-red-10)' }} />
                  </YStack>
                  <YStack>
                    <Text fontWeight="600">Export Error</Text>
                    <Text fontSize="$3">{exportError}</Text>
                  </YStack>
                </XStack>
              )}
            </YStack>
          )}
        </YStack>

        {/* Footer */}
        {!importSuccess && (
          <XStack
            position="sticky"
            bottom={0}
            backgroundColor="$background"
            borderTopWidth={1}
            borderColor="$borderColor"
            paddingHorizontal="$6"
            paddingVertical="$4"
            alignItems="center"
            justifyContent="flex-end"
            gap="$3"
          >
            <Button
              unstyled
              paddingHorizontal="$4"
              paddingVertical="$2"
              color="$gray12"
              hoverStyle={{ backgroundColor: '$gray2' }}
              borderRadius="$4"
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
                  <XStack alignItems="center" gap="$2">
                    <LoadingSpinner size="sm" />
                    <Text>Importing...</Text>
                  </XStack>
                ) : (
                  <XStack alignItems="center" gap="$1">
                    <Upload size={16} />
                    <Text>Import {importPreview?.validRows ?? 0} Requirements</Text>
                  </XStack>
                )}
              </Button>
            ) : (
              <Button onPress={handleExport} disabled={isExporting}>
                {isExporting ? (
                  <XStack alignItems="center" gap="$2">
                    <LoadingSpinner size="sm" />
                    <Text>Exporting...</Text>
                  </XStack>
                ) : (
                  <XStack alignItems="center" gap="$1">
                    <Download size={16} />
                    <Text>Export Requirements</Text>
                  </XStack>
                )}
              </Button>
            )}
          </XStack>
        )}
      </YStack>
    </YStack>
  )
}

export default BulkOperationsModal
