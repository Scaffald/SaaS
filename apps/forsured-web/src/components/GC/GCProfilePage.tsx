/**
 * GC Profile Page
 * REQ-275: GC Profile Page with Subcontractor List
 *
 * Shows General Contractor profile with all assigned subcontractors
 * and their compliance scores.
 */

import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Clock
} from 'lucide-react';
import { YStack, XStack, Text, H1, H2, H3, Card, Input } from '@unicornlove/ui';
import { useClients } from '../../hooks/useClients';
import { useCompliance } from '../../hooks/useCompliance';
import { useProjects } from '../../hooks/useProjects';
import Button from '../Common/Button';
import { DashboardSkeleton } from '../Common/SkeletonLoader';

// Status filter options
type StatusFilter = 'all' | 'active' | 'inactive';
type ComplianceFilter = 'all' | 'compliant' | 'at-risk' | 'non-compliant';

interface RecentDocument {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
}

interface SubcontractorWithCompliance {
  id: string;
  name: string;
  company: string;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive';
  complianceScore: number;
  complianceStatus: 'compliant' | 'at-risk' | 'non-compliant';
  pendingItems: number;
  lastActivity?: string;
  projects: string[];
  notes?: string;
  recentDocuments: RecentDocument[];
}

/**
 * Get compliance status from score
 */
function getComplianceStatus(score: number): 'compliant' | 'at-risk' | 'non-compliant' {
  if (score >= 80) return 'compliant';
  if (score >= 50) return 'at-risk';
  return 'non-compliant';
}

