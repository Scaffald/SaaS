import { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Pressable, View as RNView, type LayoutChangeEvent } from 'react-native';
import { ChevronRight, ChevronDown, ChevronUp, Search, Calendar, MessageSquare, Users, Shield, Building2, HardHat } from 'lucide-react';
import { Stack, Row, Text, H2, Card, ButtonGroup, Input, Button, Dropdown, DropdownMenu, DropdownItem, Chip, ProgressBarBase, Avatar } from '@scaffald/ui';
import type { BrokerClient, PolicyData, ComplianceData } from '../../types';
import { formatDistanceToNow } from '../../utils/dateHelpers';
import type { ClientBrokerCount } from '../../hooks/useClientBrokerCounts';

type SortOption = 'default' | 'most-subs' | 'lowest-compliance' | 'recent-activity';
type ClientTypeFilter = 'all' | 'manager' | 'subcontractor';

// Helper component for custom dropdown with Button + DropdownMenu
function CustomDropdown({
  triggerText,
  open,
  onOpenChange,
  children,
  position = 'bottom-left',
}: {
  triggerText: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}) {
  const triggerRef = useRef<RNView>(null);
  const [triggerLayout, setTriggerLayout] = useState<{ x: number; y: number; width: number; height: number } | undefined>();

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height, x, y } = event.nativeEvent.layout;
    if (triggerRef.current) {
      // Use measureInWindow for absolute positioning
      triggerRef.current.measureInWindow((fx, fy, fwidth, fheight) => {
        setTriggerLayout({
          x: fx || 0,
          y: fy || 0,
          width: fwidth || width || 200,
          height: fheight || height || 40,
        });
      });
    } else {
      // Fallback to layout values
      setTriggerLayout({ x: x || 0, y: y || 0, width: width || 200, height: height || 40 });
    }
  };

  // Measure on open
  useEffect(() => {
    if (open && triggerRef.current) {
      triggerRef.current.measureInWindow((fx, fy, fwidth, fheight) => {
        setTriggerLayout({
          x: fx || 0,
          y: fy || 0,
          width: fwidth || 200,
          height: fheight || 40,
        });
      });
    }
  }, [open]);

  return (
    <Stack style={{ position: 'relative' }}>
      <RNView ref={triggerRef} onLayout={handleLayout}>
        <Button
          variant="outlined"
          size="md"
          onPress={() => onOpenChange(!open)}
          iconEnd={open ? ChevronUp : ChevronDown}
        >
          {triggerText}
        </Button>
      </RNView>
      {open && triggerLayout && (
        <DropdownMenu
          position={position}
          visible={open}
          triggerLayout={triggerLayout}
          onDismiss={() => onOpenChange(false)}
        >
          {children}
        </DropdownMenu>
      )}
    </Stack>
  );
}

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
  /** Controlled client type filter - when provided, component is controlled */
  clientTypeFilter?: ClientTypeFilter;
  /** Initial client type filter - only used if clientTypeFilter is not provided */
  initialClientTypeFilter?: ClientTypeFilter;
  /** Callback when filter changes - useful for updating parent stats */
  onFilterChange?: (filter: ClientTypeFilter) => void;
}


