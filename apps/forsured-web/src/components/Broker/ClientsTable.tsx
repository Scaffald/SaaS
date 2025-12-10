import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Search, Calendar, MessageSquare, Users } from 'lucide-react';
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
      low: 'bg-success-100 text-success-700 border-success-300',
      medium: 'bg-warning-100 text-warning-700 border-warning-300',
      high: 'bg-error-100 text-error-700 border-error-300',
    };
    return styles[risk as keyof typeof styles] || styles.medium;
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'bg-success-600';
    if (score >= 70) return 'bg-warning-600';
    return 'bg-error-600';
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
    <div className="bg-surface rounded-lg shadow-sm border border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-text-primary">
              {gcOnly ? 'Key Clients (General Contractors)' : 'Key Clients'}
            </h2>
            {gcOnly && (
              <span className="text-sm text-text-secondary">
                {filteredClients.length} GC{filteredClients.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {gcOnly && (
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="px-3 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="default">Sort by: Default</option>
                <option value="most-subs">Most Subcontractors</option>
                <option value="lowest-compliance">Lowest Compliance</option>
                <option value="recent-activity">Recent Activity</option>
              </select>
            )}
            <button className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700">
              View all Clients
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary"
              size={18}
            />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>

          <select
            value={complianceFilter}
            onChange={(e) => setComplianceFilter(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Compliance</option>
            <option value="compliant">Compliant (90%+)</option>
            <option value="warning">Warning (70-89%)</option>
            <option value="critical">Critical (&lt;70%)</option>
          </select>

          <select
            value={expiringFilter}
            onChange={(e) => setExpiringFilter(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-border rounded-lg"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-bg-tertiary">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Client
              </th>
              {gcOnly && (
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Subs Compliant
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Risk Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Open Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Next Renewal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Compliance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Last Activity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Notes
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border">
            {filteredClients.map((client) => (
              <tr
                key={client.id}
                className="hover:bg-surface-hover cursor-pointer transition-colors"
                onClick={() => onClientClick?.(client)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">
                        {(client.company_name || '')
                          .split(' ')
                          .map((n) => n[0] || '')
                          .join('')
                          .substring(0, 2) || '??'}
                      </span>
                    </div>
                    <div className="ml-4">
                      <Link
                        to={client.client_type === 'general_contractor'
                          ? `/broker/gcs/${client.id}`
                          : `/broker/clients/${client.id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                        data-testid="client-name-link"
                      >
                        {client.company_name}
                      </Link>
                      <div className="text-sm text-text-secondary">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            client.client_type === 'subcontractor'
                              ? 'bg-primary-100 text-primary-700'
                              : 'bg-secondary-100 text-secondary-700'
                          }`}
                        >
                          {client.client_type === 'subcontractor'
                            ? 'Sub'
                            : 'GC'}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                {gcOnly && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const stats = gcSubStats.get(client.id);
                      if (!stats || stats.totalSubs === 0) {
                        return <span className="text-sm text-text-tertiary">No subs</span>;
                      }
                      const colorClass = stats.compliancePercent >= 80
                        ? 'text-success-600'
                        : stats.compliancePercent >= 50
                        ? 'text-warning-600'
                        : 'text-error-600';
                      return (
                        <div className="flex items-center space-x-2">
                          <Users size={16} className="text-text-tertiary" />
                          <span className={`text-sm font-medium ${colorClass}`}>
                            {stats.compliantSubs}/{stats.totalSubs} ({stats.compliancePercent}%)
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRiskBadge(client.risk_level)}`}
                  >
                    {client.risk_level}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-text-primary font-medium">
                    {getOpenItemsCount(client.id)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-text-secondary">
                    <Calendar size={14} className="mr-1" />
                    {getNextRenewal(client.id)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-neutral-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getComplianceColor(client.compliance_score)}`}
                        style={{ width: `${client.compliance_score}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-text-primary">
                      {client.compliance_score}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                  <div className="flex items-center">
                    <MessageSquare size={14} className="mr-1" />
                    {client.last_activity_at ? formatDistanceToNow(client.last_activity_at) : 'No activity'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                  <div className="flex items-center">
                    <MessageSquare size={14} className="mr-1" />
                    {client.notes ? '2 comments' : 'No notes'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-primary-600 hover:text-primary-900">
                    <ChevronRight size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-text-secondary">
              No clients found matching your filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
