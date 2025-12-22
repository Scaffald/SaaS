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
import { YStack, XStack, Text, H1, H2, H3, Card, Spinner, Button as TamaguiButton } from '@unicornlove/ui';
import { TabsCustom } from '@unicornlove/ui';
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

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return { backgroundColor: '$green2', color: '$green11', borderColor: '$green6' };
      case 'warning':
        return { backgroundColor: '$yellow2', color: '$yellow11', borderColor: '$yellow6' };
      case 'critical':
        return { backgroundColor: '$red2', color: '$red11', borderColor: '$red6' };
      case 'non_compliant':
        return { backgroundColor: '$red2', color: '$red11', borderColor: '$red6' };
      default:
        return { backgroundColor: '$gray2', color: '$gray11', borderColor: '$gray6' };
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { backgroundColor: '$red2', color: '$red11', borderColor: '$red6' };
      case 'high':
        return { backgroundColor: '$yellow2', color: '$yellow11', borderColor: '$yellow6' };
      case 'medium':
        return { backgroundColor: '$blue2', color: '$blue11', borderColor: '$blue6' };
      case 'low':
        return { backgroundColor: '$gray2', color: '$gray11', borderColor: '$gray6' };
      default:
        return { backgroundColor: '$gray2', color: '$gray11', borderColor: '$gray6' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { backgroundColor: '$green2', color: '$green11' };
      case 'in_progress':
        return { backgroundColor: '$blue2', color: '$blue11' };
      case 'pending':
        return { backgroundColor: '$yellow2', color: '$yellow11' };
      case 'blocked':
        return { backgroundColor: '$red2', color: '$red11' };
      default:
        return { backgroundColor: '$gray2', color: '$gray11' };
    }
  };

  if (loading) {
    return (
      <YStack gap="$6">
        <YStack height={32} backgroundColor="$backgroundHover" borderRadius="$4" opacity={0.5} />
        <YStack height={256} backgroundColor="$backgroundHover" borderRadius="$4" opacity={0.5} />
      </YStack>
    );
  }

  if (error || !project) {
    return (
      <YStack alignItems="center" paddingVertical="$12">
        <AlertCircle size={48} color="$red10" mb="$4" />
        <H3 mb="$2">Project not found</H3>
        <Text color="$color11" mb="$4">
          {error?.message || 'The project you are looking for does not exist.'}
        </Text>
        <Button onClick={() => navigate(-1)} leftIcon={ArrowLeft}>
          Go Back
        </Button>
      </YStack>
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
        <YStack gap="$6">
          <XStack flexWrap="wrap" gap="$4">
            <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4" flex={1} minWidth="45%">
              <XStack alignItems="center" gap="$2" mb="$2">
                <Calendar size={18} color="$color10" />
                <Text fontSize="$3" fontWeight="500" color="$color11">
                  Start Date
                </Text>
              </XStack>
              <Text fontSize="$4" fontWeight="600" color="$color12">
                {formatDate(project.start_date)}
              </Text>
            </Card>
            <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4" flex={1} minWidth="45%">
              <XStack alignItems="center" gap="$2" mb="$2">
                <Calendar size={18} color="$color10" />
                <Text fontSize="$3" fontWeight="500" color="$color11">
                  End Date
                </Text>
              </XStack>
              <Text fontSize="$4" fontWeight="600" color="$color12">
                {formatDate(project.end_date)}
              </Text>
            </Card>
            {project.location && (
              <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4" flex={1} minWidth="45%">
                <XStack alignItems="center" gap="$2" mb="$2">
                  <MapPin size={18} color="$color10" />
                  <Text fontSize="$3" fontWeight="500" color="$color11">
                    Location
                  </Text>
                </XStack>
                <Text fontSize="$4" fontWeight="600" color="$color12">
                  {project.location}
                </Text>
              </Card>
            )}
            {project.contract_value && (
              <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4" flex={1} minWidth="45%">
                <XStack alignItems="center" gap="$2" mb="$2">
                  <Building size={18} color="$color10" />
                  <Text fontSize="$3" fontWeight="500" color="$color11">
                    Contract Value
                  </Text>
                </XStack>
                <Text fontSize="$4" fontWeight="600" color="$color12">
                  {formatCurrency(project.contract_value)}
                </Text>
              </Card>
            )}
            {project.project_manager && (
              <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4" flex={1} minWidth="45%">
                <XStack alignItems="center" gap="$2" mb="$2">
                  <Users size={18} color="$color10" />
                  <Text fontSize="$3" fontWeight="500" color="$color11">
                    Project Manager
                  </Text>
                </XStack>
                <Text fontSize="$4" fontWeight="600" color="$color12">
                  {project.project_manager}
                </Text>
              </Card>
            )}
            <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4" flex={1} minWidth="45%">
              <XStack alignItems="center" gap="$2" mb="$2">
                <Shield size={18} color="$color10" />
                <Text fontSize="$3" fontWeight="500" color="$color11">
                  Compliance Status
                </Text>
              </XStack>
              <XStack
                alignItems="center"
                paddingHorizontal="$2"
                paddingVertical="$1"
                borderRadius="$2"
                borderWidth={1}
                {...getComplianceStatusColor(project.compliance_status)}
              >
                <Text fontSize="$2" fontWeight="500">
                {project.compliance_status}
                </Text>
              </XStack>
            </Card>
          </XStack>
          {project.description && (
            <YStack>
              <H3 fontSize="$3" fontWeight="600" color="$color12" mb="$2">
                Description
              </H3>
              <Text color="$color11">{project.description}</Text>
            </YStack>
          )}
        </YStack>
      ),
    },
    {
      id: 'requirements',
      label: 'Requirements',
      icon: Shield,
      content: (
        <YStack gap="$6">
          <YStack>
            <H3 fontSize="$3" fontWeight="600" color="$color12" mb="$4">
              Insurance Requirements
            </H3>
            {requiredCoverages.length > 0 ? (
              <YStack gap="$3">
                {requiredCoverages.map((coverage, index) => (
                  <XStack
                    key={index}
                    alignItems="center"
                    justifyContent="space-between"
                    padding="$4"
                    backgroundColor="$backgroundHover"
                    borderRadius="$4"
                  >
                    <YStack>
                      <Text fontSize="$3" fontWeight="500" color="$color12">
                        {coverage.name}
                      </Text>
                      <Text fontSize="$2" color="$color10" mt="$1">
                        Type: {coverage.type}
                      </Text>
                    </YStack>
                    <Text fontSize="$3" fontWeight="600" color="$color12">
                      {formatCurrency(coverage.amount)}
                    </Text>
                  </XStack>
                ))}
              </YStack>
            ) : (
              <Text color="$color11">
                No insurance requirements specified
              </Text>
            )}
          </YStack>

          {(project.waiver_of_subrogation_required ||
            project.primary_non_contributory_required ||
            project.additional_insureds?.length ||
            project.certificate_holder) && (
            <YStack>
              <H3 fontSize="$3" fontWeight="600" color="$color12" mb="$4">
                Additional Requirements
              </H3>
              <YStack gap="$3">
                {project.waiver_of_subrogation_required && (
                  <XStack alignItems="center" gap="$2" padding="$3" backgroundColor="$yellow2" borderWidth={1} borderColor="$yellow6" borderRadius="$4">
                    <CheckCircle size={16} color="$yellow11" />
                    <Text fontSize="$3" color="$yellow12">
                      Waiver of Subrogation Required
                    </Text>
                  </XStack>
                )}
                {project.primary_non_contributory_required && (
                  <XStack alignItems="center" gap="$2" padding="$3" backgroundColor="$yellow2" borderWidth={1} borderColor="$yellow6" borderRadius="$4">
                    <CheckCircle size={16} color="$yellow11" />
                    <Text fontSize="$3" color="$yellow12">
                      Primary & Non-Contributory Required
                    </Text>
                  </XStack>
                )}
                {project.additional_insureds &&
                  project.additional_insureds.length > 0 && (
                    <Card padding="$3" backgroundColor="$backgroundHover" borderRadius="$4">
                      <Text fontSize="$3" fontWeight="500" color="$color12" mb="$2">
                        Additional Insureds:
                      </Text>
                      <YStack gap="$1">
                        {project.additional_insureds.map((insured, index) => (
                          <Text
                            key={index}
                            fontSize="$3"
                            color="$color11"
                          >
                            • {insured}
                          </Text>
                        ))}
                      </YStack>
                    </Card>
                  )}
                {project.certificate_holder && (
                  <Card padding="$3" backgroundColor="$backgroundHover" borderRadius="$4">
                    <Text fontSize="$3" fontWeight="500" color="$color12" mb="$1">
                      Certificate Holder:
                    </Text>
                    <Text fontSize="$3" color="$color11">
                      {project.certificate_holder}
                    </Text>
                  </Card>
                )}
              </YStack>
            </YStack>
          )}

          {project.special_provisions && (
            <YStack>
              <H3 fontSize="$3" fontWeight="600" color="$color12" mb="$2">
                Special Provisions
              </H3>
              <Text color="$color11" whiteSpace="pre-wrap">
                {project.special_provisions}
              </Text>
            </YStack>
          )}
        </YStack>
      ),
    },
    {
      id: 'participants',
      label: 'Participants',
      icon: Users,
      badge: participants.length,
      content: (
        <YStack gap="$4">
          {participants.length > 0 ? (
            <YStack gap="$3">
              {participants.map((participant) => (
                <XStack
                  key={participant.id}
                  alignItems="center"
                  justifyContent="space-between"
                  padding="$4"
                  backgroundColor="$backgroundHover"
                  borderRadius="$4"
                >
                  <XStack alignItems="center" gap="$3">
                    <XStack
                      width={40}
                      height={40}
                      backgroundColor="$blue10"
                      borderRadius={9999}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text fontSize="$3" fontWeight="600" color="white">
                        {participant.role.charAt(0).toUpperCase()}
                      </Text>
                    </XStack>
                    <YStack>
                      <Text fontSize="$3" fontWeight="500" color="$color12">
                        {participant.role}
                      </Text>
                      <Text fontSize="$2" color="$color10">
                        {participant.status} • Invited{' '}
                        {formatDate(participant.invited_at)}
                      </Text>
                    </YStack>
                  </XStack>
                  <XStack
                    paddingHorizontal="$2"
                    paddingVertical="$1"
                    borderRadius="$2"
                    backgroundColor={participant.status === 'accepted' ? '$green2' : '$yellow2'}
                  >
                    <Text fontSize="$2" fontWeight="500" color={participant.status === 'accepted' ? '$green11' : '$yellow11'}>
                    {participant.status}
                    </Text>
                  </XStack>
                </XStack>
              ))}
            </YStack>
          ) : (
            <YStack alignItems="center" paddingVertical="$8" color="$color10">
              <Users size={32} color="$color10" mb="$2" />
              <Text>No participants yet</Text>
            </YStack>
          )}
        </YStack>
      ),
    },
    {
      // REQ-279: Compliance tab now shows only user-assigned issues
      id: 'compliance',
      label: 'My Compliance',
      icon: Shield,
      badge: userIssuesCount,
      content: (
        <YStack gap="$6">
          {compliance && (
            <XStack flexWrap="wrap" gap="$4">
              <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4" flex={1} minWidth="30%">
                <Text fontSize="$3" fontWeight="500" color="$color11" mb="$1">
                  Overall Score
                </Text>
                <Text fontSize="$8" fontWeight="700" color="$color12">
                  {compliance.overall_score}%
                </Text>
              </Card>
              <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4" flex={1} minWidth="30%">
                <Text fontSize="$3" fontWeight="500" color="$color11" mb="$1">
                  My Issues
                </Text>
                <Text fontSize="$8" fontWeight="700" color="$red10">
                  {userIssuesCount}
                </Text>
              </Card>
              <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4" flex={1} minWidth="30%">
                <Text fontSize="$3" fontWeight="500" color="$color11" mb="$1">
                  Total Issues
                </Text>
                <Text fontSize="$8" fontWeight="700" color="$yellow10">
                  {totalIssuesCount}
                </Text>
              </Card>
            </XStack>
          )}

          <Card padding="$3" backgroundColor="$blue2" borderWidth={1} borderColor="$blue6" borderRadius="$4">
            <Text fontSize="$3" color="$blue12">
              Showing issues assigned to you. View{' '}
              <TamaguiButton
                unstyled
                onPress={() => handleTabChange('all-issues')}
                style={{ textDecorationLine: 'underline' }}
              >
                <Text fontSize="$3" fontWeight="500" color="$blue12" textDecorationLine="underline">
                  All Issues
                </Text>
              </TamaguiButton>{' '}
              to see the complete list.
            </Text>
          </Card>

          {userIssues.length > 0 ? (
            <YStack>
              <H3 fontSize="$3" fontWeight="600" color="$color12" mb="$4">
                Your Open Issues
              </H3>
              <YStack gap="$3">
                {userIssues.map((issue) => (
                  <Card key={issue.id} padding="$4" borderWidth={1} borderColor="$borderColor" borderRadius="$4">
                    <XStack alignItems="flex-start" justifyContent="space-between" mb="$2">
                      <YStack flex={1}>
                        <XStack alignItems="center" gap="$2" mb="$1">
                          <XStack
                            paddingHorizontal="$2"
                            paddingVertical="$0.5"
                            borderRadius="$2"
                            borderWidth={1}
                            {...getSeverityColor(issue.severity)}
                          >
                            <Text fontSize="$2" fontWeight="500">
                              {issue.severity.toUpperCase()}
                            </Text>
                          </XStack>
                          <Text fontSize="$3" fontWeight="500" color="$color12">
                              {issue.title}
                          </Text>
                        </XStack>
                        <Text fontSize="$3" color="$color11">
                            {issue.description}
                        </Text>
                      </YStack>
                      <XStack
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$2"
                        backgroundColor={issue.status === 'open' ? '$blue2' : '$yellow2'}
                      >
                        <Text fontSize="$2" fontWeight="500" color={issue.status === 'open' ? '$blue11' : '$yellow11'}>
                          {issue.status}
                        </Text>
                      </XStack>
                    </XStack>
                      {issue.due_date && (
                      <Text fontSize="$2" color="$color10" mt="$2">
                          Due: {formatDate(issue.due_date)}
                      </Text>
                    )}
                  </Card>
                ))}
              </YStack>
            </YStack>
          ) : (
            <YStack alignItems="center" paddingVertical="$8" color="$color10">
              <CheckCircle size={32} color="$green10" mb="$2" />
              <Text color="$green11" fontWeight="500">No issues assigned to you</Text>
              <Text fontSize="$2" mt="$1">
                You have no compliance issues to address in this project.
              </Text>
            </YStack>
          )}
        </YStack>
      ),
    },
    {
      // REQ-279: All Issues tab shows complete unfiltered compliance view
      id: 'all-issues',
      label: 'All Issues',
      icon: List,
      badge: totalIssuesCount,
      content: (
        <YStack gap="$6">
          {compliance && (
            <XStack flexWrap="wrap" gap="$4">
              <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4" flex={1} minWidth="30%">
                <Text fontSize="$3" fontWeight="500" color="$color11" mb="$1">
                  Overall Score
                </Text>
                <Text fontSize="$8" fontWeight="700" color="$color12">
                  {compliance.overall_score}%
                </Text>
              </Card>
              <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4" flex={1} minWidth="30%">
                <Text fontSize="$3" fontWeight="500" color="$color11" mb="$1">
                  Total Issues
                </Text>
                <Text fontSize="$8" fontWeight="700" color="$red10">
                  {totalIssuesCount}
                </Text>
              </Card>
              <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4" flex={1} minWidth="30%">
                <Text fontSize="$3" fontWeight="500" color="$color11" mb="$1">
                  Your Issues
                </Text>
                <Text fontSize="$8" fontWeight="700" color="$yellow10">
                  {userIssuesCount}
                </Text>
              </Card>
            </XStack>
          )}

          <Card padding="$3" backgroundColor="$gray2" borderWidth={1} borderColor="$gray6" borderRadius="$4">
            <Text fontSize="$3" color="$gray11">
            Showing all {totalIssuesCount} issue{totalIssuesCount !== 1 ? 's' : ''} across all assignees. {userIssuesCount} assigned to you.
            </Text>
          </Card>

          {allOpenIssues.length > 0 ? (
            <YStack>
              <H3 fontSize="$3" fontWeight="600" color="$color12" mb="$4">
                All Open Issues ({allOpenIssues.length})
              </H3>
              <YStack gap="$3">
                {allOpenIssues.map((issue) => (
                  <Card
                    key={issue.id}
                    padding="$4"
                    borderWidth={1}
                    borderColor={issue.assigned_to === currentUser?.id ? '$blue6' : '$borderColor'}
                    backgroundColor={issue.assigned_to === currentUser?.id ? '$blue2' : undefined}
                    borderRadius="$4"
                    opacity={issue.assigned_to === currentUser?.id ? 0.3 : 1}
                  >
                    <XStack alignItems="flex-start" justifyContent="space-between" mb="$2">
                      <YStack flex={1}>
                        <XStack alignItems="center" gap="$2" mb="$1">
                          <XStack
                            paddingHorizontal="$2"
                            paddingVertical="$0.5"
                            borderRadius="$2"
                            borderWidth={1}
                            {...getSeverityColor(issue.severity)}
                          >
                            <Text fontSize="$2" fontWeight="500">
                              {issue.severity.toUpperCase()}
                            </Text>
                          </XStack>
                          <Text fontSize="$3" fontWeight="500" color="$color12">
                              {issue.title}
                          </Text>
                            {issue.assigned_to === currentUser?.id && (
                            <XStack paddingHorizontal="$1.5" paddingVertical="$0.5" borderRadius="$2" backgroundColor="$blue2">
                              <Text fontSize="$2" fontWeight="500" color="$blue11">
                                Yours
                              </Text>
                            </XStack>
                            )}
                        </XStack>
                        <Text fontSize="$3" color="$color11">
                            {issue.description}
                        </Text>
                      </YStack>
                      <XStack
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$2"
                        backgroundColor={issue.status === 'open' ? '$blue2' : '$yellow2'}
                      >
                        <Text fontSize="$2" fontWeight="500" color={issue.status === 'open' ? '$blue11' : '$yellow11'}>
                          {issue.status}
                        </Text>
                      </XStack>
                    </XStack>
                      {issue.due_date && (
                      <Text fontSize="$2" color="$color10" mt="$2">
                          Due: {formatDate(issue.due_date)}
                      </Text>
                    )}
                  </Card>
                ))}
              </YStack>
            </YStack>
          ) : (
            <YStack alignItems="center" paddingVertical="$8" color="$color10">
              <CheckCircle size={32} color="$green10" mb="$2" />
              <Text color="$green11" fontWeight="500">No compliance issues</Text>
              <Text fontSize="$2" mt="$1">
                This project has no open compliance issues.
              </Text>
            </YStack>
          )}
        </YStack>
      ),
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      content: (
        <YStack gap="$4">
          <YStack alignItems="center" paddingVertical="$8" color="$color10">
            <FileText size={32} color="$color10" mb="$2" />
            <Text>Document management coming soon</Text>
            <Text fontSize="$2" mt="$1">
              This will show all project-related documents (COIs, endorsements,
              contracts)
            </Text>
          </YStack>
        </YStack>
      ),
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckCircle,
      badge: tasks.length,
      content: (
        <YStack gap="$4">
          {tasks.length > 0 ? (
            <YStack gap="$3">
              {tasks.map((task) => (
                <XStack
                  key={task.id}
                  alignItems="center"
                  justifyContent="space-between"
                  padding="$4"
                  backgroundColor="$backgroundHover"
                  borderRadius="$4"
                >
                  <YStack flex={1}>
                    <XStack alignItems="center" gap="$2" mb="$1">
                      <Text fontSize="$3" fontWeight="500" color="$color12">
                        {task.title}
                      </Text>
                      <XStack
                        paddingHorizontal="$2"
                        paddingVertical="$0.5"
                        borderRadius="$2"
                        {...getStatusColor(task.status)}
                      >
                        <Text fontSize="$2" fontWeight="500">
                        {task.status.replace('_', ' ')}
                        </Text>
                      </XStack>
                    </XStack>
                    {task.description && (
                      <Text fontSize="$3" color="$color11">
                        {task.description}
                      </Text>
                    )}
                    {task.due_date && (
                      <Text fontSize="$2" color="$color10" mt="$1">
                        Due: {formatDate(task.due_date)}
                      </Text>
                    )}
                  </YStack>
                </XStack>
              ))}
            </YStack>
          ) : (
            <YStack alignItems="center" paddingVertical="$8" color="$color10">
              <CheckCircle size={32} color="$color10" mb="$2" />
              <Text>No tasks yet</Text>
            </YStack>
          )}
        </YStack>
      ),
    },
    {
      id: 'history',
      label: 'History',
      icon: HistoryIcon,
      content: (
        <YStack gap="$4">
          <YStack alignItems="center" paddingVertical="$8" color="$color10">
            <HistoryIcon size={32} color="$color10" mb="$2" />
            <Text>Activity log coming soon</Text>
            <Text fontSize="$2" mt="$1">
              This will show project activity with timestamps and user actions
            </Text>
          </YStack>
        </YStack>
      ),
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: MessageSquare,
      badge: projectComments.length,
      content: (
        <YStack gap="$4">
          {projectComments.length > 0 ? (
            <YStack gap="$3">
              {projectComments.map((comment) => (
                <Card
                  key={comment.id}
                  padding="$4"
                  backgroundColor="$backgroundHover"
                  borderRadius="$4"
                >
                  <XStack alignItems="center" gap="$2" mb="$2">
                    <XStack
                      width={32}
                      height={32}
                      backgroundColor="$blue10"
                      borderRadius={9999}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text fontSize="$2" fontWeight="600" color="white">
                        {comment.user_id.charAt(0).toUpperCase()}
                      </Text>
                    </XStack>
                    <YStack flex={1}>
                      <Text fontSize="$3" fontWeight="500" color="$color12">
                        User {comment.user_id.substring(0, 8)}
                      </Text>
                      <Text fontSize="$2" color="$color10">
                        {formatDate(comment.created_at)}
                      </Text>
                    </YStack>
                  </XStack>
                  <Text fontSize="$3" color="$color11" whiteSpace="pre-wrap">
                    {comment.content}
                  </Text>
                </Card>
              ))}
            </YStack>
          ) : (
            <YStack alignItems="center" paddingVertical="$8" color="$color10">
              <MessageSquare size={32} color="$color10" mb="$2" />
              <Text>No notes yet</Text>
            </YStack>
          )}
        </YStack>
      ),
    },
  ];

  return (
    <YStack gap="$6">
      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap="$4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            leftIcon={ArrowLeft}
            size="$2"
          >
            Back
          </Button>
          <YStack>
            <H1 fontSize="$8" fontWeight="700" color="$color12">
              {project.name}
            </H1>
            <XStack alignItems="center" gap="$4" mt="$1">
              <XStack
                alignItems="center"
                paddingHorizontal="$2"
                paddingVertical="$0.5"
                borderRadius="$2"
                borderWidth={1}
                {...getComplianceStatusColor(project.compliance_status)}
              >
                <Text fontSize="$2" fontWeight="500">
                {project.compliance_status}
                </Text>
              </XStack>
              {/* REQ-279: Warning badge with tooltip showing issue breakdown */}
              {totalIssuesCount > 0 && (
                <Tooltip
                  content={`${totalIssuesCount} total ${totalIssuesCount === 1 ? 'issue' : 'issues'} (${userIssuesCount} yours, ${othersIssuesCount} assigned to others)`}
                  position="bottom"
                >
                  <XStack
                    alignItems="center"
                    gap="$1"
                    paddingHorizontal="$2"
                    paddingVertical="$0.5"
                    borderRadius="$2"
                    backgroundColor="$yellow2"
                    borderWidth={1}
                    borderColor="$yellow6"
                    cursor="help"
                    data-testid="warning-badge"
                  >
                    <AlertTriangle size={12} />
                    <Text fontSize="$2" fontWeight="500" color="$yellow11">
                    {totalIssuesCount} {totalIssuesCount === 1 ? 'Issue' : 'Issues'}
                    </Text>
                  </XStack>
                </Tooltip>
              )}
              {project.location && (
                <XStack alignItems="center" gap="$1">
                  <MapPin size={14} />
                  <Text fontSize="$3" color="$color11">
                    {project.location}
                  </Text>
                </XStack>
              )}
            </XStack>
          </YStack>
        </XStack>
      </XStack>

      {/* Tabs */}
      <TabsCustom tabs={tabs} variant="enclosed" activeTab={activeTab} onChange={handleTabChange} />
    </YStack>
  );
}
