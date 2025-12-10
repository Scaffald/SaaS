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
      <div className="space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <div className="text-center py-16 bg-surface rounded-lg border border-border">
          <Building className="mx-auto text-error-500 mb-4" size={64} />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            GC Not Found
          </h3>
          <p className="text-text-secondary">
            The General Contractor you're looking for doesn't exist or has been deleted.
          </p>
        </div>
      </div>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/broker/clients')}
            leftIcon={ArrowLeft}
            size="sm"
          >
            Back to Clients
          </Button>
        </div>
      </div>

      {/* GC Profile Header */}
      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
              <Building className="text-primary-600" size={32} />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-text-primary">
                  {gc.company_name}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    stats.avgScore >= 80
                      ? 'bg-success-100 text-success-700'
                      : stats.avgScore >= 50
                      ? 'bg-warning-100 text-warning-700'
                      : 'bg-error-100 text-error-700'
                  }`}
                >
                  {stats.avgScore}% Compliant
                </span>
              </div>
              <p className="text-text-secondary mt-1">{gc.address}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-text-secondary">
                {gc.phone && <span>{gc.phone}</span>}
                {gc.email && <span>{gc.email}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 border-t border-border">
          <div className="p-4 text-center border-r border-border">
            <div className="flex items-center justify-center space-x-2 text-primary-600">
              <Users size={18} />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
            <p className="text-sm text-text-secondary mt-1">Total Subcontractors</p>
          </div>
          <div className="p-4 text-center border-r border-border">
            <div className="flex items-center justify-center space-x-2 text-success-600">
              <Shield size={18} />
              <span className="text-2xl font-bold">{stats.compliant}</span>
            </div>
            <p className="text-sm text-text-secondary mt-1">Compliant</p>
          </div>
          <div className="p-4 text-center border-r border-border">
            <div className="flex items-center justify-center space-x-2 text-warning-600">
              <Shield size={18} />
              <span className="text-2xl font-bold">{stats.atRisk}</span>
            </div>
            <p className="text-sm text-text-secondary mt-1">At Risk</p>
          </div>
          <div className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2 text-text-primary">
              <FileText size={18} />
              <span className="text-2xl font-bold">{stats.active}</span>
            </div>
            <p className="text-sm text-text-secondary mt-1">Active</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary" size={18} />
          <input
            type="text"
            placeholder="Search subcontractors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter size={18} className="text-text-tertiary" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={complianceFilter}
            onChange={(e) => setComplianceFilter(e.target.value as ComplianceFilter)}
            className="px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Compliance</option>
            <option value="compliant">Compliant</option>
            <option value="at-risk">At Risk</option>
            <option value="non-compliant">Non-Compliant</option>
          </select>
        </div>
      </div>

      {/* Subcontractors Table */}
      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            Subcontractors ({filteredSubcontractors.length})
          </h2>
        </div>

        {filteredSubcontractors.length === 0 ? (
          <div className="text-center py-16">
            <Users className="mx-auto text-text-tertiary mb-4" size={48} />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              No Subcontractors Found
            </h3>
            <p className="text-text-secondary">
              {searchQuery || statusFilter !== 'all' || complianceFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'This GC has no assigned subcontractors yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-bg-secondary text-left text-sm font-medium text-text-secondary">
                  <th className="px-3 py-3 w-10"></th>
                  <th className="px-6 py-3">Subcontractor</th>
                  <th className="px-6 py-3">Score</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Pending Items</th>
                  <th className="px-6 py-3">Projects</th>
                  <th className="px-6 py-3">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSubcontractors.map((sub) => {
                  const isExpanded = expandedRowId === sub.id;
                  return (
                    <React.Fragment key={sub.id}>
                      {/* Main Row */}
                      <tr
                        className={`hover:bg-bg-secondary cursor-pointer transition-colors ${
                          isExpanded ? 'bg-bg-secondary' : ''
                        }`}
                        onClick={() => handleRowClick(sub.id)}
                        data-testid="subcontractor-row"
                      >
                        {/* Expand Indicator */}
                        <td className="px-3 py-4">
                          <ChevronDown
                            size={18}
                            className={`text-text-tertiary transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                            data-testid="expand-icon"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <Building className="text-primary-600" size={20} />
                            </div>
                            <div>
                              <p className="font-medium text-text-primary">{sub.name}</p>
                              <p className="text-sm text-text-secondary">{sub.company}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-lg font-bold ${
                              sub.complianceScore >= 80
                                ? 'text-success-600'
                                : sub.complianceScore >= 50
                                ? 'text-warning-600'
                                : 'text-error-600'
                            }`}
                          >
                            {sub.complianceScore}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              sub.complianceStatus === 'compliant'
                                ? 'bg-success-100 text-success-700'
                                : sub.complianceStatus === 'at-risk'
                                ? 'bg-warning-100 text-warning-700'
                                : 'bg-error-100 text-error-700'
                            }`}
                          >
                            {sub.complianceStatus === 'compliant'
                              ? 'Compliant'
                              : sub.complianceStatus === 'at-risk'
                              ? 'At Risk'
                              : 'Non-Compliant'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {sub.pendingItems > 0 ? (
                            <span className="inline-flex items-center px-2 py-1 rounded bg-warning-100 text-warning-700 text-sm">
                              {sub.pendingItems} pending
                            </span>
                          ) : (
                            <span className="text-text-tertiary">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-text-secondary">{sub.projects.length}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-text-secondary text-sm">
                            {sub.lastActivity
                              ? new Date(sub.lastActivity).toLocaleDateString()
                              : '-'}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded Card Row */}
                      <tr
                        className={`transition-all duration-200 ease-in-out ${
                          isExpanded ? 'opacity-100' : 'opacity-0 hidden'
                        }`}
                        data-testid="expanded-card"
                      >
                        <td colSpan={7} className="px-6 py-0">
                          <div
                            className={`overflow-hidden transition-all duration-200 ease-in-out ${
                              isExpanded ? 'max-h-96 py-4' : 'max-h-0'
                            }`}
                          >
                            <div className="bg-bg-secondary rounded-lg p-6 border border-border">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {/* Compliance Score */}
                                <div>
                                  <div className="flex items-center space-x-2 text-text-secondary text-sm mb-2">
                                    <Shield size={16} />
                                    <span>Compliance Score</span>
                                  </div>
                                  <div
                                    className={`text-3xl font-bold ${
                                      sub.complianceScore >= 80
                                        ? 'text-success-600'
                                        : sub.complianceScore >= 50
                                        ? 'text-warning-600'
                                        : 'text-error-600'
                                    }`}
                                  >
                                    {sub.complianceScore}%
                                  </div>
                                </div>

                                {/* Recent Documents */}
                                <div>
                                  <div className="flex items-center space-x-2 text-text-secondary text-sm mb-2">
                                    <FileText size={16} />
                                    <span>Recent Documents</span>
                                  </div>
                                  {sub.recentDocuments.length > 0 ? (
                                    <ul className="space-y-1">
                                      {sub.recentDocuments.slice(0, 3).map((doc) => (
                                        <li key={doc.id} className="text-sm text-text-primary">
                                          {doc.name}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <span className="text-sm text-text-tertiary">No recent documents</span>
                                  )}
                                </div>

                                {/* Active Status */}
                                <div>
                                  <div className="flex items-center space-x-2 text-text-secondary text-sm mb-2">
                                    <Clock size={16} />
                                    <span>Active Status</span>
                                  </div>
                                  <span
                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${
                                      sub.status === 'active'
                                        ? 'bg-success-100 text-success-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    {sub.status === 'active' ? 'Active' : 'Inactive'}
                                  </span>
                                </div>

                                {/* Notes */}
                                <div>
                                  <div className="flex items-center space-x-2 text-text-secondary text-sm mb-2">
                                    <StickyNote size={16} />
                                    <span>Notes</span>
                                  </div>
                                  <p className="text-sm text-text-primary">
                                    {sub.notes || 'No notes available'}
                                  </p>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center space-x-3 mt-6 pt-4 border-t border-border">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  leftIcon={Eye}
                                  onClick={(e) => handleViewFullProfile(e, sub.id)}
                                  data-testid="view-profile-btn"
                                >
                                  View Full Profile
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  leftIcon={StickyNote}
                                  onClick={(e) => handleAddNote(e, sub.id)}
                                  data-testid="add-note-btn"
                                >
                                  Add Note
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  leftIcon={MessageSquare}
                                  onClick={(e) => handleSendMessage(e, sub.id)}
                                  data-testid="send-message-btn"
                                >
                                  Send Message
                                </Button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
