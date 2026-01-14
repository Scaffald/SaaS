import { useState, useEffect, useMemo } from 'react';
import {
  Building,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle,
  Upload,
  Download,
  Eye,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { Stack, Row, Text, H2, H3, Card } from '@unicornlove/beyond-ui';
// Modal import removed - using simple overlay to avoid ResponsiveModal freeze issue
import Button from '../Common/Button';
import StatusBadge from '../Common/StatusBadge';
import Select from '../Common/Select';
import DocumentDetailModal from '../Document/DocumentDetailModal';
import { RiskBadge } from '../compliance/RiskBadge';
import type { RiskLevel } from '../../lib/compliance/riskCalculationService';
import { useAttachments } from '../../hooks/useAttachments';
import { useComplianceIssues } from '../../hooks/useComplianceIssues';
import { EntityType, SeverityLevel } from '../../types';
import { formatDate } from '../../utils/dateHelpers';
import { useDatabase } from '../../contexts/DatabaseContext';
import { toast } from 'sonner';

// Type definitions for database schema
// Database schema: name (contact person), company (company name)
interface Subcontractor {
  id: string;
  organization_id: string;
  name: string; // Contact person name (from DB)
  company: string; // Company name (from DB)
  // Legacy fields for compatibility - mapped from DB fields
  company_name: string; // Mapped from 'company'
  contact_name: string; // Mapped from 'name'
  contact_info: {
    email: string;
    phone: string;
    address?: { street: string; city: string; state: string; zip: string };
  };
  trade_type?: string;
  license_number?: string;
  status?: string;
  compliance_score?: number;
  risk_level?: string;
  last_activity_at?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
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
  const { forsured } = useDatabase();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'policies' | 'documents' | 'issues'
  >('overview');
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
        // Fetch subcontractor first - this is required
        const subResult = await forsured('subcontractors')
          .select('*')
          .eq('id', subcontractorId)
          .single();

        if (subResult.error) {
          console.error('[SubcontractorDetailModal] Error fetching subcontractor:', subResult.error);
          throw subResult.error;
        }

        // Map database fields to component interface
        const mappedSubcontractor = subResult.data ? {
          ...subResult.data,
          company_name: subResult.data.company || '',
          contact_name: subResult.data.name || '',
        } : null;

        setSubcontractor(mappedSubcontractor);

        // Fetch related data - these are optional, don't fail if they error
        try {
          const policiesResult = await forsured('insurance_policies')
            .select('*')
            .eq('subcontractor_id', subcontractorId);
          if (!policiesResult.error) {
            setPolicies(policiesResult.data || []);
          }
        } catch (e) {
          console.warn('[SubcontractorDetailModal] Could not fetch policies:', e);
        }

        try {
          const projectsResult = await forsured('projects').select('*');
          if (!projectsResult.error) {
            setProjects(projectsResult.data || []);
          }
        } catch (e) {
          console.warn('[SubcontractorDetailModal] Could not fetch projects:', e);
        }

        // Skip users query for now - it's not critical
        setUsers([]);

      } catch (err) {
        const error = err as Error;
        console.error('[SubcontractorDetailModal] Error:', error);
        toast.error(error.message || 'Failed to load subcontractor details');
      } finally {
        setLoadingData(false);
      }
    }

    fetchSubcontractorData();
  }, [forsured, subcontractorId, isOpen]);

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

  // Simple overlay wrapper for modal content
  const ModalOverlay = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <Card
        onPress={(e: React.MouseEvent) => e.stopPropagation()}
        data-testid="subcontractor-detail-modal"
        style={{
          backgroundColor: 'var(--color-background)',
          padding: 24,
          borderRadius: 12,
          width: 900,
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        {children}
      </Card>
    </div>
  );

  if (!isOpen) return null;

  // Show loading while fetching data
  if (loadingData) {
    return (
      <ModalOverlay>
        <Stack alignItems="center" justifyContent="center" style={{ minHeight: 400 }}>
          <Stack alignItems="center" gap={16}>
            <Loader2 size={32} color="var(--color-blue-10)" className="animate-spin" />
            <Text muted>Loading subcontractor details...</Text>
          </Stack>
        </Stack>
      </ModalOverlay>
    );
  }

  if (!subcontractor) {
    return (
      <ModalOverlay>
        <Stack alignItems="center" justifyContent="center" style={{ minHeight: 400 }}>
          <Stack alignItems="center">
            <div style={{ marginBottom: 16 }}>
              <AlertTriangle color="var(--color-red-10)" size={48} />
            </div>
            <H3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Subcontractor not found
            </H3>
            <Text muted>The requested subcontractor could not be loaded.</Text>
          </Stack>
        </Stack>
      </ModalOverlay>
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

  return (
    <>
      <ModalOverlay>
        <Stack gap={24}>
          <Row alignItems="flex-start" justifyContent="space-between">
            <Stack style={{ flex: 1 }}>
              <Row alignItems="center" gap={12} style={{ marginBottom: 8 }}>
                <H2 style={{ fontSize: 28, fontWeight: 700 }}>
                  {subcontractor.company_name}
                </H2>
                {hasActiveCoverage ? (
                  <span
                    style={{
                      paddingLeft: 10,
                      paddingRight: 10,
                      paddingTop: 4,
                      paddingBottom: 4,
                      fontSize: 12,
                      fontWeight: 500,
                      borderRadius: 8,
                      backgroundColor: 'var(--color-green-2)',
                      color: 'var(--color-green-10)',
                    }}
                  >
                    Active Coverage
                  </span>
                ) : (
                  <span
                    style={{
                      paddingLeft: 10,
                      paddingRight: 10,
                      paddingTop: 4,
                      paddingBottom: 4,
                      fontSize: 12,
                      fontWeight: 500,
                      borderRadius: 8,
                      backgroundColor: 'var(--color-red-2)',
                      color: 'var(--color-red-10)',
                    }}
                  >
                    No Coverage
                  </span>
                )}
              </Row>
              <Text muted>
                {subcontractor.trade_type} · {subcontractor.status}
              </Text>
            </Stack>
            <Stack alignItems="flex-end" gap={8} data-testid="compliance-header">
              <Text size="2xl" weight="bold">
                {complianceScore != null && !isNaN(complianceScore) ? `${complianceScore}%` : 'No data yet'}
              </Text>
              <Text size="xs" muted>Compliance Score</Text>
              {subcontractor.risk_level && (
                <RiskBadge
                  level={(subcontractor.risk_level as RiskLevel)}
                  size="sm"
                />
              )}
            </Stack>
          </Row>

          <Row style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div
              onClick={() => setActiveTab('overview')}
              style={{
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 8,
                paddingBottom: 8,
                cursor: 'pointer',
                borderBottom: activeTab === 'overview' ? '2px solid var(--color-blue-10)' : '2px solid transparent',
              }}
            >
              <Text
                size="sm"
                weight="medium"
                style={{ color: activeTab === 'overview' ? 'var(--color-blue-10)' : 'var(--color-text-muted)' }}
              >
                Overview
              </Text>
            </div>
            <div
              onClick={() => setActiveTab('policies')}
              style={{
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 8,
                paddingBottom: 8,
                cursor: 'pointer',
                borderBottom: activeTab === 'policies' ? '2px solid var(--color-blue-10)' : '2px solid transparent',
              }}
            >
              <Text
                size="sm"
                weight="medium"
                style={{ color: activeTab === 'policies' ? 'var(--color-blue-10)' : 'var(--color-text-muted)' }}
              >
                Policies ({activePolicies.length})
              </Text>
            </div>
            <div
              onClick={() => setActiveTab('documents')}
              style={{
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 8,
                paddingBottom: 8,
                cursor: 'pointer',
                borderBottom: activeTab === 'documents' ? '2px solid var(--color-blue-10)' : '2px solid transparent',
              }}
            >
              <Text
                size="sm"
                weight="medium"
                style={{ color: activeTab === 'documents' ? 'var(--color-blue-10)' : 'var(--color-text-muted)' }}
              >
                Documents ({documents.length})
              </Text>
            </div>
            <div
              onClick={() => setActiveTab('issues')}
              style={{
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 8,
                paddingBottom: 8,
                cursor: 'pointer',
                borderBottom: activeTab === 'issues' ? '2px solid var(--color-blue-10)' : '2px solid transparent',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Text
                size="sm"
                weight="medium"
                style={{ color: activeTab === 'issues' ? 'var(--color-blue-10)' : 'var(--color-text-muted)' }}
              >
                Issues
              </Text>
              {allIssues.length > 0 && (
                <span
                  style={{
                    paddingLeft: 6,
                    paddingRight: 6,
                    paddingTop: 2,
                    paddingBottom: 2,
                    backgroundColor: 'var(--color-red-10)',
                    color: 'white',
                    fontSize: 12,
                    borderRadius: 9999,
                  }}
                >
                  {allIssues.length}
                </span>
              )}
            </div>
          </Row>

          {activeTab === 'overview' && (
            <Stack gap={24}>
              <Row style={{ flexWrap: 'wrap', gap: 16 }}>
                <Card style={{ padding: 16, backgroundColor: 'var(--color-gray-2)', borderRadius: 12, flex: 1, minWidth: 'calc(50% - 8px)' }}>
                  <Row alignItems="center" gap={12} style={{ marginBottom: 8 }}>
                    <Building color="var(--color-text-muted)" size={20} />
                    <Text size="sm" muted>
                      Trade Type
                    </Text>
                  </Row>
                  <Text size="lg" weight="medium">
                    {subcontractor.trade_type}
                  </Text>
                </Card>

                <Card style={{ padding: 16, backgroundColor: 'var(--color-gray-2)', borderRadius: 12, flex: 1, minWidth: 'calc(50% - 8px)' }}>
                  <Row alignItems="center" gap={12} style={{ marginBottom: 8 }}>
                    <Shield color="var(--color-text-muted)" size={20} />
                    <Text size="sm" muted>
                      Active Policies
                    </Text>
                  </Row>
                  <Text size="lg" weight="medium">
                    {activePolicies.length}
                  </Text>
                </Card>

                <Card style={{ padding: 16, backgroundColor: 'var(--color-gray-2)', borderRadius: 12, flex: 1, minWidth: 'calc(50% - 8px)' }}>
                  <Row alignItems="center" gap={12} style={{ marginBottom: 8 }}>
                    <AlertTriangle color="var(--color-text-muted)" size={20} />
                    <Text size="sm" muted>
                      Open Issues
                    </Text>
                  </Row>
                  <Text size="lg" weight="medium">
                    {issues.length}
                  </Text>
                </Card>

                <Card style={{ padding: 16, backgroundColor: 'var(--color-gray-2)', borderRadius: 12, flex: 1, minWidth: 'calc(50% - 8px)' }} data-testid="risk-level-card">
                  <Row alignItems="center" gap={12} style={{ marginBottom: 8 }}>
                    <TrendingUp color="var(--color-text-muted)" size={20} />
                    <Text size="sm" muted>Risk Level</Text>
                  </Row>
                  <Stack alignItems="flex-start">
                    <RiskBadge
                      level={(subcontractor.risk_level as RiskLevel) || 'medium'}
                      score={complianceScore}
                      showScore
                      size="md"
                    />
                  </Stack>
                </Card>
              </Row>

              {people.length > 0 && (
                <Stack>
                  <H3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                    Team Members
                  </H3>
                  <Stack gap={8}>
                    {people.map((person) => (
                      <Row
                        key={person.id}
                        alignItems="center"
                        justifyContent="space-between"
                        style={{ padding: 12, backgroundColor: 'var(--color-gray-2)', borderRadius: 12 }}
                      >
                        <Row alignItems="center" gap={12}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              backgroundColor: 'var(--color-blue-10)',
                              borderRadius: 9999,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>
                              {person.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </span>
                          </div>
                          <Stack>
                            <Text size="sm" weight="medium">
                              {person.name}
                            </Text>
                            <Text size="xs" muted>
                              {person.email}
                            </Text>
                          </Stack>
                        </Row>
                        <div style={{ cursor: 'pointer' }}>
                          <Text size="xs" weight="medium" style={{ color: 'var(--color-blue-10)' }}>
                            Contact
                          </Text>
                        </div>
                      </Row>
                    ))}
                  </Stack>
                </Stack>
              )}

              {projects.length > 0 && (
                <Stack>
                  <H3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                    Projects
                  </H3>
                  <Stack gap={8}>
                    {projects.slice(0, 5).map((project) => (
                      <Row
                        key={project.id}
                        alignItems="center"
                        justifyContent="space-between"
                        style={{ padding: 12, border: '1px solid var(--color-border)', borderRadius: 12 }}
                      >
                        <Stack>
                          <Text size="sm" weight="medium">
                            {project.name}
                          </Text>
                          <Text size="xs" muted style={{ textTransform: 'capitalize' }}>
                            Status: {project.compliance_status}
                          </Text>
                        </Stack>
                        <StatusBadge
                          status={
                            project.compliance_status === 'compliant' ? 'compliant' : 'warning'
                          }
                          size="sm"
                        />
                      </Row>
                    ))}
                  </Stack>
                </Stack>
              )}
            </Stack>
          )}

          {activeTab === 'policies' && (
            <Stack gap={12}>
              {activePolicies.length > 0 ? (
                activePolicies.map((policy) => {
                  const expiryDate = new Date(policy.expiration_date);
                  const isExpiringSoon =
                    expiryDate.getTime() - Date.now() <
                    30 * 24 * 60 * 60 * 1000;

                  return (
                    <Card
                      key={policy.id}
                      style={{ padding: 16, border: '1px solid var(--color-border)', borderRadius: 12 }}
                    >
                      <Stack gap={12}>
                        <Row alignItems="center" justifyContent="space-between">
                          <Text weight="semibold" style={{ textTransform: 'capitalize' }}>
                            {policy.policy_type.replace(/_/g, ' ')}
                          </Text>
                          {isExpiringSoon ? (
                            <span
                              style={{
                                paddingLeft: 8,
                                paddingRight: 8,
                                paddingTop: 4,
                                paddingBottom: 4,
                                fontSize: 12,
                                fontWeight: 500,
                                borderRadius: 8,
                                backgroundColor: 'var(--color-orange-2)',
                                color: 'var(--color-orange-10)',
                              }}
                            >
                              Expiring Soon
                            </span>
                          ) : (
                            <span
                              style={{
                                paddingLeft: 8,
                                paddingRight: 8,
                                paddingTop: 4,
                                paddingBottom: 4,
                                fontSize: 12,
                                fontWeight: 500,
                                borderRadius: 8,
                                backgroundColor: 'var(--color-green-2)',
                                color: 'var(--color-green-10)',
                              }}
                            >
                              Active
                            </span>
                          )}
                        </Row>
                        <Row style={{ flexWrap: 'wrap', gap: 16 }}>
                          <Stack style={{ flex: 1, minWidth: 'calc(50% - 8px)' }}>
                            <Text size="sm" muted>Carrier</Text>
                            <Text size="sm" weight="medium">
                              {policy.carrier}
                            </Text>
                          </Stack>
                          <Stack style={{ flex: 1, minWidth: 'calc(50% - 8px)' }}>
                            <Text size="sm" muted>
                              Policy Number
                            </Text>
                            <Text size="sm" weight="medium">
                              {policy.policy_number}
                            </Text>
                          </Stack>
                          <Stack style={{ flex: 1, minWidth: 'calc(50% - 8px)' }}>
                            <Text size="sm" muted>
                              Effective Date
                            </Text>
                            <Text size="sm" weight="medium">
                              {new Date(policy.effective_date).toLocaleDateString()}
                            </Text>
                          </Stack>
                          <Stack style={{ flex: 1, minWidth: 'calc(50% - 8px)' }}>
                            <Text size="sm" muted>
                              Expiry Date
                            </Text>
                            <Text
                              size="sm"
                              weight="medium"
                              style={{ color: isExpiringSoon ? 'var(--color-orange-10)' : undefined }}
                            >
                              {expiryDate.toLocaleDateString()}
                            </Text>
                          </Stack>
                        </Row>
                        {policy.limits && Object.keys(policy.limits).length > 0 && (
                          <Stack>
                            <Text size="sm" muted style={{ marginBottom: 4 }}>
                              Coverage Limits
                            </Text>
                            <Stack gap={4}>
                              {Object.entries(policy.limits).map(
                                ([key, value]) => (
                                  <Row
                                    key={key}
                                    justifyContent="space-between"
                                  >
                                    <Text size="sm" muted style={{ textTransform: 'capitalize' }}>
                                      {key.replace(/_/g, ' ')}
                                    </Text>
                                    <Text size="sm" weight="medium">
                                      ${(value as number).toLocaleString()}
                                    </Text>
                                  </Row>
                                )
                              )}
                            </Stack>
                          </Stack>
                        )}
                      </Stack>
                    </Card>
                  );
                })
              ) : (
                <Stack alignItems="center" style={{ paddingTop: 48, paddingBottom: 48 }}>
                  <div style={{ marginBottom: 12 }}>
                    <Shield color="var(--color-text-muted)" size={48} />
                  </div>
                  <Text muted>
                    No active insurance policies
                  </Text>
                </Stack>
              )}
            </Stack>
          )}

          {activeTab === 'documents' && (
            <Stack gap={16}>
              {/* Filters */}
              <Row alignItems="center" gap={12}>
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
              </Row>

              {documentsLoading ? (
                <Stack alignItems="center" style={{ paddingTop: 48, paddingBottom: 48 }}>
                  <Loader2 size={32} color="var(--color-blue-10)" className="animate-spin" style={{ marginBottom: 8 }} />
                  <Text muted>Loading documents...</Text>
                </Stack>
              ) : filteredDocuments.length === 0 ? (
                <Stack alignItems="center" style={{ paddingTop: 48, paddingBottom: 48 }}>
                  <div style={{ marginBottom: 12 }}>
                    <FileText color="var(--color-text-muted)" size={48} />
                  </div>
                  <Text muted style={{ marginBottom: 16 }}>
                    No documents uploaded yet
                  </Text>
                  <Button variant="primary" leftIcon={Upload}>
                    Request Document Upload
                  </Button>
                </Stack>
              ) : (
                <Stack gap={12}>
                  {filteredDocuments.map((doc) => {
                    const status = getDocumentStatus(doc);
                    const daysUntilExpiry = getDaysUntilExpiry(doc.expiry_date);
                    const statusBorderColors: Record<string, string> = {
                      verified: 'var(--color-green-8)',
                      pending: 'var(--color-orange-8)',
                      expiring: 'var(--color-orange-8)',
                      expired: 'var(--color-red-8)',
                    };
                    const statusBgColors: Record<string, string> = {
                      verified: 'var(--color-green-2)',
                      pending: 'var(--color-orange-2)',
                      expiring: 'var(--color-orange-2)',
                      expired: 'var(--color-red-2)',
                    };
                    const statusTextColors: Record<string, string> = {
                      verified: 'var(--color-green-10)',
                      pending: 'var(--color-orange-10)',
                      expiring: 'var(--color-orange-10)',
                      expired: 'var(--color-red-10)',
                    };

                    return (
                      <Card
                        key={doc.id}
                        style={{
                          padding: 16,
                          borderLeft: `4px solid ${statusBorderColors[status] || 'var(--color-border)'}`,
                          borderRadius: 12,
                          backgroundColor: statusBgColors[status] || 'var(--color-gray-2)',
                        }}
                      >
                        <Row alignItems="flex-start" justifyContent="space-between">
                          <Stack style={{ flex: 1 }}>
                            <Row alignItems="center" gap={12} style={{ marginBottom: 8 }}>
                              <FileText color="var(--color-blue-10)" size={20} />
                              <Text weight="semibold">
                                {doc.file_name}
                              </Text>
                              <span
                                style={{
                                  paddingLeft: 8,
                                  paddingRight: 8,
                                  paddingTop: 2,
                                  paddingBottom: 2,
                                  fontSize: 12,
                                  fontWeight: 500,
                                  borderRadius: 8,
                                  backgroundColor: statusBgColors[status],
                                  color: statusTextColors[status],
                                }}
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </span>
                            </Row>
                            <Row style={{ flexWrap: 'wrap', gap: 16, marginLeft: 32 }}>
                              <Stack style={{ flex: 1, minWidth: 'calc(50% - 8px)' }}>
                                <Text size="sm" muted>Uploaded:</Text>
                                <Text size="sm" weight="medium">
                                  {formatDate(doc.created_at)}
                                </Text>
                              </Stack>
                              <Stack style={{ flex: 1, minWidth: 'calc(50% - 8px)' }}>
                                <Text size="sm" muted>Size:</Text>
                                <Text size="sm" weight="medium">
                                  {doc.file_size
                                    ? `${(doc.file_size / 1024 / 1024).toFixed(2)} MB`
                                    : 'N/A'}
                                </Text>
                              </Stack>
                              {doc.expiry_date && (
                                <Stack style={{ flex: 1, minWidth: 'calc(50% - 8px)' }}>
                                  <Text size="sm" muted>Expiry:</Text>
                                  <Text
                                    size="sm"
                                    weight="medium"
                                    style={{ color: daysUntilExpiry !== null && daysUntilExpiry <= 30 ? 'var(--color-orange-10)' : undefined }}
                                  >
                                    {formatDate(doc.expiry_date)}
                                    {daysUntilExpiry !== null &&
                                      daysUntilExpiry <= 30 &&
                                      ` (${daysUntilExpiry} days)`}
                                  </Text>
                                </Stack>
                              )}
                            </Row>
                          </Stack>
                          <Row alignItems="center" gap={8}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onPress={() =>
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
                                onPress={() =>
                                  window.open(doc.file_url, '_blank')
                                }
                                leftIcon={Download}
                              >
                                Download
                              </Button>
                            )}
                          </Row>
                        </Row>
                      </Card>
                    );
                  })}
                </Stack>
              )}
            </Stack>
          )}

          {activeTab === 'issues' && (
            <Stack gap={16}>
              {/* Filters */}
              <Row alignItems="center" gap={12}>
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
              </Row>

              {issuesLoading ? (
                <Stack alignItems="center" style={{ paddingTop: 48, paddingBottom: 48 }}>
                  <Loader2 size={32} color="var(--color-blue-10)" className="animate-spin" style={{ marginBottom: 8 }} />
                  <Text muted>Loading issues...</Text>
                </Stack>
              ) : filteredIssues.length === 0 ? (
                <Stack alignItems="center" style={{ paddingTop: 48, paddingBottom: 48 }}>
                  <div style={{ marginBottom: 12 }}>
                    <CheckCircle color="var(--color-green-10)" size={48} />
                  </div>
                  <Text weight="medium" style={{ color: 'var(--color-green-10)' }}>
                    No compliance issues
                  </Text>
                  <Text size="sm" muted>
                    This subcontractor is fully compliant
                  </Text>
                </Stack>
              ) : (
                <Stack gap={12}>
                  {filteredIssues.map((issue) => {
                    const severityBorderColors: Record<string, string> = {
                      critical: 'var(--color-red-10)',
                      high: 'var(--color-red-9)',
                      medium: 'var(--color-orange-10)',
                      low: 'var(--color-orange-8)',
                    };
                    const severityBgColors: Record<string, string> = {
                      critical: 'var(--color-red-2)',
                      high: 'var(--color-red-2)',
                      medium: 'var(--color-orange-2)',
                      low: 'var(--color-orange-2)',
                    };

                    const severityLabels: Record<string, string> = {
                      critical: 'CRITICAL',
                      high: 'HIGH',
                      medium: 'MEDIUM',
                      low: 'LOW',
                    };

                    return (
                      <Card
                        key={issue.id}
                        style={{
                          padding: 16,
                          borderLeft: `4px solid ${severityBorderColors[issue.severity] || 'var(--color-border)'}`,
                          borderRadius: 12,
                          backgroundColor: severityBgColors[issue.severity] || 'var(--color-gray-2)',
                        }}
                      >
                        <Row alignItems="flex-start" justifyContent="space-between" style={{ marginBottom: 8 }}>
                          <Row alignItems="center" gap={8}>
                            <AlertTriangle
                              color={
                                issue.severity === 'critical' ||
                                issue.severity === 'high'
                                  ? 'var(--color-red-10)'
                                  : 'var(--color-orange-10)'
                              }
                              size={18}
                            />
                            <Text weight="semibold">
                              {issue.title}
                            </Text>
                          </Row>
                          <Row alignItems="center" gap={8}>
                            <span
                              style={{
                                paddingLeft: 8,
                                paddingRight: 8,
                                paddingTop: 4,
                                paddingBottom: 4,
                                fontSize: 12,
                                fontWeight: 500,
                                borderRadius: 8,
                                backgroundColor:
                                  issue.severity === 'critical' || issue.severity === 'high'
                                    ? 'var(--color-red-3)'
                                    : issue.severity === 'medium'
                                      ? 'var(--color-orange-3)'
                                      : 'var(--color-orange-2)',
                                color:
                                  issue.severity === 'critical' || issue.severity === 'high'
                                    ? 'var(--color-red-12)'
                                    : issue.severity === 'medium'
                                      ? 'var(--color-orange-12)'
                                      : 'var(--color-orange-11)',
                              }}
                            >
                              {severityLabels[issue.severity]}
                            </span>
                            <span
                              style={{
                                paddingLeft: 8,
                                paddingRight: 8,
                                paddingTop: 4,
                                paddingBottom: 4,
                                fontSize: 12,
                                fontWeight: 500,
                                borderRadius: 8,
                                backgroundColor:
                                  issue.status === 'open'
                                    ? 'var(--color-blue-2)'
                                    : issue.status === 'in_progress'
                                      ? 'var(--color-orange-2)'
                                      : 'var(--color-green-2)',
                                color:
                                  issue.status === 'open'
                                    ? 'var(--color-blue-10)'
                                    : issue.status === 'in_progress'
                                      ? 'var(--color-orange-10)'
                                      : 'var(--color-green-10)',
                              }}
                            >
                              {issue.status.charAt(0).toUpperCase() +
                                issue.status.slice(1).replace('_', ' ')}
                            </span>
                          </Row>
                        </Row>
                        <Text size="sm" muted style={{ marginBottom: 12, marginLeft: 24 }}>
                          {issue.description}
                        </Text>
                        <Row alignItems="center" justifyContent="space-between" style={{ marginLeft: 24 }}>
                          <Row gap={12}>
                            <Text size="xs" muted>
                              Type: {issue.issue_type.replace('_', ' ')}
                            </Text>
                            <Text size="xs" muted>
                              Created: {formatDate(issue.created_at)}
                            </Text>
                          </Row>
                          {issue.status === 'open' && (
                            <Button
                              variant="outlined"
                              size="sm"
                              onPress={() => handleMarkIssueResolved(issue.id)}
                            >
                              Mark Resolved
                            </Button>
                          )}
                        </Row>
                      </Card>
                    );
                  })}
                </Stack>
              )}
            </Stack>
          )}

        </Stack>
      </ModalOverlay>

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

    </>
  );
}
