import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  Building,
  AlertTriangle,
  CheckCircle,
  Users,
  ChevronDown,
  Loader2,
  UserPlus,
} from 'lucide-react';
import { EmptyState, YStack, XStack, Text, H1, H2, H3, Card, Spinner, Circle } from '@unicornlove/ui';
import Button from '../Common/Button';
import SubcontractorDetailModal from './SubcontractorDetailModal';
import { useMockDatabase } from '../../contexts/DatabaseContext';
import { toast } from 'sonner';

type ComplianceStatus = 'compliant' | 'warning' | 'critical' | 'all';

interface Subcontractor {
  id: string;
  organization_id: string;
  company_name: string;
  contact_name: string;
  contact_info: {
    email: string;
    phone: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
  };
  trade_type: string;
  license_number: string;
  status: string;
  compliance_score: number;
  risk_level: string;
  last_activity_at: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function SubcontractorsPage() {
  const db = useMockDatabase();
  const navigate = useNavigate();

  // State for data fetching
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ComplianceStatus>('all');
  const [sortBy, setSortBy] = useState<'name' | 'compliance' | 'issues'>(
    'name'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<
    string | null
  >(null);

  // Fetch subcontractors from database on mount
  useEffect(() => {
    async function fetchSubcontractors() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await db
          .from('subcontractors')
          .select('*')
          .order('company_name', { ascending: true });

        if (queryError) {
          throw queryError;
        }

        setSubcontractors(data || []);
      } catch (err) {
        const error = err as Error;
        setError(error);
        toast.error(error.message || 'Failed to load subcontractors');
      } finally {
        setLoading(false);
      }
    }

    fetchSubcontractors();
  }, [db]);

  // Derive compliance status from compliance_score
  const subcontractorsWithStatus = useMemo(() => {
    return subcontractors.map((sub) => {
      let complianceStatus: 'compliant' | 'warning' | 'critical';
      if (sub.risk_level === 'critical' || sub.compliance_score < 60) {
        complianceStatus = 'critical';
      } else if (sub.risk_level === 'medium' || sub.compliance_score < 80) {
        complianceStatus = 'warning';
      } else {
        complianceStatus = 'compliant';
      }

      return {
        ...sub,
        complianceStatus,
      };
    });
  }, [subcontractors]);