export default function ClientsTable({
  clients,
  policies,
  onClientClick,
  complianceData = [],
  projects = [],
  brokerCounts,
  clientTypeFilter: controlledClientTypeFilter,
  initialClientTypeFilter = 'all',
  onFilterChange,
}: ClientsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [complianceFilter, setComplianceFilter] = useState<string>('all');
  const [expiringFilter, setExpiringFilter] = useState<string>('all');
  const [internalClientTypeFilter, setInternalClientTypeFilter] = useState<ClientTypeFilter>(initialClientTypeFilter);
  const [sortOption, setSortOption] = useState<SortOption>('default');
  
  // Dropdown open states
  const [riskDropdownOpen, setRiskDropdownOpen] = useState(false);
  const [complianceDropdownOpen, setComplianceDropdownOpen] = useState(false);
  const [expiringDropdownOpen, setExpiringDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Use controlled value if provided, otherwise use internal state
  const clientTypeFilter = controlledClientTypeFilter ?? internalClientTypeFilter;

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
    // If controlled, only call callback. Otherwise update internal state.
    if (controlledClientTypeFilter !== undefined) {
      onFilterChange?.(filter);
    } else {
      setInternalClientTypeFilter(filter);
      onFilterChange?.(filter);
    }
  };

  // Calculate minimum table width based on column widths for horizontal scrolling
  const tableMinWidth = useMemo(() => {
    const baseWidth = 250 + 100; // client + type
    const conditionalWidth = clientTypeFilter !== 'subcontractor' ? 120 : 0; // subsCompliant
    const standardWidth = 100 + 100 + 120 + 120; // risk + openItems + nextRenewal + compliance
    const brokerWidth = brokerCounts ? 100 : 0;
    const otherWidth = 120 + 100; // lastActivity + actions
    return baseWidth + conditionalWidth + standardWidth + brokerWidth + otherWidth;
  }, [clientTypeFilter, brokerCounts]);

  const getRiskChipStyle = (risk: string) => {
    const styles: Record<string, { backgroundColor: string; color: string; borderColor: string }> = {
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




  return (
    <Card 
      variant="elevated" 
      padding="none" 
      radius="lg" 
      elevation="sm"
      style={{ overflow: 'hidden', width: '100%' }}
    >
      <Stack padding={24} style={{ borderBottomWidth: 1, borderBottomColor: 'var(--color-border)' }}>
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
          <ButtonGroup
            items={[
              {
                id: 'all',
                label: `All (${clientCounts.total})`,
                icon: Users,
                iconPosition: 'start',
              },
              {
                id: 'manager',
                label: `Managers (${clientCounts.managers})`,
                icon: Building2,
                iconPosition: 'start',
              },
              {
                id: 'subcontractor',
                label: `Contractors (${clientCounts.contractors})`,
                icon: HardHat,
                iconPosition: 'start',
              },
            ]}
            value={clientTypeFilter}
            onChange={(value) => handleClientTypeChange(value as ClientTypeFilter)}
            size="md"
            mode="single"
          />
        </Row>

        {/* Filters Row */}
        <Row gap={16} style={{ flexWrap: 'wrap' }}>
          <Stack style={{ flex: 1, minWidth: '18%' }}>
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              iconStart={Search}
              fullWidth
            />
          </Stack>

          <CustomDropdown
            triggerText={
              riskFilter === 'all'
                ? `All Risk Levels (${filterCounts.total})`
                : riskFilter === 'low'
                  ? `Low Risk (${filterCounts.riskCounts.low})`
                  : riskFilter === 'medium'
                    ? `Medium Risk (${filterCounts.riskCounts.medium})`
                    : `High Risk (${filterCounts.riskCounts.high})`
            }
            open={riskDropdownOpen}
            onOpenChange={setRiskDropdownOpen}
            position="bottom-left"
          >
            <DropdownItem checked={riskFilter === 'all'} onPress={() => { setRiskFilter('all'); setRiskDropdownOpen(false); }}>
              All Risk Levels ({filterCounts.total})
            </DropdownItem>
            <DropdownItem checked={riskFilter === 'low'} onPress={() => { setRiskFilter('low'); setRiskDropdownOpen(false); }}>
              Low Risk ({filterCounts.riskCounts.low})
            </DropdownItem>
            <DropdownItem checked={riskFilter === 'medium'} onPress={() => { setRiskFilter('medium'); setRiskDropdownOpen(false); }}>
              Medium Risk ({filterCounts.riskCounts.medium})
            </DropdownItem>
            <DropdownItem checked={riskFilter === 'high'} onPress={() => { setRiskFilter('high'); setRiskDropdownOpen(false); }}>
              High Risk ({filterCounts.riskCounts.high})
            </DropdownItem>
          </CustomDropdown>

          <CustomDropdown
            triggerText={
              complianceFilter === 'all'
                ? `All Compliance (${filterCounts.total})`
                : complianceFilter === 'compliant'
                  ? `Compliant 90%+ (${filterCounts.complianceCounts.compliant})`
                  : complianceFilter === 'warning'
                    ? `Warning 70-89% (${filterCounts.complianceCounts.warning})`
                    : `Critical <70% (${filterCounts.complianceCounts.critical})`
            }
            open={complianceDropdownOpen}
            onOpenChange={setComplianceDropdownOpen}
            position="bottom-left"
          >
            <DropdownItem checked={complianceFilter === 'all'} onPress={() => { setComplianceFilter('all'); setComplianceDropdownOpen(false); }}>
              All Compliance ({filterCounts.total})
            </DropdownItem>
            <DropdownItem checked={complianceFilter === 'compliant'} onPress={() => { setComplianceFilter('compliant'); setComplianceDropdownOpen(false); }}>
              Compliant 90%+ ({filterCounts.complianceCounts.compliant})
            </DropdownItem>
            <DropdownItem checked={complianceFilter === 'warning'} onPress={() => { setComplianceFilter('warning'); setComplianceDropdownOpen(false); }}>
              Warning 70-89% ({filterCounts.complianceCounts.warning})
            </DropdownItem>
            <DropdownItem checked={complianceFilter === 'critical'} onPress={() => { setComplianceFilter('critical'); setComplianceDropdownOpen(false); }}>
              Critical &lt;70% ({filterCounts.complianceCounts.critical})
            </DropdownItem>
          </CustomDropdown>

          <CustomDropdown
            triggerText={
              expiringFilter === 'all'
                ? `All Policies (${filterCounts.total})`
                : expiringFilter === '30'
                  ? `Expiring 30 days (${filterCounts.expiringCounts['30']})`
                  : expiringFilter === '60'
                    ? `Expiring 60 days (${filterCounts.expiringCounts['60']})`
                    : `Expiring 90 days (${filterCounts.expiringCounts['90']})`
            }
            open={expiringDropdownOpen}
            onOpenChange={setExpiringDropdownOpen}
            position="bottom-left"
          >
            <DropdownItem checked={expiringFilter === 'all'} onPress={() => { setExpiringFilter('all'); setExpiringDropdownOpen(false); }}>
              All Policies ({filterCounts.total})
            </DropdownItem>
            <DropdownItem checked={expiringFilter === '30'} onPress={() => { setExpiringFilter('30'); setExpiringDropdownOpen(false); }}>
              Expiring 30 days ({filterCounts.expiringCounts['30']})
            </DropdownItem>
            <DropdownItem checked={expiringFilter === '60'} onPress={() => { setExpiringFilter('60'); setExpiringDropdownOpen(false); }}>
              Expiring 60 days ({filterCounts.expiringCounts['60']})
            </DropdownItem>
            <DropdownItem checked={expiringFilter === '90'} onPress={() => { setExpiringFilter('90'); setExpiringDropdownOpen(false); }}>
              Expiring 90 days ({filterCounts.expiringCounts['90']})
            </DropdownItem>
          </CustomDropdown>

          <CustomDropdown
            triggerText={
              sortOption === 'default'
                ? 'Sort by: Default'
                : sortOption === 'most-subs'
                  ? 'Sort by: Most Subcontractors'
                  : sortOption === 'lowest-compliance'
                    ? 'Sort by: Lowest Compliance'
                    : 'Sort by: Recent Activity'
            }
            open={sortDropdownOpen}
            onOpenChange={setSortDropdownOpen}
            position="bottom-left"
          >
            <DropdownItem checked={sortOption === 'default'} onPress={() => { setSortOption('default'); setSortDropdownOpen(false); }}>
              Sort by: Default
            </DropdownItem>
            <DropdownItem checked={sortOption === 'most-subs'} onPress={() => { setSortOption('most-subs'); setSortDropdownOpen(false); }}>
              Most Subcontractors
            </DropdownItem>
            <DropdownItem checked={sortOption === 'lowest-compliance'} onPress={() => { setSortOption('lowest-compliance'); setSortDropdownOpen(false); }}>
              Lowest Compliance
            </DropdownItem>
            <DropdownItem checked={sortOption === 'recent-activity'} onPress={() => { setSortOption('recent-activity'); setSortDropdownOpen(false); }}>
              Recent Activity
            </DropdownItem>
          </CustomDropdown>

          <Button
            variant="outlined"
            color="primary"
            size="md"
            onPress={() => {
              setSearchTerm('');
              setRiskFilter('all');
              setComplianceFilter('all');
              setExpiringFilter('all');
              if (controlledClientTypeFilter === undefined) {
                setInternalClientTypeFilter('all');
              }
              onFilterChange?.('all');
              setSortOption('default');
              setRiskDropdownOpen(false);
              setComplianceDropdownOpen(false);
              setExpiringDropdownOpen(false);
              setSortDropdownOpen(false);
            }}
          >
            Clear Filters
          </Button>
        </Row>
      </Stack>

      {filteredClients.length === 0 ? (
        <Stack alignItems="center" style={{ paddingTop: 48, paddingBottom: 48 }}>
          <Text muted>
            No clients found matching your filters
          </Text>
        </Stack>
      ) : (
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: tableMinWidth }}>
            <thead style={{ backgroundColor: 'var(--color-gray-2)' }}>
              <tr>
                <th
                  scope="col"
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'var(--color-gray-11)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: 250,
                  }}
                >
                  Client
                </th>
                <th
                  scope="col"
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'var(--color-gray-11)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: 100,
                  }}
                >
                  Type
                </th>
                {clientTypeFilter !== 'subcontractor' && (
                  <th
                    scope="col"
                    style={{
                      padding: '12px 24px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: 'var(--color-gray-11)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      width: 120,
                    }}
                  >
                    Subs Compliant
                  </th>
                )}
                <th
                  scope="col"
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'var(--color-gray-11)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: 100,
                  }}
                >
                  Risk Score
                </th>
                <th
                  scope="col"
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'var(--color-gray-11)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: 100,
                  }}
                >
                  Open Items
                </th>
                <th
                  scope="col"
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'var(--color-gray-11)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: 120,
                  }}
                >
                  Next Renewal
                </th>
                <th
                  scope="col"
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'var(--color-gray-11)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: 120,
                  }}
                >
                  Compliance
                </th>
                {brokerCounts && (
                  <th
                    scope="col"
                    style={{
                      padding: '12px 24px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: 'var(--color-gray-11)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      width: 100,
                    }}
                  >
                    Brokers
                  </th>
                )}
                <th
                  scope="col"
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'var(--color-gray-11)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: 120,
                  }}
                >
                  Last Activity
                </th>
                <th
                  scope="col"
                  style={{
                    padding: '12px 24px',
                    textAlign: 'right',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'var(--color-gray-11)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: 100,
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => {
                const isGC = client.client_type === 'general_contractor';
                const initials = (client.company_name || '')
                  .split(' ')
                  .map((n) => n[0] || '')
                  .join('')
                  .substring(0, 2) || '??';
                const riskStyle = getRiskChipStyle(client.risk_level);
                const score = client.compliance_score ?? 0;
                const progressColor = score >= 90 ? 'success' : score >= 70 ? 'primary' : 'error';
                const fillColor = getComplianceColor(score);
                const stats = gcSubStats.get(client.id);
                const brokerInfo = brokerCounts?.get(client.id);

                return (
                  <tr
                    key={client.id}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer',
                    }}
                    onClick={() => onClientClick?.(client)}
                  >
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar
                          size={40}
                          color={isGC ? 'primary' : 'info'}
                          initials={initials}
                        />
                        <div>
                          <Link
                            to={`/broker/clients/${client.id}`}
                            style={{
                              fontSize: 14,
                              fontWeight: 500,
                              color: 'var(--color-blue-10)',
                              textDecoration: 'none',
                              display: 'block',
                            }}
                            onClick={(e) => {
                              e?.stopPropagation();
                              onClientClick?.(client);
                            }}
                            data-testid="client-name-link"
                          >
                            {client.company_name}
                          </Link>
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                            {client.contact_email || client.contact_name || 'No contact info'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <Chip
                        size="sm"
                        type="default"
                        style={{
                          backgroundColor: isGC ? 'var(--color-purple-2)' : 'var(--color-blue-2)',
                        }}
                        textStyle={{
                          color: isGC ? 'var(--color-purple-11)' : 'var(--color-blue-11)',
                        }}
                      >
                        {getClientTypeBadge(client)}
                      </Chip>
                    </td>
                    {clientTypeFilter !== 'subcontractor' && (
                      <td style={{ padding: '16px 24px' }}>
                        {!isGC ? (
                          <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>-</span>
                        ) : !stats || stats.totalSubs === 0 ? (
                          <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>No subs</span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Users size={16} style={{ color: 'var(--color-text-muted)' }} />
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 500,
                                color: stats.compliancePercent >= 80
                                  ? 'var(--color-green-10)'
                                  : stats.compliancePercent >= 50
                                    ? 'var(--color-yellow-10)'
                                    : 'var(--color-red-10)',
                              }}
                            >
                              {stats.compliantSubs}/{stats.totalSubs} ({stats.compliancePercent}%)
                            </span>
                          </div>
                        )}
                      </td>
                    )}
                    <td style={{ padding: '16px 24px' }}>
                      <Chip
                        size="sm"
                        type="default"
                        style={{
                          backgroundColor: riskStyle.backgroundColor,
                          borderColor: riskStyle.borderColor,
                          borderWidth: 1,
                        }}
                        textStyle={{ color: riskStyle.color }}
                      >
                        {client.risk_level}
                      </Chip>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>
                        {getOpenItemsCount(client.id)}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={14} style={{ color: 'var(--color-text-muted)' }} />
                        <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
                          {getNextRenewal(client.id)}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ProgressBarBase
                          value={score}
                          color={progressColor}
                          style={{ width: 64, height: 8 }}
                          fillStyle={{ backgroundColor: fillColor }}
                        />
                        <span style={{ fontSize: 14, fontWeight: 500 }}>
                          {score}%
                        </span>
                      </div>
                    </td>
                    {brokerCounts && (
                      <td style={{ padding: '16px 24px' }}>
                        {!brokerInfo || brokerInfo.brokerCount === 0 ? (
                          <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>-</span>
                        ) : brokerInfo.hasMultipleBrokers ? (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              backgroundColor: 'var(--color-orange-2)',
                              paddingLeft: 8,
                              paddingRight: 8,
                              paddingTop: 4,
                              paddingBottom: 4,
                              borderRadius: 4,
                            }}
                          >
                            <Shield size={14} style={{ color: 'var(--color-orange-10)' }} />
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: 'var(--color-orange-11)',
                              }}
                            >
                              {brokerInfo.brokerCount}
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Shield size={14} style={{ color: 'var(--color-text-muted)' }} />
                            <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>1</span>
                          </div>
                        )}
                      </td>
                    )}
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MessageSquare size={14} style={{ color: 'var(--color-text-muted)' }} />
                        <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
                          {client.last_activity_at ? formatDistanceToNow(client.last_activity_at) : 'No activity'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        iconEnd={ChevronRight}
                        onPress={() => {
                          onClientClick?.(client);
                        }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
