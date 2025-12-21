import { useState, useEffect, useMemo } from 'react';
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
import { YStack, XStack, Text, H2, H3, Spinner, Card } from '@unicornlove/ui';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import StatusBadge from '../Common/StatusBadge';
import Select from '../Common/Select';
import DocumentDetailModal from '../Document/DocumentDetailModal';
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
          forsured('subcontractors').select('*').eq('id', subcontractorId).single(),
          forsured('policies').select('*').eq('subcontractor_id', subcontractorId),
          forsured('projects').select('*'),
          forsured('users').select('*'),
        ]);

        if (subResult.error) throw subResult.error;
        if (policiesResult.error) throw policiesResult.error;
        if (projectsResult.error) throw projectsResult.error;
        if (usersResult.error) throw usersResult.error;

        // Map database fields to component interface
        const mappedSubcontractor = subResult.data ? {
          ...subResult.data,
          company_name: subResult.data.company || '', // Map 'company' to 'company_name'
          contact_name: subResult.data.name || '', // Map 'name' to 'contact_name'
        } : null;

        setSubcontractor(mappedSubcontractor);
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

  // Show loading while fetching data
  if (loadingData) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
        <YStack alignItems="center" justifyContent="center" minHeight={400}>
          <YStack alignItems="center" gap="$4">
            <Spinner size="large" color="$blue10" />
            <Text color="$color11" fontSize="$4">Loading subcontractor details...</Text>
          </YStack>
        </YStack>
      </Modal>
    );
  }

  if (!subcontractor) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
        <YStack alignItems="center" justifyContent="center" minHeight={400}>
          <YStack alignItems="center">
            <YStack alignItems="center" marginBottom="$4">
              <AlertTriangle color="$red10" size={48} />
            </YStack>
            <H3 fontSize="$6" fontWeight="600" color="$color12" marginBottom="$2">
              Subcontractor not found
            </H3>
            <Text color="$color11">The requested subcontractor could not be loaded.</Text>
          </YStack>
        </YStack>
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
        <YStack gap="$6">
          <XStack alignItems="flex-start" justifyContent="space-between">
            <YStack flex={1}>
              <XStack alignItems="center" gap="$3" marginBottom="$2">
                <H2 fontSize="$9" fontWeight="700" color="$color12">
                  {subcontractor.company_name}
                </H2>
                {hasActiveCoverage ? (
                  <Text
                    paddingHorizontal="$2.5"
                    paddingVertical="$1"
                    fontSize="$1"
                    fontWeight="500"
                    borderRadius="$2"
                    backgroundColor="$green2"
                    color="$green10"
                  >
                    Active Coverage
                  </Text>
                ) : (
                  <Text
                    paddingHorizontal="$2.5"
                    paddingVertical="$1"
                    fontSize="$1"
                    fontWeight="500"
                    borderRadius="$2"
                    backgroundColor="$red2"
                    color="$red10"
                  >
                    No Coverage
                  </Text>
                )}
              </XStack>
              <Text color="$color11" fontSize="$4">
                {subcontractor.trade_type} · {subcontractor.status}
              </Text>
            </YStack>
            <YStack alignItems="flex-end">
              <Text fontSize="$10" fontWeight="700" color="$color12">
                {complianceScore}%
              </Text>
              <Text fontSize="$1" color="$color10">Compliance Score</Text>
            </YStack>
          </XStack>

          <XStack borderBottomWidth={1} borderColor="$borderColor">
            <XStack
              onPress={() => setActiveTab('overview')}
              paddingHorizontal="$4"
              paddingVertical="$2"
              cursor="pointer"
              borderBottomWidth={activeTab === 'overview' ? 2 : 0}
              borderBottomColor={activeTab === 'overview' ? '$blue10' : 'transparent'}
              hoverStyle={{ opacity: 0.8 }}
            >
              <Text
                fontSize="$3"
                fontWeight="500"
                color={activeTab === 'overview' ? '$blue10' : '$color11'}
              >
                Overview
              </Text>
            </XStack>
            <XStack
              onPress={() => setActiveTab('policies')}
              paddingHorizontal="$4"
              paddingVertical="$2"
              cursor="pointer"
              borderBottomWidth={activeTab === 'policies' ? 2 : 0}
              borderBottomColor={activeTab === 'policies' ? '$blue10' : 'transparent'}
              hoverStyle={{ opacity: 0.8 }}
            >
              <Text
                fontSize="$3"
                fontWeight="500"
                color={activeTab === 'policies' ? '$blue10' : '$color11'}
              >
                Policies ({activePolicies.length})
              </Text>
            </XStack>
            <XStack
              onPress={() => setActiveTab('documents')}
              paddingHorizontal="$4"
              paddingVertical="$2"
              cursor="pointer"
              borderBottomWidth={activeTab === 'documents' ? 2 : 0}
              borderBottomColor={activeTab === 'documents' ? '$blue10' : 'transparent'}
              hoverStyle={{ opacity: 0.8 }}
            >
              <Text
                fontSize="$3"
                fontWeight="500"
                color={activeTab === 'documents' ? '$blue10' : '$color11'}
              >
                Documents ({documents.length})
              </Text>
            </XStack>
            <XStack
              onPress={() => setActiveTab('issues')}
              paddingHorizontal="$4"
              paddingVertical="$2"
              cursor="pointer"
              borderBottomWidth={activeTab === 'issues' ? 2 : 0}
              borderBottomColor={activeTab === 'issues' ? '$blue10' : 'transparent'}
              hoverStyle={{ opacity: 0.8 }}
              position="relative"
            >
              <Text
                fontSize="$3"
                fontWeight="500"
                color={activeTab === 'issues' ? '$blue10' : '$color11'}
              >
                Issues
              </Text>
              {allIssues.length > 0 && (
                <Text
                  marginLeft="$2"
                  paddingHorizontal="$1.5"
                  paddingVertical="$0.5"
                  backgroundColor="$red10"
                  color="white"
                  fontSize="$1"
                  borderRadius={9999}
                >
                  {allIssues.length}
                </Text>
              )}
            </XStack>
          </XStack>

          {activeTab === 'overview' && (
            <YStack gap="$6">
              <XStack flexWrap="wrap" gap="$4">
                <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4" flex={1} minWidth="calc(50% - 8px)">
                  <XStack alignItems="center" gap="$3" marginBottom="$2">
                    <Building color="$color10" size={20} />
                    <Text fontSize="$3" color="$color10">
                      Trade Type
                    </Text>
                  </XStack>
                  <Text fontSize="$5" fontWeight="500" color="$color12">
                    {subcontractor.trade_type}
                  </Text>
                </Card>

                <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4" flex={1} minWidth="calc(50% - 8px)">
                  <XStack alignItems="center" gap="$3" marginBottom="$2">
                    <Shield color="$color10" size={20} />
                    <Text fontSize="$3" color="$color10">
                      Active Policies
                    </Text>
                  </XStack>
                  <Text fontSize="$5" fontWeight="500" color="$color12">
                    {activePolicies.length}
                  </Text>
                </Card>

                <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4" flex={1} minWidth="calc(50% - 8px)">
                  <XStack alignItems="center" gap="$3" marginBottom="$2">
                    <AlertTriangle color="$color10" size={20} />
                    <Text fontSize="$3" color="$color10">
                      Open Issues
                    </Text>
                  </XStack>
                  <Text fontSize="$5" fontWeight="500" color="$color12">
                    {issues.length}
                  </Text>
                </Card>

                <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4" flex={1} minWidth="calc(50% - 8px)">
                  <XStack alignItems="center" gap="$3" marginBottom="$2">
                    <FileText color="$color10" size={20} />
                    <Text fontSize="$3" color="$color10">Risk Level</Text>
                  </XStack>
                  <Text fontSize="$5" fontWeight="500" color="$color12" textTransform="capitalize">
                    {subcontractor.risk_level}
                  </Text>
                </Card>
              </XStack>

              {people.length > 0 && (
                <YStack>
                  <H3 fontSize="$3" fontWeight="600" color="$color12" marginBottom="$3">
                    Team Members
                  </H3>
                  <YStack gap="$2">
                    {people.map((person) => (
                      <XStack
                        key={person.id}
                        alignItems="center"
                        justifyContent="space-between"
                        padding="$3"
                        backgroundColor="$backgroundHover"
                        borderRadius="$4"
                      >
                        <XStack alignItems="center" gap="$3">
                          <YStack
                            width={40}
                            height={40}
                            backgroundColor="$blue10"
                            borderRadius={9999}
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text fontSize="$3" fontWeight="600" color="white">
                              {person.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </Text>
                          </YStack>
                          <YStack>
                            <Text fontSize="$3" fontWeight="500" color="$color12">
                              {person.name}
                            </Text>
                            <Text fontSize="$1" color="$color10">
                              {person.email}
                            </Text>
                          </YStack>
                        </XStack>
                        <XStack
                          onPress={() => {}}
                          cursor="pointer"
                          hoverStyle={{ opacity: 0.8 }}
                        >
                          <Text
                            fontSize="$1"
                            color="$blue10"
                            fontWeight="500"
                          >
                            Contact
                          </Text>
                        </XStack>
                      </XStack>
                    ))}
                  </YStack>
                </YStack>
              )}

              {projects.length > 0 && (
                <YStack>
                  <H3 fontSize="$3" fontWeight="600" color="$color12" marginBottom="$3">
                    Projects
                  </H3>
                  <YStack gap="$2">
                    {projects.slice(0, 5).map((project) => (
                      <XStack
                        key={project.id}
                        alignItems="center"
                        justifyContent="space-between"
                        padding="$3"
                        borderWidth={1}
                        borderColor="$borderColor"
                        borderRadius="$4"
                      >
                        <YStack>
                          <Text fontSize="$3" fontWeight="500" color="$color12">
                            {project.name}
                          </Text>
                          <Text fontSize="$1" color="$color10" textTransform="capitalize">
                            Status: {project.compliance_status}
                          </Text>
                        </YStack>
                        <StatusBadge
                          status={
                            project.compliance_status === 'compliant' ? 'compliant' : 'warning'
                          }
                          size="sm"
                        />
                      </XStack>
                    ))}
                  </YStack>
                </YStack>
              )}
            </YStack>
          )}

          {activeTab === 'policies' && (
            <YStack gap="$3">
              {activePolicies.length > 0 ? (
                activePolicies.map((policy) => {
                  const expiryDate = new Date(policy.expiration_date);
                  const isExpiringSoon =
                    expiryDate.getTime() - Date.now() <
                    30 * 24 * 60 * 60 * 1000;

                  return (
                    <Card
                      key={policy.id}
                      padding="$4"
                      borderWidth={1}
                      borderColor="$borderColor"
                      borderRadius="$4"
                      gap="$3"
                    >
                      <XStack alignItems="center" justifyContent="space-between">
                        <Text fontSize="$4" fontWeight="600" color="$color12" textTransform="capitalize">
                          {policy.policy_type.replace(/_/g, ' ')}
                        </Text>
                        {isExpiringSoon ? (
                          <Text
                            paddingHorizontal="$2"
                            paddingVertical="$1"
                            fontSize="$1"
                            fontWeight="500"
                            borderRadius="$2"
                            backgroundColor="$orange2"
                            color="$orange10"
                          >
                            Expiring Soon
                          </Text>
                        ) : (
                          <Text
                            paddingHorizontal="$2"
                            paddingVertical="$1"
                            fontSize="$1"
                            fontWeight="500"
                            borderRadius="$2"
                            backgroundColor="$green2"
                            color="$green10"
                          >
                            Active
                          </Text>
                        )}
                      </XStack>
                      <XStack flexWrap="wrap" gap="$4">
                        <YStack flex={1} minWidth="calc(50% - 8px)">
                          <Text fontSize="$3" color="$color10">Carrier</Text>
                          <Text fontSize="$3" fontWeight="500" color="$color12">
                            {policy.carrier}
                          </Text>
                        </YStack>
                        <YStack flex={1} minWidth="calc(50% - 8px)">
                          <Text fontSize="$3" color="$color10">
                            Policy Number
                          </Text>
                          <Text fontSize="$3" fontWeight="500" color="$color12">
                            {policy.policy_number}
                          </Text>
                        </YStack>
                        <YStack flex={1} minWidth="calc(50% - 8px)">
                          <Text fontSize="$3" color="$color10">
                            Effective Date
                          </Text>
                          <Text fontSize="$3" fontWeight="500" color="$color12">
                            {new Date(policy.effective_date).toLocaleDateString()}
                          </Text>
                        </YStack>
                        <YStack flex={1} minWidth="calc(50% - 8px)">
                          <Text fontSize="$3" color="$color10">
                            Expiry Date
                          </Text>
                          <Text
                            fontSize="$3"
                            fontWeight="500"
                            color={isExpiringSoon ? '$orange10' : '$color12'}
                          >
                            {expiryDate.toLocaleDateString()}
                          </Text>
                        </YStack>
                      </XStack>
                      {policy.limits && Object.keys(policy.limits).length > 0 && (
                        <YStack>
                          <Text fontSize="$3" color="$color10" marginBottom="$1">
                            Coverage Limits
                          </Text>
                          <YStack gap="$1">
                            {Object.entries(policy.limits).map(
                              ([key, value]) => (
                                <XStack
                                  key={key}
                                  justifyContent="space-between"
                                  fontSize="$3"
                                >
                                  <Text fontSize="$3" color="$color11" textTransform="capitalize">
                                    {key.replace(/_/g, ' ')}
                                  </Text>
                                  <Text fontSize="$3" fontWeight="500" color="$color12">
                                    ${(value as number).toLocaleString()}
                                  </Text>
                                </XStack>
                              )
                            )}
                          </YStack>
                        </YStack>
                      )}
                    </Card>
                  );
                })
              ) : (
                <YStack alignItems="center" paddingVertical="$12">
                  <YStack alignItems="center" marginBottom="$3">
                    <Shield color="$color10" size={48} />
                  </YStack>
                  <Text color="$color11">
                    No active insurance policies
                  </Text>
                </YStack>
              )}
            </YStack>
          )}

          {activeTab === 'documents' && (
            <YStack gap="$4">
              {/* Filters */}
              <XStack alignItems="center" gap="$3">
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
              </XStack>

              {documentsLoading ? (
                <YStack alignItems="center" paddingVertical="$12">
                  <Spinner size="large" color="$blue10" marginBottom="$2" />
                  <Text color="$color11">Loading documents...</Text>
                </YStack>
              ) : filteredDocuments.length === 0 ? (
                <YStack alignItems="center" paddingVertical="$12">
                  <YStack alignItems="center" marginBottom="$3">
                    <FileText color="$color10" size={48} />
                  </YStack>
                  <Text color="$color11" marginBottom="$4">
                    No documents uploaded yet
                  </Text>
                  <Button variant="primary" leftIcon={Upload}>
                    Request Document Upload
                  </Button>
                </YStack>
              ) : (
                <YStack gap="$3">
                  {filteredDocuments.map((doc) => {
                    const status = getDocumentStatus(doc);
                    const daysUntilExpiry = getDaysUntilExpiry(doc.expiry_date);
                    const statusBorderColors = {
                      verified: '$green8',
                      pending: '$orange8',
                      expiring: '$orange8',
                      expired: '$red8',
                    };
                    const statusBgColors = {
                      verified: '$green2',
                      pending: '$orange2',
                      expiring: '$orange2',
                      expired: '$red2',
                    };
                    const statusTextColors = {
                      verified: '$green10',
                      pending: '$orange10',
                      expiring: '$orange10',
                      expired: '$red10',
                    };

                    return (
                      <Card
                        key={doc.id}
                        padding="$4"
                        borderLeftWidth={4}
                        borderLeftColor={statusBorderColors[status] || '$borderColor'}
                        borderRadius="$4"
                        backgroundColor={statusBgColors[status] || '$backgroundHover'}
                      >
                        <XStack alignItems="flex-start" justifyContent="space-between">
                          <YStack flex={1}>
                            <XStack alignItems="center" gap="$3" marginBottom="$2">
                              <FileText
                                color="$blue10"
                                size={20}
                              />
                              <Text fontSize="$4" fontWeight="600" color="$color12">
                                {doc.file_name}
                              </Text>
                              <Text
                                paddingHorizontal="$2"
                                paddingVertical="$0.5"
                                fontSize="$1"
                                fontWeight="500"
                                borderRadius="$2"
                                backgroundColor={
                                  status === 'verified'
                                    ? '$green2'
                                    : status === 'pending'
                                      ? '$orange2'
                                      : status === 'expiring'
                                        ? '$orange2'
                                        : '$red2'
                                }
                                color={
                                  status === 'verified'
                                    ? '$green10'
                                    : status === 'pending'
                                      ? '$orange10'
                                      : status === 'expiring'
                                        ? '$orange10'
                                        : '$red10'
                                }
                              >
                                {status.charAt(0).toUpperCase() +
                                  status.slice(1)}
                              </Text>
                            </XStack>
                            <XStack flexWrap="wrap" gap="$4" marginLeft="$8">
                              <YStack flex={1} minWidth="calc(50% - 8px)">
                                <Text fontSize="$3" color="$color10">
                                  Uploaded:
                                </Text>
                                <Text fontSize="$3" fontWeight="500" color="$color12">
                                  {formatDate(doc.created_at)}
                                </Text>
                              </YStack>
                              <YStack flex={1} minWidth="calc(50% - 8px)">
                                <Text fontSize="$3" color="$color10">
                                  Size:
                                </Text>
                                <Text fontSize="$3" fontWeight="500" color="$color12">
                                  {doc.file_size
                                    ? `${(doc.file_size / 1024 / 1024).toFixed(2)} MB`
                                    : 'N/A'}
                                </Text>
                              </YStack>
                              {doc.expiry_date && (
                                <YStack flex={1} minWidth="calc(50% - 8px)">
                                  <Text fontSize="$3" color="$color10">
                                    Expiry:
                                  </Text>
                                  <Text
                                    fontSize="$3"
                                    fontWeight="500"
                                    color={daysUntilExpiry !== null && daysUntilExpiry <= 30 ? '$orange10' : '$color12'}
                                  >
                                    {formatDate(doc.expiry_date)}
                                    {daysUntilExpiry !== null &&
                                      daysUntilExpiry <= 30 &&
                                      ` (${daysUntilExpiry} days)`}
                                  </Text>
                                </YStack>
                              )}
                            </XStack>
                          </YStack>
                          <XStack alignItems="center" gap="$2">
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
                          </XStack>
                        </XStack>
                      </Card>
                    );
                  })}
                </YStack>
              )}
            </YStack>
          )}

          {activeTab === 'issues' && (
            <YStack gap="$4">
              {/* Filters */}
              <XStack alignItems="center" gap="$3">
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
              </XStack>

              {issuesLoading ? (
                <YStack alignItems="center" paddingVertical="$12">
                  <Spinner size="large" color="$blue10" marginBottom="$2" />
                  <Text color="$color11">Loading issues...</Text>
                </YStack>
              ) : filteredIssues.length === 0 ? (
                <YStack alignItems="center" paddingVertical="$12">
                  <YStack alignItems="center" marginBottom="$3">
                    <CheckCircle color="$green10" size={48} />
                  </YStack>
                  <Text color="$green10" fontWeight="500">
                    No compliance issues
                  </Text>
                  <Text color="$color11" fontSize="$3">
                    This subcontractor is fully compliant
                  </Text>
                </YStack>
              ) : (
                <YStack gap="$3">
                  {filteredIssues.map((issue) => {
                    const severityBorderColors = {
                      critical: '$red10',
                      high: '$red9',
                      medium: '$orange10',
                      low: '$orange8',
                    };
                    const severityBgColors = {
                      critical: '$red2',
                      high: '$red2',
                      medium: '$orange2',
                      low: '$orange2',
                    };

                    const severityLabels = {
                      critical: 'CRITICAL',
                      high: 'HIGH',
                      medium: 'MEDIUM',
                      low: 'LOW',
                    };

                    return (
                      <Card
                        key={issue.id}
                        padding="$4"
                        borderLeftWidth={4}
                        borderLeftColor={severityBorderColors[issue.severity] || '$borderColor'}
                        borderRadius="$4"
                        backgroundColor={severityBgColors[issue.severity] || '$backgroundHover'}
                      >
                        <XStack alignItems="flex-start" justifyContent="space-between" marginBottom="$2">
                          <XStack alignItems="center" gap="$2">
                            <AlertTriangle
                              color={
                                issue.severity === 'critical' ||
                                issue.severity === 'high'
                                  ? '$red10'
                                  : '$orange10'
                              }
                              size={18}
                            />
                            <Text fontSize="$4" fontWeight="600" color="$color12">
                              {issue.title}
                            </Text>
                          </XStack>
                          <XStack alignItems="center" gap="$2">
                            <Text
                              paddingHorizontal="$2"
                              paddingVertical="$1"
                              fontSize="$1"
                              fontWeight="500"
                              borderRadius="$2"
                              backgroundColor={
                                issue.severity === 'critical' || issue.severity === 'high'
                                  ? '$red3'
                                  : issue.severity === 'medium'
                                    ? '$orange3'
                                    : '$orange2'
                              }
                              color={
                                issue.severity === 'critical' || issue.severity === 'high'
                                  ? '$red12'
                                  : issue.severity === 'medium'
                                    ? '$orange12'
                                    : '$orange11'
                              }
                            >
                              {severityLabels[issue.severity]}
                            </Text>
                            <Text
                              paddingHorizontal="$2"
                              paddingVertical="$1"
                              fontSize="$1"
                              fontWeight="500"
                              borderRadius="$2"
                              backgroundColor={
                                issue.status === 'open'
                                  ? '$blue2'
                                  : issue.status === 'in_progress'
                                    ? '$orange2'
                                    : '$green2'
                              }
                              color={
                                issue.status === 'open'
                                  ? '$blue10'
                                  : issue.status === 'in_progress'
                                    ? '$orange10'
                                    : '$green10'
                              }
                            >
                              {issue.status.charAt(0).toUpperCase() +
                                issue.status.slice(1).replace('_', ' ')}
                            </Text>
                          </XStack>
                        </XStack>
                        <Text fontSize="$3" color="$color11" marginBottom="$3" marginLeft="$6">
                          {issue.description}
                        </Text>
                        <XStack alignItems="center" justifyContent="space-between" marginLeft="$6">
                          <XStack gap="$3" fontSize="$1" color="$color10">
                            <Text fontSize="$1" color="$color10">
                              Type: {issue.issue_type.replace('_', ' ')}
                            </Text>
                            <Text fontSize="$1" color="$color10">
                              Created: {formatDate(issue.created_at)}
                            </Text>
                          </XStack>
                          {issue.status === 'open' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkIssueResolved(issue.id)}
                            >
                              Mark Resolved
                            </Button>
                          )}
                        </XStack>
                      </Card>
                    );
                  })}
                </YStack>
              )}
            </YStack>
          )}

          <XStack gap="$3" paddingTop="$4" borderTopWidth={1} borderColor="$borderColor">
            <Button
              variant="secondary"
              onClick={() => setShowMessageModal(true)}
              leftIcon={MessageSquare}
              flex={1}
            >
              Send Message
            </Button>
            <Button variant="secondary" leftIcon={FileText} flex={1}>
              View Full Profile
            </Button>
            {allIssues.length > 0 ? (
              <Button variant="danger" leftIcon={UserX} flex={1}>
                Restrict Access
              </Button>
            ) : (
              <Button variant="success" leftIcon={UserCheck} flex={1}>
                Approve
              </Button>
            )}
          </XStack>
        </YStack>
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
        <YStack gap="$4">
          <YStack>
            <Text
              as="label"
              display="block"
              fontSize="$3"
              fontWeight="500"
              color="$color11"
              marginBottom="$2"
            >
              Message to {subcontractor.company_name}
            </Text>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Type your message here..."
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'var(--background)',
                border: '1px solid var(--borderColor)',
                borderRadius: '8px',
                fontSize: '14px',
                color: 'var(--color12)',
                fontFamily: 'inherit',
              }}
            />
          </YStack>
          <XStack gap="$3">
            <Button
              variant="secondary"
              onClick={() => setShowMessageModal(false)}
              flex={1}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSendMessage}
              flex={1}
            >
              Send Message
            </Button>
          </XStack>
        </YStack>
      </Modal>
    </>
  );
}