  const filteredAndSortedSubs = useMemo(() => {
    const filtered = subcontractorsWithStatus.filter((sub) => {
      const matchesSearch =
        searchQuery === '' ||
        sub.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.contact_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === 'all' || sub.complianceStatus === selectedStatus;

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'name') {
        comparison = a.company_name.localeCompare(b.company_name);
      } else if (sortBy === 'compliance') {
        comparison = b.compliance_score - a.compliance_score;
      } else if (sortBy === 'issues') {
        // Sort by risk level (critical > medium > low) then by compliance score
        const riskOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        comparison = (riskOrder[a.risk_level] ?? 4) - (riskOrder[b.risk_level] ?? 4);
        if (comparison === 0) {
          comparison = a.compliance_score - b.compliance_score;
        }
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [subcontractorsWithStatus, searchQuery, selectedStatus, sortBy, sortOrder]);

  const statusCounts = useMemo(() => {
    return {
      compliant: subcontractorsWithStatus.filter((s) => s.complianceStatus === 'compliant')
        .length,
      warning: subcontractorsWithStatus.filter((s) => s.complianceStatus === 'warning')
        .length,
      critical: subcontractorsWithStatus.filter((s) => s.complianceStatus === 'critical')
        .length,
    };
  }, [subcontractorsWithStatus]);

  const getStatusColorProps = (status: 'compliant' | 'warning' | 'critical') => {
    switch (status) {
      case 'compliant':
        return { borderColor: '$green8', backgroundColor: '$green2' };
      case 'warning':
        return { borderColor: '$orange8', backgroundColor: '$orange2' };
      case 'critical':
        return { borderColor: '$red8', backgroundColor: '$red2' };
    }
  };

  const getStatusIcon = (status: 'compliant' | 'warning' | 'critical') => {
    switch (status) {
      case 'compliant':
        return <CheckCircle color="$green10" size={20} />;
      case 'warning':
        return <AlertTriangle color="$orange10" size={20} />;
      case 'critical':
        return <AlertTriangle color="$red10" size={20} />;
    }
  };

  // Show loading state
  if (loading) {
    return (
      <YStack alignItems="center" justifyContent="center" minHeight={400}>
        <YStack alignItems="center" gap="$4">
          <Spinner size="large" color="$blue10" />
          <Text color="$color11">Loading subcontractors...</Text>
        </YStack>
      </YStack>
    );
  }

  // Show error state
  if (error) {
    return (
      <YStack alignItems="center" justifyContent="center" minHeight={400}>
        <YStack alignItems="center">
          <AlertTriangle color="$red10" size={48} marginBottom="$4" />
          <H3 fontSize="$6" fontWeight="600" color="$color12" marginBottom="$2">
            Failed to load subcontractors
          </H3>
          <Text color="$color11">{error.message}</Text>
        </YStack>
      </YStack>
    );
  }

  // Show empty state when no subcontractors exist
  if (subcontractors.length === 0) {
    return (
      <YStack gap="$6">
        <YStack>
          <H1 fontSize="$10" fontWeight="700" color="$color12" fontFamily="$heading">
            Subcontractors
          </H1>
          <Text color="$color11" fontSize="$6" marginTop="$1">
            Manage your project subcontractors
          </Text>
        </YStack>
        <EmptyState
          icon={UserPlus}
          title="No Subcontractors Yet"
          description="Invite subcontractors to your projects to track their compliance and insurance requirements."
          action={{
            label: 'Add Subcontractor',
            onClick: () => navigate('/manager/subcontractors/new'),
          }}
        />
      </YStack>
    );
  }

  return (
    <YStack gap="$6">
      <XStack alignItems="center" justifyContent="space-between">
        <YStack>
          <H1 fontSize="$10" fontWeight="700" color="$color12" fontFamily="$heading">
            Subcontractors
          </H1>
          <Text color="$color11" fontSize="$6" marginTop="$1">
            Manage {subcontractors.length} subcontractors across your projects
          </Text>
        </YStack>
        <Button variant="primary" icon={Plus}>
          Add Subcontractor
        </Button>
      </XStack>

      <XStack alignItems="center" gap="$4" fontSize="$3">
        <XStack alignItems="center" gap="$2">
          <Circle size={12} backgroundColor="$green10" />
          <Text fontWeight="600" color="$color12">
            {statusCounts.compliant}
          </Text>
          <Text color="$color11">Compliant</Text>
        </XStack>
        <YStack height={16} width={1} backgroundColor="$borderColor" />
        <XStack alignItems="center" gap="$2">
          <Circle size={12} backgroundColor="$orange10" />
          <Text fontWeight="600" color="$color12">
            {statusCounts.warning}
          </Text>
          <Text color="$color11">Issues</Text>
        </XStack>
        <YStack height={16} width={1} backgroundColor="$borderColor" />
        <XStack alignItems="center" gap="$2">
          <Circle size={12} backgroundColor="$red10" />
          <Text fontWeight="600" color="$color12">
            {statusCounts.critical}
          </Text>
          <Text color="$color11">Critical</Text>
        </XStack>
      </XStack>

      <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$4" elevation={1} gap="$4">
        <XStack alignItems="center" gap="$3">
          <YStack flex={1} position="relative">
            <YStack position="absolute" left="$3" top="50%" transform="translateY(-50%)" zIndex={1}>
              <Search
                color="$color10"
                size={20}
              />
            </YStack>
            <input
              type="text"
              placeholder="Search subcontractors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '40px',
                paddingRight: '16px',
                paddingTop: '10px',
                paddingBottom: '10px',
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px',
                color: 'var(--color-12)',
              }}
            />
          </YStack>
          <XStack
            onPress={() => setShowFilters(!showFilters)}
            alignItems="center"
            gap="$2"
            paddingHorizontal="$4"
            paddingVertical="$2.5"
            borderWidth={1}
            borderRadius="$4"
            fontSize="$3"
            fontWeight="500"
            backgroundColor={showFilters ? '$blue2' : '$background'}
            borderColor={showFilters ? '$blue10' : '$borderColor'}
            color={showFilters ? '$blue10' : '$color11'}
            hoverStyle={{ backgroundColor: '$backgroundHover' }}
            cursor="pointer"
          >
            <Filter size={18} />
            <Text fontSize="$3" fontWeight="500" color={showFilters ? '$blue10' : '$color11'}>
              Filters
            </Text>
          </XStack>
        </XStack>

        {showFilters && (
          <YStack borderTopWidth={1} borderColor="$borderColor" paddingTop="$4" gap="$4">
            <XStack flexWrap="wrap" gap="$4" $gtMd={{ flexWrap: 'wrap' }}>
              <YStack flex={1} minWidth="calc(50% - 8px)" $gtMd={{ minWidth: 'calc(50% - 8px)' }}>
                <Text
                  as="label"
                  display="block"
                  fontSize="$1"
                  fontWeight="500"
                  color="$color11"
                  marginBottom="$2"
                >
                  Status
                </Text>
                <select
                  value={selectedStatus}
                  onChange={(e) =>
                    setSelectedStatus(e.target.value as ComplianceStatus)
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: 'var(--color-12)',
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="compliant">Compliant</option>
                  <option value="warning">Has Issues</option>
                  <option value="critical">Critical Issues</option>
                </select>
              </YStack>

              <YStack flex={1} minWidth="calc(50% - 8px)" $gtMd={{ minWidth: 'calc(50% - 8px)' }}>
                <Text
                  as="label"
                  display="block"
                  fontSize="$1"
                  fontWeight="500"
                  color="$color11"
                  marginBottom="$2"
                >
                  Sort By
                </Text>
                <XStack gap="$2">
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(
                        e.target.value as 'name' | 'compliance' | 'issues'
                      )
                    }
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'var(--color-12)',
                    }}
                  >
                    <option value="name">Name</option>
                    <option value="compliance">Compliance Score</option>
                    <option value="issues">Issues</option>
                  </select>
                  <XStack
                    onPress={() =>
                      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                    }
                    padding="$2"
                    borderWidth={1}
                    borderColor="$borderColor"
                    borderRadius="$4"
                    hoverStyle={{ backgroundColor: '$backgroundHover' }}
                    cursor="pointer"
                  >
                    <ChevronDown
                      size={16}
                      color="$color11"
                      style={{
                        transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s',
                      }}
                    />
                  </XStack>
                </XStack>
              </YStack>
            </XStack>
          </YStack>
        )}

