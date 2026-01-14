import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Search, Calendar, MessageSquare, Users, Shield } from 'lucide-react';
import { Stack, Row, Text, H2, Card, Input } from '@unicornlove/beyond-ui';
import type { BrokerClient, PolicyData, ComplianceData } from '../../types';
import { formatDistanceToNow } from '../../utils/dateHelpers';
import type { ClientBrokerCount } from '../../hooks/useClientBrokerCounts';

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
  /** Optional map of client organization ID to broker count info */
  brokerCounts?: Map<string, ClientBrokerCount>;
}

export default function ClientsTable({
  clients,
  policies,
  onClientClick,
  gcOnly = false,
  complianceData = [],
  projects = [],
  brokerCounts,
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

  const getRiskBadgeStyle = (risk: string): React.CSSProperties => {
    const styles: Record<string, React.CSSProperties> = {
      low: { backgroundColor: 'var(--color-green-2)', color: 'var(--color-green-11)', borderColor: 'var(--color-green-6)' },
      medium: { backgroundColor: 'var(--color-yellow-2)', color: 'var(--color-yellow-11)', borderColor: 'var(--color-yellow-6)' },
      high: { backgroundColor: 'var(--color-red-2)', color: 'var(--color-red-11)', borderColor: 'var(--color-red-6)' },
    };
    return styles[risk] || styles.medium;
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'var(--color-green-10)';
    if (score >= 70) return 'var(--color-yellow-10)';
    return 'var(--color-red-10)';
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

  const selectStyle: React.CSSProperties = {
    padding: '8px 16px',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    fontSize: 14,
    backgroundColor: 'var(--color-background)',
  };

  const thStyle: React.CSSProperties = {
    padding: '12px 24px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  return (
    <Card
      style={{
        backgroundColor: 'var(--color-background)',
        borderRadius: 12,
        border: '1px solid var(--color-border)',
      }}
    >
      <Stack padding={24} style={{ borderBottom: '1px solid var(--color-border)' }}>
        <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 16 }}>
          <Row alignItems="center" gap={12}>
            <H2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text)' }}>
              {gcOnly ? 'Key Clients (General Contractors)' : 'Key Clients'}
            </H2>
            {gcOnly && (
              <Text size="sm" muted>
                {filteredClients.length} GC{filteredClients.length !== 1 ? 's' : ''}
              </Text>
            )}
          </Row>
          <Row alignItems="center" gap={12}>
            {gcOnly && (
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                style={{ ...selectStyle, padding: '6px 12px' }}
              >
                <option value="default">Sort by: Default</option>
                <option value="most-subs">Most Subcontractors</option>
                <option value="lowest-compliance">Lowest Compliance</option>
                <option value="recent-activity">Recent Activity</option>
              </select>
            )}
            <button
              style={{
                background: 'none',
                border: 'none',
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--color-blue-10)',
                cursor: 'pointer',
              }}
            >
              View all Clients
            </button>
          </Row>
        </Row>

        <Row gap={16} style={{ flexWrap: 'wrap' }}>
          <Stack style={{ position: 'relative', flex: 1, minWidth: '18%' }}>
            <Stack
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1,
              }}
            >
              <Search size={18} style={{ color: 'var(--color-text-muted)' }} />
            </Stack>
            <Input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: 40,
                paddingRight: 16,
                paddingTop: 8,
                paddingBottom: 8,
                border: '1px solid var(--color-border)',
                borderRadius: 8,
              }}
            />
          </Stack>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>

          <select
            value={complianceFilter}
            onChange={(e) => setComplianceFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="all">All Compliance</option>
            <option value="compliant">Compliant (90%+)</option>
            <option value="warning">Warning (70-89%)</option>
            <option value="critical">Critical (&lt;70%)</option>
          </select>

          <select
            value={expiringFilter}
            onChange={(e) => setExpiringFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="all">All Policies</option>
            <option value="30">Expiring in 30 days</option>
            <option value="60">Expiring in 60 days</option>
            <option value="90">Expiring in 90 days</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setRiskFilter('all');
              setComplianceFilter('all');
              setExpiringFilter('all');
            }}
            style={{
              padding: '8px 16px',
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              background: 'none',
              cursor: 'pointer',
            }}
          >
            Clear Filters
          </button>
        </Row>
      </Stack>

      <Stack style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%' }}>
          <thead style={{ backgroundColor: 'var(--color-gray-3)' }}>
            <tr>
              <th style={thStyle}>Client</th>
              {gcOnly && <th style={thStyle}>Subs Compliant</th>}
              <th style={thStyle}>Risk Score</th>
              <th style={thStyle}>Open Items</th>
              <th style={thStyle}>Next Renewal</th>
              <th style={thStyle}>Compliance</th>
              {brokerCounts && <th style={thStyle}>Brokers</th>}
              <th style={thStyle}>Last Activity</th>
              <th style={thStyle}>Notes</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: 'var(--color-background)' }}>
            {filteredClients.map((client, index) => {
              const riskBadgeStyle = getRiskBadgeStyle(client.risk_level);
              return (
                <tr
                  key={client.id}
                  style={{
                    borderTop: index > 0 ? '1px solid var(--color-border)' : 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-gray-2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  onClick={() => onClientClick?.(client)}
                >
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                    <Row alignItems="center">
                      <Stack
                        alignItems="center"
                        justifyContent="center"
                        style={{
                          flexShrink: 0,
                          width: 40,
                          height: 40,
                          backgroundColor: 'var(--color-blue-3)',
                          borderRadius: 9999,
                        }}
                      >
                        <Text size="sm" weight="medium" style={{ color: 'var(--color-blue-10)' }}>
                          {(client.company_name || '')
                            .split(' ')
                            .map((n) => n[0] || '')
                            .join('')
                            .substring(0, 2) || '??'}
                        </Text>
                      </Stack>
                      <Stack style={{ marginLeft: 16 }}>
                        <Link
                          to={`/broker/clients/${client.id}`}
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: 'var(--color-blue-10)',
                            textDecoration: 'none',
                          }}
                          onClick={(e) => e.stopPropagation()}
                          data-testid="client-name-link"
                        >
                          {client.company_name}
                        </Link>
                        <Stack style={{ marginTop: 4 }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              paddingLeft: 8,
                              paddingRight: 8,
                              paddingTop: 2,
                              paddingBottom: 2,
                              borderRadius: 4,
                              fontSize: 12,
                              fontWeight: 500,
                              backgroundColor: client.client_type === 'subcontractor' ? 'var(--color-blue-2)' : 'var(--color-purple-2)',
                              color: client.client_type === 'subcontractor' ? 'var(--color-blue-11)' : 'var(--color-purple-11)',
                            }}
                          >
                            {client.client_type === 'subcontractor' ? 'Sub' : 'GC'}
                          </span>
                        </Stack>
                      </Stack>
                    </Row>
                  </td>
                  {gcOnly && (
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      {(() => {
                        const stats = gcSubStats.get(client.id);
                        if (!stats || stats.totalSubs === 0) {
                          return <Text size="sm" muted>No subs</Text>;
                        }
                        const color = stats.compliancePercent >= 80
                          ? 'var(--color-green-10)'
                          : stats.compliancePercent >= 50
                          ? 'var(--color-yellow-10)'
                          : 'var(--color-red-10)';
                        return (
                          <Row alignItems="center" gap={8}>
                            <Users size={16} style={{ color: 'var(--color-text-muted)' }} />
                            <Text size="sm" weight="medium" style={{ color }}>
                              {stats.compliantSubs}/{stats.totalSubs} ({stats.compliancePercent}%)
                            </Text>
                          </Row>
                        );
                      })()}
                    </td>
                  )}
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        paddingLeft: 12,
                        paddingRight: 12,
                        paddingTop: 4,
                        paddingBottom: 4,
                        borderRadius: 9999,
                        fontSize: 12,
                        fontWeight: 500,
                        border: '1px solid',
                        ...riskBadgeStyle,
                      }}
                    >
                      {client.risk_level}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                    <Text size="sm" weight="medium">
                      {getOpenItemsCount(client.id)}
                    </Text>
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                    <Row alignItems="center" gap={4}>
                      <Calendar size={14} style={{ color: 'var(--color-text-muted)' }} />
                      <Text size="sm" muted>{getNextRenewal(client.id)}</Text>
                    </Row>
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                    <Row alignItems="center" gap={8}>
                      <Stack
                        style={{
                          width: 64,
                          backgroundColor: 'var(--color-gray-6)',
                          borderRadius: 9999,
                          height: 8,
                        }}
                      >
                        <Stack
                          style={{
                            height: 8,
                            borderRadius: 9999,
                            backgroundColor: getComplianceColor(client.compliance_score),
                            width: `${client.compliance_score}%`,
                          }}
                        />
                      </Stack>
                      <Text size="sm" weight="medium">
                        {client.compliance_score}%
                      </Text>
                    </Row>
                  </td>
                  {brokerCounts && (
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      {(() => {
                        const brokerInfo = brokerCounts.get(client.id);
                        if (!brokerInfo || brokerInfo.brokerCount === 0) {
                          return (
                            <Text size="sm" muted>-</Text>
                          );
                        }
                        if (brokerInfo.hasMultipleBrokers) {
                          return (
                            <Row
                              alignItems="center"
                              gap={4}
                              style={{
                                backgroundColor: 'var(--color-orange-2)',
                                paddingLeft: 8,
                                paddingRight: 8,
                                paddingTop: 4,
                                paddingBottom: 4,
                                borderRadius: 4,
                                display: 'inline-flex',
                              }}
                              title={`This client works with ${brokerInfo.brokerCount} brokers`}
                            >
                              <Shield size={14} style={{ color: 'var(--color-orange-10)' }} />
                              <Text size="sm" weight="semibold" style={{ color: 'var(--color-orange-11)' }}>
                                {brokerInfo.brokerCount}
                              </Text>
                            </Row>
                          );
                        }
                        return (
                          <Row alignItems="center" gap={4}>
                            <Shield size={14} style={{ color: 'var(--color-text-muted)' }} />
                            <Text size="sm" muted>1</Text>
                          </Row>
                        );
                      })()}
                    </td>
                  )}
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: 14, color: 'var(--color-text-muted)' }}>
                    <Row alignItems="center" gap={4}>
                      <MessageSquare size={14} />
                      <Text size="sm" muted>
                        {client.last_activity_at ? formatDistanceToNow(client.last_activity_at) : 'No activity'}
                      </Text>
                    </Row>
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: 14, color: 'var(--color-text-muted)' }}>
                    <Row alignItems="center" gap={4}>
                      <MessageSquare size={14} />
                      <Text size="sm" muted>
                        {client.notes ? '2 comments' : 'No notes'}
                      </Text>
                    </Row>
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', textAlign: 'right', fontSize: 14, fontWeight: 500 }}>
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-blue-10)',
                        padding: 4,
                      }}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredClients.length === 0 && (
          <Stack alignItems="center" style={{ paddingTop: 48, paddingBottom: 48 }}>
            <Text muted>
              No clients found matching your filters
            </Text>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
