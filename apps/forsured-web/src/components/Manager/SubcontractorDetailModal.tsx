import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Mail,
  Phone,
  Building,
  Calendar,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle,
  Upload,
  MessageSquare,
  UserX,
  UserCheck,
  Download,
  Eye,
  Clock,
  Filter,
  Loader2,
} from 'lucide-react';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import StatusBadge from '../Common/StatusBadge';
import Select from '../Common/Select';
import DocumentDetailModal from '../Document/DocumentDetailModal';
import { useAttachments } from '../../hooks/useAttachments';
import { useComplianceIssues } from '../../hooks/useComplianceIssues';
import { EntityType, SeverityLevel } from '../../types';
import { formatDate } from '../../utils/dateHelpers';
import { useMockDatabase } from '../../contexts/DatabaseContext';
import { toast } from 'sonner';

// Type definitions for database schema
interface Subcontractor {
  id: string;
  organization_id: string;
  company_name: string;
  contact_name: string;
  contact_info: {
    email: string;
    phone: string;
    address?: { street: string; city: string; state: string; zip: string };
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

interface Policy {
  id: string;
  subcontractor_id: string;
  policy_type: string;
  carrier: string;
  policy_number: string;
  effective_date: string;
  expiration_date: string;
  limits: Record<string, number>;
  status: string;
}

interface Project {
  id: string;
  name: string;
  compliance_status: string;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  organization_id: string;
}

interface SubcontractorDetailModalProps {
  subcontractorId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SubcontractorDetailModal({
  subcontractorId,
  isOpen,
  onClose,
}: SubcontractorDetailModalProps) {
  const db = useMockDatabase();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'policies' | 'documents' | 'issues'
  >('overview');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState('');
  const [documentFilter, setDocumentFilter] = useState<string>('all');
  const [documentStatusFilter, setDocumentStatusFilter] =
    useState<string>('all');
  const [issueStatusFilter, setIssueStatusFilter] = useState<string>('all');
  const [issueSeverityFilter, setIssueSeverityFilter] = useState<string>('all');
  const [selectedDocument, setSelectedDocument] = useState<{
    id: string;
    name: string;
    type: string;
    url?: string;
    uploadDate: string;
    expiryDate?: string;
    uploadedBy: string;
    status: string;
    fileSize?: string;
  } | null>(null);

  // Database state
  const [subcontractor, setSubcontractor] = useState<Subcontractor | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch subcontractor and related data
  useEffect(() => {
    async function fetchSubcontractorData() {
      if (!subcontractorId || !isOpen) return;
      setLoadingData(true);

      try {
        const [subResult, policiesResult, projectsResult, usersResult] = await Promise.all([
          db.from('subcontractors').select('*').eq('id', subcontractorId).single(),
          db.from('policies').select('*').eq('subcontractor_id', subcontractorId),
          db.from('projects').select('*'),
          db.from('users').select('*'),
        ]);

        if (subResult.error) throw subResult.error;
        if (policiesResult.error) throw policiesResult.error;
        if (projectsResult.error) throw projectsResult.error;
        if (usersResult.error) throw usersResult.error;

        setSubcontractor(subResult.data);
        setPolicies(policiesResult.data || []);
        setProjects(projectsResult.data || []);
        setUsers(usersResult.data || []);
      } catch (err) {
        const error = err as Error;
        toast.error(error.message || 'Failed to load subcontractor details');
      } finally {
        setLoadingData(false);
      }
    }

    fetchSubcontractorData();
  }, [db, subcontractorId, isOpen]);

  // Use hooks for documents and issues
  const { attachments: documents, loading: documentsLoading } = useAttachments({
    entityType: 'subcontractor' as EntityType,
    entityId: subcontractorId || '',
  });

  const {
    issues,
    loading: issuesLoading,
    updateIssue,
  } = useComplianceIssues({
    subcontractorId: subcontractorId || '',
  });

  // Filter users by subcontractor's organization
  const people = useMemo(() => {
    if (!subcontractor) return [];
    return users.filter(u => u.organization_id === subcontractor.organization_id);
  }, [subcontractor, users]);

  // Active policies for this subcontractor
  const activePolicies = useMemo(() => {
    return policies.filter(p => p.status === 'active');
  }, [policies]);

  // Use issues from hook, or empty array
  const allIssues = issues;

  if (!subcontractorId) return null;

  // Show loading while fetching data
  if (loadingData) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            <p className="text-text-secondary">Loading subcontractor details...</p>
          </div>
        </div>
      </Modal>
    );
  }

  if (!subcontractor) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="mx-auto text-error-500 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Subcontractor not found
            </h3>
            <p className="text-text-secondary">The requested subcontractor could not be loaded.</p>
          </div>
        </div>
      </Modal>
    );
  }

  const complianceScore = subcontractor.compliance_score;
  const hasActiveCoverage = activePolicies.length > 0;

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    if (documentFilter !== 'all' && doc.file_type !== documentFilter)
      return false;
    return true;
  });

  // Filter issues
  const filteredIssues = allIssues.filter((issue) => {
    if (issueStatusFilter !== 'all' && issue.status !== issueStatusFilter)
      return false;
    if (issueSeverityFilter !== 'all' && issue.severity !== issueSeverityFilter)
      return false;
    return true;
  });

  const getDaysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const days = Math.ceil(
      (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const getDocumentStatus = (doc: any) => {
    // This would be determined by the document metadata or expiry date
    if (doc.expiry_date) {
      const days = getDaysUntilExpiry(doc.expiry_date);
      if (days === null || days < 0) return 'expired';
      if (days <= 30) return 'expiring';
    }
    return 'verified';
  };

  const handleMarkIssueResolved = async (issueId: string) => {
    try {
      await updateIssue(issueId, { status: 'resolved' });
    } catch (error) {
      console.error('Failed to resolve issue:', error);
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log('Sending message:', message, 'to:', subcontractorId);
      setMessage('');
      setShowMessageModal(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-2xl font-bold text-text-primary">
                  {subcontractor.company_name}
                </h2>
                {hasActiveCoverage ? (
                  <span className="px-2.5 py-1 text-xs font-medium rounded bg-success-100 text-success-700">
                    Active Coverage
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-xs font-medium rounded bg-error-100 text-error-700">
                    No Coverage
                  </span>
                )}
              </div>
              <p className="text-text-secondary">
                {subcontractor.trade_type} · {subcontractor.status}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-text-primary">
                {complianceScore}%
              </div>
              <div className="text-xs text-text-tertiary">Compliance Score</div>
            </div>
          </div>

          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('policies')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'policies'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Policies ({activePolicies.length})
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'documents'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Documents ({documents.length})
            </button>
            <button
              onClick={() => setActiveTab('issues')}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === 'issues'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Issues
              {allIssues.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-error-500 text-white text-xs rounded-full">
                  {allIssues.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-bg-secondary rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <Building className="text-text-tertiary" size={20} />
                    <span className="text-sm text-text-tertiary">
                      Trade Type
                    </span>
                  </div>
                  <p className="text-base font-medium text-text-primary">
                    {subcontractor.trade_type}
                  </p>
                </div>

                <div className="p-4 bg-bg-secondary rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <Shield className="text-text-tertiary" size={20} />
                    <span className="text-sm text-text-tertiary">
                      Active Policies
                    </span>
                  </div>
                  <p className="text-base font-medium text-text-primary">
                    {activePolicies.length}
                  </p>
                </div>

                <div className="p-4 bg-bg-secondary rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <AlertTriangle className="text-text-tertiary" size={20} />
                    <span className="text-sm text-text-tertiary">
                      Open Issues
                    </span>
                  </div>
                  <p className="text-base font-medium text-text-primary">
                    {issues.length}
                  </p>
                </div>

                <div className="p-4 bg-bg-secondary rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <FileText className="text-text-tertiary" size={20} />
                    <span className="text-sm text-text-tertiary">Risk Level</span>
                  </div>
                  <p className="text-base font-medium text-text-primary capitalize">
                    {subcontractor.risk_level}
                  </p>
                </div>
              </div>

              {people.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-3">
                    Team Members
                  </h3>
                  <div className="space-y-2">
                    {people.map((person) => (
                      <div
                        key={person.id}
                        className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-white">
                              {person.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {person.name}
                            </p>
                            <p className="text-xs text-text-tertiary">
                              {person.email}
                            </p>
                          </div>
                        </div>
                        <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                          Contact
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {projects.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-3">
                    Projects
                  </h3>
                  <div className="space-y-2">
                    {projects.slice(0, 5).map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {project.name}
                          </p>
                          <p className="text-xs text-text-tertiary capitalize">
                            Status: {project.compliance_status}
                          </p>
                        </div>
                        <StatusBadge
                          status={
                            project.compliance_status === 'compliant' ? 'compliant' : 'warning'
                          }
                          size="sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'policies' && (
            <div className="space-y-3">
              {activePolicies.length > 0 ? (
                activePolicies.map((policy) => {
                  const expiryDate = new Date(policy.expiration_date);
                  const isExpiringSoon =
                    expiryDate.getTime() - Date.now() <
                    30 * 24 * 60 * 60 * 1000;

                  return (
                    <div
                      key={policy.id}
                      className="p-4 border border-border rounded-lg space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-text-primary capitalize">
                          {policy.policy_type.replace(/_/g, ' ')}
                        </h4>
                        {isExpiringSoon ? (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-warning-100 text-warning-700">
                            Expiring Soon
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-success-100 text-success-700">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-text-tertiary">Carrier</span>
                          <p className="font-medium text-text-primary">
                            {policy.carrier}
                          </p>
                        </div>
                        <div>
                          <span className="text-text-tertiary">
                            Policy Number
                          </span>
                          <p className="font-medium text-text-primary">
                            {policy.policy_number}
                          </p>
                        </div>
                        <div>
                          <span className="text-text-tertiary">
                            Effective Date
                          </span>
                          <p className="font-medium text-text-primary">
                            {new Date(policy.effective_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-text-tertiary">
                            Expiry Date
                          </span>
                          <p
                            className={`font-medium ${isExpiringSoon ? 'text-warning-600' : 'text-text-primary'}`}
                          >
                            {expiryDate.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {policy.limits && Object.keys(policy.limits).length > 0 && (
                        <div>
                          <span className="text-text-tertiary text-sm">
                            Coverage Limits
                          </span>
                          <div className="mt-1 space-y-1">
                            {Object.entries(policy.limits).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="flex justify-between text-sm"
                                >
                                  <span className="text-text-secondary capitalize">
                                    {key.replace(/_/g, ' ')}
                                  </span>
                                  <span className="font-medium text-text-primary">
                                    ${(value as number).toLocaleString()}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <Shield
                    className="mx-auto text-text-tertiary mb-3"
                    size={48}
                  />
                  <p className="text-text-secondary">
                    No active insurance policies
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex items-center space-x-3">
                <Select
                  value={documentFilter}
                  onChange={(e) => setDocumentFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Types' },
                    { value: 'application/pdf', label: 'PDF' },
                    { value: 'image', label: 'Images' },
                    { value: 'document', label: 'Documents' },
                  ]}
                />
                <Select
                  value={documentStatusFilter}
                  onChange={(e) => setDocumentStatusFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'verified', label: 'Verified' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'expiring', label: 'Expiring' },
                    { value: 'expired', label: 'Expired' },
                  ]}
                />
              </div>

              {documentsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                  <p className="text-text-secondary">Loading documents...</p>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <FileText
                    className="mx-auto text-text-tertiary mb-3"
                    size={48}
                  />
                  <p className="text-text-secondary mb-4">
                    No documents uploaded yet
                  </p>
                  <Button variant="primary" leftIcon={Upload}>
                    Request Document Upload
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDocuments.map((doc) => {
                    const status = getDocumentStatus(doc);
                    const daysUntilExpiry = getDaysUntilExpiry(doc.expiry_date);
                    const statusColors = {
                      verified: 'border-success-200 bg-success-50',
                      pending: 'border-warning-200 bg-warning-50',
                      expiring: 'border-warning-200 bg-warning-50',
                      expired: 'border-error-200 bg-error-50',
                    };

                    return (
                      <div
                        key={doc.id}
                        className={`p-4 border-l-4 rounded-lg ${statusColors[status] || 'border-border bg-bg-secondary'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <FileText
                                className="text-primary-600"
                                size={20}
                              />
                              <h4 className="font-semibold text-text-primary">
                                {doc.file_name}
                              </h4>
                              <span
                                className={`px-2 py-0.5 text-xs font-medium rounded ${
                                  status === 'verified'
                                    ? 'bg-success-100 text-success-700'
                                    : status === 'pending'
                                      ? 'bg-warning-100 text-warning-700'
                                      : status === 'expiring'
                                        ? 'bg-warning-100 text-warning-700'
                                        : 'bg-error-100 text-error-700'
                                }`}
                              >
                                {status.charAt(0).toUpperCase() +
                                  status.slice(1)}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm ml-8">
                              <div>
                                <span className="text-text-tertiary">
                                  Uploaded:
                                </span>
                                <p className="font-medium text-text-primary">
                                  {formatDate(doc.created_at)}
                                </p>
                              </div>
                              <div>
                                <span className="text-text-tertiary">
                                  Size:
                                </span>
                                <p className="font-medium text-text-primary">
                                  {doc.file_size
                                    ? `${(doc.file_size / 1024 / 1024).toFixed(2)} MB`
                                    : 'N/A'}
                                </p>
                              </div>
                              {doc.expiry_date && (
                                <div>
                                  <span className="text-text-tertiary">
                                    Expiry:
                                  </span>
                                  <p
                                    className={`font-medium ${daysUntilExpiry !== null && daysUntilExpiry <= 30 ? 'text-warning-600' : 'text-text-primary'}`}
                                  >
                                    {formatDate(doc.expiry_date)}
                                    {daysUntilExpiry !== null &&
                                      daysUntilExpiry <= 30 &&
                                      ` (${daysUntilExpiry} days)`}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setSelectedDocument({
                                  id: doc.id,
                                  name: doc.file_name,
                                  type: doc.file_type,
                                  url: doc.file_url,
                                  uploadDate: doc.created_at,
                                  uploadedBy: doc.uploaded_by,
                                  status,
                                  fileSize: doc.file_size
                                    ? `${(doc.file_size / 1024 / 1024).toFixed(2)} MB`
                                    : undefined,
                                })
                              }
                              leftIcon={Eye}
                            >
                              View
                            </Button>
                            {doc.file_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  window.open(doc.file_url, '_blank')
                                }
                                leftIcon={Download}
                              >
                                Download
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'issues' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex items-center space-x-3">
                <Select
                  value={issueStatusFilter}
                  onChange={(e) => setIssueStatusFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'open', label: 'Open' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'resolved', label: 'Resolved' },
                  ]}
                />
                <Select
                  value={issueSeverityFilter}
                  onChange={(e) => setIssueSeverityFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Severities' },
                    { value: 'critical', label: 'Critical' },
                    { value: 'high', label: 'High' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'low', label: 'Low' },
                  ]}
                />
              </div>

              {issuesLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                  <p className="text-text-secondary">Loading issues...</p>
                </div>
              ) : filteredIssues.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle
                    className="mx-auto text-success-600 mb-3"
                    size={48}
                  />
                  <p className="text-success-700 font-medium">
                    No compliance issues
                  </p>
                  <p className="text-text-secondary text-sm">
                    This subcontractor is fully compliant
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredIssues.map((issue) => {
                    const severityColors = {
                      critical: 'border-error-500 bg-error-50',
                      high: 'border-error-400 bg-error-50',
                      medium: 'border-warning-500 bg-warning-50',
                      low: 'border-warning-300 bg-warning-50',
                    };

                    const severityLabels = {
                      critical: 'CRITICAL',
                      high: 'HIGH',
                      medium: 'MEDIUM',
                      low: 'LOW',
                    };

                    return (
                      <div
                        key={issue.id}
                        className={`p-4 border-l-4 rounded-lg ${severityColors[issue.severity] || 'border-border bg-bg-secondary'}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle
                              className={`${
                                issue.severity === 'critical' ||
                                issue.severity === 'high'
                                  ? 'text-error-600'
                                  : 'text-warning-600'
                              }`}
                              size={18}
                            />
                            <h4 className="font-semibold text-text-primary">
                              {issue.title}
                            </h4>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded ${
                                issue.severity === 'critical'
                                  ? 'bg-error-200 text-error-900'
                                  : issue.severity === 'high'
                                    ? 'bg-error-200 text-error-900'
                                    : issue.severity === 'medium'
                                      ? 'bg-warning-200 text-warning-900'
                                      : 'bg-warning-100 text-warning-800'
                              }`}
                            >
                              {severityLabels[issue.severity]}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded ${
                                issue.status === 'open'
                                  ? 'bg-primary-100 text-primary-700'
                                  : issue.status === 'in_progress'
                                    ? 'bg-warning-100 text-warning-700'
                                    : 'bg-success-100 text-success-700'
                              }`}
                            >
                              {issue.status.charAt(0).toUpperCase() +
                                issue.status.slice(1).replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-text-secondary mb-3 ml-6">
                          {issue.description}
                        </p>
                        <div className="flex items-center justify-between ml-6">
                          <div className="text-xs text-text-tertiary">
                            <span>
                              Type: {issue.issue_type.replace('_', ' ')}
                            </span>
                            <span className="ml-3">
                              Created: {formatDate(issue.created_at)}
                            </span>
                          </div>
                          {issue.status === 'open' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkIssueResolved(issue.id)}
                            >
                              Mark Resolved
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-3 pt-4 border-t border-border">
            <Button
              variant="secondary"
              onClick={() => setShowMessageModal(true)}
              leftIcon={MessageSquare}
              className="flex-1"
            >
              Send Message
            </Button>
            <Button variant="secondary" leftIcon={FileText} className="flex-1">
              View Full Profile
            </Button>
            {allIssues.length > 0 ? (
              <Button variant="danger" leftIcon={UserX} className="flex-1">
                Restrict Access
              </Button>
            ) : (
              <Button variant="success" leftIcon={UserCheck} className="flex-1">
                Approve
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Document Detail Modal */}
      {selectedDocument && (
        <DocumentDetailModal
          documentId={selectedDocument.id}
          documentName={selectedDocument.name}
          documentType={selectedDocument.type}
          documentUrl={selectedDocument.url}
          uploadDate={selectedDocument.uploadDate}
          expiryDate={selectedDocument.expiryDate}
          uploadedBy={selectedDocument.uploadedBy}
          status={selectedDocument.status}
          fileSize={selectedDocument.fileSize}
          isOpen={!!selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}

      <Modal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        title="Send Message"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Message to {subcontractor.company_name}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Type your message here..."
              className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowMessageModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSendMessage}
              className="flex-1"
            >
              Send Message
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
