import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Shield,
  AlertTriangle,
  Building,
  Calendar,
  Clock,
  CheckCircle,
  Loader2,
  FolderPlus,
} from 'lucide-react';
import EmptyState from '../../ui/EmptyState';
import StatusBadge from '../Common/StatusBadge';
import { useMockDatabase } from '../../contexts/DatabaseContext';
import { toast } from 'sonner';
import EnhancedTaskDetailModal from '../Manager/EnhancedTaskDetailModal';
import { useLexicon } from '../../contexts/LexiconContext';

// Type definitions for database schema
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'needs_info';
type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

interface Task {
  id: string;
  project_id: string;
  subcontractor_id: string | null;
  assigned_to_user_id: string | null;
  created_by_user_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
  task_type: string;
  origin_role: string;
  target_role: string;
  metadata?: {
    blockers?: string[];
    quick_actions?: string[];
    tags?: string[];
    project_name?: string;
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
}

interface Subcontractor {
  id: string;
  organization_id: string;
  company_name: string;
  contact_name: string;
  contact_info: {
    email: string;
    phone: string;
  };
  trade_type: string;
  license_number: string;
  status: string;
  compliance_score: number;
  risk_level: string;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

interface ComplianceGap {
  type: string;
  policy_type: string;
  severity: string;
  description: string;
  required_amount?: number;
  current_amount?: number;
}

interface ComplianceScore {
  id: string;
  project_id: string;
  subcontractor_id: string;
  overall_score: number;
  status: 'compliant' | 'warning' | 'critical';
  gaps: ComplianceGap[];
  notes?: string;
  last_evaluated_at: string;
  expires_at: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  manager_org_id: string;
  compliance_status: string;
}

export default function EnhancedManagerDashboard() {
  const db = useMockDatabase();
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // REQ-4: Use lexicon for dynamic labels
  const { t, getContractorLabel } = useLexicon();

  // Data state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [complianceScores, setComplianceScores] = useState<ComplianceScore[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all data on mount
  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      setError(null);

      try {
        // Fetch all data sources in parallel
        const [tasksResult, subsResult, complianceResult, projectsResult] = await Promise.all([
          db.from('tasks').select('*').order('due_date', { ascending: true }),
          db.from('subcontractors').select('*'),
          db.from('compliance_scores').select('*'),
          db.from('projects').select('*'),
        ]);

        if (tasksResult.error) throw tasksResult.error;
        if (subsResult.error) throw subsResult.error;
        if (complianceResult.error) throw complianceResult.error;
        if (projectsResult.error) throw projectsResult.error;

        setTasks(tasksResult.data || []);
        setSubcontractors(subsResult.data || []);
        setComplianceScores(complianceResult.data || []);
        setProjects(projectsResult.data || []);
      } catch (err) {
        const error = err as Error;
        setError(error);
        toast.error(error.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [db]);

  // Computed metrics
  const totalSubcontractors = subcontractors.filter(s => s.status === 'active').length;
  const activeProjects = projects.length;

  // Task metrics using new status values
  const urgentTasks = useMemo(() => {
    return tasks
      .filter(
        (t) =>
          (t.priority === 'urgent' || t.priority === 'high') &&
          (t.status === 'pending' || t.status === 'in_progress')
      )
      .slice(0, 5);
  }, [tasks]);

  const tasksOverdue = useMemo(() => {
    return tasks.filter((t) => {
      const dueDate = new Date(t.due_date);
      return dueDate < new Date() && t.status !== 'completed' && t.status !== 'cancelled';
    }).length;
  }, [tasks]);

  const tasksInProgress = useMemo(() => {
    return tasks.filter((t) => t.status === 'in_progress').length;
  }, [tasks]);

  // Note: "blocked" status doesn't exist in new schema, check metadata.blockers instead
  const tasksBlocked = useMemo(() => {
    return tasks.filter((t) => t.metadata?.blockers && t.metadata.blockers.length > 0).length;
  }, [tasks]);

  // Build critical compliance items from compliance_scores gaps
  const criticalItems = useMemo(() => {
    const items: Array<{
      type: string;
      subcontractor: string;
      project: string;
      severity: string;
      dueDate: string;
    }> = [];

    complianceScores.forEach((score) => {
      if (score.gaps && score.gaps.length > 0) {
        const subcontractor = subcontractors.find(s => s.id === score.subcontractor_id);
        const project = projects.find(p => p.id === score.project_id);

        score.gaps.forEach((gap) => {
          items.push({
            type: gap.description || gap.type,
            subcontractor: subcontractor?.company_name || 'Unknown',
            project: project?.name || 'Unknown',
            severity: gap.severity?.toLowerCase() || 'medium',
            dueDate: score.expires_at
              ? new Date(score.expires_at).toLocaleDateString()
              : 'ASAP',
          });
        });
      }
    });

    return items;
  }, [complianceScores, subcontractors, projects]);

  const formatDueDate = (dueAt: string) => {
    const date = new Date(dueAt);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0)
      return {
        text: `${Math.abs(diffDays)}d overdue`,
        color: 'text-error-600',
      };
    if (diffDays === 0) return { text: 'Due today', color: 'text-warning-600' };
    if (diffDays === 1)
      return { text: 'Due tomorrow', color: 'text-warning-600' };
    if (diffDays <= 3)
      return { text: `Due in ${diffDays}d`, color: 'text-warning-600' };
    return { text: date.toLocaleDateString(), color: 'text-text-secondary' };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-error-500';
      case 'high':
        return 'bg-warning-500';
      case 'medium':
        return 'bg-primary-500';
      case 'low':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="text-text-secondary">Loading dashboard...</p>
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
            Failed to load dashboard
          </h3>
          <p className="text-text-secondary">{error.message}</p>
        </div>
      </div>
    );
  }

