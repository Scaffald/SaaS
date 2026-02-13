/**
 * GC Profile Page
 * GC profile page with subcontractor list
 *
 * Shows General Contractor profile with all assigned subcontractors
 * and their compliance scores.
 */

import React, { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Filter,
  Search,
  Users,
  Building,
  Shield,
  FileText,
  ChevronDown,
  Eye,
  MessageSquare,
  StickyNote,
  Clock,
} from 'lucide-react'
import { Stack, Row, Text, Card, Grid } from '@scaffald/ui'
import { useClients } from '../../hooks/useClients'
import { useCompliance } from '../../hooks/useCompliance'
import { useProjects } from '../../hooks/useProjects'
import Button from '../Common/Button'
import { DashboardSkeleton } from '../Common/SkeletonLoader'

// Status filter options
type StatusFilter = 'all' | 'active' | 'inactive'
type ComplianceFilter = 'all' | 'compliant' | 'at-risk' | 'non-compliant'

interface RecentDocument {
  id: string
  name: string
  type: string
  uploadedAt: string
}

interface SubcontractorWithCompliance {
  id: string
  name: string
  company: string
  email?: string
  phone?: string
  status: 'active' | 'inactive'
  complianceScore: number
  complianceStatus: 'compliant' | 'at-risk' | 'non-compliant'
  pendingItems: number
  lastActivity?: string
  projects: string[]
  notes?: string
  recentDocuments: RecentDocument[]
}

/**
 * Get compliance status from score
 */
function getComplianceStatus(score: number): 'compliant' | 'at-risk' | 'non-compliant' {
  if (score >= 80) return 'compliant'
  if (score >= 50) return 'at-risk'
  return 'non-compliant'
}

