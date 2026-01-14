/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Clock,
  Calendar,
  Building,
  Maximize2,
  Minimize2,
  Layout,
  History as HistoryIcon,
  FileCheck,
} from 'lucide-react';
import { Stack, Row, Text, H2, H3, Card } from '@unicornlove/beyond-ui';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import {
  DocumentViewMode,
  AIExtractedFields,
  DocumentVersion,
} from '../../types';
import { useAIExtractions } from '../../hooks/useAIExtractions';
import { useDocumentVersions } from '../../hooks/useDocumentVersions';
import { useComments } from '../../hooks/useComments';
import { EntityType } from '../../types';
import { formatDate } from '../../utils/dateHelpers';
import AIProcessingIndicator, {
  AIProcessingState,
} from '../Common/AIProcessingIndicator';
import AISummaryScreen from '../Common/AISummaryScreen';

interface DocumentDetailModalProps {
  documentId: string;
  documentName: string;
  documentType: string;
  documentUrl?: string;
  uploadDate: string;
  expiryDate?: string;
  uploadedBy: string;
  status: string;
  fileSize?: string;
  projectId?: string;
  isOpen: boolean;
  onClose: () => void;
  viewMode?: DocumentViewMode;
  onViewModeChange?: (mode: DocumentViewMode) => void;
}

