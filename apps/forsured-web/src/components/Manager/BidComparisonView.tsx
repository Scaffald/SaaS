/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect, useRef } from 'react';
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  Trophy,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Download,
  Filter,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';
import { YStack, XStack, Text, H2, H3, Card, Spinner } from '@unicornlove/ui';
import { useBids } from '../../hooks/useBids';
import { useProjects } from '../../hooks/useProjects';
import { useUsers } from '../../hooks/useUsers';
import {
  mockCalculateComplianceScore,
  BidScoreBreakdown,
} from '../../utils/bidScoring';
import Button from '../Common/Button';
import Select from '../Common/Select';
import Modal from '../Common/Modal';
import Textarea from '../Common/Textarea';
import AIProcessingIndicator, {
  AIProcessingState,
} from '../Common/AIProcessingIndicator';
import AISummaryScreen from '../Common/AISummaryScreen';
import { BidProposal } from '../../types';
import { formatDate } from '../../utils/dateHelpers';

interface BidComparisonViewProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function BidComparisonView({
  projectId,
  isOpen,
  onClose,
}: BidComparisonViewProps) {
  const { bids, loading, updateBid } = useBids({
    projectId,
    status: 'submitted',
  });
  const { projects } = useProjects();
  const { users } = useUsers();

  const [sortBy, setSortBy] = useState<'amount' | 'score' | 'response_time'>(
    'score'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [complianceFilter, setComplianceFilter] = useState<string>('all');
  const [selectedBid, setSelectedBid] = useState<string | null>(null);
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showClarificationModal, setShowClarificationModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [clarificationQuestion, setClarificationQuestion] = useState('');
  const [aiProcessingStates, setAIProcessingStates] = useState<
    Record<string, AIProcessingState>
  >({});
  const [aiProcessingProgress, setAIProcessingProgress] = useState<
    Record<string, number>
  >({});
  const [showAISummary, setShowAISummary] = useState<string | null>(null);

  const project = projects.find((p) => p.id === projectId);

  // Track all intervals and timeouts for cleanup
  const activeTimersRef = useRef<{
    timeouts: Set<ReturnType<typeof setTimeout>>;
    intervals: Set<ReturnType<typeof setInterval>>;
  }>({
    timeouts: new Set(),
    intervals: new Set(),
  });

  // Simulate AI processing for new bids
  useEffect(() => {
    if (!project) return;

    bids.forEach((bid) => {
      if (!aiProcessingStates[bid.id] && bid.status === 'submitted') {
        // Start AI processing simulation
        const timeoutId1 = setTimeout(() => {
          setAIProcessingStates((prev) => ({ ...prev, [bid.id]: 'analyzing' }));
          const timeoutId2 = setTimeout(() => {
            setAIProcessingStates((prev) => ({
              ...prev,
              [bid.id]: 'processing',
            }));
            let progress = 0;
            const progressInterval = setInterval(() => {
              progress += Math.random() * 20;
              if (progress >= 100) {
                progress = 100;
                clearInterval(progressInterval);
                activeTimersRef.current.intervals.delete(progressInterval);
                setAIProcessingStates((prev) => ({
                  ...prev,
                  [bid.id]: 'complete',
                }));
                const timeoutId3 = setTimeout(() => {
                  setAIProcessingStates((prev) => {
                    const newState = { ...prev };
                    delete newState[bid.id];
                    return newState;
                  });
                  setAIProcessingProgress((prev) => {
                    const newProgress = { ...prev };
                    delete newProgress[bid.id];
                    return newProgress;
                  });
                  activeTimersRef.current.timeouts.delete(timeoutId3);
                }, 1000);
                activeTimersRef.current.timeouts.add(timeoutId3);
              } else {
                setAIProcessingProgress((prev) => ({
                  ...prev,
                  [bid.id]: progress,
                }));
              }
            }, 400);
            activeTimersRef.current.intervals.add(progressInterval);
            activeTimersRef.current.timeouts.delete(timeoutId2);
          }, 1000);
          activeTimersRef.current.timeouts.add(timeoutId2);
          activeTimersRef.current.timeouts.delete(timeoutId1);
        }, 500);
        activeTimersRef.current.timeouts.add(timeoutId1);
      }
    });

    // Cleanup function to clear all timeouts and intervals
    return () => {
      activeTimersRef.current.timeouts.forEach((id) => clearTimeout(id));
      activeTimersRef.current.intervals.forEach((id) => clearInterval(id));
      activeTimersRef.current.timeouts.clear();
      activeTimersRef.current.intervals.clear();
    };
  }, [bids, project, aiProcessingStates]);

  // Calculate scores for all bids
  const bidsWithScores = useMemo(() => {
    if (!project) return [];

    return bids.map((bid) => {
      const score = mockCalculateComplianceScore(bid, project);
      const subcontractor = users.find((u) => u.id === bid.subcontractor_id);
      const daysToRespond = Math.ceil(
        (new Date(bid.submitted_at).getTime() -
          new Date(project.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      return {
        ...bid,
        score,
        subcontractorName: subcontractor?.name || 'Unknown',
        daysToRespond,
        aiProcessingState: aiProcessingStates[bid.id] || null,
        aiProgress: aiProcessingProgress[bid.id] || 0,
      };
    });
  }, [bids, project, users, aiProcessingStates, aiProcessingProgress]);

  // Filter and sort bids
  const filteredAndSortedBids = useMemo(() => {
    let filtered = [...bidsWithScores];

    // Filter by compliance score
    if (complianceFilter !== 'all') {
      filtered = filtered.filter((bid) => {
        if (complianceFilter === 'high' && bid.score.overallScore >= 80)
          return true;
        if (
          complianceFilter === 'medium' &&
          bid.score.overallScore >= 60 &&
          bid.score.overallScore < 80
        )
          return true;
        if (complianceFilter === 'low' && bid.score.overallScore < 60)
          return true;
        return false;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'amount':
          comparison = a.bid_amount - b.bid_amount;
          break;
        case 'score':
          comparison = a.score.overallScore - b.score.overallScore;
          break;
        case 'response_time':
          comparison = a.daysToRespond - b.daysToRespond;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [bidsWithScores, sortBy, sortOrder, complianceFilter]);

  const handleAwardBid = async (bidId: string) => {
    try {
      // Update awarded bid
      await updateBid(bidId, { status: 'awarded' });

      // Reject all other bids
      for (const bid of bids) {
        if (bid.id !== bidId && bid.status === 'submitted') {
          await updateBid(bid.id, { status: 'rejected' });
        }
      }

      setShowAwardModal(false);
      setSelectedBid(null);
    } catch (error) {
      console.error('Failed to award bid:', error);
    }
  };

  const handleRejectBid = async () => {
    if (!selectedBid || !rejectReason.trim()) return;

    try {
      await updateBid(selectedBid, {
        status: 'rejected',
        metadata: {
          rejection_reason: rejectReason,
        },
      });
      setShowRejectModal(false);
      setSelectedBid(null);
      setRejectReason('');
    } catch (error) {
      console.error('Failed to reject bid:', error);
    }
  };

  const handleRequestClarification = async () => {
    if (!selectedBid || !clarificationQuestion.trim()) return;

    try {
      // In a real app, this would send a notification/message
      console.log(
        'Request clarification:',
        clarificationQuestion,
        'for bid:',
        selectedBid
      );
      setShowClarificationModal(false);
      setSelectedBid(null);
      setClarificationQuestion('');
    } catch (error) {
      console.error('Failed to request clarification:', error);
    }
  };

  const getScoreColorProps = (score: number) => {
    if (score >= 80) return { color: '$green10', backgroundColor: '$green2', borderColor: '$green8' };
    if (score >= 60) return { color: '$orange10', backgroundColor: '$orange2', borderColor: '$orange8' };
    return { color: '$red10', backgroundColor: '$red2', borderColor: '$red8' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!project) {
    return null;
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Bid Comparison" size="xl">
        <YStack gap="$6">
          <YStack>
            <H2 fontSize="$8" fontWeight="700" color="$color12" mb="$1">
              {project.name}
            </H2>
            <Text color="$color11">
              Compare bids from all subcontractors
            </Text>
          </YStack>

          {/* Filters and Sort */}
          <XStack alignItems="center" gap="$3">
            <Select
              value={complianceFilter}
              onChange={(e) => setComplianceFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Scores' },
                { value: 'high', label: 'High (≥80)' },
                { value: 'medium', label: 'Medium (60-79)' },
                { value: 'low', label: 'Low (<60)' },
              ]}
            />
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              options={[
                { value: 'score', label: 'Sort by Score' },
                { value: 'amount', label: 'Sort by Amount' },
                { value: 'response_time', label: 'Sort by Response Time' },
              ]}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              leftIcon={ArrowUpDown}
            >
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </Button>
          </XStack>

          {loading ? (
            <YStack alignItems="center" paddingVertical="$12">
              <Spinner size="large" color="$blue10" mb="$2" />
              <Text color="$color11">Loading bids...</Text>
            </YStack>
          ) : filteredAndSortedBids.length === 0 ? (
            <YStack alignItems="center" paddingVertical="$12">
              <YStack alignItems="center" mb="$4">
                <Trophy color="$color10" size={48} />
              </YStack>
              <Text color="$color12" fontWeight="500" mb="$2">
                No bids found
              </Text>
              <Text color="$color11" fontSize="$3">
                No subcontractors have submitted bids yet
              </Text>
            </YStack>
          ) : (
            <YStack gap="$4">
              {filteredAndSortedBids.map((bid) => (
                <Card
                  key={bid.id}
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$4"
                  padding="$6"
                  hoverStyle={{ borderColor: '$blue8' }}
                >
                  <XStack flexWrap="wrap" gap="$4" mb="$4">
                    <YStack flex={2} minWidth="calc(33.333% - 11px)">
                      <Text fontSize="$3" color="$color10" mb="$1">
                        Subcontractor
                      </Text>
                      <Text fontWeight="600" color="$color12">
                        {bid.subcontractorName}
                      </Text>
                    </YStack>
                    <YStack flex={1} minWidth="calc(16.666% - 11px)">
                      <Text fontSize="$3" color="$color10" mb="$1">
                        Bid Amount
                      </Text>
                      <Text fontWeight="600" color="$color12">
                        {formatCurrency(bid.bid_amount)}
                      </Text>
                    </YStack>
                    <YStack flex={1} minWidth="calc(16.666% - 11px)">
                      <Text fontSize="$3" color="$color10" mb="$1">
                        Compliance Score
                      </Text>
                      <XStack
                        alignItems="center"
                        paddingHorizontal="$3"
                        paddingVertical="$1"
                        borderRadius={9999}
                        borderWidth={1}
                        {...getScoreColorProps(bid.score.overallScore)}
                      >
                        <Text fontWeight="700" fontSize="$7" color={getScoreColorProps(bid.score.overallScore).color}>
                          {bid.score.overallScore}
                        </Text>
                        <Text fontSize="$1" ml="$1" color={getScoreColorProps(bid.score.overallScore).color}>
                          /100
                        </Text>
                      </XStack>
                    </YStack>
                    <YStack flex={1} minWidth="calc(16.666% - 11px)">
                      <Text fontSize="$3" color="$color10" mb="$1">
                        Response Time
                      </Text>
                      <Text fontWeight="500" color="$color12">
                        {bid.daysToRespond} days
                      </Text>
                    </YStack>
                    <YStack flex={1} minWidth="calc(16.666% - 11px)">
                      <Text fontSize="$3" color="$color10" mb="$1">Status</Text>
                      <Text
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        fontSize="$1"
                        fontWeight="500"
                        borderRadius="$2"
                        backgroundColor={
                          bid.status === 'awarded'
                            ? '$green2'
                            : bid.status === 'rejected'
                              ? '$red2'
                              : '$blue2'
                        }
                        color={
                          bid.status === 'awarded'
                            ? '$green10'
                            : bid.status === 'rejected'
                              ? '$red10'
                              : '$blue10'
                        }
                        textTransform="uppercase"
                      >
                        {bid.status.replace('_', ' ')}
                      </Text>
                    </YStack>
                  </XStack>

                  {/* AI Processing Indicator */}
                  {bid.aiProcessingState && (
                    <YStack mb="$4">
                      <AIProcessingIndicator
                        state={bid.aiProcessingState}
                        message={
                          bid.aiProcessingState === 'analyzing'
                            ? 'AI calculating compliance score...'
                            : bid.aiProcessingState === 'processing'
                              ? 'AI analyzing bid proposal...'
                              : undefined
                        }
                        progress={
                          bid.aiProcessingState === 'processing'
                            ? bid.aiProgress
                            : undefined
                        }
                      />
                    </YStack>
                  )}

                  {/* Score Breakdown */}
                  {!bid.aiProcessingState && (
                    <Card backgroundColor="$backgroundHover" borderRadius="$4" padding="$4" mb="$4">
                      <Text fontSize="$1" fontWeight="500" color="$color11" mb="$3">
                        Score Breakdown
                      </Text>
                      <XStack flexWrap="wrap" gap="$3" fontSize="$1">
                        <YStack>
                          <Text color="$color10">Coverage:</Text>
                          <Text fontWeight="500" color="$color12">
                            {bid.score.insuranceCoverage}/40
                          </Text>
                        </YStack>
                        <YStack>
                          <Text color="$color10">Documents:</Text>
                          <Text fontWeight="500" color="$color12">
                            {bid.score.documentCompleteness}/20
                          </Text>
                        </YStack>
                        <YStack>
                          <Text color="$color10">Carrier:</Text>
                          <Text fontWeight="500" color="$color12">
                            {bid.score.carrierRatings}/15
                          </Text>
                        </YStack>
                        <YStack>
                          <Text color="$color10">
                            Performance:
                          </Text>
                          <Text fontWeight="500" color="$color12">
                            {bid.score.pastPerformance}/15
                          </Text>
                        </YStack>
                        <YStack>
                          <Text color="$color10">
                            Timeliness:
                          </Text>
                          <Text fontWeight="500" color="$color12">
                            {bid.score.responseTimeliness}/10
                          </Text>
                        </YStack>
                      </XStack>
                    </Card>
                  )}

                  {/* Coverage Gaps */}
                  {!bid.aiProcessingState &&
                    bid.score.coverageGaps.length > 0 && (
                      <Card backgroundColor="$orange2" borderWidth={1} borderColor="$orange8" borderRadius="$4" padding="$3" mb="$4">
                        <Text fontSize="$1" fontWeight="500" color="$orange12" mb="$2">
                          Coverage Gaps
                        </Text>
                        <YStack gap="$1">
                          {bid.score.coverageGaps.map((gap, index) => (
                            <Text
                              key={index}
                              fontSize="$1"
                              color="$orange11"
                            >
                              • {gap.type}: {formatCurrency(gap.actual)} /{' '}
                              {formatCurrency(gap.required)} required
                            </Text>
                          ))}
                        </YStack>
                      </Card>
                    )}

                  {/* Risk Assessment */}
                  {!bid.aiProcessingState && (
                    <YStack mb="$4">
                      <Text fontSize="$1" fontWeight="500" color="$color11" mb="$1">
                        Risk Assessment
                      </Text>
                      <Text fontSize="$3" color="$color12">
                        {bid.score.riskAssessment}
                      </Text>
                    </YStack>
                  )}

                  {/* Actions */}
                  {!bid.aiProcessingState && bid.status === 'submitted' && (
                    <XStack alignItems="center" gap="$2" paddingTop="$4" borderTopWidth={1} borderColor="$borderColor">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => {
                          setSelectedBid(bid.id);
                          setShowAwardModal(true);
                        }}
                        leftIcon={Trophy}
                      >
                        Award Bid
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedBid(bid.id);
                          setShowClarificationModal(true);
                        }}
                        leftIcon={MessageSquare}
                      >
                        Request Clarification
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setSelectedBid(bid.id);
                          setShowRejectModal(true);
                        }}
                        leftIcon={XCircle}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAISummary(bid.id)}
                        leftIcon={Sparkles}
                      >
                        View AI Summary
                      </Button>
                    </XStack>
                  )}
                </Card>
              ))}
            </YStack>
          )}
        </YStack>
      </Modal>

      {/* AI Summary Modal for Bids */}
      {showAISummary &&
        (() => {
          const bid = bidsWithScores.find((b) => b.id === showAISummary);
          if (!bid) return null;
          return (
            <Modal
              isOpen={!!showAISummary}
              onClose={() => setShowAISummary(null)}
              title="AI Bid Analysis Summary"
              size="medium"
            >
              <AISummaryScreen
                title="Bid Compliance Analysis"
                whatWasAnalyzed={`Analyzed bid from ${bid.subcontractorName} for ${project?.name || 'the project'}. Evaluated insurance coverage, document completeness, carrier ratings, past performance, and response timeliness.`}
                keyFindings={[
                  `Overall compliance score: ${bid.score.overallScore}/100`,
                  `Insurance coverage: ${bid.score.insuranceCoverage}/40`,
                  `Document completeness: ${bid.score.documentCompleteness}/20`,
                  `Carrier ratings: ${bid.score.carrierRatings}/15`,
                  `Past performance: ${bid.score.pastPerformance}/15`,
                  `Response timeliness: ${bid.score.responseTimeliness}/10`,
                  bid.score.coverageGaps.length > 0
                    ? `Found ${bid.score.coverageGaps.length} coverage gap${bid.score.coverageGaps.length > 1 ? 's' : ''}`
                    : 'All coverage requirements met',
                ]}
                confidence={85 + Math.floor(Math.random() * 15)} // Mock confidence
                recommendations={bid.score.recommendations}
                actionsTaken={[
                  'Calculated compliance score across 5 dimensions',
                  'Identified coverage gaps and deficiencies',
                  'Evaluated carrier ratings and past performance',
                  'Assessed response timeliness',
                ]}
                actionsRequiringReview={[
                  'Review coverage gaps with bidder',
                  'Verify document completeness',
                  'Consider past performance in award decision',
                  'Make final award decision based on score and price',
                ]}
                onClose={() => setShowAISummary(null)}
              />
            </Modal>
          );
        })()}

      {/* Award Confirmation Modal */}
      <Modal
        isOpen={showAwardModal}
        onClose={() => {
          setShowAwardModal(false);
          setSelectedBid(null);
        }}
        title="Award Bid"
        size="sm"
      >
        <YStack gap="$4">
          <Text color="$color11">
            Are you sure you want to award this bid? All other bids will be
            automatically rejected.
          </Text>
          <XStack gap="$3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowAwardModal(false);
                setSelectedBid(null);
              }}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={() => selectedBid && handleAwardBid(selectedBid)}
              fullWidth
              leftIcon={Trophy}
            >
              Award Bid
            </Button>
          </XStack>
        </YStack>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedBid(null);
          setRejectReason('');
        }}
        title="Reject Bid"
        size="sm"
      >
        <YStack gap="$4">
          <Textarea
            label="Reason for Rejection"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Please provide a reason for rejecting this bid..."
            rows={4}
            fullWidth
            required
          />
          <XStack gap="$3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowRejectModal(false);
                setSelectedBid(null);
                setRejectReason('');
              }}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleRejectBid}
              disabled={!rejectReason.trim()}
              fullWidth
              leftIcon={XCircle}
            >
              Reject Bid
            </Button>
          </XStack>
        </YStack>
      </Modal>

      {/* Clarification Modal */}
      <Modal
        isOpen={showClarificationModal}
        onClose={() => {
          setShowClarificationModal(false);
          setSelectedBid(null);
          setClarificationQuestion('');
        }}
        title="Request Clarification"
        size="sm"
      >
        <YStack gap="$4">
          <Textarea
            label="Questions or Clarifications Needed"
            value={clarificationQuestion}
            onChange={(e) => setClarificationQuestion(e.target.value)}
            placeholder="Enter your questions or clarification requests..."
            rows={4}
            fullWidth
            required
          />
          <XStack gap="$3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowClarificationModal(false);
                setSelectedBid(null);
                setClarificationQuestion('');
              }}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRequestClarification}
              disabled={!clarificationQuestion.trim()}
              fullWidth
              leftIcon={MessageSquare}
            >
              Send Request
            </Button>
          </XStack>
        </YStack>
      </Modal>
    </>
  );
}
