import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Search, Calendar, MessageSquare, Users, Shield, Building2, HardHat } from 'lucide-react';
import { Stack, Row, Text, H2, Card } from '@unicornlove/beyond-ui';
import type { BrokerClient, PolicyData, ComplianceData } from '../../types';
import { formatDistanceToNow } from '../../utils/dateHelpers';
import type { ClientBrokerCount } from '../../hooks/useClientBrokerCounts';

type SortOption = 'default' | 'most-subs' | 'lowest-compliance' | 'recent-activity';
type ClientTypeFilter = 'all' | 'manager' | 'subcontractor';

interface GCSubcontractorStats {
  totalSubs: number;
  compliantSubs: number;
  compliancePercent: number;
}

interface ClientsTableProps {
  clients: BrokerClient[];
  policies: PolicyData[];
  onClientClick?: (client: BrokerClient) => void;
  /** Compliance data for calculating aggregate sub compliance */
  complianceData?: ComplianceData[];
  /** Projects for mapping GCs to their subcontractors */
  projects?: Array<{ id: string; client_id: string }>;
  /** Optional map of client organization ID to broker count info */
  brokerCounts?: Map<string, ClientBrokerCount>;
  /** Initial client type filter */
  initialClientTypeFilter?: ClientTypeFilter;
  /** Callback when filter changes - useful for updating parent stats */
  onFilterChange?: (filter: ClientTypeFilter) => void;
}

// Orange button style for visibility
const orangeButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 14,
  fontWeight: 600,
  color: 'white',
  backgroundColor: 'var(--color-orange-9)',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
};

const orangeButtonHoverStyle: React.CSSProperties = {
  ...orangeButtonStyle,
  backgroundColor: 'var(--color-orange-10)',
};