        <Text fontSize="$3" color="$color11">
          Showing{' '}
          <Text fontWeight="600" color="$color12">
            {filteredAndSortedSubs.length}
          </Text>{' '}
          of {subcontractors.length} subcontractors
        </Text>
      </Card>

      <XStack flexWrap="wrap" gap="$4" $gtMd={{ flexWrap: 'wrap' }} $gtLg={{ flexWrap: 'wrap' }}>
        {filteredAndSortedSubs.map((sub) => (
          <Card
            key={sub.id}
            onPress={() => setSelectedSubcontractor(sub.id)}
            borderWidth={2}
            {...getStatusColorProps(sub.complianceStatus)}
            hoverStyle={{ borderColor: '$blue8' }}
            cursor="pointer"
            borderRadius="$4"
            elevation={1}
            flex={1}
            minWidth="calc(100% - 16px)"
            $gtMd={{ minWidth: 'calc(50% - 8px)' }}
            $gtLg={{ minWidth: 'calc(33.333% - 11px)' }}
          >
            <YStack padding="$5">
              <XStack alignItems="flex-start" justifyContent="space-between" marginBottom="$3">
                <YStack flex={1}>
                  <H3 fontSize="$6" fontWeight="600" color="$color12" marginBottom="$1">
                    {sub.company_name}
                  </H3>
                  <Text fontSize="$3" color="$color10">{sub.trade_type}</Text>
                </YStack>
                {getStatusIcon(sub.complianceStatus)}
              </XStack>

              <YStack marginBottom="$4">
                <XStack alignItems="center" justifyContent="space-between" marginBottom="$1">
                  <Text fontSize="$1" color="$color10">
                    Compliance Score
                  </Text>
                  <Text fontSize="$1" fontWeight="600" color="$color12">
                    {Math.round(sub.compliance_score)}%
                  </Text>
                </XStack>
                <YStack width="100%" height={8} backgroundColor="$gray8" borderRadius={9999}>
                  <YStack
                    height="100%"
                    borderRadius={9999}
                    backgroundColor={
                      sub.compliance_score >= 90
                        ? '$green10'
                        : sub.compliance_score >= 70
                          ? '$orange10'
                          : '$red10'
                    }
                    width={`${sub.compliance_score}%`}
                  />
                </YStack>
              </YStack>

              <XStack flexWrap="wrap" gap="$3">
                <Card padding="$2" backgroundColor="$backgroundHover" borderRadius="$2" flex={1} minWidth="calc(50% - 6px)" alignItems="center">
                  <Text fontSize="$7" fontWeight="700" color="$color12" textTransform="capitalize">
                    {sub.risk_level}
                  </Text>
                  <Text fontSize="$1" color="$color10">Risk Level</Text>
                </Card>
                <Card padding="$2" backgroundColor="$backgroundHover" borderRadius="$2" flex={1} minWidth="calc(50% - 6px)" alignItems="center">
                  <Text
                    fontSize="$7"
                    fontWeight="700"
                    color={sub.status === 'active' ? '$green10' : '$color11'}
                    textTransform="capitalize"
                  >
                    {sub.status}
                  </Text>
                  <Text fontSize="$1" color="$color10">Status</Text>
                </Card>
              </XStack>

              {sub.contact_name && (
                <YStack marginTop="$3" paddingTop="$3" borderTopWidth={1} borderColor="$borderColor">
                  <XStack alignItems="center" gap="$2">
                    <Users size={14} color="$color10" />
                    <Text fontSize="$1" color="$color11">
                      {sub.contact_name}
                    </Text>
                  </XStack>
                </YStack>
              )}
            </YStack>
          </Card>
        ))}
      </XStack>

      {filteredAndSortedSubs.length === 0 && (
        <Card alignItems="center" paddingVertical="$16" backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor">
          <Building color="$color10" size={64} marginBottom="$4" />
          <H3 fontSize="$6" fontWeight="600" color="$color12" marginBottom="$2">
            No subcontractors found
          </H3>
          <Text color="$color11">
            Try adjusting your filters or search criteria
          </Text>
        </Card>
      )}

      <SubcontractorDetailModal
        subcontractorId={selectedSubcontractor}
        isOpen={!!selectedSubcontractor}
        onClose={() => setSelectedSubcontractor(null)}
      />
    </YStack>
  );
}
