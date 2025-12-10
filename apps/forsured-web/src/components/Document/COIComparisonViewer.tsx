import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  X,
  AlertTriangle,
  FileText,
  Shield,
  Download,
  Check,
  XCircle,
  AlertCircle,
  MessageSquare,
  UserCheck,
  AlertOctagon,
} from 'lucide-react';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import Textarea from '../Common/Textarea';
import AIProcessingIndicator, {
  AIProcessingState,
} from '../Common/AIProcessingIndicator';
import AISummaryScreen from '../Common/AISummaryScreen';
import {
  AIExtractedFields,
  ComparisonResult,
  CoverageGap,
  Project,
} from '../../types';
import { useAIExtractions } from '../../hooks/useAIExtractions';
import { useProjects } from '../../hooks/useProjects';
import { useTasks } from '../../hooks/useTasks';
import { formatDate } from '../../utils/dateHelpers';

interface COIComparisonViewerProps {
  documentId: string;
  projectId?: string;
  documentName: string;
  documentUrl?: string;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: () => void;
  onRequestChanges?: (comments: string) => void;
  onOverride?: (reason: string) => void;
}

export default function COIComparisonViewer({
  documentId,
  projectId,
  documentName,
  documentUrl,
  isOpen,
  onClose,
  onApprove,
  onRequestChanges,
  onOverride,
}: COIComparisonViewerProps) {
  const [showRequestChangesModal, setShowRequestChangesModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [requestChangesComment, setRequestChangesComment] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [comparisonResult, setComparisonResult] =
    useState<ComparisonResult | null>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [aiProcessingState, setAIProcessingState] =
    useState<AIProcessingState | null>(null);
  const [aiProcessingProgress, setAIProcessingProgress] = useState(0);
  const [showAISummary, setShowAISummary] = useState(false);

  const {
    extractions,
    loading: extractionsLoading,
    fetchExtractions,
  } = useAIExtractions({
    documentId,
  });
  const { projects } = useProjects();

  const project = projectId ? projects.find((p) => p.id === projectId) : null;
  const currentExtraction = extractions[0];

  useEffect(() => {
    if (isOpen && documentId) {
      fetchExtractions();
    }
  }, [isOpen, documentId]);

  useEffect(() => {
    if (currentExtraction && project) {
      performComparison();
    }
  }, [currentExtraction, project]);

  const performComparison = async () => {
    if (!currentExtraction || !project) return;

    setLoadingComparison(true);
    setAIProcessingState('analyzing');
    setAIProcessingProgress(0);

    // Simulate AI comparison processing
    setTimeout(() => {
      setAIProcessingState('processing');
      const progressInterval = setInterval(() => {
        setAIProcessingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 300);

      const gaps: CoverageGap[] = [];
      const requirements = {
        general_liability: project.general_liability_required,
        workers_comp: project.workers_comp_required,
        auto_liability: project.auto_liability_required,
        umbrella: project.umbrella_required,
        professional_liability: project.professional_liability_required,
        pollution_liability: project.pollution_liability_required,
      };

      // Compare each coverage type
      if (requirements.general_liability) {
        const extracted = currentExtraction.coverage_amounts?.find(
          (c) => c.type === 'GL'
        );
        if (!extracted || extracted.amount < requirements.general_liability) {
          gaps.push({
            type: 'General Liability',
            required: requirements.general_liability,
            actual: extracted?.amount || 0,
            status: 'insufficient',
          });
        }
      }

      if (requirements.workers_comp) {
        const extracted = currentExtraction.coverage_amounts?.find(
          (c) => c.type === 'WC'
        );
        if (!extracted || extracted.amount < requirements.workers_comp) {
          gaps.push({
            type: 'Workers Compensation',
            required: requirements.workers_comp,
            actual: extracted?.amount || 0,
            status: 'insufficient',
          });
        }
      }

      if (requirements.auto_liability) {
        const extracted = currentExtraction.coverage_amounts?.find(
          (c) => c.type === 'Auto'
        );
        if (!extracted || extracted.amount < requirements.auto_liability) {
          gaps.push({
            type: 'Auto Liability',
            required: requirements.auto_liability,
            actual: extracted?.amount || 0,
            status: 'insufficient',
          });
        }
      }

      if (requirements.umbrella) {
        const extracted = currentExtraction.coverage_amounts?.find(
          (c) => c.type === 'Umbrella'
        );
        if (!extracted || extracted.amount < requirements.umbrella) {
          gaps.push({
            type: 'Umbrella/Excess',
            required: requirements.umbrella,
            actual: extracted?.amount || 0,
            status: 'insufficient',
          });
        }
      }

      // Calculate overall match percentage
      const totalCoverages = Object.values(requirements).filter(Boolean).length;
      const matchedCoverages = totalCoverages - gaps.length;
      const overallMatch =
        totalCoverages > 0
          ? Math.round((matchedCoverages / totalCoverages) * 100)
          : 100;

      // Generate recommendations
      const recommendations: string[] = [];
      if (gaps.length > 0) {
        recommendations.push(
          `${gaps.length} coverage gap${gaps.length > 1 ? 's' : ''} found`
        );
        gaps.forEach((gap) => {
          recommendations.push(
            `${gap.type} needs to be increased to $${gap.required.toLocaleString()}`
          );
        });
      } else {
        recommendations.push('All coverage requirements are met');
      }

      const result = {
        overallMatch,
        gaps,
        recommendations,
        confidence: currentExtraction.confidence,
      };

      setComparisonResult(result);
      setAIProcessingProgress(100);
      setAIProcessingState('complete');

      setTimeout(() => {
        setAIProcessingState(null);
        setAIProcessingProgress(0);
        setShowAISummary(true);
      }, 1000);

      setLoadingComparison(false);
    }, 1000);
  };

  const handleApprove = () => {
    onApprove?.();
    onClose();
  };

  const handleRequestChanges = () => {
    if (requestChangesComment.trim()) {
      onRequestChanges?.(requestChangesComment);
      setShowRequestChangesModal(false);
      setRequestChangesComment('');
      onClose();
    }
  };

  const handleOverride = () => {
    if (overrideReason.trim()) {
      onOverride?.(overrideReason);
      setShowOverrideModal(false);
      setOverrideReason('');
      onClose();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getGapStatusIcon = (gap: CoverageGap) => {
    if (gap.actual >= gap.required) {
      return <CheckCircle className="text-success-600" size={20} />;
    }
    const percentage = (gap.actual / gap.required) * 100;
    if (percentage >= 80) {
      return <AlertTriangle className="text-warning-600" size={20} />;
    }
    return <XCircle className="text-error-600" size={20} />;
  };

  const getGapStatusColor = (gap: CoverageGap) => {
    if (gap.actual >= gap.required) {
      return 'bg-success-50 border-success-200';
    }
    const percentage = (gap.actual / gap.required) * 100;
    if (percentage >= 80) {
      return 'bg-warning-50 border-warning-200';
    }
    return 'bg-error-50 border-error-200';
  };

  const getMatchColor = (match: number) => {
    if (match >= 100) return 'text-success-600';
    if (match >= 80) return 'text-warning-600';
    return 'text-error-600';
  };

  const pdfUrl =
    documentUrl ||
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">
                COI Comparison
              </h2>
              <p className="text-text-secondary">{documentName}</p>
              {project && (
                <p className="text-sm text-text-tertiary mt-1">
                  Project: {project.name}
                </p>
              )}
            </div>
          </div>

          {/* Main Content: Split Screen */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left: PDF Viewer */}
            <div>
              <div className="border border-border rounded-lg overflow-hidden bg-bg-secondary">
                <div className="flex items-center justify-between p-3 bg-bg-tertiary border-b border-border">
                  <span className="text-sm font-medium text-text-secondary">
                    Document Preview
                  </span>
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
                <div className="relative" style={{ height: '600px' }}>
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

            {/* Right: Comparison Panel */}
            <div className="space-y-6">
              {/* AI Processing Indicator */}
              {aiProcessingState && (
                <AIProcessingIndicator
                  state={aiProcessingState}
                  message={
                    aiProcessingState === 'analyzing'
                      ? 'AI analyzing coverage...'
                      : aiProcessingState === 'processing'
                        ? 'AI comparing requirements...'
                        : undefined
                  }
                  progress={
                    aiProcessingState === 'processing'
                      ? aiProcessingProgress
                      : undefined
                  }
                />
              )}

              {/* Overall Match Score */}
              {comparisonResult && !aiProcessingState && (
                <div className="border border-border rounded-lg p-4 bg-bg-secondary">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-text-primary flex items-center space-x-2">
                      <Shield size={16} />
                      <span>Overall Match</span>
                    </h3>
                    <span
                      className={`text-2xl font-bold ${getMatchColor(comparisonResult.overallMatch)}`}
                    >
                      {comparisonResult.overallMatch}%
                    </span>
                  </div>
                  <div className="w-full bg-bg-tertiary rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        comparisonResult.overallMatch >= 100
                          ? 'bg-success-600'
                          : comparisonResult.overallMatch >= 80
                            ? 'bg-warning-600'
                            : 'bg-error-600'
                      }`}
                      style={{ width: `${comparisonResult.overallMatch}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-tertiary mt-2">
                    AI Confidence: {comparisonResult.confidence}%
                  </p>
                </div>
              )}

              {/* AI Extracted Fields */}
              {currentExtraction && (
                <div className="border border-border rounded-lg p-4 bg-bg-secondary">
                  <h3 className="text-sm font-semibold text-text-primary mb-4">
                    Extracted Fields
                  </h3>
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
                </div>
              )}

              {/* Requirements vs Extracted */}
              {project && (
                <div className="border border-border rounded-lg p-4 bg-bg-secondary">
                  <h3 className="text-sm font-semibold text-text-primary mb-4">
                    Project Requirements
                  </h3>
                  <div className="space-y-3">
                    {project.general_liability_required && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-secondary">
                          General Liability
                        </span>
                        <span className="text-sm font-medium text-text-primary">
                          {formatCurrency(project.general_liability_required)}
                        </span>
                      </div>
                    )}
                    {project.workers_comp_required && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-secondary">
                          Workers Comp
                        </span>
                        <span className="text-sm font-medium text-text-primary">
                          {formatCurrency(project.workers_comp_required)}
                        </span>
                      </div>
                    )}
                    {project.auto_liability_required && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-secondary">
                          Auto Liability
                        </span>
                        <span className="text-sm font-medium text-text-primary">
                          {formatCurrency(project.auto_liability_required)}
                        </span>
                      </div>
                    )}
                    {project.umbrella_required && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-secondary">
                          Umbrella
                        </span>
                        <span className="text-sm font-medium text-text-primary">
                          {formatCurrency(project.umbrella_required)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Gap Analysis */}
              {loadingComparison ? (
                <div className="border border-border rounded-lg p-8 bg-bg-secondary text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                  <p className="text-sm text-text-secondary">
                    Analyzing coverage...
                  </p>
                </div>
              ) : comparisonResult && comparisonResult.gaps.length > 0 ? (
                <div className="border border-border rounded-lg p-4 bg-bg-secondary">
                  <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center space-x-2">
                    <AlertOctagon className="text-error-600" size={16} />
                    <span>Coverage Gaps ({comparisonResult.gaps.length})</span>
                  </h3>
                  <div className="space-y-3">
                    {comparisonResult.gaps.map((gap, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${getGapStatusColor(gap)}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getGapStatusIcon(gap)}
                            <span className="text-sm font-medium text-text-primary">
                              {gap.type}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1 ml-7">
                          <div className="flex justify-between text-xs">
                            <span className="text-text-secondary">
                              Required:
                            </span>
                            <span className="font-medium text-text-primary">
                              {formatCurrency(gap.required)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-text-secondary">Actual:</span>
                            <span className="font-medium text-text-primary">
                              {formatCurrency(gap.actual)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs pt-1 border-t border-border">
                            <span className="text-text-secondary">Gap:</span>
                            <span className="font-medium text-error-600">
                              {formatCurrency(gap.required - gap.actual)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : comparisonResult && comparisonResult.gaps.length === 0 ? (
                <div className="border border-success-200 rounded-lg p-4 bg-success-50">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-success-600" size={20} />
                    <span className="text-sm font-medium text-success-900">
                      All coverage requirements are met
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Recommendations */}
              {comparisonResult &&
                comparisonResult.recommendations.length > 0 && (
                  <div className="border border-border rounded-lg p-4 bg-bg-secondary">
                    <h3 className="text-sm font-semibold text-text-primary mb-4">
                      Recommendations
                    </h3>
                    <ul className="space-y-2">
                      {comparisonResult.recommendations.map((rec, index) => (
                        <li
                          key={index}
                          className="flex items-start space-x-2 text-sm text-text-secondary"
                        >
                          <span className="text-primary-600 mt-0.5">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Actions */}
              <div className="border border-border rounded-lg p-4 bg-bg-secondary">
                <h3 className="text-sm font-semibold text-text-primary mb-4">
                  Actions
                </h3>
                <div className="space-y-2">
                  <Button
                    variant="success"
                    onClick={handleApprove}
                    leftIcon={CheckCircle}
                    fullWidth
                  >
                    Approve
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowRequestChangesModal(true)}
                    leftIcon={MessageSquare}
                    fullWidth
                  >
                    Request Changes
                  </Button>
                  {comparisonResult && comparisonResult.gaps.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setShowOverrideModal(true)}
                      leftIcon={UserCheck}
                      fullWidth
                    >
                      Override with Exception
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Request Changes Modal */}
      <Modal
        isOpen={showRequestChangesModal}
        onClose={() => {
          setShowRequestChangesModal(false);
          setRequestChangesComment('');
        }}
        title="Request Changes"
        size="sm"
      >
        <div className="space-y-4">
          <Textarea
            label="Specify required changes"
            value={requestChangesComment}
            onChange={(e) => setRequestChangesComment(e.target.value)}
            placeholder="Enter the specific changes needed..."
            rows={4}
            fullWidth
            required
          />
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowRequestChangesModal(false);
                setRequestChangesComment('');
              }}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRequestChanges}
              disabled={!requestChangesComment.trim()}
              fullWidth
            >
              Send Request
            </Button>
          </div>
        </div>
      </Modal>

      {/* Override Modal */}
      <Modal
        isOpen={showOverrideModal}
        onClose={() => {
          setShowOverrideModal(false);
          setOverrideReason('');
        }}
        title="Override Approval"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
            <p className="text-xs text-warning-900">
              This will approve the document despite coverage gaps. Please
              provide a reason for the exception.
            </p>
          </div>
          <Textarea
            label="Reason for override"
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            placeholder="Enter the reason for approving with exceptions..."
            rows={4}
            fullWidth
            required
          />
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowOverrideModal(false);
                setOverrideReason('');
              }}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleOverride}
              disabled={!overrideReason.trim()}
              fullWidth
            >
              Override & Approve
            </Button>
          </div>
        </div>
      </Modal>

      {/* AI Summary Modal */}
      {showAISummary && comparisonResult && (
        <Modal
          isOpen={showAISummary}
          onClose={() => setShowAISummary(false)}
          title="AI Comparison Analysis Summary"
          size="md"
        >
          <AISummaryScreen
            title="Coverage Comparison Analysis"
            whatWasAnalyzed={`Compared ${documentName} against project requirements for ${project?.name || 'the project'}. Analyzed coverage amounts, limits, and compliance status.`}
            keyFindings={[
              `Overall match: ${comparisonResult.overallMatch}%`,
              comparisonResult.gaps.length > 0
                ? `Found ${comparisonResult.gaps.length} coverage gap${comparisonResult.gaps.length > 1 ? 's' : ''}`
                : 'All coverage requirements are met',
              ...comparisonResult.gaps
                .slice(0, 3)
                .map(
                  (gap) =>
                    `${gap.type}: ${((gap.actual / gap.required) * 100).toFixed(0)}% of required amount`
                ),
            ]}
            confidence={comparisonResult.confidence}
            recommendations={comparisonResult.recommendations}
            actionsTaken={[
              'Analyzed coverage amounts against requirements',
              'Identified coverage gaps and deficiencies',
              'Calculated overall compliance match percentage',
            ]}
            actionsRequiringReview={
              comparisonResult.gaps.length > 0
                ? [
                    'Review coverage gaps with subcontractor',
                    'Decide on approval or request changes',
                    'Consider override if exceptions are acceptable',
                  ]
                : []
            }
            onClose={() => setShowAISummary(false)}
          />
        </Modal>
      )}
    </>
  );
}
