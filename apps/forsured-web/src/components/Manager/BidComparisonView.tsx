/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from 'react';
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

  // Simulate AI processing for new bids
  useEffect(() => {
    if (!project) return;

    bids.forEach((bid) => {
      if (!aiProcessingStates[bid.id] && bid.status === 'submitted') {
        // Start AI processing simulation
        setTimeout(() => {
          setAIProcessingStates((prev) => ({ ...prev, [bid.id]: 'analyzing' }));
          setTimeout(() => {
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
                setAIProcessingStates((prev) => ({
                  ...prev,
                  [bid.id]: 'complete',
                }));
                setTimeout(() => {
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
                }, 1000);
              } else {
                setAIProcessingProgress((prev) => ({
                  ...prev,
                  [bid.id]: progress,
                }));
              }
            }, 400);
          }, 1000);
        }, 500);
      }
    });
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success-600 bg-success-50 border-success-200';
    if (score >= 60) return 'text-warning-600 bg-warning-50 border-warning-200';
    return 'text-error-600 bg-error-50 border-error-200';
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
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-1">
              {project.name}
            </h2>
            <p className="text-text-secondary">
              Compare bids from all subcontractors
            </p>
          </div>

          {/* Filters and Sort */}
          <div className="flex items-center space-x-3">
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
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
              <p className="text-text-secondary">Loading bids...</p>
            </div>
          ) : filteredAndSortedBids.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="mx-auto text-text-tertiary mb-4" size={48} />
              <p className="text-text-primary font-medium mb-2">
                No bids found
              </p>
              <p className="text-text-secondary text-sm">
                No subcontractors have submitted bids yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedBids.map((bid) => (
                <div
                  key={bid.id}
                  className="border border-border rounded-lg p-6 hover:border-primary-300 transition-colors"
                >
                  <div className="grid grid-cols-6 gap-4 mb-4">
                    <div className="col-span-2">
                      <p className="text-sm text-text-tertiary mb-1">
                        Subcontractor
                      </p>
                      <p className="font-semibold text-text-primary">
                        {bid.subcontractorName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-text-tertiary mb-1">
                        Bid Amount
                      </p>
                      <p className="font-semibold text-text-primary">
                        {formatCurrency(bid.bid_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-text-tertiary mb-1">
                        Compliance Score
                      </p>
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full border ${getScoreColor(bid.score.overallScore)}`}
                      >
                        <span className="font-bold text-lg">
                          {bid.score.overallScore}
                        </span>
                        <span className="text-xs ml-1">/100</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-text-tertiary mb-1">
                        Response Time
                      </p>
                      <p className="font-medium text-text-primary">
                        {bid.daysToRespond} days
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-text-tertiary mb-1">Status</p>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          bid.status === 'awarded'
                            ? 'bg-success-100 text-success-700'
                            : bid.status === 'rejected'
                              ? 'bg-error-100 text-error-700'
                              : 'bg-primary-100 text-primary-700'
                        }`}
                      >
                        {bid.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* AI Processing Indicator */}
                  {bid.aiProcessingState && (
                    <div className="mb-4">
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
                    </div>
                  )}

                  {/* Score Breakdown */}
                  {!bid.aiProcessingState && (
                    <div className="bg-bg-secondary rounded-lg p-4 mb-4">
                      <p className="text-xs font-medium text-text-secondary mb-3">
                        Score Breakdown
                      </p>
                      <div className="grid grid-cols-5 gap-3 text-xs">
                        <div>
                          <span className="text-text-tertiary">Coverage:</span>
                          <p className="font-medium text-text-primary">
                            {bid.score.insuranceCoverage}/40
                          </p>
                        </div>
                        <div>
                          <span className="text-text-tertiary">Documents:</span>
                          <p className="font-medium text-text-primary">
                            {bid.score.documentCompleteness}/20
                          </p>
                        </div>
                        <div>
                          <span className="text-text-tertiary">Carrier:</span>
                          <p className="font-medium text-text-primary">
                            {bid.score.carrierRatings}/15
                          </p>
                        </div>
                        <div>
                          <span className="text-text-tertiary">
                            Performance:
                          </span>
                          <p className="font-medium text-text-primary">
                            {bid.score.pastPerformance}/15
                          </p>
                        </div>
                        <div>
                          <span className="text-text-tertiary">
                            Timeliness:
                          </span>
                          <p className="font-medium text-text-primary">
                            {bid.score.responseTimeliness}/10
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Coverage Gaps */}
                  {!bid.aiProcessingState &&
                    bid.score.coverageGaps.length > 0 && (
                      <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 mb-4">
                        <p className="text-xs font-medium text-warning-900 mb-2">
                          Coverage Gaps
                        </p>
                        <ul className="space-y-1">
                          {bid.score.coverageGaps.map((gap, index) => (
                            <li
                              key={index}
                              className="text-xs text-warning-800"
                            >
                              • {gap.type}: {formatCurrency(gap.actual)} /{' '}
                              {formatCurrency(gap.required)} required
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Risk Assessment */}
                  {!bid.aiProcessingState && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-text-secondary mb-1">
                        Risk Assessment
                      </p>
                      <p className="text-sm text-text-primary">
                        {bid.score.riskAssessment}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {!bid.aiProcessingState && bid.status === 'submitted' && (
                    <div className="flex items-center space-x-2 pt-4 border-t border-border">
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
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
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
              size="md"
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
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to award this bid? All other bids will be
            automatically rejected.
          </p>
          <div className="flex space-x-3">
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
          </div>
        </div>
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
        <div className="space-y-4">
          <Textarea
            label="Reason for Rejection"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Please provide a reason for rejecting this bid..."
            rows={4}
            fullWidth
            required
          />
          <div className="flex space-x-3">
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
          </div>
        </div>
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
        <div className="space-y-4">
          <Textarea
            label="Questions or Clarifications Needed"
            value={clarificationQuestion}
            onChange={(e) => setClarificationQuestion(e.target.value)}
            placeholder="Enter your questions or clarification requests..."
            rows={4}
            fullWidth
            required
          />
          <div className="flex space-x-3">
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
          </div>
        </div>
      </Modal>
    </>
  );
}