export default function GCProfilePage() {
  const { gcId } = useParams<{ gcId: string }>();
  const navigate = useNavigate();

  // Data hooks
  const { clients, loading: clientsLoading } = useClients();
  const { complianceData, loading: complianceLoading } = useCompliance();
  const { projects, loading: projectsLoading } = useProjects();

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [complianceFilter, setComplianceFilter] = useState<ComplianceFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Expandable row state
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Find the GC client
  const gc = useMemo(() => {
    return clients.find((c) => c.id === gcId);
  }, [clients, gcId]);

  // Get subcontractors for this GC with compliance scores
  const subcontractors = useMemo((): SubcontractorWithCompliance[] => {
    if (!gc) return [];

    // Get projects for this GC
    const gcProjects = projects.filter((p) => p.client_id === gcId);

    // Mock subcontractor data based on compliance data
    // In a real implementation, this would come from a dedicated endpoint
    const subsMap = new Map<string, SubcontractorWithCompliance>();

    complianceData.forEach((compliance) => {
      const projectBelongsToGC = gcProjects.some((p) => p.id === compliance.project_id);
      if (!projectBelongsToGC) return;

      const subId = compliance.subcontractor_id;
      if (!subsMap.has(subId)) {
        // Generate mock recent documents based on compliance gaps
        const mockDocuments: RecentDocument[] = (compliance.gaps || []).slice(0, 3).map((gap, index) => ({
          id: `doc-${subId}-${index}`,
          name: gap.description || `Document ${index + 1}`,
          type: gap.severity === 'high' ? 'COI' : 'Endorsement',
          uploadedAt: compliance.last_evaluated || new Date().toISOString(),
        }));

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
          notes: compliance.gaps?.length ? `${compliance.gaps.length} compliance gap(s) identified` : undefined,
          recentDocuments: mockDocuments,
        });
      } else {
        const existing = subsMap.get(subId)!;
        if (!existing.projects.includes(compliance.project_id)) {
          existing.projects.push(compliance.project_id);
        }
        // Update score to average across projects
        existing.complianceScore = Math.round(
          (existing.complianceScore + (compliance.score || 0)) / 2
        );
        existing.complianceStatus = getComplianceStatus(existing.complianceScore);
      }
    });

    return Array.from(subsMap.values());
  }, [gc, gcId, projects, complianceData]);

  // Filtered subcontractors
  const filteredSubcontractors = useMemo(() => {
    return subcontractors.filter((sub) => {
      // Status filter
      if (statusFilter !== 'all' && sub.status !== statusFilter) {
        return false;
      }

      // Compliance filter
      if (complianceFilter !== 'all' && sub.complianceStatus !== complianceFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          sub.name.toLowerCase().includes(query) ||
          sub.company.toLowerCase().includes(query) ||
          sub.email?.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [subcontractors, statusFilter, complianceFilter, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = subcontractors.length;
    const active = subcontractors.filter((s) => s.status === 'active').length;
    const compliant = subcontractors.filter((s) => s.complianceStatus === 'compliant').length;
    const atRisk = subcontractors.filter((s) => s.complianceStatus === 'at-risk').length;
    const avgScore = total > 0
      ? Math.round(subcontractors.reduce((sum, s) => sum + s.complianceScore, 0) / total)
      : 0;

    return { total, active, compliant, atRisk, avgScore };
  }, [subcontractors]);

  const isLoading = clientsLoading || complianceLoading || projectsLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!gc) {
    return (
      <YStack gap="$6">
        <Button
          onPress={() => navigate(-1)}
          variant="ghost"
          icon={<ArrowLeft size={20} />}
        >
          Back
        </Button>
        <YStack alignItems="center" paddingVertical="$12" backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor">
          <Building color="$red9" size={64} mb="$4" />
          <H3 fontSize="$6" fontWeight="600" color="$color12" mb="$2">
            GC Not Found
          </H3>
          <Text color="$color11">
            The General Contractor you're looking for doesn't exist or has been deleted.
          </Text>
        </YStack>
      </YStack>
    );
  }

  // Toggle row expansion
  const handleRowClick = (subId: string) => {
    setExpandedRowId((prev) => (prev === subId ? null : subId));
  };

  // Action button handlers
  const handleViewFullProfile = (e: React.MouseEvent, subId: string) => {
    e.stopPropagation(); // Prevent row collapse
    navigate(`/broker/gcs/${gcId}/subcontractors/${subId}`);
  };

  const handleAddNote = (e: React.MouseEvent, subId: string) => {
    e.stopPropagation(); // Prevent row collapse
    // TODO: Open note creation modal
    console.log('Add note for:', subId);
  };

  const handleSendMessage = (e: React.MouseEvent, subId: string) => {
    e.stopPropagation(); // Prevent row collapse
    // TODO: Open message composition modal
    console.log('Send message to:', subId);
  };

  return (
    <YStack gap="$6">
      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap="$4">
          <Button
            variant="ghost"
            onPress={() => navigate('/broker/clients')}
            leftIcon={ArrowLeft}
            size="sm"
          >
            Back to Clients
          </Button>
        </XStack>
      </XStack>

      {/* GC Profile Header */}
      <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" overflow="hidden">
        <YStack padding="$6">
          <XStack alignItems="flex-start" gap="$4">
            <XStack
              width={64}
              height={64}
              backgroundColor="$blue3"
              borderRadius="$4"
              alignItems="center"
              justifyContent="center"
            >
              <Building color="$blue9" size={32} />
            </XStack>
            <YStack flex={1}>
              <XStack alignItems="center" gap="$3">
                <H1 fontSize="$8" fontWeight="bold" color="$color12">
                  {gc.company_name}
                </H1>
                <Text
                  paddingHorizontal="$3"
                  paddingVertical="$1"
                  borderRadius={9999}
                  fontSize="$3"
                  fontWeight="500"
                  backgroundColor={
                    stats.avgScore >= 80
                      ? "$green3"
                      : stats.avgScore >= 50
                      ? "$yellow3"
                      : "$red3"
                  }
                  color={
                    stats.avgScore >= 80
                      ? "$green10"
                      : stats.avgScore >= 50
                      ? "$yellow10"
                      : "$red10"
                  }
                >
                  {stats.avgScore}% Compliant
                </Text>
              </XStack>
              <Text color="$color11" mt="$1">{gc.address}</Text>
              <XStack alignItems="center" gap="$4" mt="$2" fontSize="$3" color="$color11">
                {gc.phone && <Text fontSize="$3" color="$color11">{gc.phone}</Text>}
                {gc.email && <Text fontSize="$3" color="$color11">{gc.email}</Text>}
              </XStack>
            </YStack>
          </XStack>
        </YStack>

        {/* Stats Bar */}
        <XStack borderTopWidth={1} borderColor="$borderColor">
          <YStack flex={1} padding="$4" alignItems="center" borderRightWidth={1} borderColor="$borderColor">
            <XStack alignItems="center" justifyContent="center" gap="$2" color="$blue9">
              <Users size={18} color="$blue9" />
              <Text fontSize="$8" fontWeight="bold" color="$blue9">{stats.total}</Text>
            </XStack>
            <Text fontSize="$3" color="$color11" mt="$1">Total Subcontractors</Text>
          </YStack>
          <YStack flex={1} padding="$4" alignItems="center" borderRightWidth={1} borderColor="$borderColor">
            <XStack alignItems="center" justifyContent="center" gap="$2">
              <Shield size={18} color="$green9" />
              <Text fontSize="$8" fontWeight="bold" color="$green9">{stats.compliant}</Text>
            </XStack>
            <Text fontSize="$3" color="$color11" mt="$1">Compliant</Text>
          </YStack>
          <YStack flex={1} padding="$4" alignItems="center" borderRightWidth={1} borderColor="$borderColor">
            <XStack alignItems="center" justifyContent="center" gap="$2">
              <Shield size={18} color="$yellow9" />
              <Text fontSize="$8" fontWeight="bold" color="$yellow9">{stats.atRisk}</Text>
            </XStack>
            <Text fontSize="$3" color="$color11" mt="$1">At Risk</Text>
          </YStack>
          <YStack flex={1} padding="$4" alignItems="center">
            <XStack alignItems="center" justifyContent="center" gap="$2">
              <FileText size={18} color="$color12" />
              <Text fontSize="$8" fontWeight="bold" color="$color12">{stats.active}</Text>
            </XStack>
            <Text fontSize="$3" color="$color11" mt="$1">Active</Text>
          </YStack>
        </XStack>
      </Card>

      {/* Filters */}
      <XStack flexWrap="wrap" alignItems="center" gap="$4">
        <XStack position="relative" flex={1} minWidth={256}>
          <Search
            position="absolute"
            left="$3"
            top="50%"
            transform={[{ translateY: -9 }]}
            color="$color10"
            size={18}
          />
          <Input
            type="text"
            placeholder="Search subcontractors..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            width="100%"
            paddingLeft="$10"
            paddingRight="$4"
            paddingVertical="$2"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            backgroundColor="$background"
            color="$color12"
            placeholderTextColor="$color10"
          />
        </XStack>

        <XStack alignItems="center" gap="$2">
          <Filter size={18} color="$color10" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--borderColor)',
              borderRadius: '8px',
              backgroundColor: 'var(--background)',
              color: 'var(--color12)',
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
              border: '1px solid var(--borderColor)',
              borderRadius: '8px',
              backgroundColor: 'var(--background)',
              color: 'var(--color12)',
            }}
          >
            <option value="all">All Compliance</option>
            <option value="compliant">Compliant</option>
            <option value="at-risk">At Risk</option>
            <option value="non-compliant">Non-Compliant</option>
          </select>
        </XStack>
      </XStack>

      {/* Subcontractors Table */}
      <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" overflow="hidden">
        <XStack
          paddingHorizontal="$6"
          paddingVertical="$4"
          borderBottomWidth={1}
          borderColor="$borderColor"
          alignItems="center"
          justifyContent="space-between"
        >
          <H2 fontSize="$6" fontWeight="600" color="$color12">
            Subcontractors ({filteredSubcontractors.length})
          </H2>
        </XStack>

        {filteredSubcontractors.length === 0 ? (
          <YStack alignItems="center" paddingVertical="$12">
            <Users color="$color10" size={48} mb="$4" />
            <H3 fontSize="$6" fontWeight="600" color="$color12" mb="$2">
              No Subcontractors Found
            </H3>
            <Text color="$color11">
              {searchQuery || statusFilter !== 'all' || complianceFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'This GC has no assigned subcontractors yet.'}
            </Text>
          </YStack>
        ) : (
          <YStack overflowX="auto">
            <YStack>
              <XStack
                backgroundColor="$backgroundHover"
                paddingHorizontal="$3"
                paddingVertical="$3"
                borderBottomWidth={1}
                borderColor="$borderColor"
              >
                <Text width={40} fontSize="$3" fontWeight="500" color="$color11"></Text>
                <Text flex={2} paddingHorizontal="$6" fontSize="$3" fontWeight="500" color="$color11">Subcontractor</Text>
                <Text flex={1} paddingHorizontal="$6" fontSize="$3" fontWeight="500" color="$color11">Score</Text>
                <Text flex={1} paddingHorizontal="$6" fontSize="$3" fontWeight="500" color="$color11">Status</Text>
                <Text flex={1} paddingHorizontal="$6" fontSize="$3" fontWeight="500" color="$color11">Pending Items</Text>
                <Text flex={1} paddingHorizontal="$6" fontSize="$3" fontWeight="500" color="$color11">Projects</Text>
                <Text flex={1} paddingHorizontal="$6" fontSize="$3" fontWeight="500" color="$color11">Last Activity</Text>
              </XStack>
              <YStack>
                {filteredSubcontractors.map((sub) => {
                  const isExpanded = expandedRowId === sub.id;
                  return (
                    <React.Fragment key={sub.id}>
                      {/* Main Row */}
                      <XStack
                        borderBottomWidth={1}
                        borderColor="$borderColor"
                        paddingHorizontal="$3"
                        paddingVertical="$4"
                        cursor="pointer"
                        backgroundColor={isExpanded ? "$backgroundHover" : "transparent"}
                        hoverStyle={{ backgroundColor: "$backgroundHover" }}
                        onPress={() => handleRowClick(sub.id)}
                        data-testid="subcontractor-row"
                      >
                        {/* Expand Indicator */}
                        <XStack width={40} alignItems="center" justifyContent="center">
                          <ChevronDown
                            size={18}
                            color="$color10"
                            transform={[{ rotate: isExpanded ? '180deg' : '0deg' }]}
                            data-testid="expand-icon"
                          />
                        </XStack>
                        <XStack flex={2} paddingHorizontal="$6" alignItems="center" gap="$3">
                          <XStack
                            width={40}
                            height={40}
                            backgroundColor="$blue3"
                            borderRadius={9999}
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Building color="$blue9" size={20} />
                          </XStack>
                          <YStack>
                            <Text fontWeight="500" color="$color12">{sub.name}</Text>
                            <Text fontSize="$3" color="$color11">{sub.company}</Text>
                          </YStack>
                        </XStack>
                        <XStack flex={1} paddingHorizontal="$6" alignItems="center">
                          <Text
                            fontSize="$6"
                            fontWeight="bold"
                            color={
                              sub.complianceScore >= 80
                                ? "$green9"
                                : sub.complianceScore >= 50
                                ? "$yellow9"
                                : "$red9"
                            }
                          >
                            {sub.complianceScore}%
                          </Text>
                        </XStack>
                        <XStack flex={1} paddingHorizontal="$6" alignItems="center">
                          <Text
                            paddingHorizontal="$2.5"
                            paddingVertical="$0.5"
                            borderRadius={9999}
                            fontSize="$1"
                            fontWeight="500"
                            backgroundColor={
                              sub.complianceStatus === 'compliant'
                                ? "$green3"
                                : sub.complianceStatus === 'at-risk'
                                ? "$yellow3"
                                : "$red3"
                            }
                            color={
                              sub.complianceStatus === 'compliant'
                                ? "$green10"
                                : sub.complianceStatus === 'at-risk'
                                ? "$yellow10"
                                : "$red10"
                            }
                          >
                            {sub.complianceStatus === 'compliant'
                              ? 'Compliant'
                              : sub.complianceStatus === 'at-risk'
                              ? 'At Risk'
                              : 'Non-Compliant'}
                          </Text>
                        </XStack>
                        <XStack flex={1} paddingHorizontal="$6" alignItems="center">
                          {sub.pendingItems > 0 ? (
                            <Text
                              paddingHorizontal="$2"
                              paddingVertical="$1"
                              borderRadius="$2"
                              backgroundColor="$yellow3"
                              color="$yellow10"
                              fontSize="$3"
                            >
                              {sub.pendingItems} pending
                            </Text>
                          ) : (
                            <Text color="$color10">-</Text>
                          )}
                        </XStack>
                        <XStack flex={1} paddingHorizontal="$6" alignItems="center">
                          <Text color="$color11">{sub.projects.length}</Text>
                        </XStack>
                        <XStack flex={1} paddingHorizontal="$6" alignItems="center">
                          <Text color="$color11" fontSize="$3">
                            {sub.lastActivity
                              ? new Date(sub.lastActivity).toLocaleDateString()
                              : '-'}
                          </Text>
                        </XStack>
                      </XStack>

                      {/* Expanded Card Row */}
                      {isExpanded && (
                        <XStack
                          width="100%"
                          paddingHorizontal="$6"
                          paddingVertical={0}
                          data-testid="expanded-card"
                        >
                          <YStack
                            width="100%"
                            overflow="hidden"
                            maxHeight={isExpanded ? 384 : 0}
                            paddingVertical={isExpanded ? "$4" : 0}
                          >
                            <Card
                              backgroundColor="$backgroundHover"
                              borderRadius="$4"
                              padding="$6"
                              borderWidth={1}
                              borderColor="$borderColor"
                            >
                              <XStack gap="$6" flexWrap="wrap">
                                {/* Compliance Score */}
                                <YStack flex={1} minWidth={200}>
                                  <XStack alignItems="center" gap="$2" color="$color11" fontSize="$3" mb="$2">
                                    <Shield size={16} color="$color11" />
                                    <Text fontSize="$3" color="$color11">Compliance Score</Text>
                                  </XStack>
                                  <Text
                                    fontSize="$10"
                                    fontWeight="bold"
                                    color={
                                      sub.complianceScore >= 80
                                        ? "$green9"
                                        : sub.complianceScore >= 50
                                        ? "$yellow9"
                                        : "$red9"
                                    }
                                  >
                                    {sub.complianceScore}%
                                  </Text>
                                </YStack>

                                {/* Recent Documents */}
                                <YStack flex={1} minWidth={200}>
                                  <XStack alignItems="center" gap="$2" color="$color11" fontSize="$3" mb="$2">
                                    <FileText size={16} color="$color11" />
                                    <Text fontSize="$3" color="$color11">Recent Documents</Text>
                                  </XStack>
                                  {sub.recentDocuments.length > 0 ? (
                                    <YStack gap="$1">
                                      {sub.recentDocuments.slice(0, 3).map((doc) => (
                                        <Text key={doc.id} fontSize="$3" color="$color12">
                                          {doc.name}
                                        </Text>
                                      ))}
                                    </YStack>
                                  ) : (
                                    <Text fontSize="$3" color="$color10">No recent documents</Text>
                                  )}
                                </YStack>

                                {/* Active Status */}
                                <YStack flex={1} minWidth={200}>
                                  <XStack alignItems="center" gap="$2" color="$color11" fontSize="$3" mb="$2">
                                    <Clock size={16} color="$color11" />
                                    <Text fontSize="$3" color="$color11">Active Status</Text>
                                  </XStack>
                                  <Text
                                    paddingHorizontal="$2.5"
                                    paddingVertical="$1"
                                    borderRadius={9999}
                                    fontSize="$3"
                                    fontWeight="500"
                                    backgroundColor={sub.status === 'active' ? "$green3" : "$gray3"}
                                    color={sub.status === 'active' ? "$green10" : "$gray11"}
                                  >
                                    {sub.status === 'active' ? 'Active' : 'Inactive'}
                                  </Text>
                                </YStack>

                                {/* Notes */}
                                <YStack flex={1} minWidth={200}>
                                  <XStack alignItems="center" gap="$2" color="$color11" fontSize="$3" mb="$2">
                                    <StickyNote size={16} color="$color11" />
                                    <Text fontSize="$3" color="$color11">Notes</Text>
                                  </XStack>
                                  <Text fontSize="$3" color="$color12">
                                    {sub.notes || 'No notes available'}
                                  </Text>
                                </YStack>
                              </XStack>

                              {/* Action Buttons */}
                              <XStack alignItems="center" gap="$3" mt="$6" paddingTop="$4" borderTopWidth={1} borderColor="$borderColor">
                                <Button
                                  variant="primary"
                                  size="$2"
                                  leftIcon={Eye}
                                  onPress={(e) => handleViewFullProfile(e, sub.id)}
                                  data-testid="view-profile-btn"
                                >
                                  View Full Profile
                                </Button>
                                <Button
                                  variant="outline"
                                  size="$2"
                                  leftIcon={StickyNote}
                                  onPress={(e) => handleAddNote(e, sub.id)}
                                  data-testid="add-note-btn"
                                >
                                  Add Note
                                </Button>
                                <Button
                                  variant="outline"
                                  size="$2"
                                  leftIcon={MessageSquare}
                                  onPress={(e) => handleSendMessage(e, sub.id)}
                                  data-testid="send-message-btn"
                                >
                                  Send Message
                                </Button>
                              </XStack>
                            </Card>
                          </YStack>
                        </XStack>
                      )}
                    </React.Fragment>
                  );
                })}
              </YStack>
            </YStack>
          </YStack>
        )}
        </Card>
      </YStack>
    </YStack>
  );
}
