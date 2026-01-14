import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building,
  Calendar,
  MapPin,
  Shield,
  Users,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  X,
  ArrowLeft,
  History as HistoryIcon,
  MessageSquare,
  List,
} from 'lucide-react';
import { Stack, Row, Text, H1, H2, H3, Card, Tabs } from '@unicornlove/beyond-ui';
import Tooltip from '../../ui/Tooltip';
import Button from '../Common/Button';
import { useProjectDetail } from '../../hooks/useProjectDetail';
import { useComments } from '../../hooks/useComments';
import { useComplianceIssues } from '../../hooks/useComplianceIssues';
import { useUser } from '../../contexts/UserContext';
import { EntityType } from '../../types';
import { formatDate } from '../../utils/dateHelpers';

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const { project, participants, tasks, compliance, loading, error } =
    useProjectDetail(projectId || '');
  const { comments: projectComments } = useComments({
    entityType: 'project' as EntityType,
    entityId: projectId,
  });
  const { issues: complianceIssues } = useComplianceIssues({
    projectId: projectId,
  });

  // REQ-279: Calculate issue counts for warning indicator and tabs
  const allOpenIssues = useMemo(
    () => complianceIssues.filter((issue) => issue.status !== 'resolved'),
    [complianceIssues]
  );

  const userIssues = useMemo(
    () => allOpenIssues.filter((issue) => issue.assigned_to === currentUser?.id),
    [allOpenIssues, currentUser?.id]
  );

  const othersIssues = useMemo(
    () => allOpenIssues.filter((issue) => issue.assigned_to !== currentUser?.id),
    [allOpenIssues, currentUser?.id]
  );

  const totalIssuesCount = allOpenIssues.length;
  const userIssuesCount = userIssues.length;
  const othersIssuesCount = othersIssues.length;

  // Get initial tab from URL query parameter
  // REQ-279: Added 'all-issues' tab for complete compliance view
  const validTabs = ['overview', 'requirements', 'participants', 'compliance', 'all-issues', 'documents', 'tasks', 'history', 'notes'];
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<string>(
    tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'overview'
  );

  // Update activeTab when URL changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getComplianceStatusStyle = (status: string) => {
    switch (status) {
      case 'compliant':
        return { backgroundColor: 'var(--color-green2)', color: 'var(--color-green11)', borderColor: 'var(--color-green6)' };
      case 'warning':
        return { backgroundColor: 'var(--color-yellow2)', color: 'var(--color-yellow11)', borderColor: 'var(--color-yellow6)' };
      case 'critical':
        return { backgroundColor: 'var(--color-red2)', color: 'var(--color-red11)', borderColor: 'var(--color-red6)' };
      case 'non_compliant':
        return { backgroundColor: 'var(--color-red2)', color: 'var(--color-red11)', borderColor: 'var(--color-red6)' };
      default:
        return { backgroundColor: 'var(--color-gray2)', color: 'var(--color-gray11)', borderColor: 'var(--color-gray6)' };
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { backgroundColor: 'var(--color-red2)', color: 'var(--color-red11)', borderColor: 'var(--color-red6)' };
      case 'high':
        return { backgroundColor: 'var(--color-yellow2)', color: 'var(--color-yellow11)', borderColor: 'var(--color-yellow6)' };
      case 'medium':
        return { backgroundColor: 'var(--color-blue2)', color: 'var(--color-blue11)', borderColor: 'var(--color-blue6)' };
      case 'low':
        return { backgroundColor: 'var(--color-gray2)', color: 'var(--color-gray11)', borderColor: 'var(--color-gray6)' };
      default:
        return { backgroundColor: 'var(--color-gray2)', color: 'var(--color-gray11)', borderColor: 'var(--color-gray6)' };
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return { backgroundColor: 'var(--color-green2)', color: 'var(--color-green11)' };
      case 'in_progress':
        return { backgroundColor: 'var(--color-blue2)', color: 'var(--color-blue11)' };
      case 'pending':
        return { backgroundColor: 'var(--color-yellow2)', color: 'var(--color-yellow11)' };
      case 'blocked':
        return { backgroundColor: 'var(--color-red2)', color: 'var(--color-red11)' };
      default:
        return { backgroundColor: 'var(--color-gray2)', color: 'var(--color-gray11)' };
    }
  };

  if (loading) {
    return (
      <Stack style={{ gap: 24 }}>
        <Stack style={{ height: 32, backgroundColor: 'var(--color-backgroundHover)', borderRadius: 8, opacity: 0.5 }} />
        <Stack style={{ height: 256, backgroundColor: 'var(--color-backgroundHover)', borderRadius: 8, opacity: 0.5 }} />
      </Stack>
    );
  }

  if (error || !project) {
    return (
      <Stack style={{ alignItems: 'center', paddingTop: 48, paddingBottom: 48 }}>
        <AlertCircle size={48} color="var(--color-red10)" style={{ marginBottom: 16 }} />
        <H3 style={{ marginBottom: 8 }}>Project not found</H3>
        <Text style={{ color: 'var(--color-11)', marginBottom: 16 }}>
          {error?.message || 'The project you are looking for does not exist.'}
        </Text>
        <Button onPress={() => navigate(-1)} leftIcon={ArrowLeft}>
          Go Back
        </Button>
      </Stack>
    );
  }

  const getRequiredCoverages = () => {
    const coverages = [];
    if (project.general_liability_required)
      coverages.push({
        name: 'General Liability',
        type: 'GL',
        amount: project.general_liability_required,
      });
    if (project.workers_comp_required)
      coverages.push({
        name: 'Workers Compensation',
        type: 'WC',
        amount: project.workers_comp_required,
      });
    if (project.auto_liability_required)
      coverages.push({
        name: 'Auto Liability',
        type: 'Auto',
        amount: project.auto_liability_required,
      });
    if (project.umbrella_required)
      coverages.push({
        name: 'Umbrella/Excess',
        type: 'Umbrella',
        amount: project.umbrella_required,
      });
    if (project.professional_liability_required)
      coverages.push({
        name: 'Professional Liability',
        type: 'Prof',
        amount: project.professional_liability_required,
      });
    if (project.pollution_liability_required)
      coverages.push({
        name: 'Pollution Liability',
        type: 'Pollution',
        amount: project.pollution_liability_required,
      });
    if (project.builders_risk_required)
      coverages.push({
        name: 'Builders Risk',
        type: 'Builders',
        amount: project.builders_risk_required,
      });
    return coverages;
  };

  const requiredCoverages = getRequiredCoverages();

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Building,
      content: (
        <Stack style={{ gap: 24 }}>
          <Row style={{ flexWrap: 'wrap', gap: 16 }}>
            <Card style={{ padding: 16, backgroundColor: 'var(--color-backgroundHover)', borderRadius: 8, flex: 1, minWidth: '45%' }}>
              <Row style={{ alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Calendar size={18} color="var(--color-10)" />
                <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)' }}>
                  Start Date
                </Text>
              </Row>
              <Text style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-12)' }}>
                {formatDate(project.start_date)}
              </Text>
            </Card>
            <Card style={{ padding: 16, backgroundColor: 'var(--color-backgroundHover)', borderRadius: 8, flex: 1, minWidth: '45%' }}>
              <Row style={{ alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Calendar size={18} color="var(--color-10)" />
                <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)' }}>
                  End Date
                </Text>
              </Row>
              <Text style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-12)' }}>
                {formatDate(project.end_date)}
              </Text>
            </Card>
            {project.location && (
              <Card style={{ padding: 16, backgroundColor: 'var(--color-backgroundHover)', borderRadius: 8, flex: 1, minWidth: '45%' }}>
                <Row style={{ alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <MapPin size={18} color="var(--color-10)" />
                  <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)' }}>
                    Location
                  </Text>
                </Row>
                <Text style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-12)' }}>
                  {project.location}
                </Text>
              </Card>
            )}
            {project.contract_value && (
              <Card style={{ padding: 16, backgroundColor: 'var(--color-backgroundHover)', borderRadius: 8, flex: 1, minWidth: '45%' }}>
                <Row style={{ alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Building size={18} color="var(--color-10)" />
                  <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)' }}>
                    Contract Value
                  </Text>
                </Row>
                <Text style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-12)' }}>
                  {formatCurrency(project.contract_value)}
                </Text>
              </Card>
            )}
            {project.project_manager && (
              <Card style={{ padding: 16, backgroundColor: 'var(--color-backgroundHover)', borderRadius: 8, flex: 1, minWidth: '45%' }}>
                <Row style={{ alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Users size={18} color="var(--color-10)" />
                  <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)' }}>
                    Project Manager
                  </Text>
                </Row>
                <Text style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-12)' }}>
                  {project.project_manager}
                </Text>
              </Card>
            )}
            <Card style={{ padding: 16, backgroundColor: 'var(--color-backgroundHover)', borderRadius: 8, flex: 1, minWidth: '45%' }}>
              <Row style={{ alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Shield size={18} color="var(--color-10)" />
                <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)' }}>
                  Compliance Status
                </Text>
              </Row>
              <Row
                style={{
                  alignItems: 'center',
                  paddingLeft: 8,
                  paddingRight: 8,
                  paddingTop: 4,
                  paddingBottom: 4,
                  borderRadius: 4,
                  border: '1px solid',
                  display: 'inline-flex',
                  ...getComplianceStatusStyle(project.compliance_status),
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: 500 }}>
                  {project.compliance_status}
                </Text>
              </Row>
            </Card>
          </Row>
          {project.description && (
            <Stack>
              <H3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-12)', marginBottom: 8 }}>
                Description
              </H3>
              <Text style={{ color: 'var(--color-11)' }}>{project.description}</Text>
            </Stack>
          )}
        </Stack>
      ),
    },
    {
      id: 'requirements',
      label: 'Requirements',
      icon: Shield,
      content: (
        <Stack style={{ gap: 24 }}>
          <Stack>
            <H3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-12)', marginBottom: 16 }}>
              Insurance Requirements
            </H3>
            {requiredCoverages.length > 0 ? (
              <Stack style={{ gap: 12 }}>
                {requiredCoverages.map((coverage, index) => (
                  <Row
                    key={index}
                    style={{
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 16,
                      backgroundColor: 'var(--color-backgroundHover)',
                      borderRadius: 8,
                    }}
                  >
                    <Stack>
                      <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                        {coverage.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: 'var(--color-10)', marginTop: 4 }}>
                        Type: {coverage.type}
                      </Text>
                    </Stack>
                    <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-12)' }}>
                      {formatCurrency(coverage.amount)}
                    </Text>
                  </Row>
                ))}
              </Stack>
            ) : (
              <Text style={{ color: 'var(--color-11)' }}>
                No insurance requirements specified
              </Text>
            )}
          </Stack>

          {(project.waiver_of_subrogation_required ||
            project.primary_non_contributory_required ||
            project.additional_insureds?.length ||
            project.certificate_holder) && (
            <Stack>
              <H3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-12)', marginBottom: 16 }}>
                Additional Requirements
              </H3>
              <Stack style={{ gap: 12 }}>
                {project.waiver_of_subrogation_required && (
                  <Row style={{ alignItems: 'center', gap: 8, padding: 12, backgroundColor: 'var(--color-yellow2)', border: '1px solid var(--color-yellow6)', borderRadius: 8 }}>
                    <CheckCircle size={16} color="var(--color-yellow11)" />
                    <Text style={{ fontSize: 14, color: 'var(--color-yellow12)' }}>
                      Waiver of Subrogation Required
                    </Text>
                  </Row>
                )}
                {project.primary_non_contributory_required && (
                  <Row style={{ alignItems: 'center', gap: 8, padding: 12, backgroundColor: 'var(--color-yellow2)', border: '1px solid var(--color-yellow6)', borderRadius: 8 }}>
                    <CheckCircle size={16} color="var(--color-yellow11)" />
                    <Text style={{ fontSize: 14, color: 'var(--color-yellow12)' }}>
                      Primary & Non-Contributory Required
                    </Text>
                  </Row>
                )}
                {project.additional_insureds &&
                  project.additional_insureds.length > 0 && (
                    <Card style={{ padding: 12, backgroundColor: 'var(--color-backgroundHover)', borderRadius: 8 }}>
                      <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)', marginBottom: 8 }}>
                        Additional Insureds:
                      </Text>
                      <Stack style={{ gap: 4 }}>
                        {project.additional_insureds.map((insured, index) => (
                          <Text
                            key={index}
                            style={{ fontSize: 14, color: 'var(--color-11)' }}
                          >
                            - {insured}
                          </Text>
                        ))}
                      </Stack>
                    </Card>
                  )}
                {project.certificate_holder && (
                  <Card style={{ padding: 12, backgroundColor: 'var(--color-backgroundHover)', borderRadius: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)', marginBottom: 4 }}>
                      Certificate Holder:
                    </Text>
                    <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
                      {project.certificate_holder}
                    </Text>
                  </Card>
                )}
              </Stack>
            </Stack>
          )}

          {project.special_provisions && (
            <Stack>
              <H3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-12)', marginBottom: 8 }}>
                Special Provisions
              </H3>
              <Text style={{ color: 'var(--color-11)', whiteSpace: 'pre-wrap' }}>
                {project.special_provisions}
              </Text>
            </Stack>
          )}
        </Stack>
      ),
    },
    {
      id: 'participants',
      label: 'Participants',
      icon: Users,
      badge: participants.length,
      content: (
        <Stack style={{ gap: 16 }}>
          {participants.length > 0 ? (
            <Stack style={{ gap: 12 }}>
              {participants.map((participant) => (
                <Row
                  key={participant.id}
                  style={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 16,
                    backgroundColor: 'var(--color-backgroundHover)',
                    borderRadius: 8,
                  }}
                >
                  <Row style={{ alignItems: 'center', gap: 12 }}>
                    <Row
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: 'var(--color-blue10)',
                        borderRadius: 9999,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>
                        {participant.role.charAt(0).toUpperCase()}
                      </Text>
                    </Row>
                    <Stack>
                      <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                        {participant.role}
                      </Text>
                      <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>
                        {participant.status} - Invited{' '}
                        {formatDate(participant.invited_at)}
                      </Text>
                    </Stack>
                  </Row>
                  <Row
                    style={{
                      paddingLeft: 8,
                      paddingRight: 8,
                      paddingTop: 4,
                      paddingBottom: 4,
                      borderRadius: 4,
                      backgroundColor: participant.status === 'accepted' ? 'var(--color-green2)' : 'var(--color-yellow2)',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: 500, color: participant.status === 'accepted' ? 'var(--color-green11)' : 'var(--color-yellow11)' }}>
                      {participant.status}
                    </Text>
                  </Row>
                </Row>
              ))}
            </Stack>
          ) : (
            <Stack style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 32, color: 'var(--color-10)' }}>
              <Users size={32} color="var(--color-10)" style={{ marginBottom: 8 }} />
              <Text>No participants yet</Text>
            </Stack>
          )}
        </Stack>
      ),
    },
    {
      // REQ-279: Compliance tab now shows only user-assigned issues
      id: 'compliance',
      label: 'My Compliance',
      icon: Shield,
      badge: userIssuesCount,
      content: (
        <Stack style={{ gap: 24 }}>
          {compliance && (
            <Row style={{ flexWrap: 'wrap', gap: 16 }}>
              <Card style={{ padding: 16, backgroundColor: 'var(--color-backgroundHover)', borderRadius: 8, flex: 1, minWidth: '30%' }}>
                <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)', marginBottom: 4 }}>
                  Overall Score
                </Text>
                <Text style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-12)' }}>
                  {compliance.overall_score}%
                </Text>
              </Card>
              <Card style={{ padding: 16, backgroundColor: 'var(--color-backgroundHover)', borderRadius: 8, flex: 1, minWidth: '30%' }}>
                <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)', marginBottom: 4 }}>
                  My Issues
                </Text>
                <Text style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-red10)' }}>
                  {userIssuesCount}
                </Text>
              </Card>
              <Card style={{ padding: 16, backgroundColor: 'var(--color-backgroundHover)', borderRadius: 8, flex: 1, minWidth: '30%' }}>
                <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)', marginBottom: 4 }}>
                  Total Issues
                </Text>
                <Text style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-yellow10)' }}>
                  {totalIssuesCount}
                </Text>
              </Card>
            </Row>
          )}

          <Card style={{ padding: 12, backgroundColor: 'var(--color-blue2)', border: '1px solid var(--color-blue6)', borderRadius: 8 }}>
            <Text style={{ fontSize: 14, color: 'var(--color-blue12)' }}>
              Showing issues assigned to you. View{' '}
              <button
                onClick={() => handleTabChange('all-issues')}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
              >
                <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-blue12)', textDecoration: 'underline' }}>
                  All Issues
                </Text>
              </button>{' '}
              to see the complete list.
            </Text>
          </Card>

          {userIssues.length > 0 ? (
            <Stack>
              <H3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-12)', marginBottom: 16 }}>
                Your Open Issues
              </H3>
              <Stack style={{ gap: 12 }}>
                {userIssues.map((issue) => (
                  <Card key={issue.id} style={{ padding: 16, border: '1px solid var(--color-border)', borderRadius: 8 }}>
                    <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Stack style={{ flex: 1 }}>
                        <Row style={{ alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Row
                            style={{
                              paddingLeft: 8,
                              paddingRight: 8,
                              paddingTop: 2,
                              paddingBottom: 2,
                              borderRadius: 4,
                              border: '1px solid',
                              ...getSeverityStyle(issue.severity),
                            }}
                          >
                            <Text style={{ fontSize: 12, fontWeight: 500 }}>
                              {issue.severity.toUpperCase()}
                            </Text>
                          </Row>
                          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                            {issue.title}
                          </Text>
                        </Row>
                        <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
                          {issue.description}
                        </Text>
                      </Stack>
                      <Row
                        style={{
                          paddingLeft: 8,
                          paddingRight: 8,
                          paddingTop: 4,
                          paddingBottom: 4,
                          borderRadius: 4,
                          backgroundColor: issue.status === 'open' ? 'var(--color-blue2)' : 'var(--color-yellow2)',
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: 500, color: issue.status === 'open' ? 'var(--color-blue11)' : 'var(--color-yellow11)' }}>
                          {issue.status}
                        </Text>
                      </Row>
                    </Row>
                    {issue.due_date && (
                      <Text style={{ fontSize: 12, color: 'var(--color-10)', marginTop: 8 }}>
                        Due: {formatDate(issue.due_date)}
                      </Text>
                    )}
                  </Card>
                ))}
              </Stack>
            </Stack>
          ) : (
            <Stack style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 32, color: 'var(--color-10)' }}>
              <CheckCircle size={32} color="var(--color-green10)" style={{ marginBottom: 8 }} />
              <Text style={{ color: 'var(--color-green11)', fontWeight: 500 }}>No issues assigned to you</Text>
              <Text style={{ fontSize: 12, marginTop: 4 }}>
                You have no compliance issues to address in this project.
              </Text>
            </Stack>
          )}
        </Stack>
      ),
    },
    {
      // REQ-279: All Issues tab shows complete unfiltered compliance view
      id: 'all-issues',
      label: 'All Issues',
      icon: List,
      badge: totalIssuesCount,
      content: (
        <Stack style={{ gap: 24 }}>
          {compliance && (
            <Row style={{ flexWrap: 'wrap', gap: 16 }}>
              <Card style={{ padding: 16, backgroundColor: 'var(--color-backgroundHover)', borderRadius: 8, flex: 1, minWidth: '30%' }}>
                <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)', marginBottom: 4 }}>
                  Overall Score
                </Text>
                <Text style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-12)' }}>
                  {compliance.overall_score}%
                </Text>
              </Card>
              <Card style={{ padding: 16, backgroundColor: 'var(--color-backgroundHover)', borderRadius: 8, flex: 1, minWidth: '30%' }}>
                <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)', marginBottom: 4 }}>
                  Total Issues
                </Text>
                <Text style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-red10)' }}>
                  {totalIssuesCount}
                </Text>
              </Card>
              <Card style={{ padding: 16, backgroundColor: 'var(--color-backgroundHover)', borderRadius: 8, flex: 1, minWidth: '30%' }}>
                <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)', marginBottom: 4 }}>
                  Your Issues
                </Text>
                <Text style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-yellow10)' }}>
                  {userIssuesCount}
                </Text>
              </Card>
            </Row>
          )}

          <Card style={{ padding: 12, backgroundColor: 'var(--color-gray2)', border: '1px solid var(--color-gray6)', borderRadius: 8 }}>
            <Text style={{ fontSize: 14, color: 'var(--color-gray11)' }}>
              Showing all {totalIssuesCount} issue{totalIssuesCount !== 1 ? 's' : ''} across all assignees. {userIssuesCount} assigned to you.
            </Text>
          </Card>

          {allOpenIssues.length > 0 ? (
            <Stack>
              <H3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-12)', marginBottom: 16 }}>
                All Open Issues ({allOpenIssues.length})
              </H3>
              <Stack style={{ gap: 12 }}>
                {allOpenIssues.map((issue) => (
                  <Card
                    key={issue.id}
                    style={{
                      padding: 16,
                      border: `1px solid ${issue.assigned_to === currentUser?.id ? 'var(--color-blue6)' : 'var(--color-border)'}`,
                      backgroundColor: issue.assigned_to === currentUser?.id ? 'var(--color-blue2)' : undefined,
                      borderRadius: 8,
                      opacity: issue.assigned_to === currentUser?.id ? 0.3 : 1,
                    }}
                  >
                    <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Stack style={{ flex: 1 }}>
                        <Row style={{ alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Row
                            style={{
                              paddingLeft: 8,
                              paddingRight: 8,
                              paddingTop: 2,
                              paddingBottom: 2,
                              borderRadius: 4,
                              border: '1px solid',
                              ...getSeverityStyle(issue.severity),
                            }}
                          >
                            <Text style={{ fontSize: 12, fontWeight: 500 }}>
                              {issue.severity.toUpperCase()}
                            </Text>
                          </Row>
                          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                            {issue.title}
                          </Text>
                          {issue.assigned_to === currentUser?.id && (
                            <Row style={{ paddingLeft: 6, paddingRight: 6, paddingTop: 2, paddingBottom: 2, borderRadius: 4, backgroundColor: 'var(--color-blue2)' }}>
                              <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-blue11)' }}>
                                Yours
                              </Text>
                            </Row>
                          )}
                        </Row>
                        <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
                          {issue.description}
                        </Text>
                      </Stack>
                      <Row
                        style={{
                          paddingLeft: 8,
                          paddingRight: 8,
                          paddingTop: 4,
                          paddingBottom: 4,
                          borderRadius: 4,
                          backgroundColor: issue.status === 'open' ? 'var(--color-blue2)' : 'var(--color-yellow2)',
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: 500, color: issue.status === 'open' ? 'var(--color-blue11)' : 'var(--color-yellow11)' }}>
                          {issue.status}
                        </Text>
                      </Row>
                    </Row>
                    {issue.due_date && (
                      <Text style={{ fontSize: 12, color: 'var(--color-10)', marginTop: 8 }}>
                        Due: {formatDate(issue.due_date)}
                      </Text>
                    )}
                  </Card>
                ))}
              </Stack>
            </Stack>
          ) : (
            <Stack style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 32, color: 'var(--color-10)' }}>
              <CheckCircle size={32} color="var(--color-green10)" style={{ marginBottom: 8 }} />
              <Text style={{ color: 'var(--color-green11)', fontWeight: 500 }}>No compliance issues</Text>
              <Text style={{ fontSize: 12, marginTop: 4 }}>
                This project has no open compliance issues.
              </Text>
            </Stack>
          )}
        </Stack>
      ),
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      content: (
        <Stack style={{ gap: 16 }}>
          <Stack style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 32, color: 'var(--color-10)' }}>
            <FileText size={32} color="var(--color-10)" style={{ marginBottom: 8 }} />
            <Text>Document management coming soon</Text>
            <Text style={{ fontSize: 12, marginTop: 4 }}>
              This will show all project-related documents (COIs, endorsements,
              contracts)
            </Text>
          </Stack>
        </Stack>
      ),
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckCircle,
      badge: tasks.length,
      content: (
        <Stack style={{ gap: 16 }}>
          {tasks.length > 0 ? (
            <Stack style={{ gap: 12 }}>
              {tasks.map((task) => (
                <Row
                  key={task.id}
                  style={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 16,
                    backgroundColor: 'var(--color-backgroundHover)',
                    borderRadius: 8,
                  }}
                >
                  <Stack style={{ flex: 1 }}>
                    <Row style={{ alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                        {task.title}
                      </Text>
                      <Row
                        style={{
                          paddingLeft: 8,
                          paddingRight: 8,
                          paddingTop: 2,
                          paddingBottom: 2,
                          borderRadius: 4,
                          ...getStatusStyle(task.status),
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: 500 }}>
                          {task.status.replace('_', ' ')}
                        </Text>
                      </Row>
                    </Row>
                    {task.description && (
                      <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
                        {task.description}
                      </Text>
                    )}
                    {task.due_date && (
                      <Text style={{ fontSize: 12, color: 'var(--color-10)', marginTop: 4 }}>
                        Due: {formatDate(task.due_date)}
                      </Text>
                    )}
                  </Stack>
                </Row>
              ))}
            </Stack>
          ) : (
            <Stack style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 32, color: 'var(--color-10)' }}>
              <CheckCircle size={32} color="var(--color-10)" style={{ marginBottom: 8 }} />
              <Text>No tasks yet</Text>
            </Stack>
          )}
        </Stack>
      ),
    },
    {
      id: 'history',
      label: 'History',
      icon: HistoryIcon,
      content: (
        <Stack style={{ gap: 16 }}>
          <Stack style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 32, color: 'var(--color-10)' }}>
            <HistoryIcon size={32} color="var(--color-10)" style={{ marginBottom: 8 }} />
            <Text>Activity log coming soon</Text>
            <Text style={{ fontSize: 12, marginTop: 4 }}>
              This will show project activity with timestamps and user actions
            </Text>
          </Stack>
        </Stack>
      ),
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: MessageSquare,
      badge: projectComments.length,
      content: (
        <Stack style={{ gap: 16 }}>
          {projectComments.length > 0 ? (
            <Stack style={{ gap: 12 }}>
              {projectComments.map((comment) => (
                <Card
                  key={comment.id}
                  style={{ padding: 16, backgroundColor: 'var(--color-backgroundHover)', borderRadius: 8 }}
                >
                  <Row style={{ alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Row
                      style={{
                        width: 32,
                        height: 32,
                        backgroundColor: 'var(--color-blue10)',
                        borderRadius: 9999,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>
                        {comment.user_id.charAt(0).toUpperCase()}
                      </Text>
                    </Row>
                    <Stack style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                        User {comment.user_id.substring(0, 8)}
                      </Text>
                      <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>
                        {formatDate(comment.created_at)}
                      </Text>
                    </Stack>
                  </Row>
                  <Text style={{ fontSize: 14, color: 'var(--color-11)', whiteSpace: 'pre-wrap' }}>
                    {comment.content}
                  </Text>
                </Card>
              ))}
            </Stack>
          ) : (
            <Stack style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 32, color: 'var(--color-10)' }}>
              <MessageSquare size={32} color="var(--color-10)" style={{ marginBottom: 8 }} />
              <Text>No notes yet</Text>
            </Stack>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Stack style={{ gap: 24 }}>
      {/* Header */}
      <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Row style={{ alignItems: 'center', gap: 16 }}>
          <Button
            variant="ghost"
            onPress={() => navigate(-1)}
            leftIcon={ArrowLeft}
            size="$2"
          >
            Back
          </Button>
          <Stack>
            <H1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-12)' }}>
              {project.name}
            </H1>
            <Row style={{ alignItems: 'center', gap: 16, marginTop: 4 }}>
              <Row
                style={{
                  alignItems: 'center',
                  paddingLeft: 8,
                  paddingRight: 8,
                  paddingTop: 2,
                  paddingBottom: 2,
                  borderRadius: 4,
                  border: '1px solid',
                  ...getComplianceStatusStyle(project.compliance_status),
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: 500 }}>
                  {project.compliance_status}
                </Text>
              </Row>
              {/* REQ-279: Warning badge with tooltip showing issue breakdown */}
              {totalIssuesCount > 0 && (
                <Tooltip
                  content={`${totalIssuesCount} total ${totalIssuesCount === 1 ? 'issue' : 'issues'} (${userIssuesCount} yours, ${othersIssuesCount} assigned to others)`}
                  position="bottom"
                >
                  <Row
                    style={{
                      alignItems: 'center',
                      gap: 4,
                      paddingLeft: 8,
                      paddingRight: 8,
                      paddingTop: 2,
                      paddingBottom: 2,
                      borderRadius: 4,
                      backgroundColor: 'var(--color-yellow2)',
                      border: '1px solid var(--color-yellow6)',
                      cursor: 'help',
                    }}
                    data-testid="warning-badge"
                  >
                    <AlertTriangle size={12} />
                    <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-yellow11)' }}>
                      {totalIssuesCount} {totalIssuesCount === 1 ? 'Issue' : 'Issues'}
                    </Text>
                  </Row>
                </Tooltip>
              )}
              {project.location && (
                <Row style={{ alignItems: 'center', gap: 4 }}>
                  <MapPin size={14} />
                  <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
                    {project.location}
                  </Text>
                </Row>
              )}
            </Row>
          </Stack>
        </Row>
      </Row>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {tabs.map(tab => (
          <Tabs.Item key={tab.id} value={tab.id}>
            <Tabs.Trigger>{tab.label}</Tabs.Trigger>
            <Tabs.Content>{tab.content}</Tabs.Content>
          </Tabs.Item>
        ))}
      </Tabs>
    </Stack>
  );
}
