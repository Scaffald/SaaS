import { useState, useEffect } from 'react';
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
import { Stack, Row, Text, H2, H3, Card } from '@unicornlove/beyond-ui';
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
      return <CheckCircle color="var(--color-green-10)" size={20} />;
    }
    const percentage = (gap.actual / gap.required) * 100;
    if (percentage >= 80) {
      return <AlertTriangle color="var(--color-yellow-10)" size={20} />;
    }
    return <XCircle color="var(--color-red-10)" size={20} />;
  };

  const pdfUrl =
    documentUrl ||
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

  const getOverallMatchColor = () => {
    if (!comparisonResult) return 'var(--color-10)';
    if (comparisonResult.overallMatch >= 100) return 'var(--color-green-10)';
    if (comparisonResult.overallMatch >= 80) return 'var(--color-yellow-10)';
    return 'var(--color-red-10)';
  };

  const getProgressBarColor = () => {
    if (!comparisonResult) return 'var(--color-9)';
    if (comparisonResult.overallMatch >= 100) return 'var(--color-green-9)';
    if (comparisonResult.overallMatch >= 80) return 'var(--color-yellow-9)';
    return 'var(--color-red-9)';
  };

  const getGapCardStyles = (gap: CoverageGap) => {
    if (gap.actual >= gap.required) {
      return {
        backgroundColor: 'var(--color-green-2)',
        borderColor: 'var(--color-green-6)',
      };
    }
    const percentage = (gap.actual / gap.required) * 100;
    if (percentage >= 80) {
      return {
        backgroundColor: 'var(--color-yellow-2)',
        borderColor: 'var(--color-yellow-6)',
      };
    }
    return {
      backgroundColor: 'var(--color-red-2)',
      borderColor: 'var(--color-red-6)',
    };
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
        <Stack style={{ gap: 24 }}>
          {/* Header */}
          <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Stack>
              <H2 style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--color-12)', marginBottom: 8 }}>
                COI Comparison
              </H2>
              <Text style={{ color: 'var(--color-11)' }}>{documentName}</Text>
              {project && (
                <Text style={{ fontSize: 14, color: 'var(--color-10)', marginTop: 4 }}>
                  Project: {project.name}
                </Text>
              )}
            </Stack>
          </Row>

          {/* Main Content: Split Screen */}
          <Row style={{ gap: 24 }}>
            {/* Left: PDF Viewer */}
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
                    Document Preview
                  </Text>
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
                <Stack style={{ position: 'relative', height: 600 }}>
                  {pdfUrl ? (
                    <iframe
                      src={pdfUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      title={documentName}
                    />
                  ) : (
                    <Stack style={{ alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <Stack style={{ alignItems: 'center', gap: 8 }}>
                        <FileText color="var(--color-10)" size={48} />
                        <Text style={{ color: 'var(--color-11)' }}>No preview available</Text>
                      </Stack>
                    </Stack>
                  )}
                </Stack>
              </Card>
            </Stack>

            {/* Right: Comparison Panel */}
            <Stack style={{ flex: 1, gap: 24 }}>
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
                      <Shield size={16} />
                      <H3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-12)' }}>
                        Overall Match
                      </H3>
                    </Row>
                    <Text
                      style={{
                        fontSize: 32,
                        fontWeight: 'bold',
                        color: getOverallMatchColor(),
                      }}
                    >
                      {comparisonResult.overallMatch}%
                    </Text>
                  </Row>
                  <Stack style={{ width: '100%', backgroundColor: 'var(--color-background-hover)', borderRadius: 9999, height: 12 }}>
                    <Stack
                      style={{
                        height: 12,
                        borderRadius: 9999,
                        backgroundColor: getProgressBarColor(),
                        width: `${comparisonResult.overallMatch}%`,
                      }}
                    />
                  </Stack>
                  <Text style={{ fontSize: 12, color: 'var(--color-10)', marginTop: 8 }}>
                    AI Confidence: {comparisonResult.confidence}%
                  </Text>
                </Card>
              )}

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
                  <H3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-12)', marginBottom: 16 }}>
                    Extracted Fields
                  </H3>
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
                        <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>Carrier</Text>
                        <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                          {currentExtraction.carrier}
                        </Text>
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
                  </Stack>
                </Card>
              )}

              {/* Requirements vs Extracted */}
              {project && (
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
                    Project Requirements
                  </H3>
                  <Stack style={{ gap: 12 }}>
                    {project.general_liability_required && (
                      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
                          General Liability
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                          {formatCurrency(project.general_liability_required)}
                        </Text>
                      </Row>
                    )}
                    {project.workers_comp_required && (
                      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
                          Workers Comp
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                          {formatCurrency(project.workers_comp_required)}
                        </Text>
                      </Row>
                    )}
                    {project.auto_liability_required && (
                      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
                          Auto Liability
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                          {formatCurrency(project.auto_liability_required)}
                        </Text>
                      </Row>
                    )}
                    {project.umbrella_required && (
                      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>Umbrella</Text>
                        <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                          {formatCurrency(project.umbrella_required)}
                        </Text>
                      </Row>
                    )}
                  </Stack>
                </Card>
              )}

              {/* Gap Analysis */}
              {loadingComparison ? (
                <Card
                  style={{
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: 'var(--color-border)',
                    borderRadius: 8,
                    padding: 32,
                    backgroundColor: 'var(--color-background)',
                    alignItems: 'center',
                  }}
                >
                  <Stack style={{ alignItems: 'center', gap: 8 }}>
                    <Stack
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9999,
                        borderWidth: 2,
                        borderStyle: 'solid',
                        borderColor: 'var(--color-teal-9)',
                        borderBottomColor: 'transparent',
                        animation: 'spin 1s linear infinite',
                      }}
                    />
                    <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
                      Analyzing coverage...
                    </Text>
                  </Stack>
                </Card>
              ) : comparisonResult && comparisonResult.gaps.length > 0 ? (
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
                    <AlertOctagon color="var(--color-red-10)" size={16} />
                    <H3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-12)' }}>
                      Coverage Gaps ({comparisonResult.gaps.length})
                    </H3>
                  </Row>
                  <Stack style={{ gap: 12 }}>
                    {comparisonResult.gaps.map((gap, index) => (
                      <Card
                        key={index}
                        style={{
                          padding: 12,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderStyle: 'solid',
                          ...getGapCardStyles(gap),
                        }}
                      >
                        <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Row style={{ alignItems: 'center', gap: 8 }}>
                            {getGapStatusIcon(gap)}
                            <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                              {gap.type}
                            </Text>
                          </Row>
                        </Row>
                        <Stack style={{ gap: 4, marginLeft: 28 }}>
                          <Row style={{ justifyContent: 'space-between', fontSize: 12 }}>
                            <Text style={{ color: 'var(--color-11)' }}>Required:</Text>
                            <Text style={{ fontWeight: 500, color: 'var(--color-12)' }}>
                              {formatCurrency(gap.required)}
                            </Text>
                          </Row>
                          <Row style={{ justifyContent: 'space-between', fontSize: 12 }}>
                            <Text style={{ color: 'var(--color-11)' }}>Actual:</Text>
                            <Text style={{ fontWeight: 500, color: 'var(--color-12)' }}>
                              {formatCurrency(gap.actual)}
                            </Text>
                          </Row>
                          <Row
                            style={{
                              justifyContent: 'space-between',
                              fontSize: 12,
                              paddingTop: 4,
                              borderTopWidth: 1,
                              borderTopStyle: 'solid',
                              borderTopColor: 'var(--color-border)',
                            }}
                          >
                            <Text style={{ color: 'var(--color-11)' }}>Gap:</Text>
                            <Text style={{ fontWeight: 500, color: 'var(--color-red-10)' }}>
                              {formatCurrency(gap.required - gap.actual)}
                            </Text>
                          </Row>
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                </Card>
              ) : comparisonResult && comparisonResult.gaps.length === 0 ? (
                <Card
                  style={{
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: 'var(--color-green-6)',
                    borderRadius: 8,
                    padding: 16,
                    backgroundColor: 'var(--color-green-2)',
                  }}
                >
                  <Row style={{ alignItems: 'center', gap: 8 }}>
                    <CheckCircle color="var(--color-green-10)" size={20} />
                    <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-green-12)' }}>
                      All coverage requirements are met
                    </Text>
                  </Row>
                </Card>
              ) : null}

              {/* Recommendations */}
              {comparisonResult &&
                comparisonResult.recommendations.length > 0 && (
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
                      Recommendations
                    </H3>
                    <Stack style={{ gap: 8 }}>
                      {comparisonResult.recommendations.map((rec, index) => (
                        <Row
                          key={index}
                          style={{
                            alignItems: 'flex-start',
                            gap: 8,
                            fontSize: 14,
                            color: 'var(--color-11)',
                          }}
                        >
                          <Text style={{ color: 'var(--color-teal-9)', marginTop: 2 }}>
                            *
                          </Text>
                          <Text>{rec}</Text>
                        </Row>
                      ))}
                    </Stack>
                  </Card>
                )}

              {/* Actions */}
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
                  Actions
                </H3>
                <Stack style={{ gap: 8 }}>
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
                </Stack>
              </Card>
            </Stack>
          </Row>
        </Stack>
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
        <Stack style={{ gap: 16 }}>
          <Textarea
            label="Specify required changes"
            value={requestChangesComment}
            onChange={(e) => setRequestChangesComment(e.target.value)}
            placeholder="Enter the specific changes needed..."
            rows={4}
            fullWidth
            required
          />
          <Row style={{ gap: 12 }}>
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
          </Row>
        </Stack>
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
        <Stack style={{ gap: 16 }}>
          <Card
            style={{
              padding: 12,
              backgroundColor: 'var(--color-yellow-2)',
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: 'var(--color-yellow-6)',
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 12, color: 'var(--color-yellow-12)' }}>
              This will approve the document despite coverage gaps. Please
              provide a reason for the exception.
            </Text>
          </Card>
          <Textarea
            label="Reason for override"
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            placeholder="Enter the reason for approving with exceptions..."
            rows={4}
            fullWidth
            required
          />
          <Row style={{ gap: 12 }}>
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
          </Row>
        </Stack>
      </Modal>

      {/* AI Summary Modal */}
      {showAISummary && comparisonResult && (
        <Modal
          isOpen={showAISummary}
          onClose={() => setShowAISummary(false)}
          title="AI Comparison Analysis Summary"
          size="medium"
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
