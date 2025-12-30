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
import { YStack, XStack, Text, H2, H3, Card } from '@unicornlove/ui';
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size={viewMode === 'split-screen' ? 'xl' : 'lg'}
    >
      <YStack gap="$6">
        {/* Header */}
        <XStack alignItems="flex-start" justifyContent="space-between">
          <YStack flex={1}>
            <XStack alignItems="center" gap="$3" mb="$2">
              <FileText color="$teal9" size={24} />
              <H2 fontSize="$8" fontWeight="bold" color="$color12">
                {documentName}
              </H2>
              <Text
                paddingHorizontal="$2.5"
                paddingVertical="$1"
                fontSize="$1"
                fontWeight="500"
                borderRadius="$2"
                borderWidth={1}
                {...(status === 'verified' && {
                  backgroundColor: '$green2',
                  color: '$green11',
                  borderColor: '$green6',
                })}
                {...(status === 'pending' && {
                  backgroundColor: '$yellow2',
                  color: '$yellow11',
                  borderColor: '$yellow6',
                })}
                {...(status === 'expired' && {
                  backgroundColor: '$red2',
                  color: '$red11',
                  borderColor: '$red6',
                })}
                {...(status === 'expiring' && {
                  backgroundColor: '$yellow2',
                  color: '$yellow11',
                  borderColor: '$yellow6',
                })}
                {...(!['verified', 'pending', 'expired', 'expiring'].includes(status) && {
                  backgroundColor: '$gray2',
                  color: '$gray11',
                  borderColor: '$gray6',
                })}
              >
                {status.toUpperCase()}
              </Text>
            </XStack>
            <XStack alignItems="center" gap="$4" fontSize="$3" color="$color11">
              <XStack alignItems="center" gap="$1">
                <Calendar size={14} />
                <Text>Uploaded {formatDate(uploadDate)}</Text>
              </XStack>
              {expiryDate && (
                <XStack
                  alignItems="center"
                  gap="$1"
                  color={
                    daysUntilExpiry !== null && daysUntilExpiry <= 30
                      ? '$yellow10'
                      : '$color11'
                  }
                >
                  <Clock size={14} />
                  <Text>
                    Expires {formatDate(expiryDate)}
                    {daysUntilExpiry !== null &&
                      daysUntilExpiry <= 30 &&
                      ` (${daysUntilExpiry} days)`}
                  </Text>
                </XStack>
              )}
              {fileSize && <Text>{formatFileSize(fileSize)}</Text>}
            </XStack>
          </YStack>
        </XStack>

        {/* View Mode Toggle */}
        <XStack
          alignItems="center"
          justifyContent="space-between"
          padding="$3"
          backgroundColor="$background"
          borderRadius="$4"
        >
          <Text fontSize="$3" fontWeight="500" color="$color11">
            View Mode:
          </Text>
          <XStack alignItems="center" gap="$2">
            <Button
              variant={viewMode === 'inline' ? 'primary' : 'ghost'}
              size="$2"
              onClick={() => handleViewModeChange('inline')}
              leftIcon={Maximize2}
            >
              Inline
            </Button>
            <Button
              variant={viewMode === 'modal' ? 'primary' : 'ghost'}
              size="$2"
              onClick={() => handleViewModeChange('modal')}
              leftIcon={Minimize2}
            >
              Modal
            </Button>
            <Button
              variant={viewMode === 'split-screen' ? 'primary' : 'ghost'}
              size="$2"
              onClick={() => handleViewModeChange('split-screen')}
              leftIcon={Layout}
            >
              Split
            </Button>
          </XStack>
        </XStack>

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
          <XStack gap="$6">
            {/* PDF Viewer */}
            <YStack flex={1}>
              <Card
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$4"
                overflow="hidden"
                backgroundColor="$background"
              >
                <XStack
                  alignItems="center"
                  justifyContent="space-between"
                  padding="$3"
                  backgroundColor="$backgroundHover"
                  borderBottomWidth={1}
                  borderBottomColor="$borderColor"
                >
                  <Text fontSize="$3" fontWeight="500" color="$color11">
                    {documentType}
                  </Text>
                  <XStack alignItems="center" gap="$2">
                    {pdfUrl && (
                      <XStack
                        as="a"
                        href={pdfUrl}
                        download={documentName}
                        padding="$2"
                        color="$teal9"
                        hoverStyle={{ backgroundColor: '$teal2' }}
                        borderRadius="$2"
                        cursor="pointer"
                      >
                        <Download size={16} />
                      </XStack>
                    )}
                  </XStack>
                </XStack>
                <YStack
                  position="relative"
                  height={viewMode === 'inline' ? 600 : 400}
                  minHeight={400}
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
                    <YStack
                      alignItems="center"
                      justifyContent="center"
                      height="100%"
                    >
                      <YStack alignItems="center" gap="$2">
                        <FileText color="$color10" size={48} />
                        <Text color="$color11">No preview available</Text>
                      </YStack>
                    </YStack>
                  )}
                </YStack>
              </Card>
            </YStack>

            {/* AI Extracted Fields & Details */}
            {(viewMode === 'split-screen' || viewMode === 'modal') && (
              <YStack flex={1} gap="$6">
                {/* AI Extracted Fields */}
                {currentExtraction && (
                  <Card
                    borderWidth={1}
                    borderColor="$borderColor"
                    borderRadius="$4"
                    padding="$4"
                    backgroundColor="$background"
                  >
                    <XStack alignItems="center" justifyContent="space-between" mb="$4">
                      <XStack alignItems="center" gap="$2">
                        <FileCheck size={16} />
                        <H3 fontSize="$3" fontWeight="600" color="$color12">
                          AI-Extracted Fields
                        </H3>
                      </XStack>
                      <Text
                        fontSize="$1"
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        backgroundColor="$teal2"
                        color="$teal11"
                        borderRadius="$2"
                      >
                        {currentExtraction.confidence}% confidence
                      </Text>
                    </XStack>

                    <YStack gap="$3">
                      {currentExtraction.policy_number && (
                        <YStack>
                          <Text fontSize="$1" color="$color10">
                            Policy Number
                          </Text>
                          <Text fontSize="$3" fontWeight="500" color="$color12">
                            {currentExtraction.policy_number}
                          </Text>
                        </YStack>
                      )}
                      {currentExtraction.carrier && (
                        <YStack>
                          <Text fontSize="$1" color="$color10">
                            Carrier
                          </Text>
                          <Text fontSize="$3" fontWeight="500" color="$color12">
                            {currentExtraction.carrier}
                          </Text>
                        </YStack>
                      )}
                      {currentExtraction.coverage_amounts &&
                        currentExtraction.coverage_amounts.length > 0 && (
                          <YStack>
                            <Text fontSize="$1" color="$color10">
                              Coverage Amounts
                            </Text>
                            <YStack gap="$1" mt="$1">
                              {currentExtraction.coverage_amounts.map(
                                (coverage, index) => (
                                  <XStack
                                    key={index}
                                    justifyContent="space-between"
                                    fontSize="$3"
                                  >
                                    <Text color="$color11">{coverage.type}:</Text>
                                    <Text fontWeight="500" color="$color12">
                                      ${coverage.amount.toLocaleString()}
                                    </Text>
                                  </XStack>
                                )
                              )}
                            </YStack>
                          </YStack>
                        )}
                      {currentExtraction.effective_date && (
                        <YStack>
                          <Text fontSize="$1" color="$color10">
                            Effective Date
                          </Text>
                          <Text fontSize="$3" fontWeight="500" color="$color12">
                            {formatDate(currentExtraction.effective_date)}
                          </Text>
                        </YStack>
                      )}
                      {currentExtraction.expiry_date && (
                        <YStack>
                          <Text fontSize="$1" color="$color10">
                            Expiry Date
                          </Text>
                          <Text fontSize="$3" fontWeight="500" color="$color12">
                            {formatDate(currentExtraction.expiry_date)}
                          </Text>
                        </YStack>
                      )}
                      {currentExtraction.named_insureds &&
                        currentExtraction.named_insureds.length > 0 && (
                          <YStack>
                            <Text fontSize="$1" color="$color10">
                              Named Insureds
                            </Text>
                            <YStack gap="$1" mt="$1">
                              {currentExtraction.named_insureds.map(
                                (insured, index) => (
                                  <Text
                                    key={index}
                                    fontSize="$3"
                                    color="$color12"
                                  >
                                    • {insured}
                                  </Text>
                                )
                              )}
                            </YStack>
                          </YStack>
                        )}
                    </YStack>

                    <YStack mt="$4" paddingTop="$4" borderTopWidth={1} borderTopColor="$borderColor">
                      <Button
                        variant="secondary"
                        size="$2"
                        onClick={handleExtractFields}
                        fullWidth
                      >
                        Re-extract Fields
                      </Button>
                    </YStack>
                  </Card>
                )}

                {/* Metadata */}
                <Card
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$4"
                  padding="$4"
                  backgroundColor="$background"
                >
                  <H3 fontSize="$3" fontWeight="600" color="$color12" mb="$4">
                    Metadata
                  </H3>
                  <YStack gap="$3">
                    <YStack>
                      <Text fontSize="$1" color="$color10">
                        Document Type
                      </Text>
                      <Text fontSize="$3" fontWeight="500" color="$color12">
                        {documentType}
                      </Text>
                    </YStack>
                    <YStack>
                      <Text fontSize="$1" color="$color10">
                        Uploaded By
                      </Text>
                      <Text fontSize="$3" fontWeight="500" color="$color12">
                        {uploadedBy}
                      </Text>
                    </YStack>
                    <YStack>
                      <Text fontSize="$1" color="$color10">
                        Upload Date
                      </Text>
                      <Text fontSize="$3" fontWeight="500" color="$color12">
                        {formatDate(uploadDate)}
                      </Text>
                    </YStack>
                    {fileSize && (
                      <YStack>
                        <Text fontSize="$1" color="$color10">
                          File Size
                        </Text>
                        <Text fontSize="$3" fontWeight="500" color="$color12">
                          {formatFileSize(fileSize)}
                        </Text>
                      </YStack>
                    )}
                    {expiryDate && (
                      <YStack>
                        <Text fontSize="$1" color="$color10">
                          Expiry Date
                        </Text>
                        <Text
                          fontSize="$3"
                          fontWeight="500"
                          color={
                            daysUntilExpiry !== null && daysUntilExpiry <= 30
                              ? '$yellow10'
                              : '$color12'
                          }
                        >
                          {formatDate(expiryDate)}
                          {daysUntilExpiry !== null && daysUntilExpiry <= 30 && (
                            <Text ml="$2" display="inline">
                              ⚠️ {daysUntilExpiry} days left
                            </Text>
                          )}
                        </Text>
                      </YStack>
                    )}
                  </YStack>
                </Card>

                {/* Version History */}
                {versions.length > 0 && (
                  <Card
                    borderWidth={1}
                    borderColor="$borderColor"
                    borderRadius="$4"
                    padding="$4"
                    backgroundColor="$background"
                  >
                    <XStack alignItems="center" gap="$2" mb="$4">
                      <HistoryIcon size={16} />
                      <H3 fontSize="$3" fontWeight="600" color="$color12">
                        Version History
                      </H3>
                    </XStack>
                    <YStack gap="$2">
                      {versions.map((version) => (
                        <XStack
                          key={version.id}
                          alignItems="center"
                          justifyContent="space-between"
                          padding="$2"
                          backgroundColor="$backgroundHover"
                          borderRadius="$2"
                        >
                          <YStack>
                            <Text fontSize="$3" fontWeight="500" color="$color12">
                              Version {version.version_number}
                            </Text>
                            <Text fontSize="$1" color="$color10">
                              {formatDate(version.uploaded_at)} by{' '}
                              {version.uploaded_by}
                            </Text>
                          </YStack>
                          <Text fontSize="$1" color="$color10">
                            {formatFileSize(version.file_size)}
                          </Text>
                        </XStack>
                      ))}
                    </YStack>
                  </Card>
                )}

                {/* Related Items */}
                {(projectId || documentComments.length > 0) && (
                  <Card
                    borderWidth={1}
                    borderColor="$borderColor"
                    borderRadius="$4"
                    padding="$4"
                    backgroundColor="$background"
                  >
                    <H3 fontSize="$3" fontWeight="600" color="$color12" mb="$4">
                      Related Items
                    </H3>
                    <YStack gap="$2">
                      {projectId && (
                        <XStack alignItems="center" gap="$2" fontSize="$3">
                          <Building size={14} color="$color10" />
                          <Text color="$color11">Project: </Text>
                          <Text color="$color12" fontWeight="500">
                            {projectId}
                          </Text>
                        </XStack>
                      )}
                      {documentComments.length > 0 && (
                        <XStack alignItems="center" gap="$2" fontSize="$3">
                          <FileText size={14} color="$color10" />
                          <Text color="$color11">
                            {documentComments.length} comments
                          </Text>
                        </XStack>
                      )}
                    </YStack>
                  </Card>
                )}
              </YStack>
            )}
          </XStack>
        ) : (
          <YStack mb="$6">
            <Card
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
              overflow="hidden"
              backgroundColor="$background"
            >
              <XStack
                alignItems="center"
                justifyContent="space-between"
                padding="$3"
                backgroundColor="$backgroundHover"
                borderBottomWidth={1}
                borderBottomColor="$borderColor"
              >
                <Text fontSize="$3" fontWeight="500" color="$color11">
                  {documentType}
                </Text>
                <XStack alignItems="center" gap="$2">
                  {pdfUrl && (
                    <XStack
                      as="a"
                      href={pdfUrl}
                      download={documentName}
                      padding="$2"
                      color="$teal9"
                      hoverStyle={{ backgroundColor: '$teal2' }}
                      borderRadius="$2"
                      cursor="pointer"
                    >
                      <Download size={16} />
                    </XStack>
                  )}
                </XStack>
              </XStack>
              <YStack
                position="relative"
                height={viewMode === 'inline' ? 600 : 400}
                minHeight={400}
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
                  <YStack
                    alignItems="center"
                    justifyContent="center"
                    height="100%"
                  >
                    <YStack alignItems="center" gap="$2">
                      <FileText color="$color10" size={48} />
                      <Text color="$color11">No preview available</Text>
                    </YStack>
                  </YStack>
                )}
              </YStack>
            </Card>
          </YStack>
        )}

          {/* Inline Mode: Show extracted fields below PDF */}
          {viewMode === 'inline' && currentExtraction && (
            <Card
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
              padding="$4"
              backgroundColor="$background"
            >
              <XStack alignItems="center" justifyContent="space-between" mb="$4">
                <XStack alignItems="center" gap="$2">
                  <FileCheck size={16} />
                  <H3 fontSize="$3" fontWeight="600" color="$color12">
                    AI-Extracted Fields
                  </H3>
                </XStack>
                <Text
                  fontSize="$1"
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  backgroundColor="$teal2"
                  color="$teal11"
                  borderRadius="$2"
                >
                  {currentExtraction.confidence}% confidence
                </Text>
              </XStack>

              <XStack flexWrap="wrap" gap="$4">
                {currentExtraction.policy_number && (
                  <YStack flex={1} minWidth="50%">
                    <Text fontSize="$1" color="$color10">
                      Policy Number
                    </Text>
                    <Text fontSize="$3" fontWeight="500" color="$color12">
                      {currentExtraction.policy_number}
                    </Text>
                  </YStack>
                )}
                {currentExtraction.carrier && (
                  <YStack flex={1} minWidth="50%">
                    <Text fontSize="$1" color="$color10">Carrier</Text>
                    <Text fontSize="$3" fontWeight="500" color="$color12">
                      {currentExtraction.carrier}
                    </Text>
                  </YStack>
                )}
                {currentExtraction.effective_date && (
                  <YStack flex={1} minWidth="50%">
                    <Text fontSize="$1" color="$color10">
                      Effective Date
                    </Text>
                    <Text fontSize="$3" fontWeight="500" color="$color12">
                      {formatDate(currentExtraction.effective_date)}
                    </Text>
                  </YStack>
                )}
                {currentExtraction.expiry_date && (
                  <YStack flex={1} minWidth="50%">
                    <Text fontSize="$1" color="$color10">
                      Expiry Date
                    </Text>
                    <Text fontSize="$3" fontWeight="500" color="$color12">
                      {formatDate(currentExtraction.expiry_date)}
                    </Text>
                  </YStack>
                )}
              </XStack>

              {currentExtraction.coverage_amounts &&
                currentExtraction.coverage_amounts.length > 0 && (
                  <YStack mt="$4" paddingTop="$4" borderTopWidth={1} borderTopColor="$borderColor">
                    <Text fontSize="$1" color="$color10">
                      Coverage Amounts
                    </Text>
                    <XStack flexWrap="wrap" gap="$2" mt="$2">
                      {currentExtraction.coverage_amounts.map(
                        (coverage, index) => (
                          <YStack
                            key={index}
                            padding="$2"
                            backgroundColor="$backgroundHover"
                            borderRadius="$2"
                            flex={1}
                            minWidth="50%"
                          >
                            <Text fontSize="$1" color="$color11">
                              {coverage.type}:
                            </Text>
                            <Text fontSize="$3" fontWeight="500" color="$color12">
                              ${coverage.amount.toLocaleString()}
                            </Text>
                          </YStack>
                        )
                      )}
                    </XStack>
                  </YStack>
                )}
            </Card>
          )}
        </YStack>

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
