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
import { trpc } from '../../../lib/trpc'
import { Button } from '../../Common/Button'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mode === 'import' ? (
              <Upload size={20} className="text-blue-500" />
            ) : (
              <Download size={20} className="text-green-500" />
            )}
            <h2 className="text-xl font-semibold">
              {mode === 'import' ? 'Import Requirements' : 'Export Requirements'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === 'import' ? (
            /* Import Mode */
            <div className="space-y-6">
              {importSuccess ? (
                /* Success State */
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} className="text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-600 mb-2">Import Successful!</h3>
                  <p className="text-gray-600 mb-4">
                    {importPreview?.validRows} requirements have been imported.
                  </p>
                  <Button onClick={handleClose}>Done</Button>
                </div>
              ) : (
                <>
                  {/* Format Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      File Format
                    </label>
                    <div className="flex gap-4">
                      {(['csv', 'json'] as ImportFormat[]).map((format) => (
                        <label
                          key={format}
                          className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer ${
                            importFormat === format
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="importFormat"
                            value={format}
                            checked={importFormat === format}
                            onChange={() => setImportFormat(format)}
                            className="sr-only"
                          />
                          <FileText size={18} />
                          <span className="font-medium uppercase">{format}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Template Download */}
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <FileText size={18} className="text-blue-500" />
                    <span className="text-sm text-blue-700">
                      Need a template?{' '}
                      <button
                        onClick={handleDownloadTemplate}
                        className="underline hover:no-underline"
                      >
                        Download {importFormat.toUpperCase()} template
                      </button>
                    </span>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload File
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={importFormat === 'csv' ? '.csv' : '.json'}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileSelect(file)
                        }}
                        className="hidden"
                      />
                      {importFile ? (
                        <div className="flex items-center justify-center gap-2">
                          <FileText size={24} className="text-blue-500" />
                          <span className="font-medium">{importFile.name}</span>
                        </div>
                      ) : (
                        <>
                          <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-600">Click to select a file or drag and drop</p>
                          <p className="text-sm text-gray-400 mt-1">
                            {importFormat.toUpperCase()} files only
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Validation Progress */}
                  {isValidating && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Loader2 size={18} className="animate-spin" />
                      Validating file...
                    </div>
                  )}

                  {/* Error */}
                  {importError && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                      <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Validation Error</p>
                        <p className="text-sm">{importError}</p>
                      </div>
                    </div>
                  )}

                  {/* Preview */}
                  {importPreview && (
                    <div className="space-y-4">
                      <h3 className="font-semibold">Preview</h3>

                      {/* Summary */}
                      <div className="grid grid-cols-4 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg text-center">
                          <div className="text-2xl font-bold">{importPreview.totalRows}</div>
                          <div className="text-sm text-gray-600">Total Rows</div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {importPreview.validRows}
                          </div>
                          <div className="text-sm text-green-600">Valid</div>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded-lg text-center">
                          <div className="text-2xl font-bold text-yellow-600">
                            {importPreview.warningRows}
                          </div>
                          <div className="text-sm text-yellow-600">Warnings</div>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {importPreview.errorRows}
                          </div>
                          <div className="text-sm text-red-600">Errors</div>
                        </div>
                      </div>

                      {/* Row Details */}
                      {importPreview.rows.filter(
                        (r) => r.errors.length > 0 || r.warnings.length > 0
                      ).length > 0 && (
                        <div className="max-h-48 overflow-y-auto border rounded-lg">
                          {importPreview.rows
                            .filter((r) => r.errors.length > 0 || r.warnings.length > 0)
                            .map((row) => (
                              <div
                                key={row.row}
                                className={`p-3 border-b last:border-b-0 ${
                                  row.errors.length > 0 ? 'bg-red-50' : 'bg-yellow-50'
                                }`}
                              >
                                <div className="font-medium text-sm">Row {row.row}</div>
                                {row.errors.map((err, i) => (
                                  <div
                                    key={i}
                                    className="text-sm text-red-600 flex items-center gap-1"
                                  >
                                    <AlertCircle size={14} /> {err}
                                  </div>
                                ))}
                                {row.warnings.map((warn, i) => (
                                  <div
                                    key={i}
                                    className="text-sm text-yellow-600 flex items-center gap-1"
                                  >
                                    <AlertTriangle size={14} /> {warn}
                                  </div>
                                ))}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Export Mode */
            <div className="space-y-6">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <div className="flex gap-4">
                  {(['csv', 'json', 'excel'] as ExportFormat[]).map((format) => (
                    <label
                      key={format}
                      className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer ${
                        exportFormat === format
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="exportFormat"
                        value={format}
                        checked={exportFormat === format}
                        onChange={() => setExportFormat(format)}
                        className="sr-only"
                      />
                      <FileText size={18} />
                      <span className="font-medium uppercase">{format}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeArchived}
                    onChange={(e) => setIncludeArchived(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Include archived requirements</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDependencies}
                    onChange={(e) => setIncludeDependencies(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Include dependency relationships</span>
                </label>
              </div>

              {/* Error */}
              {exportError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Export Error</p>
                    <p className="text-sm">{exportError}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!importSuccess && (
          <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            {mode === 'import' ? (
              <Button
                onClick={handleImport}
                disabled={!importPreview || importPreview.errorRows > 0 || isImporting}
              >
                {isImporting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload size={16} className="mr-1" />
                    Import {importPreview?.validRows ?? 0} Requirements
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download size={16} className="mr-1" />
                    Export Requirements
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default BulkOperationsModal
