import React, { useEffect, useState, useMemo } from 'react';
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
import Tabs from '../../ui/Tabs';
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
        return 'bg-success-100 text-success-700 border-success-300';
      case 'warning':
        return 'bg-warning-100 text-warning-700 border-warning-300';
      case 'critical':
        return 'bg-error-100 text-error-700 border-error-300';
      case 'non_compliant':
        return 'bg-error-100 text-error-700 border-error-300';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-300';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-error-100 text-error-700 border-error-300';
      case 'high':
        return 'bg-warning-100 text-warning-700 border-warning-300';
      case 'medium':
        return 'bg-primary-100 text-primary-700 border-primary-300';
      case 'low':
        return 'bg-neutral-100 text-neutral-700 border-neutral-300';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-700';
      case 'in_progress':
        return 'bg-primary-100 text-primary-700';
      case 'pending':
        return 'bg-warning-100 text-warning-700';
      case 'blocked':
        return 'bg-error-100 text-error-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-surface-secondary rounded animate-pulse"></div>
        <div className="h-64 bg-surface-secondary rounded animate-pulse"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="mx-auto text-error-500 mb-4" size={48} />
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Project not found
        </h3>
        <p className="text-text-secondary mb-4">
          {error?.message || 'The project you are looking for does not exist.'}
        </p>
        <Button onClick={() => navigate(-1)} leftIcon={ArrowLeft}>
          Go Back
        </Button>
      </div>
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-bg-secondary rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="text-text-tertiary" size={18} />
                <span className="text-sm font-medium text-text-secondary">
                  Start Date
                </span>
              </div>
              <p className="text-base font-semibold text-text-primary">
                {formatDate(project.start_date)}
              </p>
            </div>
            <div className="p-4 bg-bg-secondary rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="text-text-tertiary" size={18} />
                <span className="text-sm font-medium text-text-secondary">
                  End Date
                </span>
              </div>
              <p className="text-base font-semibold text-text-primary">
                {formatDate(project.end_date)}
              </p>
            </div>
            {project.location && (
              <div className="p-4 bg-bg-secondary rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <MapPin className="text-text-tertiary" size={18} />
                  <span className="text-sm font-medium text-text-secondary">
                    Location
                  </span>
                </div>
                <p className="text-base font-semibold text-text-primary">
                  {project.location}
                </p>
              </div>
            )}
            {project.contract_value && (
              <div className="p-4 bg-bg-secondary rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Building className="text-text-tertiary" size={18} />
                  <span className="text-sm font-medium text-text-secondary">
                    Contract Value
                  </span>
                </div>
                <p className="text-base font-semibold text-text-primary">
                  {formatCurrency(project.contract_value)}
                </p>
              </div>
            )}
            {project.project_manager && (
              <div className="p-4 bg-bg-secondary rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="text-text-tertiary" size={18} />
                  <span className="text-sm font-medium text-text-secondary">
                    Project Manager
                  </span>
                </div>
                <p className="text-base font-semibold text-text-primary">
                  {project.project_manager}
                </p>
              </div>
            )}
            <div className="p-4 bg-bg-secondary rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="text-text-tertiary" size={18} />
                <span className="text-sm font-medium text-text-secondary">
                  Compliance Status
                </span>
              </div>
              <span
                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getComplianceStatusColor(project.compliance_status)}`}
              >
                {project.compliance_status}
              </span>
            </div>
          </div>
          {project.description && (
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-2">
                Description
              </h3>
              <p className="text-text-secondary">{project.description}</p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'requirements',
      label: 'Requirements',
      icon: Shield,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              Insurance Requirements
            </h3>
            {requiredCoverages.length > 0 ? (
              <div className="space-y-3">
                {requiredCoverages.map((coverage, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {coverage.name}
                      </p>
                      <p className="text-xs text-text-tertiary mt-1">
                        Type: {coverage.type}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-text-primary">
                      {formatCurrency(coverage.amount)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary">
                No insurance requirements specified
              </p>
            )}
          </div>

          {(project.waiver_of_subrogation_required ||
            project.primary_non_contributory_required ||
            project.additional_insureds?.length ||
            project.certificate_holder) && (
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-4">
                Additional Requirements
              </h3>
              <div className="space-y-3">
                {project.waiver_of_subrogation_required && (
                  <div className="flex items-center space-x-2 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                    <CheckCircle className="text-warning-600" size={16} />
                    <span className="text-sm text-warning-900">
                      Waiver of Subrogation Required
                    </span>
                  </div>
                )}
                {project.primary_non_contributory_required && (
                  <div className="flex items-center space-x-2 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                    <CheckCircle className="text-warning-600" size={16} />
                    <span className="text-sm text-warning-900">
                      Primary & Non-Contributory Required
                    </span>
                  </div>
                )}
                {project.additional_insureds &&
                  project.additional_insureds.length > 0 && (
                    <div className="p-3 bg-bg-secondary rounded-lg">
                      <p className="text-sm font-medium text-text-primary mb-2">
                        Additional Insureds:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        {project.additional_insureds.map((insured, index) => (
                          <li
                            key={index}
                            className="text-sm text-text-secondary"
                          >
                            {insured}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                {project.certificate_holder && (
                  <div className="p-3 bg-bg-secondary rounded-lg">
                    <p className="text-sm font-medium text-text-primary mb-1">
                      Certificate Holder:
                    </p>
                    <p className="text-sm text-text-secondary">
                      {project.certificate_holder}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {project.special_provisions && (
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-2">
                Special Provisions
              </h3>
              <p className="text-text-secondary whitespace-pre-wrap">
                {project.special_provisions}
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'participants',
      label: 'Participants',
      icon: Users,
      badge: participants.length,
      content: (
        <div className="space-y-4">
          {participants.length > 0 ? (
            <div className="space-y-3">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-white">
                        {participant.role.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {participant.role}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {participant.status} • Invited{' '}
                        {formatDate(participant.invited_at)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${participant.status === 'accepted' ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'}`}
                  >
                    {participant.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-text-tertiary">
              <Users className="mx-auto mb-2 text-text-tertiary" size={32} />
              <p>No participants yet</p>
            </div>
          )}
        </div>
      ),
    },
    {
      // REQ-279: Compliance tab now shows only user-assigned issues
      id: 'compliance',
      label: 'My Compliance',
      icon: Shield,
      badge: userIssuesCount,
      content: (
        <div className="space-y-6">
          {compliance && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-bg-secondary rounded-lg">
                <p className="text-sm font-medium text-text-secondary mb-1">
                  Overall Score
                </p>
                <p className="text-2xl font-bold text-text-primary">
                  {compliance.overall_score}%
                </p>
              </div>
              <div className="p-4 bg-bg-secondary rounded-lg">
                <p className="text-sm font-medium text-text-secondary mb-1">
                  My Issues
                </p>
                <p className="text-2xl font-bold text-error-600">
                  {userIssuesCount}
                </p>
              </div>
              <div className="p-4 bg-bg-secondary rounded-lg">
                <p className="text-sm font-medium text-text-secondary mb-1">
                  Total Issues
                </p>
                <p className="text-2xl font-bold text-warning-600">
                  {totalIssuesCount}
                </p>
              </div>
            </div>
          )}

          <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-800">
            Showing issues assigned to you. View <button onClick={() => handleTabChange('all-issues')} className="font-medium underline hover:no-underline">All Issues</button> to see the complete list.
          </div>

          {userIssues.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-4">
                Your Open Issues
              </h3>
              <div className="space-y-3">
                {userIssues.map((issue) => (
                    <div key={issue.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded border ${getSeverityColor(issue.severity)}`}
                            >
                              {issue.severity.toUpperCase()}
                            </span>
                            <span className="text-sm font-medium text-text-primary">
                              {issue.title}
                            </span>
                          </div>
                          <p className="text-sm text-text-secondary">
                            {issue.description}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${issue.status === 'open' ? 'bg-primary-100 text-primary-700' : 'bg-warning-100 text-warning-700'}`}
                        >
                          {issue.status}
                        </span>
                      </div>
                      {issue.due_date && (
                        <p className="text-xs text-text-tertiary mt-2">
                          Due: {formatDate(issue.due_date)}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-text-tertiary">
              <CheckCircle className="mx-auto mb-2 text-success-500" size={32} />
              <p className="text-success-600 font-medium">No issues assigned to you</p>
              <p className="text-xs mt-1">
                You have no compliance issues to address in this project.
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      // REQ-279: All Issues tab shows complete unfiltered compliance view
      id: 'all-issues',
      label: 'All Issues',
      icon: List,
      badge: totalIssuesCount,
      content: (
        <div className="space-y-6">
          {compliance && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-bg-secondary rounded-lg">
                <p className="text-sm font-medium text-text-secondary mb-1">
                  Overall Score
                </p>
                <p className="text-2xl font-bold text-text-primary">
                  {compliance.overall_score}%
                </p>
              </div>
              <div className="p-4 bg-bg-secondary rounded-lg">
                <p className="text-sm font-medium text-text-secondary mb-1">
                  Total Issues
                </p>
                <p className="text-2xl font-bold text-error-600">
                  {totalIssuesCount}
                </p>
              </div>
              <div className="p-4 bg-bg-secondary rounded-lg">
                <p className="text-sm font-medium text-text-secondary mb-1">
                  Your Issues
                </p>
                <p className="text-2xl font-bold text-warning-600">
                  {userIssuesCount}
                </p>
              </div>
            </div>
          )}

          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-700">
            Showing all {totalIssuesCount} issue{totalIssuesCount !== 1 ? 's' : ''} across all assignees. {userIssuesCount} assigned to you.
          </div>

          {allOpenIssues.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-4">
                All Open Issues ({allOpenIssues.length})
              </h3>
              <div className="space-y-3">
                {allOpenIssues.map((issue) => (
                    <div key={issue.id} className={`p-4 border rounded-lg ${issue.assigned_to === currentUser?.id ? 'border-primary-300 bg-primary-50/30' : ''}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded border ${getSeverityColor(issue.severity)}`}
                            >
                              {issue.severity.toUpperCase()}
                            </span>
                            <span className="text-sm font-medium text-text-primary">
                              {issue.title}
                            </span>
                            {issue.assigned_to === currentUser?.id && (
                              <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-primary-100 text-primary-700">
                                Yours
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-text-secondary">
                            {issue.description}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${issue.status === 'open' ? 'bg-primary-100 text-primary-700' : 'bg-warning-100 text-warning-700'}`}
                        >
                          {issue.status}
                        </span>
                      </div>
                      {issue.due_date && (
                        <p className="text-xs text-text-tertiary mt-2">
                          Due: {formatDate(issue.due_date)}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-text-tertiary">
              <CheckCircle className="mx-auto mb-2 text-success-500" size={32} />
              <p className="text-success-600 font-medium">No compliance issues</p>
              <p className="text-xs mt-1">
                This project has no open compliance issues.
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <div className="text-center py-8 text-text-tertiary">
            <FileText className="mx-auto mb-2 text-text-tertiary" size={32} />
            <p>Document management coming soon</p>
            <p className="text-xs mt-1">
              This will show all project-related documents (COIs, endorsements,
              contracts)
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckCircle,
      badge: tasks.length,
      content: (
        <div className="space-y-4">
          {tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-medium text-text-primary">
                        {task.title}
                      </p>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(task.status)}`}
                      >
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-sm text-text-secondary">
                        {task.description}
                      </p>
                    )}
                    {task.due_date && (
                      <p className="text-xs text-text-tertiary mt-1">
                        Due: {formatDate(task.due_date)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-text-tertiary">
              <CheckCircle
                className="mx-auto mb-2 text-text-tertiary"
                size={32}
              />
              <p>No tasks yet</p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'history',
      label: 'History',
      icon: HistoryIcon,
      content: (
        <div className="space-y-4">
          <div className="text-center py-8 text-text-tertiary">
            <HistoryIcon
              className="mx-auto mb-2 text-text-tertiary"
              size={32}
            />
            <p>Activity log coming soon</p>
            <p className="text-xs mt-1">
              This will show project activity with timestamps and user actions
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: MessageSquare,
      badge: projectComments.length,
      content: (
        <div className="space-y-4">
          {projectComments.length > 0 ? (
            <div className="space-y-3">
              {projectComments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-4 bg-bg-secondary rounded-lg"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-white">
                        {comment.user_id.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">
                        User {comment.user_id.substring(0, 8)}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {formatDate(comment.created_at)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-text-tertiary">
              <MessageSquare
                className="mx-auto mb-2 text-text-tertiary"
                size={32}
              />
              <p>No notes yet</p>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            leftIcon={ArrowLeft}
            size="sm"
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {project.name}
            </h1>
            <div className="flex items-center space-x-4 mt-1">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getComplianceStatusColor(project.compliance_status)}`}
              >
                {project.compliance_status}
              </span>
              {/* REQ-279: Warning badge with tooltip showing issue breakdown */}
              {totalIssuesCount > 0 && (
                <Tooltip
                  content={`${totalIssuesCount} total ${totalIssuesCount === 1 ? 'issue' : 'issues'} (${userIssuesCount} yours, ${othersIssuesCount} assigned to others)`}
                  position="bottom"
                >
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warning-100 text-warning-700 border border-warning-300 cursor-help"
                    data-testid="warning-badge"
                  >
                    <AlertTriangle size={12} className="mr-1" />
                    {totalIssuesCount} {totalIssuesCount === 1 ? 'Issue' : 'Issues'}
                  </span>
                </Tooltip>
              )}
              {project.location && (
                <span className="text-sm text-text-secondary flex items-center space-x-1">
                  <MapPin size={14} />
                  <span>{project.location}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} variant="enclosed" activeTab={activeTab} onChange={handleTabChange} />
    </div>
  );
}