export default function DocumentDetailModal({
  documentId,
  documentName,
  documentType,
  documentUrl,
  uploadDate,
  expiryDate,
  uploadedBy,
  status,
  fileSize,
  projectId,
  isOpen,
  onClose,
  viewMode: initialViewMode,
  onViewModeChange,
}: DocumentDetailModalProps) {
  const [viewMode, setViewMode] = useState<DocumentViewMode>(
    initialViewMode || 'inline'
  );
  const [aiProcessingState, setAIProcessingState] =
    useState<AIProcessingState | null>(null);
  const [aiProcessingProgress, setAIProcessingProgress] = useState(0);
  const [showAISummary, setShowAISummary] = useState(false);

  const {
    extractions,
    loading: extractionsLoading,
    fetchExtractions,
    mockExtractFields,
  } = useAIExtractions({
    documentId,
  });

  const { versions, loading: versionsLoading } = useDocumentVersions({
    documentId,
  });

  const { comments: documentComments } = useComments({
    entityType: 'document' as EntityType,
    entityId: documentId,
  });

  useEffect(() => {
    if (isOpen && documentId) {
      fetchExtractions();
      // If no extraction exists, trigger mock extraction
      if (!extractions.length) {
        handleExtractFields();
      }
    }
  }, [isOpen, documentId]);

  const handleExtractFields = async () => {
    setAIProcessingState('analyzing');
    setAIProcessingProgress(0);

    // Simulate progress
    setTimeout(() => {
      setAIProcessingState('processing');
      const progressInterval = setInterval(() => {
        setAIProcessingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      mockExtractFields(documentId)
        .then(() => {
          setAIProcessingProgress(100);
          setAIProcessingState('complete');
          setTimeout(() => {
            setAIProcessingState(null);
            setAIProcessingProgress(0);
            setShowAISummary(true);
          }, 1000);
        })
        .catch((error) => {
          console.error('Failed to extract fields:', error);
          setAIProcessingState('error');
          setTimeout(() => {
            setAIProcessingState(null);
            setAIProcessingProgress(0);
          }, 3000);
        });
    }, 1000);
  };

  const handleViewModeChange = (mode: DocumentViewMode) => {
    setViewMode(mode);
    onViewModeChange?.(mode);
    // Store preference in localStorage
    localStorage.setItem('documentViewMode', mode);
  };

  useEffect(() => {
    // Load view mode preference from localStorage
    const savedMode = localStorage.getItem(
      'documentViewMode'
    ) as DocumentViewMode;
    if (savedMode && ['inline', 'modal', 'split-screen'].includes(savedMode)) {
      setViewMode(savedMode);
    }
  }, []);


  const formatFileSize = (size?: string | number) => {
    if (!size) return 'N/A';
    if (typeof size === 'string') return size;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDaysUntilExpiry = () => {
    if (!expiryDate) return null;
    const days = Math.ceil(
      (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const daysUntilExpiry = getDaysUntilExpiry();
  const currentExtraction = extractions[0];

  // Default mock PDF URL if none provided
  const pdfUrl =
    documentUrl ||
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

  const getStatusStyles = () => {
    switch (status) {
      case 'verified':
        return {
          backgroundColor: 'var(--color-green-2)',
          color: 'var(--color-green-11)',
          borderColor: 'var(--color-green-6)',
        };
      case 'pending':
      case 'expiring':
        return {
          backgroundColor: 'var(--color-yellow-2)',
          color: 'var(--color-yellow-11)',
          borderColor: 'var(--color-yellow-6)',
        };
      case 'expired':
        return {
          backgroundColor: 'var(--color-red-2)',
          color: 'var(--color-red-11)',
          borderColor: 'var(--color-red-6)',
        };
      default:
        return {
          backgroundColor: 'var(--color-gray-2)',
          color: 'var(--color-gray-11)',
          borderColor: 'var(--color-gray-6)',
        };
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size={viewMode === 'split-screen' ? 'xl' : 'lg'}
    >
      <Stack style={{ gap: 24 }}>
        {/* Header */}
        <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Stack style={{ flex: 1 }}>
            <Row style={{ alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <FileText color="var(--color-teal-9)" size={24} />
              <H2 style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--color-12)' }}>
                {documentName}
              </H2>
              <Text
                style={{
                  paddingLeft: 10,
                  paddingRight: 10,
                  paddingTop: 4,
                  paddingBottom: 4,
                  fontSize: 12,
                  fontWeight: 500,
                  borderRadius: 4,
                  borderWidth: 1,
                  borderStyle: 'solid',
                  ...getStatusStyles(),
                }}
              >
                {status.toUpperCase()}
              </Text>
            </Row>
            <Row style={{ alignItems: 'center', gap: 16, fontSize: 14, color: 'var(--color-11)' }}>
              <Row style={{ alignItems: 'center', gap: 4 }}>
                <Calendar size={14} />
                <Text>Uploaded {formatDate(uploadDate)}</Text>
              </Row>
              {expiryDate && (
                <Row
                  style={{
                    alignItems: 'center',
                    gap: 4,
                    color: daysUntilExpiry !== null && daysUntilExpiry <= 30
                      ? 'var(--color-yellow-10)'
                      : 'var(--color-11)',
                  }}
                >
                  <Clock size={14} />
                  <Text>
                    Expires {formatDate(expiryDate)}
                    {daysUntilExpiry !== null &&
                      daysUntilExpiry <= 30 &&
                      ` (${daysUntilExpiry} days)`}
                  </Text>
                </Row>
              )}
              {fileSize && <Text>{formatFileSize(fileSize)}</Text>}
            </Row>
          </Stack>
        </Row>

        {/* View Mode Toggle */}
        <Row
          style={{
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 12,
            backgroundColor: 'var(--color-background)',
            borderRadius: 8,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)' }}>
            View Mode:
          </Text>
          <Row style={{ alignItems: 'center', gap: 8 }}>
            <Button
              variant={viewMode === 'inline' ? 'primary' : 'ghost'}
              size="sm"
              onPress={() => handleViewModeChange('inline')}
              leftIcon={Maximize2}
            >
              Inline
            </Button>
            <Button
              variant={viewMode === 'modal' ? 'primary' : 'ghost'}
              size="sm"
              onPress={() => handleViewModeChange('modal')}
              leftIcon={Minimize2}
            >
              Modal
            </Button>
            <Button
              variant={viewMode === 'split-screen' ? 'primary' : 'ghost'}
              size="sm"
              onPress={() => handleViewModeChange('split-screen')}
              leftIcon={Layout}
            >
              Split
            </Button>
          </Row>
        </Row>

        {/* AI Processing Indicator */}
        {aiProcessingState && (
          <AIProcessingIndicator
            state={aiProcessingState}
            message={
              aiProcessingState === 'analyzing'
                ? 'AI extracting policy data...'
                : aiProcessingState === 'processing'
                  ? 'AI processing document...'
                  : undefined
            }
            progress={
              aiProcessingState === 'processing'
                ? aiProcessingProgress
                : undefined
            }
          />
        )}

        {/* Main Content Area */}
        {viewMode === 'split-screen' ? (
          <Row style={{ gap: 24 }}>
            {/* PDF Viewer */}
            <Stack style={{ flex: 1 }}>
              <Card
                style={{
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: 'var(--color-border)',
                  borderRadius: 8,
                  overflow: 'hidden',
                  backgroundColor: 'var(--color-background)',
                }}
              >
                <Row
                  style={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 12,
                    backgroundColor: 'var(--color-background-hover)',
                    borderBottomWidth: 1,
                    borderBottomStyle: 'solid',
                    borderBottomColor: 'var(--color-border)',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)' }}>
                    {documentType}
                  </Text>
                  <Row style={{ alignItems: 'center', gap: 8 }}>
                    {pdfUrl && (
                      <a
                        href={pdfUrl}
                        download={documentName}
                        style={{
                          padding: 8,
                          color: 'var(--color-teal-9)',
                          borderRadius: 4,
                          cursor: 'pointer',
                          display: 'flex',
                        }}
                      >
                        <Download size={16} />
                      </a>
                    )}
                  </Row>
                </Row>
                <Stack
                  style={{
                    position: 'relative',
                    height: viewMode === 'inline' ? 600 : 400,
                    minHeight: 400,
                  }}
                >
                  {pdfUrl ? (
                    <iframe
                      src={pdfUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      title={documentName}
                    />
                  ) : (
                    <Stack
                      style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                      }}
                    >
                      <Stack style={{ alignItems: 'center', gap: 8 }}>
                        <FileText color="var(--color-10)" size={48} />
                        <Text style={{ color: 'var(--color-11)' }}>No preview available</Text>
                      </Stack>
                    </Stack>
                  )}
                </Stack>
              </Card>
            </Stack>

            {/* AI Extracted Fields & Details */}
            {(viewMode === 'split-screen' || viewMode === 'modal') && (
              <Stack style={{ flex: 1, gap: 24 }}>
                {/* AI Extracted Fields */}
                {currentExtraction && (
                  <Card
                    style={{
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor: 'var(--color-border)',
                      borderRadius: 8,
                      padding: 16,
                      backgroundColor: 'var(--color-background)',
                    }}
                  >
                    <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <Row style={{ alignItems: 'center', gap: 8 }}>
                        <FileCheck size={16} />
                        <H3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-12)' }}>
                          AI-Extracted Fields
                        </H3>
                      </Row>
                      <Text
                        style={{
                          fontSize: 12,
                          paddingLeft: 8,
                          paddingRight: 8,
                          paddingTop: 4,
                          paddingBottom: 4,
                          backgroundColor: 'var(--color-teal-2)',
                          color: 'var(--color-teal-11)',
                          borderRadius: 4,
                        }}
                      >
                        {currentExtraction.confidence}% confidence
                      </Text>
                    </Row>

                    <Stack style={{ gap: 12 }}>
                      {currentExtraction.policy_number && (
                        <Stack>
                          <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>
                            Policy Number
                          </Text>
                          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                            {currentExtraction.policy_number}
                          </Text>
                        </Stack>
                      )}
                      {currentExtraction.carrier && (
                        <Stack>
                          <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>
                            Carrier
                          </Text>
                          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                            {currentExtraction.carrier}
                          </Text>
                        </Stack>
                      )}
                      {currentExtraction.coverage_amounts &&
                        currentExtraction.coverage_amounts.length > 0 && (
                          <Stack>
                            <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>
                              Coverage Amounts
                            </Text>
                            <Stack style={{ gap: 4, marginTop: 4 }}>
                              {currentExtraction.coverage_amounts.map(
                                (coverage, index) => (
                                  <Row
                                    key={index}
                                    style={{
                                      justifyContent: 'space-between',
                                      fontSize: 14,
                                    }}
                                  >
                                    <Text style={{ color: 'var(--color-11)' }}>{coverage.type}:</Text>
                                    <Text style={{ fontWeight: 500, color: 'var(--color-12)' }}>
                                      ${coverage.amount.toLocaleString()}
                                    </Text>
                                  </Row>
                                )
                              )}
                            </Stack>
                          </Stack>
                        )}
                      {currentExtraction.effective_date && (
                        <Stack>
                          <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>
                            Effective Date
                          </Text>
                          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                            {formatDate(currentExtraction.effective_date)}
                          </Text>
                        </Stack>
                      )}
                      {currentExtraction.expiry_date && (
                        <Stack>
                          <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>
                            Expiry Date
                          </Text>
                          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                            {formatDate(currentExtraction.expiry_date)}
                          </Text>
                        </Stack>
                      )}
                      {currentExtraction.named_insureds &&
                        currentExtraction.named_insureds.length > 0 && (
                          <Stack>
                            <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>
                              Named Insureds
                            </Text>
                            <Stack style={{ gap: 4, marginTop: 4 }}>
                              {currentExtraction.named_insureds.map(
                                (insured, index) => (
                                  <Text
                                    key={index}
                                    style={{
                                      fontSize: 14,
                                      color: 'var(--color-12)',
                                    }}
                                  >
                                    {insured}
                                  </Text>
                                )
                              )}
                            </Stack>
                          </Stack>
                        )}
                    </Stack>

                    <Stack style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'var(--color-border)' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onPress={handleExtractFields}
                        fullWidth
                      >
                        Re-extract Fields
                      </Button>
                    </Stack>
                  </Card>
                )}

                {/* Metadata */}
                <Card
                  style={{
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: 'var(--color-border)',
                    borderRadius: 8,
                    padding: 16,
                    backgroundColor: 'var(--color-background)',
                  }}
                >
                  <H3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-12)', marginBottom: 16 }}>
                    Metadata
                  </H3>
                  <Stack style={{ gap: 12 }}>
                    <Stack>
                      <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>
                        Document Type
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                        {documentType}
                      </Text>
                    </Stack>
                    <Stack>
                      <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>
                        Uploaded By
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                        {uploadedBy}
                      </Text>
                    </Stack>
                    <Stack>
                      <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>
                        Upload Date
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                        {formatDate(uploadDate)}
                      </Text>
                    </Stack>
                    {fileSize && (
                      <Stack>
                        <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>
                          File Size
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                          {formatFileSize(fileSize)}
                        </Text>
                      </Stack>
                    )}
                    {expiryDate && (
                      <Stack>
                        <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>
                          Expiry Date
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: daysUntilExpiry !== null && daysUntilExpiry <= 30
                              ? 'var(--color-yellow-10)'
                              : 'var(--color-12)',
                          }}
                        >
                          {formatDate(expiryDate)}
                          {daysUntilExpiry !== null && daysUntilExpiry <= 30 && (
                            <span style={{ marginLeft: 8 }}>
                              {daysUntilExpiry} days left
                            </span>
                          )}
                        </Text>
                      </Stack>
                    )}
                  </Stack>
                </Card>

                {/* Version History */}
                {versions.length > 0 && (
                  <Card
                    style={{
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor: 'var(--color-border)',
                      borderRadius: 8,
                      padding: 16,
                      backgroundColor: 'var(--color-background)',
                    }}
                  >
                    <Row style={{ alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <HistoryIcon size={16} />
                      <H3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-12)' }}>
                        Version History
                      </H3>
                    </Row>
                    <Stack style={{ gap: 8 }}>
                      {versions.map((version) => (
                        <Row
                          key={version.id}
                          style={{
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 8,
                            backgroundColor: 'var(--color-background-hover)',
                            borderRadius: 4,
                          }}
                        >
                          <Stack>
                            <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                              Version {version.version_number}
                            </Text>
                            <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>
                              {formatDate(version.uploaded_at)} by{' '}
                              {version.uploaded_by}
                            </Text>
                          </Stack>
                          <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>
                            {formatFileSize(version.file_size)}
                          </Text>
                        </Row>
                      ))}
                    </Stack>
                  </Card>
                )}

                {/* Related Items */}
                {(projectId || documentComments.length > 0) && (
                  <Card
                    style={{
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor: 'var(--color-border)',
                      borderRadius: 8,
                      padding: 16,
                      backgroundColor: 'var(--color-background)',
                    }}
                  >
                    <H3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-12)', marginBottom: 16 }}>
                      Related Items
                    </H3>
                    <Stack style={{ gap: 8 }}>
                      {projectId && (
                        <Row style={{ alignItems: 'center', gap: 8, fontSize: 14 }}>
                          <Building size={14} color="var(--color-10)" />
                          <Text style={{ color: 'var(--color-11)' }}>Project: </Text>
                          <Text style={{ color: 'var(--color-12)', fontWeight: 500 }}>
                            {projectId}
                          </Text>
                        </Row>
                      )}
                      {documentComments.length > 0 && (
                        <Row style={{ alignItems: 'center', gap: 8, fontSize: 14 }}>
                          <FileText size={14} color="var(--color-10)" />
                          <Text style={{ color: 'var(--color-11)' }}>
                            {documentComments.length} comments
                          </Text>
                        </Row>
                      )}
                    </Stack>
                  </Card>
                )}
              </Stack>
            )}
          </Row>
        ) : (
          <Stack style={{ marginBottom: 24 }}>
            <Card
              style={{
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: 'var(--color-border)',
                borderRadius: 8,
                overflow: 'hidden',
                backgroundColor: 'var(--color-background)',
              }}
            >
              <Row
                style={{
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 12,
                  backgroundColor: 'var(--color-background-hover)',
                  borderBottomWidth: 1,
                  borderBottomStyle: 'solid',
                  borderBottomColor: 'var(--color-border)',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)' }}>
                  {documentType}
                </Text>
                <Row style={{ alignItems: 'center', gap: 8 }}>
                  {pdfUrl && (
                    <a
                      href={pdfUrl}
                      download={documentName}
                      style={{
                        padding: 8,
                        color: 'var(--color-teal-9)',
                        borderRadius: 4,
                        cursor: 'pointer',
                        display: 'flex',
                      }}
                    >
                      <Download size={16} />
                    </a>
                  )}
                </Row>
              </Row>
              <Stack
                style={{
                  position: 'relative',
                  height: viewMode === 'inline' ? 600 : 400,
                  minHeight: 400,
                }}
              >
                {pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    title={documentName}
                  />
                ) : (
                  <Stack
                    style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                    }}
                  >
                    <Stack style={{ alignItems: 'center', gap: 8 }}>
                      <FileText color="var(--color-10)" size={48} />
                      <Text style={{ color: 'var(--color-11)' }}>No preview available</Text>
                    </Stack>
                  </Stack>
                )}
              </Stack>
            </Card>
          </Stack>
        )}

          {/* Inline Mode: Show extracted fields below PDF */}
          {viewMode === 'inline' && currentExtraction && (
            <Card
              style={{
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: 'var(--color-border)',
                borderRadius: 8,
                padding: 16,
                backgroundColor: 'var(--color-background)',
              }}
            >
              <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <Row style={{ alignItems: 'center', gap: 8 }}>
                  <FileCheck size={16} />
                  <H3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-12)' }}>
                    AI-Extracted Fields
                  </H3>
                </Row>
                <Text
                  style={{
                    fontSize: 12,
                    paddingLeft: 8,
                    paddingRight: 8,
                    paddingTop: 4,
                    paddingBottom: 4,
                    backgroundColor: 'var(--color-teal-2)',
                    color: 'var(--color-teal-11)',
                    borderRadius: 4,
                  }}
                >
                  {currentExtraction.confidence}% confidence
                </Text>
              </Row>

              <Row style={{ flexWrap: 'wrap', gap: 16 }}>
                {currentExtraction.policy_number && (
                  <Stack style={{ flex: 1, minWidth: '50%' }}>
                    <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>
                      Policy Number
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                      {currentExtraction.policy_number}
                    </Text>
                  </Stack>
                )}
                {currentExtraction.carrier && (
                  <Stack style={{ flex: 1, minWidth: '50%' }}>
                    <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>Carrier</Text>
                    <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                      {currentExtraction.carrier}
                    </Text>
                  </Stack>
                )}
                {currentExtraction.effective_date && (
                  <Stack style={{ flex: 1, minWidth: '50%' }}>
                    <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>
                      Effective Date
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                      {formatDate(currentExtraction.effective_date)}
                    </Text>
                  </Stack>
                )}
                {currentExtraction.expiry_date && (
                  <Stack style={{ flex: 1, minWidth: '50%' }}>
                    <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>
                      Expiry Date
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                      {formatDate(currentExtraction.expiry_date)}
                    </Text>
                  </Stack>
                )}
              </Row>

              {currentExtraction.coverage_amounts &&
                currentExtraction.coverage_amounts.length > 0 && (
                  <Stack style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'var(--color-border)' }}>
                    <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>
                      Coverage Amounts
                    </Text>
                    <Row style={{ flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      {currentExtraction.coverage_amounts.map(
                        (coverage, index) => (
                          <Stack
                            key={index}
                            style={{
                              padding: 8,
                              backgroundColor: 'var(--color-background-hover)',
                              borderRadius: 4,
                              flex: 1,
                              minWidth: '50%',
                            }}
                          >
                            <Text style={{ fontSize: 12, color: 'var(--color-11)' }}>
                              {coverage.type}:
                            </Text>
                            <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                              ${coverage.amount.toLocaleString()}
                            </Text>
                          </Stack>
                        )
                      )}
                    </Row>
                  </Stack>
                )}
            </Card>
          )}
        </Stack>

      {/* AI Summary Modal */}
      {showAISummary && currentExtraction && (
        <Modal
          isOpen={showAISummary}
          onClose={() => setShowAISummary(false)}
          title="AI Analysis Summary"
          size="medium"
        >
          <AISummaryScreen
            title="Document Analysis Complete"
            whatWasAnalyzed={`Analyzed ${documentName} for policy information, coverage amounts, dates, and compliance data.`}
            keyFindings={
              [
                currentExtraction.policy_number &&
                  `Policy Number: ${currentExtraction.policy_number}`,
                currentExtraction.carrier &&
                  `Carrier: ${currentExtraction.carrier}`,
                currentExtraction.coverage_amounts &&
                  currentExtraction.coverage_amounts.length > 0 &&
                  `Identified ${currentExtraction.coverage_amounts.length} coverage types`,
                currentExtraction.effective_date &&
                  `Effective Date: ${formatDate(currentExtraction.effective_date)}`,
                currentExtraction.expiry_date &&
                  `Expiry Date: ${formatDate(currentExtraction.expiry_date)}`,
              ].filter(Boolean) as string[]
            }
            confidence={currentExtraction.confidence}
            recommendations={[
              'Review extracted fields for accuracy',
              'Verify coverage amounts match project requirements',
              'Confirm policy dates are current',
            ]}
            actionsTaken={[
              'Extracted policy number and carrier information',
              'Identified coverage amounts and limits',
              'Parsed effective and expiry dates',
            ]}
            actionsRequiringReview={[
              'Verify extracted coverage amounts',
              'Confirm named insureds are correct',
              'Review policy dates for accuracy',
            ]}
            onClose={() => setShowAISummary(false)}
          />
        </Modal>
      )}
    </Modal>
  );
}