export default function GCProfilePage() {
  const { gcId } = useParams<{ gcId: string }>()
  const navigate = useNavigate()

  // Data hooks
  const { clients, loading: clientsLoading } = useClients()
  const { complianceData, loading: complianceLoading } = useCompliance()
  const { projects, loading: projectsLoading } = useProjects()

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [complianceFilter, setComplianceFilter] = useState<ComplianceFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Expandable row state
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)

  // Find the GC client
  const gc = useMemo(() => {
    return clients.find((c) => c.id === gcId)
  }, [clients, gcId])

  // Get subcontractors for this GC with compliance scores
  const subcontractors = useMemo((): SubcontractorWithCompliance[] => {
    if (!gc) return []

    // Get projects for this GC
    const gcProjects = projects.filter((p) => p.client_id === gcId)

    // Mock subcontractor data based on compliance data
    // In a real implementation, this would come from a dedicated endpoint
    const subsMap = new Map<string, SubcontractorWithCompliance>()

    complianceData.forEach((compliance) => {
      const projectBelongsToGC = gcProjects.some((p) => p.id === compliance.project_id)
      if (!projectBelongsToGC) return

      const subId = compliance.subcontractor_id
      if (!subsMap.has(subId)) {
        // Generate mock recent documents based on compliance gaps
        const mockDocuments: RecentDocument[] = (compliance.gaps || [])
          .slice(0, 3)
          .map((gap, index) => ({
            id: `doc-${subId}-${index}`,
            name: gap.description || `Document ${index + 1}`,
            type: gap.severity === 'high' ? 'COI' : 'Endorsement',
            uploadedAt: compliance.last_evaluated || new Date().toISOString(),
          }))

        subsMap.set(subId, {
          id: subId,
          name: compliance.subcontractor_name || `Subcontractor ${subId.slice(0, 8)}`,
          company: compliance.company_name || 'Unknown Company',
          email: `contact@${(compliance.company_name || 'company').toLowerCase().replace(/\s+/g, '')}.com`,
          status: 'active',
          complianceScore: compliance.score || 0,
          complianceStatus: getComplianceStatus(compliance.score || 0),
          pendingItems: compliance.gaps?.length || 0,
          lastActivity: compliance.last_evaluated,
          projects: [compliance.project_id],
          notes: compliance.gaps?.length
            ? `${compliance.gaps.length} compliance gap(s) identified`
            : undefined,
          recentDocuments: mockDocuments,
        })
      } else {
        const existing = subsMap.get(subId)!
        if (!existing.projects.includes(compliance.project_id)) {
          existing.projects.push(compliance.project_id)
        }
        // Update score to average across projects
        existing.complianceScore = Math.round(
          (existing.complianceScore + (compliance.score || 0)) / 2
        )
        existing.complianceStatus = getComplianceStatus(existing.complianceScore)
      }
    })

    return Array.from(subsMap.values())
  }, [gc, gcId, projects, complianceData])

  // Filtered subcontractors
  const filteredSubcontractors = useMemo(() => {
    return subcontractors.filter((sub) => {
      // Status filter
      if (statusFilter !== 'all' && sub.status !== statusFilter) {
        return false
      }

      // Compliance filter
      if (complianceFilter !== 'all' && sub.complianceStatus !== complianceFilter) {
        return false
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          sub.name.toLowerCase().includes(query) ||
          sub.company.toLowerCase().includes(query) ||
          sub.email?.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [subcontractors, statusFilter, complianceFilter, searchQuery])

  // Calculate stats
  const stats = useMemo(() => {
    const total = subcontractors.length
    const active = subcontractors.filter((s) => s.status === 'active').length
    const compliant = subcontractors.filter((s) => s.complianceStatus === 'compliant').length
    const atRisk = subcontractors.filter((s) => s.complianceStatus === 'at-risk').length
    const avgScore =
      total > 0
        ? Math.round(subcontractors.reduce((sum, s) => sum + s.complianceScore, 0) / total)
        : 0

    return { total, active, compliant, atRisk, avgScore }
  }, [subcontractors])

  const isLoading = clientsLoading || complianceLoading || projectsLoading

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (!gc) {
    return (
      <Stack style={{ gap: 'var(--space-6)' }}>
        <Button onPress={() => navigate(-1)} variant="ghost" leftIcon={ArrowLeft}>
          Back
        </Button>
        <Stack
          style={{
            alignItems: 'center',
            paddingTop: 'var(--space-12)',
            paddingBottom: 'var(--space-12)',
            backgroundColor: 'var(--color-background)',
            borderRadius: 'var(--radius-4)',
            borderWidth: 1,
            borderColor: 'var(--color-border)',
          }}
        >
          <Building
            color="var(--color-red-9)"
            size={64}
            style={{ marginBottom: 'var(--space-4)' }}
          />
          <h3
            style={{
              fontSize: 'var(--font-size-6)',
              fontWeight: '600',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-2)',
            }}
          >
            GC Not Found
          </h3>
          <Text style={{ color: 'var(--color-text-secondary)' }}>
            The General Contractor you're looking for doesn't exist or has been deleted.
          </Text>
        </Stack>
      </Stack>
    )
  }

  // Toggle row expansion
  const handleRowClick = (subId: string) => {
    setExpandedRowId((prev) => (prev === subId ? null : subId))
  }

  // Action button handlers
  const handleViewFullProfile = (e: React.MouseEvent, subId: string) => {
    e.stopPropagation() // Prevent row collapse
    navigate(`/broker/gcs/${gcId}/subcontractors/${subId}`)
  }

  const handleAddNote = (e: React.MouseEvent, subId: string) => {
    e.stopPropagation() // Prevent row collapse
    // TODO: Open note creation modal
    console.log('Add note for:', subId)
  }

  const handleSendMessage = (e: React.MouseEvent, subId: string) => {
    e.stopPropagation() // Prevent row collapse
    // TODO: Open message composition modal
    console.log('Send message to:', subId)
  }

  return (
    <Stack style={{ gap: 'var(--space-6)' }}>
      {/* Header */}
      <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Row style={{ alignItems: 'center', gap: 'var(--space-4)' }}>
          <Button
            variant="ghost"
            onPress={() => navigate('/broker/clients')}
            leftIcon={ArrowLeft}
            size="sm"
          >
            Back to Clients
          </Button>
        </Row>
      </Row>

      {/* GC Profile Header */}
      <Card
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: 'var(--radius-4)',
          borderWidth: 1,
          borderColor: 'var(--color-border)',
          overflow: 'hidden',
        }}
      >
        <Stack style={{ padding: 'var(--space-6)' }}>
          <Row style={{ alignItems: 'flex-start', gap: 'var(--space-4)' }}>
            <Row
              style={{
                width: 64,
                height: 64,
                backgroundColor: 'var(--color-blue-3)',
                borderRadius: 'var(--radius-4)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building color="var(--color-blue-9)" size={32} />
            </Row>
            <Stack style={{ flex: 1 }}>
              <Row style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
                <h1
                  style={{
                    fontSize: 'var(--font-size-8)',
                    fontWeight: 'bold',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {gc.company_name}
                </h1>
                <Text
                  style={{
                    paddingLeft: 'var(--space-3)',
                    paddingRight: 'var(--space-3)',
                    paddingTop: 'var(--space-1)',
                    paddingBottom: 'var(--space-1)',
                    borderRadius: 9999,
                    fontSize: 'var(--font-size-3)',
                    fontWeight: '500',
                    backgroundColor:
                      stats.avgScore >= 80
                        ? 'var(--color-green-3)'
                        : stats.avgScore >= 50
                          ? 'var(--color-yellow-3)'
                          : 'var(--color-red-3)',
                    color:
                      stats.avgScore >= 80
                        ? 'var(--color-green-10)'
                        : stats.avgScore >= 50
                          ? 'var(--color-yellow-10)'
                          : 'var(--color-red-10)',
                  }}
                >
                  {stats.avgScore}% Compliant
                </Text>
              </Row>
              <Text style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
                {gc.address}
              </Text>
              <Row
                style={{
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                  marginTop: 'var(--space-2)',
                  fontSize: 'var(--font-size-3)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {gc.phone && (
                  <Text
                    style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-text-secondary)' }}
                  >
                    {gc.phone}
                  </Text>
                )}
                {gc.email && (
                  <Text
                    style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-text-secondary)' }}
                  >
                    {gc.email}
                  </Text>
                )}
              </Row>
            </Stack>
          </Row>
        </Stack>

        {/* Stats Bar */}
        <Row style={{ borderTop: '1px solid var(--color-border)' }}>
          <Stack
            style={{
              flex: 1,
              padding: 'var(--space-4)',
              alignItems: 'center',
              borderRight: '1px solid var(--color-border)',
            }}
          >
            <Row
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-2)',
                color: 'var(--color-blue-9)',
              }}
            >
              <Users size={18} color="var(--color-blue-9)" />
              <Text
                style={{
                  fontSize: 'var(--font-size-8)',
                  fontWeight: 'bold',
                  color: 'var(--color-blue-9)',
                }}
              >
                {stats.total}
              </Text>
            </Row>
            <Text
              style={{
                fontSize: 'var(--font-size-3)',
                color: 'var(--color-text-secondary)',
                marginTop: 'var(--space-1)',
              }}
            >
              Total Subcontractors
            </Text>
          </Stack>
          <Stack
            style={{
              flex: 1,
              padding: 'var(--space-4)',
              alignItems: 'center',
              borderRight: '1px solid var(--color-border)',
            }}
          >
            <Row style={{ alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
              <Shield size={18} color="var(--color-green-9)" />
              <Text
                style={{
                  fontSize: 'var(--font-size-8)',
                  fontWeight: 'bold',
                  color: 'var(--color-green-9)',
                }}
              >
                {stats.compliant}
              </Text>
            </Row>
            <Text
              style={{
                fontSize: 'var(--font-size-3)',
                color: 'var(--color-text-secondary)',
                marginTop: 'var(--space-1)',
              }}
            >
              Compliant
            </Text>
          </Stack>
          <Stack
            style={{
              flex: 1,
              padding: 'var(--space-4)',
              alignItems: 'center',
              borderRight: '1px solid var(--color-border)',
            }}
          >
            <Row style={{ alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
              <Shield size={18} color="var(--color-yellow-9)" />
              <Text
                style={{
                  fontSize: 'var(--font-size-8)',
                  fontWeight: 'bold',
                  color: 'var(--color-yellow-9)',
                }}
              >
                {stats.atRisk}
              </Text>
            </Row>
            <Text
              style={{
                fontSize: 'var(--font-size-3)',
                color: 'var(--color-text-secondary)',
                marginTop: 'var(--space-1)',
              }}
            >
              At Risk
            </Text>
          </Stack>
          <Stack style={{ flex: 1, padding: 'var(--space-4)', alignItems: 'center' }}>
            <Row style={{ alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
              <FileText size={18} color="var(--color-text-primary)" />
              <Text
                style={{
                  fontSize: 'var(--font-size-8)',
                  fontWeight: 'bold',
                  color: 'var(--color-text-primary)',
                }}
              >
                {stats.active}
              </Text>
            </Row>
            <Text
              style={{
                fontSize: 'var(--font-size-3)',
                color: 'var(--color-text-secondary)',
                marginTop: 'var(--space-1)',
              }}
            >
              Active
            </Text>
          </Stack>
        </Row>
      </Card>

      {/* Filters */}
      <Row style={{ flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)' }}>
        <Row style={{ position: 'relative', flex: 1, minWidth: 256 }}>
          <Search
            style={{
              position: 'absolute',
              left: 'var(--space-3)',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-tertiary)',
            }}
            size={18}
          />
          <input
            type="text"
            placeholder="Search subcontractors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: 'var(--space-10)',
              paddingRight: 'var(--space-4)',
              paddingTop: 'var(--space-2)',
              paddingBottom: 'var(--space-2)',
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: 'var(--color-border)',
              borderRadius: 'var(--radius-4)',
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-text-primary)',
            }}
          />
        </Row>

        <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
          <Filter size={18} color="var(--color-text-tertiary)" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-text-primary)',
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={complianceFilter}
            onChange={(e) => setComplianceFilter(e.target.value as ComplianceFilter)}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-text-primary)',
            }}
          >
            <option value="all">All Compliance</option>
            <option value="compliant">Compliant</option>
            <option value="at-risk">At Risk</option>
            <option value="non-compliant">Non-Compliant</option>
          </select>
        </Row>
      </Row>

      {/* Subcontractors Table */}
      <Card
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: 'var(--radius-4)',
          borderWidth: 1,
          borderColor: 'var(--color-border)',
          overflow: 'hidden',
        }}
      >
        <Row
          style={{
            paddingLeft: 'var(--space-6)',
            paddingRight: 'var(--space-6)',
            paddingTop: 'var(--space-4)',
            paddingBottom: 'var(--space-4)',
            borderBottom: '1px solid var(--color-border)',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2
            style={{
              fontSize: 'var(--font-size-6)',
              fontWeight: '600',
              color: 'var(--color-text-primary)',
            }}
          >
            Subcontractors ({filteredSubcontractors.length})
          </h2>
        </Row>

        {filteredSubcontractors.length === 0 ? (
          <Stack
            style={{
              alignItems: 'center',
              paddingTop: 'var(--space-12)',
              paddingBottom: 'var(--space-12)',
            }}
          >
            <Users
              color="var(--color-text-tertiary)"
              size={48}
              style={{ marginBottom: 'var(--space-4)' }}
            />
            <h3
              style={{
                fontSize: 'var(--font-size-6)',
                fontWeight: '600',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--space-2)',
              }}
            >
              No Subcontractors Found
            </h3>
            <Text style={{ color: 'var(--color-text-secondary)' }}>
              {searchQuery || statusFilter !== 'all' || complianceFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'This GC has no assigned subcontractors yet.'}
            </Text>
          </Stack>
        ) : (
          <Stack style={{ overflowX: 'auto' }}>
            <Stack>
              <Row
                style={{
                  backgroundColor: 'var(--color-background-hover)',
                  paddingLeft: 'var(--space-3)',
                  paddingRight: 'var(--space-3)',
                  paddingTop: 'var(--space-3)',
                  paddingBottom: 'var(--space-3)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <Text
                  style={{
                    width: 40,
                    fontSize: 'var(--font-size-3)',
                    fontWeight: '500',
                    color: 'var(--color-text-secondary)',
                  }}
                ></Text>
                <Text
                  style={{
                    flex: 2,
                    paddingLeft: 'var(--space-6)',
                    paddingRight: 'var(--space-6)',
                    fontSize: 'var(--font-size-3)',
                    fontWeight: '500',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Subcontractor
                </Text>
                <Text
                  style={{
                    flex: 1,
                    paddingLeft: 'var(--space-6)',
                    paddingRight: 'var(--space-6)',
                    fontSize: 'var(--font-size-3)',
                    fontWeight: '500',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Score
                </Text>
                <Text
                  style={{
                    flex: 1,
                    paddingLeft: 'var(--space-6)',
                    paddingRight: 'var(--space-6)',
                    fontSize: 'var(--font-size-3)',
                    fontWeight: '500',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Status
                </Text>
                <Text
                  style={{
                    flex: 1,
                    paddingLeft: 'var(--space-6)',
                    paddingRight: 'var(--space-6)',
                    fontSize: 'var(--font-size-3)',
                    fontWeight: '500',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Pending Items
                </Text>
                <Text
                  style={{
                    flex: 1,
                    paddingLeft: 'var(--space-6)',
                    paddingRight: 'var(--space-6)',
                    fontSize: 'var(--font-size-3)',
                    fontWeight: '500',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Projects
                </Text>
                <Text
                  style={{
                    flex: 1,
                    paddingLeft: 'var(--space-6)',
                    paddingRight: 'var(--space-6)',
                    fontSize: 'var(--font-size-3)',
                    fontWeight: '500',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Last Activity
                </Text>
              </Row>
              <Stack>
                {filteredSubcontractors.map((sub) => {
                  const isExpanded = expandedRowId === sub.id
                  return (
                    <React.Fragment key={sub.id}>
                      {/* Main Row */}
                      <Row
                        style={{
                          borderBottom: '1px solid var(--color-border)',
                          paddingLeft: 'var(--space-3)',
                          paddingRight: 'var(--space-3)',
                          paddingTop: 'var(--space-4)',
                          paddingBottom: 'var(--space-4)',
                          cursor: 'pointer',
                          backgroundColor: isExpanded
                            ? 'var(--color-background-hover)'
                            : 'transparent',
                        }}
                        onPress={() => handleRowClick(sub.id)}
                        data-testid="subcontractor-row"
                      >
                        {/* Expand Indicator */}
                        <Row style={{ width: 40, alignItems: 'center', justifyContent: 'center' }}>
                          <ChevronDown
                            size={18}
                            color="var(--color-text-tertiary)"
                            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                            data-testid="expand-icon"
                          />
                        </Row>
                        <Row
                          style={{
                            flex: 2,
                            paddingLeft: 'var(--space-6)',
                            paddingRight: 'var(--space-6)',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                          }}
                        >
                          <Row
                            style={{
                              width: 40,
                              height: 40,
                              backgroundColor: 'var(--color-blue-3)',
                              borderRadius: 9999,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Building color="var(--color-blue-9)" size={20} />
                          </Row>
                          <Stack>
                            <Text style={{ fontWeight: '500', color: 'var(--color-text-primary)' }}>
                              {sub.name}
                            </Text>
                            <Text
                              style={{
                                fontSize: 'var(--font-size-3)',
                                color: 'var(--color-text-secondary)',
                              }}
                            >
                              {sub.company}
                            </Text>
                          </Stack>
                        </Row>
                        <Row
                          style={{
                            flex: 1,
                            paddingLeft: 'var(--space-6)',
                            paddingRight: 'var(--space-6)',
                            alignItems: 'center',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 'var(--font-size-6)',
                              fontWeight: 'bold',
                              color:
                                sub.complianceScore >= 80
                                  ? 'var(--color-green-9)'
                                  : sub.complianceScore >= 50
                                    ? 'var(--color-yellow-9)'
                                    : 'var(--color-red-9)',
                            }}
                          >
                            {sub.complianceScore}%
                          </Text>
                        </Row>
                        <Row
                          style={{
                            flex: 1,
                            paddingLeft: 'var(--space-6)',
                            paddingRight: 'var(--space-6)',
                            alignItems: 'center',
                          }}
                        >
                          <Text
                            style={{
                              paddingLeft: 'var(--space-2)',
                              paddingRight: 'var(--space-2)',
                              paddingTop: 2,
                              paddingBottom: 2,
                              borderRadius: 9999,
                              fontSize: 'var(--font-size-1)',
                              fontWeight: '500',
                              backgroundColor:
                                sub.complianceStatus === 'compliant'
                                  ? 'var(--color-green-3)'
                                  : sub.complianceStatus === 'at-risk'
                                    ? 'var(--color-yellow-3)'
                                    : 'var(--color-red-3)',
                              color:
                                sub.complianceStatus === 'compliant'
                                  ? 'var(--color-green-10)'
                                  : sub.complianceStatus === 'at-risk'
                                    ? 'var(--color-yellow-10)'
                                    : 'var(--color-red-10)',
                            }}
                          >
                            {sub.complianceStatus === 'compliant'
                              ? 'Compliant'
                              : sub.complianceStatus === 'at-risk'
                                ? 'At Risk'
                                : 'Non-Compliant'}
                          </Text>
                        </Row>
                        <Row
                          style={{
                            flex: 1,
                            paddingLeft: 'var(--space-6)',
                            paddingRight: 'var(--space-6)',
                            alignItems: 'center',
                          }}
                        >
                          {sub.pendingItems > 0 ? (
                            <Text
                              style={{
                                paddingLeft: 'var(--space-2)',
                                paddingRight: 'var(--space-2)',
                                paddingTop: 'var(--space-1)',
                                paddingBottom: 'var(--space-1)',
                                borderRadius: 'var(--radius-2)',
                                backgroundColor: 'var(--color-yellow-3)',
                                color: 'var(--color-yellow-10)',
                                fontSize: 'var(--font-size-3)',
                              }}
                            >
                              {sub.pendingItems} pending
                            </Text>
                          ) : (
                            <Text style={{ color: 'var(--color-text-tertiary)' }}>-</Text>
                          )}
                        </Row>
                        <Row
                          style={{
                            flex: 1,
                            paddingLeft: 'var(--space-6)',
                            paddingRight: 'var(--space-6)',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: 'var(--color-text-secondary)' }}>
                            {sub.projects.length}
                          </Text>
                        </Row>
                        <Row
                          style={{
                            flex: 1,
                            paddingLeft: 'var(--space-6)',
                            paddingRight: 'var(--space-6)',
                            alignItems: 'center',
                          }}
                        >
                          <Text
                            style={{
                              color: 'var(--color-text-secondary)',
                              fontSize: 'var(--font-size-3)',
                            }}
                          >
                            {sub.lastActivity
                              ? new Date(sub.lastActivity).toLocaleDateString()
                              : '-'}
                          </Text>
                        </Row>
                      </Row>

                      {/* Expanded Card Row */}
                      {isExpanded && (
                        <Row
                          style={{
                            width: '100%',
                            paddingLeft: 'var(--space-6)',
                            paddingRight: 'var(--space-6)',
                            paddingTop: 0,
                            paddingBottom: 0,
                          }}
                          data-testid="expanded-card"
                        >
                          <Stack
                            style={{
                              width: '100%',
                              overflow: 'hidden',
                              maxHeight: isExpanded ? 384 : 0,
                              paddingTop: isExpanded ? 'var(--space-4)' : 0,
                              paddingBottom: isExpanded ? 'var(--space-4)' : 0,
                            }}
                          >
                            <Card
                              style={{
                                backgroundColor: 'var(--color-background-hover)',
                                borderRadius: 'var(--radius-4)',
                                padding: 'var(--space-6)',
                                borderWidth: 1,
                                borderColor: 'var(--color-border)',
                              }}
                            >
                              <Grid columns={{ base: 1, sm: 2, lg: 4 }} gap={24}>
                                {/* Compliance Score */}
                                <Stack>
                                  <Row
                                    style={{
                                      alignItems: 'center',
                                      gap: 'var(--space-2)',
                                      color: 'var(--color-text-secondary)',
                                      fontSize: 'var(--font-size-3)',
                                      marginBottom: 'var(--space-2)',
                                    }}
                                  >
                                    <Shield size={16} color="var(--color-text-secondary)" />
                                    <Text
                                      style={{
                                        fontSize: 'var(--font-size-3)',
                                        color: 'var(--color-text-secondary)',
                                      }}
                                    >
                                      Compliance Score
                                    </Text>
                                  </Row>
                                  <Text
                                    style={{
                                      fontSize: 'var(--font-size-10)',
                                      fontWeight: 'bold',
                                      color:
                                        sub.complianceScore >= 80
                                          ? 'var(--color-green-9)'
                                          : sub.complianceScore >= 50
                                            ? 'var(--color-yellow-9)'
                                            : 'var(--color-red-9)',
                                    }}
                                  >
                                    {sub.complianceScore}%
                                  </Text>
                                </Stack>

                                {/* Recent Documents */}
                                <Stack>
                                  <Row
                                    style={{
                                      alignItems: 'center',
                                      gap: 'var(--space-2)',
                                      color: 'var(--color-text-secondary)',
                                      fontSize: 'var(--font-size-3)',
                                      marginBottom: 'var(--space-2)',
                                    }}
                                  >
                                    <FileText size={16} color="var(--color-text-secondary)" />
                                    <Text
                                      style={{
                                        fontSize: 'var(--font-size-3)',
                                        color: 'var(--color-text-secondary)',
                                      }}
                                    >
                                      Recent Documents
                                    </Text>
                                  </Row>
                                  {sub.recentDocuments.length > 0 ? (
                                    <Stack style={{ gap: 'var(--space-1)' }}>
                                      {sub.recentDocuments.slice(0, 3).map((doc) => (
                                        <Text
                                          key={doc.id}
                                          style={{
                                            fontSize: 'var(--font-size-3)',
                                            color: 'var(--color-text-primary)',
                                          }}
                                        >
                                          {doc.name}
                                        </Text>
                                      ))}
                                    </Stack>
                                  ) : (
                                    <Text
                                      style={{
                                        fontSize: 'var(--font-size-3)',
                                        color: 'var(--color-text-tertiary)',
                                      }}
                                    >
                                      No recent documents
                                    </Text>
                                  )}
                                </Stack>

                                {/* Active Status */}
                                <Stack>
                                  <Row
                                    style={{
                                      alignItems: 'center',
                                      gap: 'var(--space-2)',
                                      color: 'var(--color-text-secondary)',
                                      fontSize: 'var(--font-size-3)',
                                      marginBottom: 'var(--space-2)',
                                    }}
                                  >
                                    <Clock size={16} color="var(--color-text-secondary)" />
                                    <Text
                                      style={{
                                        fontSize: 'var(--font-size-3)',
                                        color: 'var(--color-text-secondary)',
                                      }}
                                    >
                                      Active Status
                                    </Text>
                                  </Row>
                                  <Text
                                    style={{
                                      paddingLeft: 'var(--space-2)',
                                      paddingRight: 'var(--space-2)',
                                      paddingTop: 'var(--space-1)',
                                      paddingBottom: 'var(--space-1)',
                                      borderRadius: 9999,
                                      fontSize: 'var(--font-size-3)',
                                      fontWeight: '500',
                                      backgroundColor:
                                        sub.status === 'active'
                                          ? 'var(--color-green-3)'
                                          : 'var(--color-gray-3)',
                                      color:
                                        sub.status === 'active'
                                          ? 'var(--color-green-10)'
                                          : 'var(--color-gray-11)',
                                      display: 'inline-block',
                                      width: 'fit-content',
                                    }}
                                  >
                                    {sub.status === 'active' ? 'Active' : 'Inactive'}
                                  </Text>
                                </Stack>

                                {/* Notes */}
                                <Stack>
                                  <Row
                                    style={{
                                      alignItems: 'center',
                                      gap: 'var(--space-2)',
                                      color: 'var(--color-text-secondary)',
                                      fontSize: 'var(--font-size-3)',
                                      marginBottom: 'var(--space-2)',
                                    }}
                                  >
                                    <StickyNote size={16} color="var(--color-text-secondary)" />
                                    <Text
                                      style={{
                                        fontSize: 'var(--font-size-3)',
                                        color: 'var(--color-text-secondary)',
                                      }}
                                    >
                                      Notes
                                    </Text>
                                  </Row>
                                  <Text
                                    style={{
                                      fontSize: 'var(--font-size-3)',
                                      color: 'var(--color-text-primary)',
                                    }}
                                  >
                                    {sub.notes || 'No notes available'}
                                  </Text>
                                </Stack>
                              </Grid>

                              {/* Action Buttons */}
                              <Row
                                style={{
                                  alignItems: 'center',
                                  gap: 'var(--space-3)',
                                  marginTop: 'var(--space-6)',
                                  paddingTop: 'var(--space-4)',
                                  borderTop: '1px solid var(--color-border)',
                                }}
                              >
                                <Button
                                  variant="primary"
                                  size="sm"
                                  leftIcon={Eye}
                                  onPress={(e) => handleViewFullProfile(e, sub.id)}
                                  data-testid="view-profile-btn"
                                >
                                  View Full Profile
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  leftIcon={StickyNote}
                                  onPress={(e) => handleAddNote(e, sub.id)}
                                  data-testid="add-note-btn"
                                >
                                  Add Note
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  leftIcon={MessageSquare}
                                  onPress={(e) => handleSendMessage(e, sub.id)}
                                  data-testid="send-message-btn"
                                >
                                  Send Message
                                </Button>
                              </Row>
                            </Card>
                          </Stack>
                        </Row>
                      )}
                    </React.Fragment>
                  )
                })}
              </Stack>
            </Stack>
          </Stack>
        )}
      </Card>
    </Stack>
  )
}