export default function ClientsTable({
  clients,
  policies,
  onClientClick,
  complianceData = [],
  projects = [],
  brokerCounts,
  initialClientTypeFilter = 'all',
  onFilterChange,
}: ClientsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [complianceFilter, setComplianceFilter] = useState<string>('all');
  const [expiringFilter, setExpiringFilter] = useState<string>('all');
  const [clientTypeFilter, setClientTypeFilter] = useState<ClientTypeFilter>(initialClientTypeFilter);
  const [sortOption, setSortOption] = useState<SortOption>('default');

  // Count clients by type
  const clientCounts = useMemo(() => {
    const managers = clients.filter(c => c.client_type === 'general_contractor').length;
    const contractors = clients.filter(c => c.client_type === 'subcontractor').length;
    return { managers, contractors, total: clients.length };
  }, [clients]);

  // Calculate subcontractor stats for each GC (only when showing managers)
  const gcSubStats = useMemo((): Map<string, GCSubcontractorStats> => {
    const statsMap = new Map<string, GCSubcontractorStats>();
    if (clientTypeFilter === 'subcontractor') return statsMap;

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
  }, [clients, complianceData, projects, clientTypeFilter]);

  // Calculate filter counts based on base filters (client type + search)
  const filterCounts = useMemo(() => {
    // Base filtered list (only client type and search applied)
    const baseFiltered = clients.filter((client) => {
      if (clientTypeFilter === 'manager' && client.client_type !== 'general_contractor') return false;
      if (clientTypeFilter === 'subcontractor' && client.client_type !== 'subcontractor') return false;
      if (searchTerm && !client.company_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });

    // Risk level counts
    const riskCounts = {
      low: baseFiltered.filter(c => c.risk_level === 'low').length,
      medium: baseFiltered.filter(c => c.risk_level === 'medium').length,
      high: baseFiltered.filter(c => c.risk_level === 'high').length,
    };

    // Compliance counts
    const complianceCounts = {
      compliant: baseFiltered.filter(c => (c.compliance_score ?? 0) >= 90).length,
      warning: baseFiltered.filter(c => {
        const score = c.compliance_score ?? 0;
        return score >= 70 && score < 90;
      }).length,
      critical: baseFiltered.filter(c => (c.compliance_score ?? 0) < 70).length,
    };

    // Expiring policy counts
    const getExpiringCount = (days: number) => {
      return baseFiltered.filter(client => {
        const clientPolicies = policies.filter(p => p.client_id === client.id);
        return clientPolicies.some(policy => {
          if (!policy.end_date) return false;
          const endDate = new Date(policy.end_date);
          if (isNaN(endDate.getTime())) return false;
          const today = new Date();
          const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return daysLeft <= days && daysLeft >= 0;
        });
      }).length;
    };

    const expiringCounts = {
      '30': getExpiringCount(30),
      '60': getExpiringCount(60),
      '90': getExpiringCount(90),
    };

    return { riskCounts, complianceCounts, expiringCounts, total: baseFiltered.length };
  }, [clients, clientTypeFilter, searchTerm, policies]);

  const filteredClients = useMemo(() => {
    const filtered = clients.filter((client) => {
      // Client type filter
      if (clientTypeFilter === 'manager' && client.client_type !== 'general_contractor') {
        return false;
      }
      if (clientTypeFilter === 'subcontractor' && client.client_type !== 'subcontractor') {
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
        const score = client.compliance_score ?? 0;
        if (complianceFilter === 'compliant' && score < 90) return false;
        if (complianceFilter === 'warning' && (score >= 90 || score < 70)) return false;
        if (complianceFilter === 'critical' && score >= 70) return false;
      }

      if (expiringFilter !== 'all') {
        const clientPolicies = policies.filter((p) => p.client_id === client.id);
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

    // Sort
    if (sortOption !== 'default') {
      filtered.sort((a, b) => {
        const statsA = gcSubStats.get(a.id);
        const statsB = gcSubStats.get(b.id);

        switch (sortOption) {
          case 'most-subs':
            return (statsB?.totalSubs || 0) - (statsA?.totalSubs || 0);
          case 'lowest-compliance':
            return (a.compliance_score ?? 100) - (b.compliance_score ?? 100);
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
    clientTypeFilter,
    policies,
    sortOption,
    gcSubStats,
  ]);

  const handleClientTypeChange = (filter: ClientTypeFilter) => {
    setClientTypeFilter(filter);
    onFilterChange?.(filter);
  };

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

  /**
   * Get display label for client type using their lexicon preference
   * Falls back to standard terms if not available
   */
  const getClientTypeLabel = (client: BrokerClient): string => {
    if (client.client_type === 'general_contractor') {
      return client.manager_label_singular || 'General Contractor';
    }
    return client.contractor_label_singular || 'Subcontractor';
  };

  /**
   * Get short display label for client type badge
   */
  const getClientTypeBadge = (client: BrokerClient): string => {
    if (client.client_type === 'general_contractor') {
      // Use first word of manager label or "GC"
      const label = client.manager_label_singular || 'General Contractor';
      if (label.toLowerCase().includes('property')) return 'PM';
      if (label.toLowerCase().includes('general')) return 'GC';
      return label.split(' ')[0].substring(0, 3).toUpperCase();
    }
    return 'Sub';
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

  const clientTypeButtonStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 8,
    border: 'none',
    backgroundColor: isSelected ? 'var(--color-orange-9)' : 'var(--color-gray-3)',
    color: isSelected ? 'white' : 'var(--color-text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  });

  return (
    <Card
      style={{
        backgroundColor: 'var(--color-background)',
        borderRadius: 12,
        border: '1px solid var(--color-border)',
      }}
    >
      <Stack padding={24} style={{ borderBottom: '1px solid var(--color-border)' }}>
        {/* Header with counts and type filter */}
        <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 16 }}>
          <Row alignItems="center" gap={12}>
            <H2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text)' }}>
              Clients
            </H2>
            <Text size="sm" muted>
              {filteredClients.length} of {clients.length} clients
            </Text>
          </Row>
          
          {/* Client Type Toggle */}
          <Row alignItems="center" gap={8}>
            <button
              type="button"
              onClick={() => handleClientTypeChange('all')}
              style={clientTypeButtonStyle(clientTypeFilter === 'all')}
            >
              <Users size={16} />
              All ({clientCounts.total})
            </button>
            <button
              type="button"
              onClick={() => handleClientTypeChange('manager')}
              style={clientTypeButtonStyle(clientTypeFilter === 'manager')}
            >
              <Building2 size={16} />
              Managers ({clientCounts.managers})
            </button>
            <button
              type="button"
              onClick={() => handleClientTypeChange('subcontractor')}
              style={clientTypeButtonStyle(clientTypeFilter === 'subcontractor')}
            >
              <HardHat size={16} />
              Contractors ({clientCounts.contractors})
            </button>
          </Row>
        </Row>

        {/* Filters Row */}
        <Row gap={16} style={{ flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '18%' }}>
            <div
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <Search size={18} style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: 40,
                paddingRight: 16,
                paddingTop: 10,
                paddingBottom: 10,
                border: '1px solid var(--color-gray-4)',
                borderRadius: 8,
                fontSize: 14,
                backgroundColor: 'white',
                outline: 'none',
              }}
            />
          </div>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="all">All Risk Levels ({filterCounts.total})</option>
            <option value="low">Low Risk ({filterCounts.riskCounts.low})</option>
            <option value="medium">Medium Risk ({filterCounts.riskCounts.medium})</option>
            <option value="high">High Risk ({filterCounts.riskCounts.high})</option>
          </select>

          <select
            value={complianceFilter}
            onChange={(e) => setComplianceFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="all">All Compliance ({filterCounts.total})</option>
            <option value="compliant">Compliant 90%+ ({filterCounts.complianceCounts.compliant})</option>
            <option value="warning">Warning 70-89% ({filterCounts.complianceCounts.warning})</option>
            <option value="critical">Critical &lt;70% ({filterCounts.complianceCounts.critical})</option>
          </select>

          <select
            value={expiringFilter}
            onChange={(e) => setExpiringFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="all">All Policies ({filterCounts.total})</option>
            <option value="30">Expiring 30 days ({filterCounts.expiringCounts['30']})</option>
            <option value="60">Expiring 60 days ({filterCounts.expiringCounts['60']})</option>
            <option value="90">Expiring 90 days ({filterCounts.expiringCounts['90']})</option>
          </select>

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            style={selectStyle}
          >
            <option value="default">Sort by: Default</option>
            <option value="most-subs">Most Subcontractors</option>
            <option value="lowest-compliance">Lowest Compliance</option>
            <option value="recent-activity">Recent Activity</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setRiskFilter('all');
              setComplianceFilter('all');
              setExpiringFilter('all');
              setClientTypeFilter('all');
              setSortOption('default');
              onFilterChange?.('all');
            }}
            style={{
              ...orangeButtonStyle,
              backgroundColor: 'transparent',
              color: 'var(--color-orange-10)',
              border: '1px solid var(--color-orange-6)',
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
              <th style={thStyle}>Type</th>
              {clientTypeFilter !== 'subcontractor' && <th style={thStyle}>Subs Compliant</th>}
              <th style={thStyle}>Risk Score</th>
              <th style={thStyle}>Open Items</th>
              <th style={thStyle}>Next Renewal</th>
              <th style={thStyle}>Compliance</th>
              {brokerCounts && <th style={thStyle}>Brokers</th>}
              <th style={thStyle}>Last Activity</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: 'var(--color-background)' }}>
            {filteredClients.map((client, index) => {
              const riskBadgeStyle = getRiskBadgeStyle(client.risk_level);
              const isGC = client.client_type === 'general_contractor';
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
                          backgroundColor: isGC ? 'var(--color-purple-3)' : 'var(--color-blue-3)',
                          borderRadius: 9999,
                        }}
                      >
                        <Text size="sm" weight="medium" style={{ color: isGC ? 'var(--color-purple-10)' : 'var(--color-blue-10)' }}>
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
                        <Text size="xs" muted style={{ marginTop: 2 }}>
                          {client.contact_email || client.contact_name || 'No contact info'}
                        </Text>
                      </Stack>
                    </Row>
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
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
                        backgroundColor: isGC ? 'var(--color-purple-2)' : 'var(--color-blue-2)',
                        color: isGC ? 'var(--color-purple-11)' : 'var(--color-blue-11)',
                      }}
                      title={getClientTypeLabel(client)}
                    >
                      {getClientTypeBadge(client)}
                    </span>
                  </td>
                  {clientTypeFilter !== 'subcontractor' && (
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      {isGC ? (() => {
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
                      })() : (
                        <Text size="sm" muted>-</Text>
                      )}
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
                            backgroundColor: getComplianceColor(client.compliance_score ?? 0),
                            width: `${client.compliance_score ?? 0}%`,
                          }}
                        />
                      </Stack>
                      <Text size="sm" weight="medium">
                        {client.compliance_score ?? 0}%
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
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', textAlign: 'right', fontSize: 14, fontWeight: 500 }}>
                    <button
                      type="button"
                      style={{
                        ...orangeButtonStyle,
                        padding: '6px 12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onClientClick?.(client);
                      }}
                    >
                      View
                      <ChevronRight size={16} />
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
