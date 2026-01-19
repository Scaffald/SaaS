import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  lazy,
  Suspense,
  startTransition,
} from 'react'
import {
  FileText,
  Upload,
  Download,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Eye,
  RefreshCw,
} from 'lucide-react'
import { Stack, Row, Text, Card, Button, H1, Spinner, Grid } from '@unicornlove/beyond-ui'
import CommonButton from '../Common/Button'
import DocumentDetailModal from '../Document/DocumentDetailModal'
// Modal import removed - using simple overlay to avoid ResponsiveModal freeze issue
import { useUser } from '../../contexts/UserContext'
import { useAuth } from '../../contexts/AuthContext'
import { DocumentService } from '../../lib/documents/documentService'
import { scaffaldClient } from '../../lib/scaffald/client'
import { getUserOrganizationId } from '../../lib/supabase'
import type { Document } from '../../types/document'

// Lazy load FileUploadZone to prevent blocking when modal opens
const FileUploadZone = lazy(() =>
  import('../documents/FileUploadZone').then((module) => ({ default: module.FileUploadZone }))
)

interface DocumentItem {
  id: string
  name: string
  type: 'coi' | 'license' | 'bond' | 'certification' | 'w9' | 'contract'
  status: 'verified' | 'pending' | 'expired' | 'expiring'
  uploadDate: string
  expiryDate?: string
  fileSize: string
  uploadedBy: string
}

const getStatusIconStyle = (status: string): React.CSSProperties => {
  switch (status) {
    case 'verified':
      return { color: 'var(--color-green-10)' }
    case 'expiring':
    case 'expired':
      return { color: 'var(--color-orange-10)' }
    case 'pending':
      return { color: 'var(--color-blue-10)' }
    default:
      return {}
  }
}

