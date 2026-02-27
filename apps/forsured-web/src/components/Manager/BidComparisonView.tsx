/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect, useRef } from 'react'
import { XCircle, MessageSquare, Trophy, ArrowUpDown, Sparkles, Loader2 } from 'lucide-react'
import { Stack, Row, Text, H2, Card, Grid } from '@scaffald/ui'
import { useBids } from '../../hooks/useBids'
import { useProjects } from '../../hooks/useProjects'
import { useUsers } from '../../hooks/useUsers'
import { mockCalculateComplianceScore } from '../../utils/bidScoring'
import Button from '../Common/Button'
import Select from '../Common/Select'
import Modal from '../Common/Modal'
import Textarea from '../Common/Textarea'
import AIProcessingIndicator, { AIProcessingState } from '../Common/AIProcessingIndicator'
import AISummaryScreen from '../Common/AISummaryScreen'

interface BidComparisonViewProps {
  projectId: string
  isOpen: boolean
  onClose: () => void
}

export default function BidComparisonView({ projectId, isOpen, onClose }: BidComparisonViewProps) {
  const { bids, loading, updateBid } = useBids({
    projectId,
    status: 'submitted',
  })
  const { projects } = useProjects()
  const { users } = useUsers()

  const [sortBy, setSortBy] = useState<'amount' | 'score' | 'response_time'>('score')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [complianceFilter, setComplianceFilter] = useState<string>('all')
  const [selectedBid, setSelectedBid] = useState<string | null>(null)
  const [showAwardModal, setShowAwardModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showClarificationModal, setShowClarificationModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [clarificationQuestion, setClarificationQuestion] = useState('')
  const [aiProcessingStates, setAIProcessingStates] = useState<Record<string, AIProcessingState>>(
    {}
  )
  const [aiProcessingProgress, setAIProcessingProgress] = useState<Record<string, number>>({})
  const [showAISummary, setShowAISummary] = useState<string | null>(null)

  const project = projects.find((p) => p.id === projectId)

  // Track all intervals and timeouts for cleanup
  const activeTimersRef = useRef<{
    timeouts: Set<ReturnType<typeof setTimeout>>
    intervals: Set<ReturnType<typeof setInterval>>
  }>({
    timeouts: new Set(),
    intervals: new Set(),
  })

  // Simulate AI processing for new bids
  useEffect(() => {
    if (!project) return

    bids.forEach((bid) => {
      if (!aiProcessingStates[bid.id] && bid.status === 'submitted') {
        // Start AI processing simulation
        const timeoutId1 = setTimeout(() => {
          setAIProcessingStates((prev) => ({ ...prev, [bid.id]: 'analyzing' }))
          const timeoutId2 = setTimeout(() => {
            setAIProcessingStates((prev) => ({
              ...prev,
              [bid.id]: 'processing',
            }))
            let progress = 0
            const progressInterval = setInterval(() => {
              progress += Math.random() * 20
              if (progress >= 100) {
                progress = 100
                clearInterval(progressInterval)
                activeTimersRef.current.intervals.delete(progressInterval)
                setAIProcessingStates((prev) => ({
                  ...prev,
                  [bid.id]: 'complete',
                }))
                const timeoutId3 = setTimeout(() => {
                  setAIProcessingStates((prev) => {
                    const newState = { ...prev }
                    delete newState[bid.id]
                    return newState
                  })
                  setAIProcessingProgress((prev) => {
                    const newProgress = { ...prev }
                    delete newProgress[bid.id]
                    return newProgress
                  })
                  activeTimersRef.current.timeouts.delete(timeoutId3)
                }, 1000)
                activeTimersRef.current.timeouts.add(timeoutId3)
              } else {
                setAIProcessingProgress((prev) => ({
                  ...prev,
                  [bid.id]: progress,
                }))
              }
            }, 400)
            activeTimersRef.current.intervals.add(progressInterval)
            activeTimersRef.current.timeouts.delete(timeoutId2)
          }, 1000)
          activeTimersRef.current.timeouts.add(timeoutId2)
          activeTimersRef.current.timeouts.delete(timeoutId1)
        }, 500)
        activeTimersRef.current.timeouts.add(timeoutId1)
      }
    })

    // Cleanup function to clear all timeouts and intervals
    return () => {
      activeTimersRef.current.timeouts.forEach((id) => clearTimeout(id))
      activeTimersRef.current.intervals.forEach((id) => clearInterval(id))
      activeTimersRef.current.timeouts.clear()
      activeTimersRef.current.intervals.clear()
    }
  }, [bids, project, aiProcessingStates])

  // Calculate scores for all bids
  const bidsWithScores = useMemo(() => {
    if (!project) return []

    return bids.map((bid) => {
      const score = mockCalculateComplianceScore(bid, project)
      const subcontractor = users.find((u) => u.id === bid.subcontractor_id)
      const daysToRespond = Math.ceil(
        (new Date(bid.submitted_at).getTime() - new Date(project.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      )

      return {
        ...bid,
        score,
        subcontractorName: subcontractor?.name || 'Unknown',
        daysToRespond,
        aiProcessingState: aiProcessingStates[bid.id] || null,
        aiProgress: aiProcessingProgress[bid.id] || 0,
      }
    })
  }, [bids, project, users, aiProcessingStates, aiProcessingProgress])

  // Filter and sort bids
  const filteredAndSortedBids = useMemo(() => {
    let filtered = [...bidsWithScores]

    // Filter by compliance score
    if (complianceFilter !== 'all') {
      filtered = filtered.filter((bid) => {
        if (complianceFilter === 'high' && bid.score.overallScore >= 80) return true
        if (
          complianceFilter === 'medium' &&
          bid.score.overallScore >= 60 &&
          bid.score.overallScore < 80
        )
          return true
        if (complianceFilter === 'low' && bid.score.overallScore < 60) return true
        return false
      })
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'amount':
          comparison = a.bid_amount - b.bid_amount
          break
        case 'score':
          comparison = a.score.overallScore - b.score.overallScore
          break
        case 'response_time':
          comparison = a.daysToRespond - b.daysToRespond
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [bidsWithScores, sortBy, sortOrder, complianceFilter])

  const handleAwardBid = async (bidId: string) => {
    try {
      // Update awarded bid
      await updateBid(bidId, { status: 'awarded' })

      // Reject all other bids
      for (const bid of bids) {
        if (bid.id !== bidId && bid.status === 'submitted') {
          await updateBid(bid.id, { status: 'rejected' })
        }
      }

      setShowAwardModal(false)
      setSelectedBid(null)
    } catch (error) {
      console.error('Failed to award bid:', error)
    }
  }

  const handleRejectBid = async () => {
    if (!selectedBid || !rejectReason.trim()) return

    try {
      await updateBid(selectedBid, {
        status: 'rejected',
        metadata: {
          rejection_reason: rejectReason,
        },
      })
      setShowRejectModal(false)
      setSelectedBid(null)
      setRejectReason('')
    } catch (error) {
      console.error('Failed to reject bid:', error)
    }
  }

  const handleRequestClarification = async () => {
    if (!selectedBid || !clarificationQuestion.trim()) return

    try {
      // In a real app, this would send a notification/message
      console.log('Request clarification:', clarificationQuestion, 'for bid:', selectedBid)
      setShowClarificationModal(false)
      setSelectedBid(null)
      setClarificationQuestion('')
    } catch (error) {
      console.error('Failed to request clarification:', error)
    }
  }

  const getScoreColorProps = (score: number): React.CSSProperties => {
    if (score >= 80)
      return {
        color: 'var(--color-green-10)',
        backgroundColor: 'var(--color-green-2)',
        borderColor: 'var(--color-green-8)',
      }
    if (score >= 60)
      return {
        color: 'var(--color-orange-10)',
        backgroundColor: 'var(--color-orange-2)',
        borderColor: 'var(--color-orange-8)',
      }
    return {
      color: 'var(--color-red-10)',
      backgroundColor: 'var(--color-red-2)',
      borderColor: 'var(--color-red-8)',
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (!project) {
    return null
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Bid Comparison" size="xl">
        <Stack gap={24}>
          <Stack>
            <H2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{project.name}</H2>
            <Text muted>Compare bids from all subcontractors</Text>
          </Stack>

          {/* Filters and Sort */}
          <Row alignItems="center" gap={12}>
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
              onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              leftIcon={ArrowUpDown}
            >
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </Button>
          </Row>

          {loading ? (
            <Stack alignItems="center" style={{ padding: '48px 0' }}>
              <Loader2
                size={32}
                color="var(--color-blue-10)"
                className="animate-spin"
                style={{ marginBottom: 8 }}
              />
              <Text muted>Loading bids...</Text>
            </Stack>
          ) : filteredAndSortedBids.length === 0 ? (
            <Stack alignItems="center" style={{ padding: '48px 0' }}>
              <Stack alignItems="center" style={{ marginBottom: 16 }}>
                <Trophy color="var(--color-text-muted)" size={48} />
              </Stack>
              <Text weight="medium" style={{ marginBottom: 8 }}>
                No bids found
              </Text>
              <Text size="sm" muted>
                No subcontractors have submitted bids yet
              </Text>
            </Stack>
          ) : (
            <Stack gap={16}>
              {filteredAndSortedBids.map((bid) => {
                const scoreProps = getScoreColorProps(bid.score.overallScore)
                return (
                  <Card
                    key={bid.id}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 12,
                      padding: 24,
                    }}
                  >
                    <Row style={{ flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                      <Stack style={{ flex: 2, minWidth: 'calc(33.333% - 11px)' }}>
                        <Text size="sm" muted style={{ marginBottom: 4 }}>
                          Subcontractor
                        </Text>
                        <Text weight="semibold">{bid.subcontractorName}</Text>
                      </Stack>
                      <Stack style={{ flex: 1, minWidth: 'calc(16.666% - 11px)' }}>
                        <Text size="sm" muted style={{ marginBottom: 4 }}>
                          Bid Amount
                        </Text>
                        <Text weight="semibold">{formatCurrency(bid.bid_amount)}</Text>
                      </Stack>
                      <Stack style={{ flex: 1, minWidth: 'calc(16.666% - 11px)' }}>
                        <Text size="sm" muted style={{ marginBottom: 4 }}>
                          Compliance Score
                        </Text>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            paddingLeft: 12,
                            paddingRight: 12,
                            paddingTop: 4,
                            paddingBottom: 4,
                            borderRadius: 9999,
                            border: '1px solid',
                            ...scoreProps,
                          }}
                        >
                          <span style={{ fontWeight: 700, fontSize: 20, color: scoreProps.color }}>
                            {bid.score.overallScore}
                          </span>
                          <span style={{ fontSize: 12, marginLeft: 4, color: scoreProps.color }}>
                            /100
                          </span>
                        </span>
                      </Stack>
                      <Stack style={{ flex: 1, minWidth: 'calc(16.666% - 11px)' }}>
                        <Text size="sm" muted style={{ marginBottom: 4 }}>
                          Response Time
                        </Text>
                        <Text weight="medium">{bid.daysToRespond} days</Text>
                      </Stack>
                      <Stack style={{ flex: 1, minWidth: 'calc(16.666% - 11px)' }}>
                        <Text size="sm" muted style={{ marginBottom: 4 }}>
                          Status
                        </Text>
                        <span
                          style={{
                            display: 'inline-block',
                            paddingLeft: 8,
                            paddingRight: 8,
                            paddingTop: 4,
                            paddingBottom: 4,
                            fontSize: 12,
                            fontWeight: 500,
                            borderRadius: 8,
                            textTransform: 'uppercase',
                            backgroundColor:
                              bid.status === 'awarded'
                                ? 'var(--color-green-2)'
                                : bid.status === 'rejected'
                                  ? 'var(--color-red-2)'
                                  : 'var(--color-blue-2)',
                            color:
                              bid.status === 'awarded'
                                ? 'var(--color-green-10)'
                                : bid.status === 'rejected'
                                  ? 'var(--color-red-10)'
                                  : 'var(--color-blue-10)',
                          }}
                        >
                          {bid.status.replace('_', ' ')}
                        </span>
                      </Stack>
                    </Row>

                    {/* AI Processing Indicator */}
                    {bid.aiProcessingState && (
                      <Stack style={{ marginBottom: 16 }}>
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
                            bid.aiProcessingState === 'processing' ? bid.aiProgress : undefined
                          }
                        />
                      </Stack>
                    )}

                    {/* Score Breakdown */}
                    {!bid.aiProcessingState && (
                      <Card
                        style={{
                          backgroundColor: 'var(--color-gray-2)',
                          borderRadius: 12,
                          padding: 16,
                          marginBottom: 16,
                        }}
                      >
                        <Text size="xs" weight="medium" muted style={{ marginBottom: 12 }}>
                          Score Breakdown
                        </Text>
                        <Grid columns={{ base: 2, sm: 3, lg: 5 }} gap={12}>
                          <Stack>
                            <Text size="xs" muted>
                              Coverage:
                            </Text>
                            <Text size="xs" weight="medium">
                              {bid.score.insuranceCoverage}/40
                            </Text>
                          </Stack>
                          <Stack>
                            <Text size="xs" muted>
                              Documents:
                            </Text>
                            <Text size="xs" weight="medium">
                              {bid.score.documentCompleteness}/20
                            </Text>
                          </Stack>
                          <Stack>
                            <Text size="xs" muted>
                              Carrier:
                            </Text>
                            <Text size="xs" weight="medium">
                              {bid.score.carrierRatings}/15
                            </Text>
                          </Stack>
                          <Stack>
                            <Text size="xs" muted>
                              Performance:
                            </Text>
                            <Text size="xs" weight="medium">
                              {bid.score.pastPerformance}/15
                            </Text>
                          </Stack>
                          <Stack>
                            <Text size="xs" muted>
                              Timeliness:
                            </Text>
                            <Text size="xs" weight="medium">
                              {bid.score.responseTimeliness}/10
                            </Text>
                          </Stack>
                        </Grid>
                      </Card>
                    )}

                    {/* Coverage Gaps */}
                    {!bid.aiProcessingState && bid.score.coverageGaps.length > 0 && (
                      <Card
                        style={{
                          backgroundColor: 'var(--color-orange-2)',
                          border: '1px solid var(--color-orange-8)',
                          borderRadius: 12,
                          padding: 12,
                          marginBottom: 16,
                        }}
                      >
                        <Text
                          size="xs"
                          weight="medium"
                          style={{ color: 'var(--color-orange-12)', marginBottom: 8 }}
                        >
                          Coverage Gaps
                        </Text>
                        <Stack gap={4}>
                          {bid.score.coverageGaps.map((gap, index) => (
                            <Text key={index} size="xs" style={{ color: 'var(--color-orange-11)' }}>
                              • {gap.type}: {formatCurrency(gap.actual)} /{' '}
                              {formatCurrency(gap.required)} required
                            </Text>
                          ))}
                        </Stack>
                      </Card>
                    )}

                    {/* Risk Assessment */}
                    {!bid.aiProcessingState && (
                      <Stack style={{ marginBottom: 16 }}>
                        <Text size="xs" weight="medium" muted style={{ marginBottom: 4 }}>
                          Risk Assessment
                        </Text>
                        <Text size="sm">{bid.score.riskAssessment}</Text>
                      </Stack>
                    )}

                    {/* Actions */}
                    {!bid.aiProcessingState && bid.status === 'submitted' && (
                      <Row
                        alignItems="center"
                        gap={8}
                        style={{ paddingTop: 16, borderTop: '1px solid var(--color-border)' }}
                      >
                        <Button
                          variant="success"
                          size="sm"
                          onPress={() => {
                            setSelectedBid(bid.id)
                            setShowAwardModal(true)
                          }}
                          leftIcon={Trophy}
                        >
                          Award Bid
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onPress={() => {
                            setSelectedBid(bid.id)
                            setShowClarificationModal(true)
                          }}
                          leftIcon={MessageSquare}
                        >
                          Request Clarification
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onPress={() => {
                            setSelectedBid(bid.id)
                            setShowRejectModal(true)
                          }}
                          leftIcon={XCircle}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="outlined"
                          size="sm"
                          onPress={() => setShowAISummary(bid.id)}
                          leftIcon={Sparkles}
                        >
                          View AI Summary
                        </Button>
                      </Row>
                    )}
                  </Card>
                )
              })}
            </Stack>
          )}
        </Stack>
      </Modal>

      {/* AI Summary Modal for Bids */}
      {showAISummary &&
        (() => {
          const bid = bidsWithScores.find((b) => b.id === showAISummary)
          if (!bid) return null
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
          )
        })()}

      {/* Award Confirmation Modal */}
      <Modal
        isOpen={showAwardModal}
        onClose={() => {
          setShowAwardModal(false)
          setSelectedBid(null)
        }}
        title="Award Bid"
        size="sm"
      >
        <Stack gap={16}>
          <Text muted>
            Are you sure you want to award this bid? All other bids will be automatically rejected.
          </Text>
          <Row gap={12}>
            <Button
              variant="secondary"
              onPress={() => {
                setShowAwardModal(false)
                setSelectedBid(null)
              }}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              variant="success"
              onPress={() => selectedBid && handleAwardBid(selectedBid)}
              fullWidth
              leftIcon={Trophy}
            >
              Award Bid
            </Button>
          </Row>
        </Stack>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false)
          setSelectedBid(null)
          setRejectReason('')
        }}
        title="Reject Bid"
        size="sm"
      >
        <Stack gap={16}>
          <Textarea
            label="Reason for Rejection"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Please provide a reason for rejecting this bid..."
            rows={4}
            fullWidth
            required
          />
          <Row gap={12}>
            <Button
              variant="secondary"
              onPress={() => {
                setShowRejectModal(false)
                setSelectedBid(null)
                setRejectReason('')
              }}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onPress={handleRejectBid}
              disabled={!rejectReason.trim()}
              fullWidth
              leftIcon={XCircle}
            >
              Reject Bid
            </Button>
          </Row>
        </Stack>
      </Modal>

      {/* Clarification Modal */}
      <Modal
        isOpen={showClarificationModal}
        onClose={() => {
          setShowClarificationModal(false)
          setSelectedBid(null)
          setClarificationQuestion('')
        }}
        title="Request Clarification"
        size="sm"
      >
        <Stack gap={16}>
          <Textarea
            label="Questions or Clarifications Needed"
            value={clarificationQuestion}
            onChange={(e) => setClarificationQuestion(e.target.value)}
            placeholder="Enter your questions or clarification requests..."
            rows={4}
            fullWidth
            required
          />
          <Row gap={12}>
            <Button
              variant="secondary"
              onPress={() => {
                setShowClarificationModal(false)
                setSelectedBid(null)
                setClarificationQuestion('')
              }}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onPress={handleRequestClarification}
              disabled={!clarificationQuestion.trim()}
              fullWidth
              leftIcon={MessageSquare}
            >
              Send Request
            </Button>
          </Row>
        </Stack>
      </Modal>
    </>
  )
}
