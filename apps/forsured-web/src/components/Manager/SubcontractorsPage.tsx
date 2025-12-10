import React, { useState, useMemo, useEffect } from 'react';
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
import EmptyState from '../../ui/EmptyState';
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

  const getStatusColor = (status: 'compliant' | 'warning' | 'critical') => {
    switch (status) {
      case 'compliant':
        return 'border-success-200 bg-success-50';
      case 'warning':
        return 'border-warning-200 bg-warning-50';
      case 'critical':
        return 'border-error-200 bg-error-50';
    }
  };

  const getStatusIcon = (status: 'compliant' | 'warning' | 'critical') => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="text-success-600" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-warning-600" size={20} />;
      case 'critical':
        return <AlertTriangle className="text-error-600" size={20} />;
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="text-text-secondary">Loading subcontractors...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="mx-auto text-error-500 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Failed to load subcontractors
          </h3>
          <p className="text-text-secondary">{error.message}</p>
        </div>
      </div>
    );
  }

  // Show empty state when no subcontractors exist
  if (subcontractors.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary">
            Subcontractors
          </h1>
          <p className="text-text-secondary text-lg mt-1">
            Manage your project subcontractors
          </p>
        </div>
        <EmptyState
          icon={UserPlus}
          title="No Subcontractors Yet"
          description="Invite subcontractors to your projects to track their compliance and insurance requirements."
          action={{
            label: 'Add Subcontractor',
            onClick: () => navigate('/manager/subcontractors/new'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary">
            Subcontractors
          </h1>
          <p className="text-text-secondary text-lg mt-1">
            Manage {subcontractors.length} subcontractors across your projects
          </p>
        </div>
        <Button variant="primary" icon={Plus}>
          Add Subcontractor
        </Button>
      </div>

      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-success-500"></div>
          <span className="font-semibold text-text-primary">
            {statusCounts.compliant}
          </span>
          <span className="text-text-secondary">Compliant</span>
        </div>
        <div className="h-4 w-px bg-border"></div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-warning-500"></div>
          <span className="font-semibold text-text-primary">
            {statusCounts.warning}
          </span>
          <span className="text-text-secondary">Issues</span>
        </div>
        <div className="h-4 w-px bg-border"></div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-error-500"></div>
          <span className="font-semibold text-text-primary">
            {statusCounts.critical}
          </span>
          <span className="text-text-secondary">Critical</span>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-sm border border-border p-4 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary"
              size={20}
            />
            <input
              type="text"
              placeholder="Search subcontractors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
              showFilters
                ? 'bg-primary-50 border-primary-500 text-primary-700'
                : 'bg-surface border-border text-text-secondary hover:bg-bg-secondary'
            }`}
          >
            <Filter size={18} />
            <span>Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="border-t border-border pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) =>
                    setSelectedStatus(e.target.value as ComplianceStatus)
                  }
                  className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="compliant">Compliant</option>
                  <option value="warning">Has Issues</option>
                  <option value="critical">Critical Issues</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Sort By
                </label>
                <div className="flex space-x-2">
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(
                        e.target.value as 'name' | 'compliance' | 'issues'
                      )
                    }
                    className="flex-1 px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="name">Name</option>
                    <option value="compliance">Compliance Score</option>
                    <option value="issues">Issues</option>
                  </select>
                  <button
                    onClick={() =>
                      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                    }
                    className="p-2 border border-border rounded-lg hover:bg-bg-secondary transition-colors"
                  >
                    <ChevronDown
                      size={16}
                      className={`text-text-secondary transform transition-transform ${
                        sortOrder === 'desc' ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-sm text-text-secondary">
          Showing{' '}
          <span className="font-semibold text-text-primary">
            {filteredAndSortedSubs.length}
          </span>{' '}
          of {subcontractors.length} subcontractors
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedSubs.map((sub) => (
          <div
            key={sub.id}
            onClick={() => setSelectedSubcontractor(sub.id)}
            className={`bg-surface rounded-lg shadow-sm border-2 ${getStatusColor(sub.complianceStatus)} hover:border-primary-300 transition-all cursor-pointer group`}
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-text-primary group-hover:text-primary-600 transition-colors mb-1">
                    {sub.company_name}
                  </h3>
                  <p className="text-sm text-text-tertiary">{sub.trade_type}</p>
                </div>
                {getStatusIcon(sub.complianceStatus)}
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-text-tertiary">
                    Compliance Score
                  </span>
                  <span className="text-xs font-semibold text-text-primary">
                    {Math.round(sub.compliance_score)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      sub.compliance_score >= 90
                        ? 'bg-success-500'
                        : sub.compliance_score >= 70
                          ? 'bg-warning-500'
                          : 'bg-error-500'
                    }`}
                    style={{ width: `${sub.compliance_score}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-2 bg-bg-secondary rounded">
                  <div className="text-lg font-bold text-text-primary capitalize">
                    {sub.risk_level}
                  </div>
                  <div className="text-xs text-text-tertiary">Risk Level</div>
                </div>
                <div className="p-2 bg-bg-secondary rounded">
                  <div className={`text-lg font-bold capitalize ${
                    sub.status === 'active' ? 'text-success-600' : 'text-text-secondary'
                  }`}>
                    {sub.status}
                  </div>
                  <div className="text-xs text-text-tertiary">Status</div>
                </div>
              </div>

              {sub.contact_name && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center space-x-2">
                    <Users size={14} className="text-text-tertiary" />
                    <span className="text-xs text-text-secondary">
                      {sub.contact_name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedSubs.length === 0 && (
        <div className="text-center py-16 bg-surface rounded-lg border border-border">
          <Building className="mx-auto text-text-tertiary mb-4" size={64} />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            No subcontractors found
          </h3>
          <p className="text-text-secondary">
            Try adjusting your filters or search criteria
          </p>
        </div>
      )}

      <SubcontractorDetailModal
        subcontractorId={selectedSubcontractor}
        isOpen={!!selectedSubcontractor}
        onClose={() => setSelectedSubcontractor(null)}
      />
    </div>
  );
}
