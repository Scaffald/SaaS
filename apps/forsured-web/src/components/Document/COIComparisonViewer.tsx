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
import { YStack, XStack, Text, H2, H3, Card } from '@unicornlove/ui';
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
      return <CheckCircle color="$green10" size={20} />;
    }
    const percentage = (gap.actual / gap.required) * 100;
    if (percentage >= 80) {
      return <AlertTriangle color="$yellow10" size={20} />;
    }
    return <XCircle color="$red10" size={20} />;
  };

  const pdfUrl =
    documentUrl ||
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
        <YStack gap="$6">
          {/* Header */}
          <XStack alignItems="flex-start" justifyContent="space-between">
            <YStack>
              <H2 fontSize="$8" fontWeight="bold" color="$color12" marginBottom="$2">
                COI Comparison
              </H2>
              <Text color="$color11">{documentName}</Text>
              {project && (
                <Text fontSize="$3" color="$color10" marginTop="$1">
                  Project: {project.name}
                </Text>
              )}
            </YStack>
          </XStack>

          {/* Main Content: Split Screen */}
          <XStack gap="$6">
            {/* Left: PDF Viewer */}
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
                    Document Preview
                  </Text>
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
                <YStack position="relative" height={600}>
                  {pdfUrl ? (
                    <iframe
                      src={pdfUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      title={documentName}
                    />
                  ) : (
                    <YStack alignItems="center" justifyContent="center" height="100%">
                      <YStack alignItems="center" gap="$2">
                        <FileText color="$color10" size={48} />
                        <Text color="$color11">No preview available</Text>
                      </YStack>
                    </YStack>
                  )}
                </YStack>
              </Card>
            </YStack>

            {/* Right: Comparison Panel */}
            <YStack flex={1} gap="$6">
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
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$4"
                  padding="$4"
                  backgroundColor="$background"
                >
                  <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
                    <XStack alignItems="center" gap="$2">
                      <Shield size={16} />
                      <H3 fontSize="$3" fontWeight="600" color="$color12">
                        Overall Match
                      </H3>
                    </XStack>
                    <Text
                      fontSize="$9"
                      fontWeight="bold"
                      color={
                        comparisonResult.overallMatch >= 100
                          ? '$green10'
                          : comparisonResult.overallMatch >= 80
                            ? '$yellow10'
                            : '$red10'
                      }
                    >
                      {comparisonResult.overallMatch}%
                    </Text>
                  </XStack>
                  <YStack width="100%" backgroundColor="$backgroundHover" borderRadius={9999} height={12}>
                    <YStack
                      height={12}
                      borderRadius={9999}
                      backgroundColor={
                        comparisonResult.overallMatch >= 100
                          ? '$green9'
                          : comparisonResult.overallMatch >= 80
                            ? '$yellow9'
                            : '$red9'
                      }
                      width={`${comparisonResult.overallMatch}%`}
                    />
                  </YStack>
                  <Text fontSize="$1" color="$color10" marginTop="$2">
                    AI Confidence: {comparisonResult.confidence}%
                  </Text>
                </Card>
              )}

              {/* AI Extracted Fields */}
              {currentExtraction && (
                <Card
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$4"
                  padding="$4"
                  backgroundColor="$background"
                >
                  <H3 fontSize="$3" fontWeight="600" color="$color12" marginBottom="$4">
                    Extracted Fields
                  </H3>
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
                        <Text fontSize="$1" color="$color10">Carrier</Text>
                        <Text fontSize="$3" fontWeight="500" color="$color12">
                          {currentExtraction.carrier}
                        </Text>
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
                  </YStack>
                </Card>
              )}

              {/* Requirements vs Extracted */}
              {project && (
                <Card
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$4"
                  padding="$4"
                  backgroundColor="$background"
                >
                  <H3 fontSize="$3" fontWeight="600" color="$color12" marginBottom="$4">
                    Project Requirements
                  </H3>
                  <YStack gap="$3">
                    {project.general_liability_required && (
                      <XStack justifyContent="space-between" alignItems="center">
                        <Text fontSize="$3" color="$color11">
                          General Liability
                        </Text>
                        <Text fontSize="$3" fontWeight="500" color="$color12">
                          {formatCurrency(project.general_liability_required)}
                        </Text>
                      </XStack>
                    )}
                    {project.workers_comp_required && (
                      <XStack justifyContent="space-between" alignItems="center">
                        <Text fontSize="$3" color="$color11">
                          Workers Comp
                        </Text>
                        <Text fontSize="$3" fontWeight="500" color="$color12">
                          {formatCurrency(project.workers_comp_required)}
                        </Text>
                      </XStack>
                    )}
                    {project.auto_liability_required && (
                      <XStack justifyContent="space-between" alignItems="center">
                        <Text fontSize="$3" color="$color11">
                          Auto Liability
                        </Text>
                        <Text fontSize="$3" fontWeight="500" color="$color12">
                          {formatCurrency(project.auto_liability_required)}
                        </Text>
                      </XStack>
                    )}
                    {project.umbrella_required && (
                      <XStack justifyContent="space-between" alignItems="center">
                        <Text fontSize="$3" color="$color11">Umbrella</Text>
                        <Text fontSize="$3" fontWeight="500" color="$color12">
                          {formatCurrency(project.umbrella_required)}
                        </Text>
                      </XStack>
                    )}
                  </YStack>
                </Card>
              )}

              {/* Gap Analysis */}
              {loadingComparison ? (
                <Card
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$4"
                  padding="$8"
                  backgroundColor="$background"
                  alignItems="center"
                >
                  <YStack alignItems="center" gap="$2">
                    <YStack
                      width={32}
                      height={32}
                      borderRadius={9999}
                      borderWidth={2}
                      borderColor="$teal9"
                      borderBottomColor="transparent"
                      animation="spin"
                    />
                    <Text fontSize="$3" color="$color11">
                      Analyzing coverage...
                    </Text>
                  </YStack>
                </Card>
              ) : comparisonResult && comparisonResult.gaps.length > 0 ? (
                <Card
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$4"
                  padding="$4"
                  backgroundColor="$background"
                >
                  <XStack alignItems="center" gap="$2" marginBottom="$4">
                    <AlertOctagon color="$red10" size={16} />
                    <H3 fontSize="$3" fontWeight="600" color="$color12">
                      Coverage Gaps ({comparisonResult.gaps.length})
                    </H3>
                  </XStack>
                  <YStack gap="$3">
                    {comparisonResult.gaps.map((gap, index) => (
                      <Card
                        key={index}
                        padding="$3"
                        borderRadius="$4"
                        borderWidth={1}
                        backgroundColor={
                          gap.actual >= gap.required
                            ? '$green2'
                            : (gap.actual / gap.required) * 100 >= 80
                              ? '$yellow2'
                              : '$red2'
                        }
                        borderColor={
                          gap.actual >= gap.required
                            ? '$green6'
                            : (gap.actual / gap.required) * 100 >= 80
                              ? '$yellow6'
                              : '$red6'
                        }
                      >
                        <XStack alignItems="flex-start" justifyContent="space-between" marginBottom="$2">
                          <XStack alignItems="center" gap="$2">
                            {getGapStatusIcon(gap)}
                            <Text fontSize="$3" fontWeight="500" color="$color12">
                              {gap.type}
                            </Text>
                          </XStack>
                        </XStack>
                        <YStack gap="$1" marginLeft="$7">
                          <XStack justifyContent="space-between" fontSize="$1">
                            <Text color="$color11">Required:</Text>
                            <Text fontWeight="500" color="$color12">
                              {formatCurrency(gap.required)}
                            </Text>
                          </XStack>
                          <XStack justifyContent="space-between" fontSize="$1">
                            <Text color="$color11">Actual:</Text>
                            <Text fontWeight="500" color="$color12">
                              {formatCurrency(gap.actual)}
                            </Text>
                          </XStack>
                          <XStack
                            justifyContent="space-between"
                            fontSize="$1"
                            paddingTop="$1"
                            borderTopWidth={1}
                            borderTopColor="$borderColor"
                          >
                            <Text color="$color11">Gap:</Text>
                            <Text fontWeight="500" color="$red10">
                              {formatCurrency(gap.required - gap.actual)}
                            </Text>
                          </XStack>
                        </YStack>
                      </Card>
                    ))}
                  </YStack>
                </Card>
              ) : comparisonResult && comparisonResult.gaps.length === 0 ? (
                <Card
                  borderWidth={1}
                  borderColor="$green6"
                  borderRadius="$4"
                  padding="$4"
                  backgroundColor="$green2"
                >
                  <XStack alignItems="center" gap="$2">
                    <CheckCircle color="$green10" size={20} />
                    <Text fontSize="$3" fontWeight="500" color="$green12">
                      All coverage requirements are met
                    </Text>
                  </XStack>
                </Card>
              ) : null}

              {/* Recommendations */}
              {comparisonResult &&
                comparisonResult.recommendations.length > 0 && (
                  <Card
                    borderWidth={1}
                    borderColor="$borderColor"
                    borderRadius="$4"
                    padding="$4"
                    backgroundColor="$background"
                  >
                    <H3 fontSize="$3" fontWeight="600" color="$color12" marginBottom="$4">
                      Recommendations
                    </H3>
                    <YStack gap="$2">
                      {comparisonResult.recommendations.map((rec, index) => (
                        <XStack
                          key={index}
                          alignItems="flex-start"
                          gap="$2"
                          fontSize="$3"
                          color="$color11"
                        >
                          <Text color="$teal9" marginTop="$0.5">
                            •
                          </Text>
                          <Text>{rec}</Text>
                        </XStack>
                      ))}
                    </YStack>
                  </Card>
                )}

              {/* Actions */}
              <Card
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$4"
                padding="$4"
                backgroundColor="$background"
              >
                <H3 fontSize="$3" fontWeight="600" color="$color12" marginBottom="$4">
                  Actions
                </H3>
                <YStack gap="$2">
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
                </YStack>
              </Card>
            </YStack>
          </XStack>
        </YStack>
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
        <YStack gap="$4">
          <Textarea
            label="Specify required changes"
            value={requestChangesComment}
            onChange={(e) => setRequestChangesComment(e.target.value)}
            placeholder="Enter the specific changes needed..."
            rows={4}
            fullWidth
            required
          />
          <XStack gap="$3">
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
          </XStack>
        </YStack>
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
        <YStack gap="$4">
          <Card
            padding="$3"
            backgroundColor="$yellow2"
            borderWidth={1}
            borderColor="$yellow6"
            borderRadius="$4"
          >
            <Text fontSize="$1" color="$yellow12">
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
          <XStack gap="$3">
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
          </XStack>
        </YStack>
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
