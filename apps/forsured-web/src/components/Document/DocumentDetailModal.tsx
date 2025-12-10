/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-success-100 text-success-700 border-success-300';
      case 'pending':
        return 'bg-warning-100 text-warning-700 border-warning-300';
      case 'expired':
        return 'bg-error-100 text-error-700 border-error-300';
      case 'expiring':
        return 'bg-warning-100 text-warning-700 border-warning-300';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-300';
    }
  };

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <FileText className="text-primary-600" size={24} />
              <h2 className="text-2xl font-bold text-text-primary">
                {documentName}
              </h2>
              <span
                className={`px-2.5 py-1 text-xs font-medium rounded border ${getStatusColor(status)}`}
              >
                {status.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-text-secondary">
              <span className="flex items-center space-x-1">
                <Calendar size={14} />
                <span>Uploaded {formatDate(uploadDate)}</span>
              </span>
              {expiryDate && (
                <span
                  className={`flex items-center space-x-1 ${daysUntilExpiry !== null && daysUntilExpiry <= 30 ? 'text-warning-600' : ''}`}
                >
                  <Clock size={14} />
                  <span>
                    Expires {formatDate(expiryDate)}
                    {daysUntilExpiry !== null &&
                      daysUntilExpiry <= 30 &&
                      ` (${daysUntilExpiry} days)`}
                  </span>
                </span>
              )}
              {fileSize && <span>{formatFileSize(fileSize)}</span>}
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg">
          <span className="text-sm font-medium text-text-secondary">
            View Mode:
          </span>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'inline' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('inline')}
              leftIcon={Maximize2}
            >
              Inline
            </Button>
            <Button
              variant={viewMode === 'modal' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('modal')}
              leftIcon={Minimize2}
            >
              Modal
            </Button>
            <Button
              variant={viewMode === 'split-screen' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('split-screen')}
              leftIcon={Layout}
            >
              Split
            </Button>
          </div>
        </div>

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
        <div
          className={
            viewMode === 'split-screen' ? 'grid grid-cols-2 gap-6' : ''
          }
        >
          {/* PDF Viewer */}
          <div className={viewMode === 'split-screen' ? '' : 'mb-6'}>
            <div className="border border-border rounded-lg overflow-hidden bg-bg-secondary">
              <div className="flex items-center justify-between p-3 bg-bg-tertiary border-b border-border">
                <span className="text-sm font-medium text-text-secondary">
                  {documentType}
                </span>
                <div className="flex items-center space-x-2">
                  {pdfUrl && (
                    <a
                      href={pdfUrl}
                      download={documentName}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded"
                    >
                      <Download size={16} />
                    </a>
                  )}
                </div>
              </div>
              <div
                className="relative"
                style={{
                  height: viewMode === 'inline' ? '600px' : '400px',
                  minHeight: '400px',
                }}
              >
                {pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    className="w-full h-full border-0"
                    title={documentName}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <FileText
                        className="mx-auto text-text-tertiary mb-2"
                        size={48}
                      />
                      <p className="text-text-secondary">
                        No preview available
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Extracted Fields & Details */}
          {(viewMode === 'split-screen' || viewMode === 'modal') && (
            <div className="space-y-6">
              {/* AI Extracted Fields */}
              {currentExtraction && (
                <div className="border border-border rounded-lg p-4 bg-bg-secondary">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-text-primary flex items-center space-x-2">
                      <FileCheck size={16} />
                      <span>AI-Extracted Fields</span>
                    </h3>
                    <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded">
                      {currentExtraction.confidence}% confidence
                    </span>
                  </div>

                  <div className="space-y-3">
                    {currentExtraction.policy_number && (
                      <div>
                        <span className="text-xs text-text-tertiary">
                          Policy Number
                        </span>
                        <p className="text-sm font-medium text-text-primary">
                          {currentExtraction.policy_number}
                        </p>
                      </div>
                    )}
                    {currentExtraction.carrier && (
                      <div>
                        <span className="text-xs text-text-tertiary">
                          Carrier
                        </span>
                        <p className="text-sm font-medium text-text-primary">
                          {currentExtraction.carrier}
                        </p>
                      </div>
                    )}
                    {currentExtraction.coverage_amounts &&
                      currentExtraction.coverage_amounts.length > 0 && (
                        <div>
                          <span className="text-xs text-text-tertiary">
                            Coverage Amounts
                          </span>
                          <div className="space-y-1 mt-1">
                            {currentExtraction.coverage_amounts.map(
                              (coverage, index) => (
                                <div
                                  key={index}
                                  className="flex justify-between text-sm"
                                >
                                  <span className="text-text-secondary">
                                    {coverage.type}:
                                  </span>
                                  <span className="font-medium text-text-primary">
                                    ${coverage.amount.toLocaleString()}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    {currentExtraction.effective_date && (
                      <div>
                        <span className="text-xs text-text-tertiary">
                          Effective Date
                        </span>
                        <p className="text-sm font-medium text-text-primary">
                          {formatDate(currentExtraction.effective_date)}
                        </p>
                      </div>
                    )}
                    {currentExtraction.expiry_date && (
                      <div>
                        <span className="text-xs text-text-tertiary">
                          Expiry Date
                        </span>
                        <p className="text-sm font-medium text-text-primary">
                          {formatDate(currentExtraction.expiry_date)}
                        </p>
                      </div>
                    )}
                    {currentExtraction.named_insureds &&
                      currentExtraction.named_insureds.length > 0 && (
                        <div>
                          <span className="text-xs text-text-tertiary">
                            Named Insureds
                          </span>
                          <div className="space-y-1 mt-1">
                            {currentExtraction.named_insureds.map(
                              (insured, index) => (
                                <p
                                  key={index}
                                  className="text-sm text-text-primary"
                                >
                                  • {insured}
                                </p>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleExtractFields}
                      fullWidth
                    >
                      Re-extract Fields
                    </Button>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="border border-border rounded-lg p-4 bg-bg-secondary">
                <h3 className="text-sm font-semibold text-text-primary mb-4">
                  Metadata
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-text-tertiary">
                      Document Type
                    </span>
                    <p className="text-sm font-medium text-text-primary">
                      {documentType}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-text-tertiary">
                      Uploaded By
                    </span>
                    <p className="text-sm font-medium text-text-primary">
                      {uploadedBy}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-text-tertiary">
                      Upload Date
                    </span>
                    <p className="text-sm font-medium text-text-primary">
                      {formatDate(uploadDate)}
                    </p>
                  </div>
                  {fileSize && (
                    <div>
                      <span className="text-xs text-text-tertiary">
                        File Size
                      </span>
                      <p className="text-sm font-medium text-text-primary">
                        {formatFileSize(fileSize)}
                      </p>
                    </div>
                  )}
                  {expiryDate && (
                    <div>
                      <span className="text-xs text-text-tertiary">
                        Expiry Date
                      </span>
                      <p
                        className={`text-sm font-medium ${daysUntilExpiry !== null && daysUntilExpiry <= 30 ? 'text-warning-600' : 'text-text-primary'}`}
                      >
                        {formatDate(expiryDate)}
                        {daysUntilExpiry !== null && daysUntilExpiry <= 30 && (
                          <span className="ml-2">
                            ⚠️ {daysUntilExpiry} days left
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Version History */}
              {versions.length > 0 && (
                <div className="border border-border rounded-lg p-4 bg-bg-secondary">
                  <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center space-x-2">
                    <HistoryIcon size={16} />
                    <span>Version History</span>
                  </h3>
                  <div className="space-y-2">
                    {versions.map((version) => (
                      <div
                        key={version.id}
                        className="flex items-center justify-between p-2 bg-bg-primary rounded"
                      >
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            Version {version.version_number}
                          </p>
                          <p className="text-xs text-text-tertiary">
                            {formatDate(version.uploaded_at)} by{' '}
                            {version.uploaded_by}
                          </p>
                        </div>
                        <span className="text-xs text-text-tertiary">
                          {formatFileSize(version.file_size)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Items */}
              {(projectId || documentComments.length > 0) && (
                <div className="border border-border rounded-lg p-4 bg-bg-secondary">
                  <h3 className="text-sm font-semibold text-text-primary mb-4">
                    Related Items
                  </h3>
                  <div className="space-y-2">
                    {projectId && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Building size={14} className="text-text-tertiary" />
                        <span className="text-text-secondary">Project: </span>
                        <span className="text-text-primary font-medium">
                          {projectId}
                        </span>
                      </div>
                    )}
                    {documentComments.length > 0 && (
                      <div className="flex items-center space-x-2 text-sm">
                        <FileText size={14} className="text-text-tertiary" />
                        <span className="text-text-secondary">
                          {documentComments.length} comments
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Inline Mode: Show extracted fields below PDF */}
          {viewMode === 'inline' && currentExtraction && (
            <div className="border border-border rounded-lg p-4 bg-bg-secondary">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-primary flex items-center space-x-2">
                  <FileCheck size={16} />
                  <span>AI-Extracted Fields</span>
                </h3>
                <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded">
                  {currentExtraction.confidence}% confidence
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {currentExtraction.policy_number && (
                  <div>
                    <span className="text-xs text-text-tertiary">
                      Policy Number
                    </span>
                    <p className="text-sm font-medium text-text-primary">
                      {currentExtraction.policy_number}
                    </p>
                  </div>
                )}
                {currentExtraction.carrier && (
                  <div>
                    <span className="text-xs text-text-tertiary">Carrier</span>
                    <p className="text-sm font-medium text-text-primary">
                      {currentExtraction.carrier}
                    </p>
                  </div>
                )}
                {currentExtraction.effective_date && (
                  <div>
                    <span className="text-xs text-text-tertiary">
                      Effective Date
                    </span>
                    <p className="text-sm font-medium text-text-primary">
                      {formatDate(currentExtraction.effective_date)}
                    </p>
                  </div>
                )}
                {currentExtraction.expiry_date && (
                  <div>
                    <span className="text-xs text-text-tertiary">
                      Expiry Date
                    </span>
                    <p className="text-sm font-medium text-text-primary">
                      {formatDate(currentExtraction.expiry_date)}
                    </p>
                  </div>
                )}
              </div>

              {currentExtraction.coverage_amounts &&
                currentExtraction.coverage_amounts.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <span className="text-xs text-text-tertiary">
                      Coverage Amounts
                    </span>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {currentExtraction.coverage_amounts.map(
                        (coverage, index) => (
                          <div
                            key={index}
                            className="p-2 bg-bg-primary rounded"
                          >
                            <span className="text-xs text-text-secondary">
                              {coverage.type}:
                            </span>
                            <p className="text-sm font-medium text-text-primary">
                              ${coverage.amount.toLocaleString()}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* AI Summary Modal */}
      {showAISummary && currentExtraction && (
        <Modal
          isOpen={showAISummary}
          onClose={() => setShowAISummary(false)}
          title="AI Analysis Summary"
          size="md"
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