export default function DocumentsPage() {
  const { currentUser } = useUser()
  const { user, profile } = useAuth()
  const [filter, setFilter] = useState<'all' | 'verified' | 'pending' | 'expiring'>('all')
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Use useRef to maintain a stable DocumentService instance
  const documentServiceRef = useRef<DocumentService | null>(null)
  if (!documentServiceRef.current) {
    documentServiceRef.current = new DocumentService()
  }
  const documentService = documentServiceRef.current

  // Use ref to track loading state to prevent infinite loops
  const isLoadingRef = useRef(false)

  // Get user ID from auth context
  const userId = useMemo(() => currentUser?.id ?? user?.id ?? null, [currentUser?.id, user?.id])

  // State for organization ID - fetched from role_assignments
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [orgLoading, setOrgLoading] = useState(true)

  // Fetch organization ID from role_assignments when user is available
  useEffect(() => {
    async function fetchOrganization() {
      if (!userId) {
        setOrgLoading(false)
        return
      }

      try {
        const orgId = await getUserOrganizationId(userId)
        console.log('[DocumentsPage] Fetched organization ID:', orgId, 'for user:', userId)
        setOrganizationId(orgId)
      } catch (error) {
        console.error('[DocumentsPage] Error fetching organization:', error)
      } finally {
        setOrgLoading(false)
      }
    }

    fetchOrganization()
  }, [userId])

  // Convert real documents to display format - memoized to prevent recalculation
  const displayDocuments: DocumentItem[] = useMemo(() => {
    return documents.map((doc) => ({
      id: doc.id,
      name: doc.filename,
      type: doc.docType as any,
      status: doc.status as any,
      uploadDate: doc.uploadedAt,
      expiryDate: doc.expiresAt || undefined,
      fileSize: `${(doc.fileSize / 1024).toFixed(1)} KB`,
      uploadedBy: doc.uploadedBy || 'Unknown',
    }))
  }, [documents])

  const filteredDocuments = useMemo(() => {
    if (filter === 'all') return displayDocuments
    return displayDocuments.filter((doc) => doc.status === filter)
  }, [displayDocuments, filter])

  const stats = useMemo(
    () => ({
      total: displayDocuments.length,
      verified: displayDocuments.filter((d) => d.status === 'verified').length,
      pending: displayDocuments.filter((d) => d.status === 'pending').length,
      expiring: displayDocuments.filter((d) => d.status === 'expiring' || d.status === 'expired')
        .length,
    }),
    [displayDocuments]
  )

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      coi: 'Certificate of Insurance',
      license: 'License',
      bond: 'Bond',
      certification: 'Certification',
      w9: 'Tax Form',
      contract: 'Contract',
    }
    return labels[type] || type
  }

  const getStatusIcon = (status: string) => {
    const iconStyle = getStatusIconStyle(status)
    switch (status) {
      case 'verified':
        return <CheckCircle style={iconStyle} size={20} />
      case 'expiring':
      case 'expired':
        return <AlertTriangle style={iconStyle} size={20} />
      case 'pending':
        return <Calendar style={iconStyle} size={20} />
      default:
        return null
    }
  }

  const getDaysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return null
    const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days
  }

  // Load documents from Scaffald API
  const loadDocuments = useCallback(async () => {
    if (!organizationId) {
      console.log('[DocumentsPage] No organization ID, skipping document load')
      return
    }

    // Prevent multiple simultaneous loads
    if (isLoadingRef.current) {
      console.log('[DocumentsPage] Load already in progress, skipping')
      return
    }

    try {
      isLoadingRef.current = true
      setLoading(true)
      setLoadError(null)
      console.log('[DocumentsPage] Loading documents for organization:', organizationId)

      // Fetch documents from Scaffald API
      const response = await scaffaldClient.documents.list({
        organizationId,
        category: 'compliance', // Focus on compliance documents (COIs, insurance)
        limit: 100,
      })

      console.log('[DocumentsPage] Loaded documents:', response.documents?.length || 0)

      // Map Scaffald documents to our Document type
      const mappedDocs: Document[] = (response.documents || []).map((doc) => ({
        id: doc.id,
        filename: doc.name,
        docType: 'coi' as const, // Default to COI for insurance documents
        status: 'pending', // Default status
        clientId: organizationId || '',
        clientName: '',
        clientType: 'contractor',
        projectId: null,
        projectName: null,
        contentPreview: null,
        fileSize: doc.latestSizeBytes || 0,
        mimeType: doc.latestMimeType || 'application/pdf',
        uploadedBy: userId || '',
        uploadedAt: doc.createdAt,
        verifiedAt: null,
        expiresAt: null,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }))

      setDocuments(mappedDocs)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load documents'
      console.error('[DocumentsPage] Error loading documents:', errorMessage)
      setLoadError(errorMessage)
    } finally {
      isLoadingRef.current = false
      setLoading(false)
    }
  }, [organizationId, userId])

  // Load documents on mount and when organization changes
  // Use primitive values in dependency array to prevent infinite loops
  useEffect(() => {
    if (organizationId) {
      loadDocuments()
    } else {
      // If no organization ID, set loading to false so page can render
      setLoading(false)
      console.log('[DocumentsPage] No organization ID available')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId])

  const handleUploadDocument = useCallback(
    async (document: Document) => {
      console.log('[DocumentsPage] Document uploaded successfully:', document.id)
      setUploadSuccess('Document uploaded successfully!')

      // Clear success message after 3 seconds
      setTimeout(() => {
        setUploadSuccess(null)
      }, 3000)

      // Refresh document list to show the newly uploaded document
      await loadDocuments()
    },
    [loadDocuments]
  )

  const handleUploadError = useCallback((error: string) => {
    setUploadError(error)
    console.error('[DocumentsPage] Upload error:', error)

    // Clear error after 5 seconds
    setTimeout(() => {
      setUploadError(null)
    }, 5000)
  }, [])

  // Memoize modal close handler to prevent re-renders
  const handleModalClose = useCallback(() => {
    setUploadModalOpen(false)
    setUploadError(null)
  }, [])

  const getFilterButtonStyle = (isActive: boolean): React.CSSProperties => ({
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 14,
    fontWeight: 500,
    borderRadius: 8,
    backgroundColor: isActive ? 'var(--color-blue-9)' : 'var(--color-gray-3)',
    color: isActive ? 'white' : 'var(--color-gray-11)',
    border: 'none',
    cursor: 'pointer',
  })

  const getActionButtonStyle = (): React.CSSProperties => ({
    padding: 4,
    backgroundColor: 'transparent',
    color: 'var(--color-blue-10)',
    border: 'none',
    cursor: 'pointer',
  })

  return (
    <Stack gap={24}>
      <Row alignItems="center" justifyContent="space-between" style={{ flexWrap: 'wrap' }}>
        <Stack>
          <H1 style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--color-gray-12)' }}>
            Documents
          </H1>
          <Text style={{ color: 'var(--color-gray-11)' }}>
            Manage your certificates, licenses, and compliance documents
          </Text>
        </Stack>
        <Row gap={8}>
          <CommonButton
            onPress={() => {
              console.log('[DocumentsPage] Upload button clicked')
              // Use startTransition to prevent blocking the UI
              startTransition(() => {
                setUploadError(null)
                setUploadSuccess(null)
                setUploadModalOpen(true)
              })
            }}
          >
            <Row alignItems="center" gap={8}>
              <Upload size={18} />
              <Text>Upload Document</Text>
            </Row>
          </CommonButton>
          <CommonButton variant="ghost" onPress={loadDocuments} disabled={loading}>
            <Row alignItems="center" gap={8}>
              <RefreshCw size={18} />
              {loading && <Spinner size="sm" />}
              {!loading && <Text>Refresh</Text>}
            </Row>
          </CommonButton>
        </Row>
      </Row>

      {/* Success message */}
      {uploadSuccess && (
        <Card
          style={{
            backgroundColor: 'var(--color-green-2)',
            borderColor: 'var(--color-green-6)',
            borderWidth: 1,
            borderStyle: 'solid',
            borderRadius: 8,
            padding: 16,
          }}
        >
          <Row alignItems="center" gap={8}>
            <CheckCircle style={{ color: 'var(--color-green-10)' }} size={20} />
            <Text style={{ color: 'var(--color-green-11)', fontSize: 14, fontWeight: 500 }}>
              {uploadSuccess}
            </Text>
          </Row>
        </Card>
      )}

      {/* Load error message */}
      {loadError && (
        <Card
          style={{
            backgroundColor: 'var(--color-red-2)',
            borderColor: 'var(--color-red-6)',
            borderWidth: 1,
            borderStyle: 'solid',
            borderRadius: 8,
            padding: 16,
          }}
        >
          <Text style={{ color: 'var(--color-red-11)', fontSize: 14 }}>
            Error loading documents: {loadError}
          </Text>
        </Card>
      )}

      <Grid columns={{ base: 1, sm: 2, lg: 4 }} gap={16}>
        <Card
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            padding: 20,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Text size="3xl" weight="bold" style={{ marginBottom: 12 }}>
              {stats.total}
            </Text>
            <Text size="sm" style={{ fontWeight: 500, color: 'var(--color-text-muted)' }}>
              Total Documents
            </Text>
          </div>
        </Card>

        <Card
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            padding: 20,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Text size="3xl" weight="bold" style={{ marginBottom: 12 }}>
              {stats.verified}
            </Text>
            <Text size="sm" style={{ fontWeight: 500, color: 'var(--color-text-muted)' }}>
              Verified
            </Text>
          </div>
        </Card>

        <Card
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            padding: 20,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Text size="3xl" weight="bold" style={{ marginBottom: 12 }}>
              {stats.pending}
            </Text>
            <Text size="sm" style={{ fontWeight: 500, color: 'var(--color-text-muted)' }}>
              Pending
            </Text>
          </div>
        </Card>

        <Card
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            padding: 20,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Text size="3xl" weight="bold" style={{ marginBottom: 12 }}>
              {stats.expiring}
            </Text>
            <Text size="sm" style={{ fontWeight: 500, color: 'var(--color-text-muted)' }}>
              Expiring Soon
            </Text>
          </div>
        </Card>
      </Grid>

      <Card
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: 12,
          border: '1px solid var(--color-border)',
          padding: 16,
        }}
      >
        <Row alignItems="center" gap={8}>
          <button
            onClick={() => setFilter('verified')}
            style={getFilterButtonStyle(filter === 'verified')}
          >
            Verified ({stats.verified})
          </button>
          <button
            onClick={() => setFilter('pending')}
            style={getFilterButtonStyle(filter === 'pending')}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setFilter('expiring')}
            style={getFilterButtonStyle(filter === 'expiring')}
          >
            Expiring ({stats.expiring})
          </button>
        </Row>
      </Card>

      <Card
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: 12,
          border: '1px solid var(--color-border)',
        }}
      >
        {loading && (
          <Stack alignItems="center" style={{ paddingTop: 32, paddingBottom: 32 }}>
            <Spinner size="lg" />
            <Text style={{ color: 'var(--color-gray-11)', marginTop: 16 }}>
              Loading documents...
            </Text>
          </Stack>
        )}
        {!loading && (
          <Stack style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>
                    <Row
                      style={{
                        paddingLeft: 24,
                        paddingRight: 24,
                        paddingTop: 12,
                        paddingBottom: 12,
                      }}
                    >
                      <Text
                        style={{
                          textAlign: 'left',
                          fontSize: 11,
                          fontWeight: 500,
                          color: 'var(--color-gray-11)',
                          textTransform: 'uppercase',
                          letterSpacing: 0.05,
                        }}
                      >
                        Document
                      </Text>
                    </Row>
                  </th>
                  <th>
                    <Row
                      style={{
                        paddingLeft: 24,
                        paddingRight: 24,
                        paddingTop: 12,
                        paddingBottom: 12,
                      }}
                    >
                      <Text
                        style={{
                          textAlign: 'left',
                          fontSize: 11,
                          fontWeight: 500,
                          color: 'var(--color-gray-11)',
                          textTransform: 'uppercase',
                          letterSpacing: 0.05,
                        }}
                      >
                        Type
                      </Text>
                    </Row>
                  </th>
                  <th>
                    <Row
                      style={{
                        paddingLeft: 24,
                        paddingRight: 24,
                        paddingTop: 12,
                        paddingBottom: 12,
                      }}
                    >
                      <Text
                        style={{
                          textAlign: 'left',
                          fontSize: 11,
                          fontWeight: 500,
                          color: 'var(--color-gray-11)',
                          textTransform: 'uppercase',
                          letterSpacing: 0.05,
                        }}
                      >
                        Status
                      </Text>
                    </Row>
                  </th>
                  <th>
                    <Row
                      style={{
                        paddingLeft: 24,
                        paddingRight: 24,
                        paddingTop: 12,
                        paddingBottom: 12,
                      }}
                    >
                      <Text
                        style={{
                          textAlign: 'left',
                          fontSize: 11,
                          fontWeight: 500,
                          color: 'var(--color-gray-11)',
                          textTransform: 'uppercase',
                          letterSpacing: 0.05,
                        }}
                      >
                        Upload Date
                      </Text>
                    </Row>
                  </th>
                  <th>
                    <Row
                      style={{
                        paddingLeft: 24,
                        paddingRight: 24,
                        paddingTop: 12,
                        paddingBottom: 12,
                      }}
                    >
                      <Text
                        style={{
                          textAlign: 'left',
                          fontSize: 11,
                          fontWeight: 500,
                          color: 'var(--color-gray-11)',
                          textTransform: 'uppercase',
                          letterSpacing: 0.05,
                        }}
                      >
                        Expiry
                      </Text>
                    </Row>
                  </th>
                  <th>
                    <Row
                      style={{
                        paddingLeft: 24,
                        paddingRight: 24,
                        paddingTop: 12,
                        paddingBottom: 12,
                      }}
                    >
                      <Text
                        style={{
                          textAlign: 'left',
                          fontSize: 11,
                          fontWeight: 500,
                          color: 'var(--color-gray-11)',
                          textTransform: 'uppercase',
                          letterSpacing: 0.05,
                        }}
                      >
                        Size
                      </Text>
                    </Row>
                  </th>
                  <th>
                    <Row
                      style={{
                        paddingLeft: 24,
                        paddingRight: 24,
                        paddingTop: 12,
                        paddingBottom: 12,
                        justifyContent: 'flex-end',
                      }}
                    >
                      <Text
                        style={{
                          textAlign: 'right',
                          fontSize: 11,
                          fontWeight: 500,
                          color: 'var(--color-gray-11)',
                          textTransform: 'uppercase',
                          letterSpacing: 0.05,
                        }}
                      >
                        Actions
                      </Text>
                    </Row>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => {
                  const daysUntilExpiry = getDaysUntilExpiry(doc.expiryDate)
                  return (
                    <tr key={doc.id}>
                      <td>
                        <Row
                          style={{
                            paddingLeft: 24,
                            paddingRight: 24,
                            paddingTop: 16,
                            paddingBottom: 16,
                          }}
                          alignItems="center"
                          gap={12}
                        >
                          <FileText style={{ color: 'var(--color-blue-10)' }} size={20} />
                          <Stack>
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: 500,
                                color: 'var(--color-gray-12)',
                              }}
                            >
                              {doc.name}
                            </Text>
                            <Text style={{ fontSize: 11, color: 'var(--color-gray-11)' }}>
                              Uploaded by {doc.uploadedBy}
                            </Text>
                          </Stack>
                        </Row>
                      </td>
                      <td>
                        <Row
                          style={{
                            paddingLeft: 24,
                            paddingRight: 24,
                            paddingTop: 16,
                            paddingBottom: 16,
                          }}
                        >
                          <Row
                            alignItems="center"
                            style={{
                              display: 'inline-flex',
                              paddingLeft: 8,
                              paddingRight: 8,
                              paddingTop: 4,
                              paddingBottom: 4,
                              borderRadius: 4,
                              backgroundColor: 'var(--color-blue-3)',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: 500,
                                color: 'var(--color-blue-11)',
                              }}
                            >
                              {getTypeLabel(doc.type)}
                            </Text>
                          </Row>
                        </Row>
                      </td>
                      <td>
                        <Row
                          style={{
                            paddingLeft: 24,
                            paddingRight: 24,
                            paddingTop: 16,
                            paddingBottom: 16,
                          }}
                          alignItems="center"
                          gap={8}
                        >
                          {getStatusIcon(doc.status)}
                          <Text
                            style={{
                              fontSize: 14,
                              color: 'var(--color-gray-12)',
                              textTransform: 'capitalize',
                            }}
                          >
                            {doc.status}
                          </Text>
                        </Row>
                      </td>
                      <td>
                        <Row
                          style={{
                            paddingLeft: 24,
                            paddingRight: 24,
                            paddingTop: 16,
                            paddingBottom: 16,
                          }}
                        >
                          <Text style={{ fontSize: 14, color: 'var(--color-gray-11)' }}>
                            {new Date(doc.uploadDate).toLocaleDateString()}
                          </Text>
                        </Row>
                      </td>
                      <td>
                        <Row
                          style={{
                            paddingLeft: 24,
                            paddingRight: 24,
                            paddingTop: 16,
                            paddingBottom: 16,
                          }}
                        >
                          {doc.expiryDate ? (
                            <Stack>
                              <Text style={{ fontSize: 14, color: 'var(--color-gray-12)' }}>
                                {new Date(doc.expiryDate).toLocaleDateString()}
                              </Text>
                              {daysUntilExpiry !== null && daysUntilExpiry <= 30 && (
                                <Text style={{ fontSize: 11, color: 'var(--color-orange-10)' }}>
                                  {daysUntilExpiry} days left
                                </Text>
                              )}
                            </Stack>
                          ) : (
                            <Text style={{ fontSize: 14, color: 'var(--color-gray-11)' }}>N/A</Text>
                          )}
                        </Row>
                      </td>
                      <td>
                        <Row
                          style={{
                            paddingLeft: 24,
                            paddingRight: 24,
                            paddingTop: 16,
                            paddingBottom: 16,
                          }}
                        >
                          <Text style={{ fontSize: 14, color: 'var(--color-gray-11)' }}>
                            {doc.fileSize}
                          </Text>
                        </Row>
                      </td>
                      <td>
                        <Row
                          style={{
                            paddingLeft: 24,
                            paddingRight: 24,
                            paddingTop: 16,
                            paddingBottom: 16,
                            justifyContent: 'flex-end',
                          }}
                          alignItems="center"
                          gap={8}
                        >
                          <button
                            onClick={() => setSelectedDocument(doc)}
                            style={getActionButtonStyle()}
                          >
                            <Eye size={16} />
                          </button>
                          <button style={getActionButtonStyle()}>
                            <Download size={16} />
                          </button>
                        </Row>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {filteredDocuments.length === 0 && (
              <Stack alignItems="center" style={{ paddingTop: 48, paddingBottom: 48 }} gap={16}>
                <FileText style={{ color: 'var(--color-gray-10)' }} size={48} />
                <Stack alignItems="center" gap={8}>
                  <Text style={{ color: 'var(--color-gray-12)', fontWeight: 500 }}>
                    No documents found
                  </Text>
                  <Text style={{ color: 'var(--color-gray-11)', fontSize: 14 }}>
                    Upload documents to get started
                  </Text>
                </Stack>
              </Stack>
            )}
          </Stack>
        )}
      </Card>

      {/* Document Detail Modal */}
      {selectedDocument && (
        <DocumentDetailModal
          documentId={selectedDocument.id}
          documentName={selectedDocument.name}
          documentType={getTypeLabel(selectedDocument.type)}
          uploadDate={selectedDocument.uploadDate}
          expiryDate={selectedDocument.expiryDate}
          uploadedBy={selectedDocument.uploadedBy}
          status={selectedDocument.status}
          fileSize={selectedDocument.fileSize}
          isOpen={!!selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}

      {/* Simple overlay modal - avoiding ResponsiveModal freeze issue */}
      {uploadModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={handleModalClose}
        >
          <Card
            style={{
              backgroundColor: 'var(--color-background)',
              padding: 24,
              borderRadius: 8,
              width: 560,
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onPress={(e: React.MouseEvent) => e.stopPropagation()}
            data-testid="upload-modal"
          >
            <Stack gap={16}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'var(--color-gray-12)' }}>
                Upload Document
              </Text>
              <Text style={{ color: 'var(--color-gray-11)' }}>
                Upload your compliance documents, certificates, licenses, or other required files.
              </Text>

              {uploadError && (
                <Card
                  style={{
                    backgroundColor: 'var(--color-red-2)',
                    borderColor: 'var(--color-red-6)',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  <Text style={{ color: 'var(--color-red-11)', fontSize: 14 }}>{uploadError}</Text>
                </Card>
              )}

              {organizationId && userId ? (
                <Suspense fallback={<Spinner size="lg" />}>
                  <FileUploadZone
                    projectId="general"
                    uploaderId={userId}
                    organizationId={organizationId}
                    subcontractorId={userId}
                    maxFiles={5}
                    category="compliance"
                    description="Insurance and compliance documents"
                    tags={['coi', 'insurance', 'compliance']}
                    onUpload={handleUploadDocument}
                    onError={handleUploadError}
                  />
                </Suspense>
              ) : (
                <Card
                  style={{
                    backgroundColor: 'var(--color-yellow-2)',
                    borderColor: 'var(--color-yellow-6)',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  <Text style={{ color: 'var(--color-yellow-11)', fontSize: 14 }}>
                    Unable to upload documents. Please ensure you are logged in and have a valid
                    organization.
                  </Text>
                  <Text style={{ color: 'var(--color-yellow-11)', fontSize: 12, marginTop: 8 }}>
                    Organization ID: {organizationId || 'Not available'}
                  </Text>
                  <Text style={{ color: 'var(--color-yellow-11)', fontSize: 12 }}>
                    User ID: {userId || 'Not available'}
                  </Text>
                </Card>
              )}

              <Row justifyContent="flex-end" style={{ paddingTop: 16 }}>
                <Button variant="ghost" onPress={handleModalClose}>
                  Close
                </Button>
              </Row>
            </Stack>
          </Card>
        </div>
      )}
    </Stack>
  )
}
