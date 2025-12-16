import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Search, Calendar, MessageSquare, Users } from 'lucide-react';
import { YStack, XStack, Text, H2, Card, Input } from '@unicornlove/ui';
import { BrokerClient, PolicyData, ComplianceData } from '../../types';
import { formatDistanceToNow } from '../../utils/dateHelpers';

type SortOption = 'default' | 'most-subs' | 'lowest-compliance' | 'recent-activity';

interface GCSubcontractorStats {
  totalSubs: number;
  compliantSubs: number;
  compliancePercent: number;
}

interface ClientsTableProps {
  clients: BrokerClient[];
  policies: PolicyData[];
  onClientClick?: (client: BrokerClient) => void;
  /** When true, only shows General Contractors with aggregate sub compliance */
  gcOnly?: boolean;
  /** Compliance data for calculating aggregate sub compliance */
  complianceData?: ComplianceData[];
  /** Projects for mapping GCs to their subcontractors */
  projects?: Array<{ id: string; client_id: string }>;
}

export default function ClientsTable({
  clients,
  policies,
  onClientClick,
  gcOnly = false,
  complianceData = [],
  projects = [],
}: ClientsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [complianceFilter, setComplianceFilter] = useState<string>('all');
  const [expiringFilter, setExpiringFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('default');

  // Calculate subcontractor stats for each GC
  const gcSubStats = useMemo((): Map<string, GCSubcontractorStats> => {
    const statsMap = new Map<string, GCSubcontractorStats>();
    if (!gcOnly) return statsMap;

    // Get projects for each GC
    const gcProjects = new Map<string, string[]>();
    projects.forEach((p) => {
      const existing = gcProjects.get(p.client_id) || [];
      existing.push(p.id);
      gcProjects.set(p.client_id, existing);
    });

    // For each GC, find compliance data for their projects' subcontractors
    clients
      .filter((c) => c.client_type === 'general_contractor')
      .forEach((gc) => {
        const gcProjectIds = gcProjects.get(gc.id) || [];
        const subComplianceRecords = complianceData.filter((c) =>
          gcProjectIds.includes(c.project_id)
        );

        // Dedupe by subcontractor_id and count compliant
        const subIds = new Set<string>();
        let compliantCount = 0;
        subComplianceRecords.forEach((record) => {
          if (!subIds.has(record.subcontractor_id)) {
            subIds.add(record.subcontractor_id);
            if (record.score >= 80) compliantCount++;
          }
        });

        const totalSubs = subIds.size;
        statsMap.set(gc.id, {
          totalSubs,
          compliantSubs: compliantCount,
          compliancePercent: totalSubs > 0 ? Math.round((compliantCount / totalSubs) * 100) : 0,
        });
      });

    return statsMap;
  }, [clients, complianceData, projects, gcOnly]);

  const filteredClients = useMemo(() => {
    const filtered = clients.filter((client) => {
      // GC-only filter
      if (gcOnly && client.client_type !== 'general_contractor') {
        return false;
      }
      if (
        searchTerm &&
        !client.company_name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      if (riskFilter !== 'all' && client.risk_level !== riskFilter) {
        return false;
      }

      if (complianceFilter !== 'all') {
        if (complianceFilter === 'compliant' && client.compliance_score < 90)
          return false;
        if (
          complianceFilter === 'warning' &&
          (client.compliance_score >= 90 || client.compliance_score < 70)
        )
          return false;
        if (complianceFilter === 'critical' && client.compliance_score >= 70)
          return false;
      }

      if (expiringFilter !== 'all') {
        const clientPolicies = policies.filter(
          (p) => p.client_id === client.id
        );
        const daysUntilExpiry = parseInt(expiringFilter);
        const hasExpiringPolicy = clientPolicies.some((policy) => {
          if (!policy.end_date) return false;
          const endDate = new Date(policy.end_date);
          if (isNaN(endDate.getTime())) return false;
          const today = new Date();
          const daysLeft = Math.ceil(
            (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysLeft <= daysUntilExpiry && daysLeft >= 0;
        });
        if (!hasExpiringPolicy) return false;
      }

      return true;
    });

    // Sort for GC-only mode
    if (gcOnly && sortOption !== 'default') {
      filtered.sort((a, b) => {
        const statsA = gcSubStats.get(a.id);
        const statsB = gcSubStats.get(b.id);

        switch (sortOption) {
          case 'most-subs':
            return (statsB?.totalSubs || 0) - (statsA?.totalSubs || 0);
          case 'lowest-compliance':
            return (statsA?.compliancePercent || 100) - (statsB?.compliancePercent || 100);
          case 'recent-activity': {
            const dateA = a.last_activity_at ? new Date(a.last_activity_at).getTime() : 0;
            const dateB = b.last_activity_at ? new Date(b.last_activity_at).getTime() : 0;
            return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
          }
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [
    clients,
    searchTerm,
    riskFilter,
    complianceFilter,
    expiringFilter,
    policies,
    gcOnly,
    sortOption,
    gcSubStats,
  ]);

  const getRiskBadge = (risk: string) => {
    const styles = {
      low: { backgroundColor: '$green2', color: '$green11', borderColor: '$green6' },
      medium: { backgroundColor: '$yellow2', color: '$yellow11', borderColor: '$yellow6' },
      high: { backgroundColor: '$red2', color: '$red11', borderColor: '$red6' },
    };
    return styles[risk as keyof typeof styles] || styles.medium;
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return '$green10';
    if (score >= 70) return '$yellow10';
    return '$red10';
  };

  const getOpenItemsCount = (clientId: string) => {
    return policies.filter(
      (p) => p.client_id === clientId && p.status === 'expiring'
    ).length;
  };

  const getNextRenewal = (clientId: string) => {
    const clientPolicies = policies.filter((p) => p.client_id === clientId);
    if (clientPolicies.length === 0) return 'N/A';

    const policiesWithDates = clientPolicies.filter((p) => p.end_date);
    if (policiesWithDates.length === 0) return 'N/A';

    const sortedByDate = policiesWithDates.sort((a, b) => {
      const dateA = new Date(a.end_date).getTime();
      const dateB = new Date(b.end_date).getTime();
      return (isNaN(dateA) ? Infinity : dateA) - (isNaN(dateB) ? Infinity : dateB);
    });

    const firstDate = new Date(sortedByDate[0].end_date);
    return isNaN(firstDate.getTime()) ? 'N/A' : firstDate.toLocaleDateString();
  };

  return (
    <Card
      backgroundColor="$background"
      borderRadius="$4"
      elevation={1}
      borderWidth={1}
      borderColor="$borderColor"
    >
      <YStack padding="$6" borderBottomWidth={1} borderColor="$borderColor">
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <XStack alignItems="center" gap="$3">
            <H2 fontSize="$6" fontWeight="600" color="$color12">
              {gcOnly ? 'Key Clients (General Contractors)' : 'Key Clients'}
            </H2>
            {gcOnly && (
              <Text fontSize="$3" color="$color11">
                {filteredClients.length} GC{filteredClients.length !== 1 ? 's' : ''}
              </Text>
            )}
          </XStack>
          <XStack alignItems="center" gap="$3">
            {gcOnly && (
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                style={{
                  padding: '6px 12px',
                  fontSize: '14px',
                  border: '1px solid var(--borderColor)',
                  borderRadius: '8px',
                }}
              >
                <option value="default">Sort by: Default</option>
                <option value="most-subs">Most Subcontractors</option>
                <option value="lowest-compliance">Lowest Compliance</option>
                <option value="recent-activity">Recent Activity</option>
              </select>
            )}
            <XStack
              as="button"
              paddingHorizontal="$4"
              paddingVertical="$2"
              fontSize="$3"
              fontWeight="500"
              color="$blue10"
              hoverStyle={{ color: '$blue11' }}
            >
              <Text fontSize="$3" fontWeight="500" color="$blue10">View all Clients</Text>
            </XStack>
          </XStack>
        </XStack>

        <XStack
          flexDirection="column"
          $gtMd={{ flexDirection: 'row' }}
          $gtLg={{ flexDirection: 'row' }}
          gap="$4"
          flexWrap="wrap"
        >
          <YStack position="relative" flex={1} minWidth="18%">
            <YStack
              position="absolute"
              left="$3"
              top="50%"
              transform="translateY(-50%)"
              zIndex={1}
            >
              <Search color="$color10" size={18} />
            </YStack>
            <Input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              width="100%"
              paddingLeft="$10"
              paddingRight="$4"
              paddingVertical="$2"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
            />
          </YStack>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--borderColor)',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>

          <select
            value={complianceFilter}
            onChange={(e) => setComplianceFilter(e.target.value)}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--borderColor)',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            <option value="all">All Compliance</option>
            <option value="compliant">Compliant (90%+)</option>
            <option value="warning">Warning (70-89%)</option>
            <option value="critical">Critical (&lt;70%)</option>
          </select>

          <select
            value={expiringFilter}
            onChange={(e) => setExpiringFilter(e.target.value)}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--borderColor)',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            <option value="all">All Policies</option>
            <option value="30">Expiring in 30 days</option>
            <option value="60">Expiring in 60 days</option>
            <option value="90">Expiring in 90 days</option>
          </select>

          <XStack
            as="button"
            paddingHorizontal="$4"
            paddingVertical="$2"
            fontSize="$3"
            fontWeight="500"
            color="$color11"
            hoverStyle={{ color: '$color12' }}
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            onClick={() => {
              setSearchTerm('');
              setRiskFilter('all');
              setComplianceFilter('all');
              setExpiringFilter('all');
            }}
          >
            <Text fontSize="$3" fontWeight="500" color="$color11">Clear Filters</Text>
          </XStack>
        </XStack>
      </YStack>

      <YStack overflowX="auto">
        <table style={{ width: '100%' }}>
          <thead style={{ backgroundColor: 'var(--gray3)' }}>
            <tr>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: 'var(--color11)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Client
              </th>
              {gcOnly && (
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: 'var(--color11)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Subs Compliant
                </th>
              )}
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: 'var(--color11)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Risk Score
              </th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: 'var(--color11)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Open Items
              </th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: 'var(--color11)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Next Renewal
              </th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: 'var(--color11)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Compliance
              </th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: 'var(--color11)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Last Activity
              </th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: 'var(--color11)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Notes
              </th>
              <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '12px', fontWeight: 500, color: 'var(--color11)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: 'var(--background)' }}>
            {filteredClients.map((client, index) => {
              const riskBadge = getRiskBadge(client.risk_level);
              return (
                <tr
                  key={client.id}
                  style={{
                    borderTop: index > 0 ? '1px solid var(--borderColor)' : 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--gray2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  onClick={() => onClientClick?.(client)}
                >
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                    <XStack alignItems="center">
                      <YStack
                        flexShrink={0}
                        width={40}
                        height={40}
                        backgroundColor="$blue3"
                        borderRadius={9999}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text fontSize="$3" fontWeight="500" color="$blue10">
                          {(client.company_name || '')
                            .split(' ')
                            .map((n) => n[0] || '')
                            .join('')
                            .substring(0, 2) || '??'}
                        </Text>
                      </YStack>
                      <YStack marginLeft="$4">
                        <Link
                          to={client.client_type === 'general_contractor'
                            ? `/broker/gcs/${client.id}`
                            : `/broker/clients/${client.id}`}
                          style={{
                            fontSize: '14px',
                            fontWeight: 500,
                            color: 'var(--blue10)',
                            textDecoration: 'none',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--blue11)';
                            e.currentTarget.style.textDecoration = 'underline';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--blue10)';
                            e.currentTarget.style.textDecoration = 'none';
                          }}
                          onClick={(e) => e.stopPropagation()}
                          data-testid="client-name-link"
                        >
                          {client.company_name}
                        </Link>
                        <YStack marginTop="$1">
                          <XStack
                            alignItems="center"
                            paddingHorizontal="$2"
                            paddingVertical="$0.5"
                            borderRadius="$2"
                            fontSize="$1"
                            fontWeight="500"
                            backgroundColor={client.client_type === 'subcontractor' ? '$blue2' : '$purple2'}
                            color={client.client_type === 'subcontractor' ? '$blue11' : '$purple11'}
                          >
                            <Text fontSize="$1" fontWeight="500" color={client.client_type === 'subcontractor' ? '$blue11' : '$purple11'}>
                              {client.client_type === 'subcontractor'
                                ? 'Sub'
                                : 'GC'}
                            </Text>
                          </XStack>
                        </YStack>
                      </YStack>
                    </XStack>
                  </td>
                  {gcOnly && (
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      {(() => {
                        const stats = gcSubStats.get(client.id);
                        if (!stats || stats.totalSubs === 0) {
                          return <Text fontSize="$3" color="$color10">No subs</Text>;
                        }
                        const color = stats.compliancePercent >= 80
                          ? '$green10'
                          : stats.compliancePercent >= 50
                          ? '$yellow10'
                          : '$red10';
                        return (
                          <XStack alignItems="center" gap="$2">
                            <Users size={16} color="$color10" />
                            <Text fontSize="$3" fontWeight="500" color={color}>
                              {stats.compliantSubs}/{stats.totalSubs} ({stats.compliancePercent}%)
                            </Text>
                          </XStack>
                        );
                      })()}
                    </td>
                  )}
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                    <XStack
                      alignItems="center"
                      paddingHorizontal="$3"
                      paddingVertical="$1"
                      borderRadius={9999}
                      fontSize="$1"
                      fontWeight="500"
                      borderWidth={1}
                      {...riskBadge}
                    >
                      <Text fontSize="$1" fontWeight="500" color={riskBadge.color}>
                        {client.risk_level}
                      </Text>
                    </XStack>
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                    <Text fontSize="$3" color="$color12" fontWeight="500">
                      {getOpenItemsCount(client.id)}
                    </Text>
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                    <XStack alignItems="center" fontSize="$3" color="$color11">
                      <Calendar size={14} marginRight="$1" color="$color11" />
                      <Text fontSize="$3" color="$color11">{getNextRenewal(client.id)}</Text>
                    </XStack>
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                    <XStack alignItems="center" gap="$2">
                      <YStack width={64} backgroundColor="$gray6" borderRadius={9999} height={8}>
                        <YStack
                          height={8}
                          borderRadius={9999}
                          backgroundColor={getComplianceColor(client.compliance_score)}
                          width={`${client.compliance_score}%`}
                        />
                      </YStack>
                      <Text fontSize="$3" fontWeight="500" color="$color12">
                        {client.compliance_score}%
                      </Text>
                    </XStack>
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', color: 'var(--color11)' }}>
                    <XStack alignItems="center">
                      <MessageSquare size={14} marginRight="$1" color="$color11" />
                      <Text fontSize="$3" color="$color11">
                        {client.last_activity_at ? formatDistanceToNow(client.last_activity_at) : 'No activity'}
                      </Text>
                    </XStack>
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', color: 'var(--color11)' }}>
                    <XStack alignItems="center">
                      <MessageSquare size={14} marginRight="$1" color="$color11" />
                      <Text fontSize="$3" color="$color11">
                        {client.notes ? '2 comments' : 'No notes'}
                      </Text>
                    </XStack>
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', textAlign: 'right', fontSize: '14px', fontWeight: 500 }}>
                    <XStack
                      as="button"
                      color="$blue10"
                      hoverStyle={{ color: '$blue12' }}
                    >
                      <ChevronRight size={20} color="$blue10" />
                    </XStack>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredClients.length === 0 && (
          <YStack alignItems="center" paddingVertical="$12">
            <Text color="$color11">
              No clients found matching your filters
            </Text>
          </YStack>
        )}
      </YStack>
    </Card>
  );
}