  // Show empty state when no projects exist
  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary">
            {t('nav.dashboard')}
          </h1>
          <p className="text-text-secondary text-lg">
            Manage {getContractorLabel(true).toLowerCase()} compliance across your projects
          </p>
        </div>
        <EmptyState
          icon={FolderPlus}
          title="No Projects Yet"
          description={`Create your first project to start managing ${getContractorLabel(true).toLowerCase()} compliance.`}
          action={{
            label: 'Create Project',
            onClick: () => navigate('/manager/projects/new'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-text-primary">
          {t('nav.dashboard')}
        </h1>
        <p className="text-text-secondary text-lg">
          Manage {getContractorLabel(true).toLowerCase()} compliance across your projects
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-lg shadow-sm border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Users className="text-primary-600" size={20} />
            </div>
            <span className="text-2xl font-bold text-text-primary">
              {totalSubcontractors}
            </span>
          </div>
          <h3 className="text-sm font-medium text-text-secondary">
            Active {getContractorLabel(true)}
          </h3>
          <p className="text-xs text-text-tertiary mt-1">
            Across {activeProjects} projects
          </p>
        </div>

        <div className="bg-surface rounded-lg shadow-sm border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-success-600" size={20} />
            </div>
            <span className="text-2xl font-bold text-text-primary">
              {tasks.length - tasksOverdue}
            </span>
          </div>
          <h3 className="text-sm font-medium text-text-secondary">
            Tasks On Track
          </h3>
          <p className="text-xs text-text-tertiary mt-1">
            {tasksInProgress} in progress
          </p>
        </div>

        <div className="bg-surface rounded-lg shadow-sm border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-error-100 rounded-lg flex items-center justify-center">
              <Clock className="text-error-600" size={20} />
            </div>
            <span className="text-2xl font-bold text-error-600">
              {tasksOverdue}
            </span>
          </div>
          <h3 className="text-sm font-medium text-text-secondary">
            Overdue Tasks
          </h3>
          <p className="text-xs text-text-tertiary mt-1">
            Require immediate action
          </p>
        </div>

        <div className="bg-surface rounded-lg shadow-sm border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-warning-600" size={20} />
            </div>
            <span className="text-2xl font-bold text-warning-600">
              {tasksBlocked}
            </span>
          </div>
          <h3 className="text-sm font-medium text-text-secondary">
            Blocked Tasks
          </h3>
          <p className="text-xs text-text-tertiary mt-1">
            Waiting on dependencies
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-sm border border-border">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Urgent Tasks
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              High priority items requiring attention
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-warning-600">
              {urgentTasks.length}
            </span>
            <AlertTriangle className="text-warning-600" size={20} />
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {urgentTasks.map((task) => {
              const dueDate = formatDueDate(task.due_date);
              const projectName = task.metadata?.project_name || projects.find(p => p.id === task.project_id)?.name || 'Unknown Project';
              const blockers = task.metadata?.blockers || [];
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="flex items-start justify-between p-4 border border-border rounded-lg hover:border-primary-300 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start space-x-3 flex-1">
                    <div
                      className={`mt-0.5 w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}
                    ></div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-text-primary text-sm group-hover:text-primary-600 transition-colors">
                          {task.title}
                        </h3>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded uppercase ${
                            task.priority === 'urgent'
                              ? 'bg-error-100 text-error-700'
                              : task.priority === 'high'
                                ? 'bg-warning-100 text-warning-700'
                                : 'bg-primary-100 text-primary-700'
                          }`}
                        >
                          {task.priority}
                        </span>
                        {blockers.length > 0 && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-error-100 text-error-700">
                            BLOCKED
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary mb-2">
                        {task.description}
                      </p>
                      <div className="flex items-center space-x-3 text-xs text-text-tertiary">
                        <span className="flex items-center">
                          <Building size={12} className="mr-1" />
                          {projectName}
                        </span>
                        <span className="flex items-center">
                          <Calendar size={12} className="mr-1" />
                          <span className={dueDate.color}>{dueDate.text}</span>
                        </span>
                        {blockers.length > 0 && (
                          <span className="flex items-center text-error-600">
                            <AlertTriangle size={12} className="mr-1" />
                            {blockers.length} blocker
                            {blockers.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTask(task);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-primary-600 border border-primary-600 rounded hover:bg-primary-50 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-sm border border-border">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Critical Compliance Items
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Issues requiring immediate attention
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-error-600">
              {criticalItems.length}
            </span>
            <Shield className="text-error-600" size={20} />
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {criticalItems.map((item, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-4 border border-border rounded-lg hover:border-primary-300 transition-colors"
              >
                <div className="flex items-start space-x-3 flex-1">
                  <div
                    className={`mt-0.5 w-2 h-2 rounded-full ${
                      item.severity === 'critical'
                        ? 'bg-error-500'
                        : 'bg-warning-500'
                    }`}
                  ></div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-text-primary text-sm">
                        {item.type}
                      </h3>
                      <StatusBadge
                        status={
                          item.severity === 'critical' ? 'critical' : 'warning'
                        }
                        size="sm"
                      />
                    </div>
                    <p className="text-sm text-text-secondary mb-1">
                      {item.subcontractor}
                    </p>
                    <div className="flex items-center space-x-3 text-xs text-text-tertiary">
                      <span className="flex items-center">
                        <Building size={12} className="mr-1" />
                        {item.project}
                      </span>
                      <span className="flex items-center">
                        <Calendar size={12} className="mr-1" />
                        Due {item.dueDate}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="px-3 py-1.5 text-xs font-medium text-primary-600 border border-primary-600 rounded hover:bg-primary-50 transition-colors">
                  Review
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <EnhancedTaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdateTask={(taskId, updates) => {
          console.log('Updating task:', taskId, updates);
          setSelectedTask(null);
        }}
      />
    </div>
  );
}
