/**
 * EnhancedManagerDashboard - Manager dashboard using Beyond UI
 * Manual user creation support
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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
  UserPlus,
} from 'lucide-react'
import { Stack, Row, Text, Button, Card, Grid } from '@unicornlove/beyond-ui'
import {
  EmptyState,
  LoadingContainer,
  ErrorContainer,
  getPriorityColor,
  getPriorityBackground,
  formatDueDate,
} from '../../ui'
import StatusBadge from '../Common/StatusBadge'
import { useDatabase } from '../../contexts/DatabaseContext'
import { toast } from 'sonner'
import EnhancedTaskDetailModal from '../Manager/EnhancedTaskDetailModal'
import { useLexicon } from '../../contexts/LexiconContext'
import { ManualUserCreateModal } from '../ManualUsers'

// Type definitions for database schema
type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'submitted'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'needs_info'
type TaskPriority = 'urgent' | 'high' | 'medium' | 'low'

interface Task {
  id: string
  project_id: string
  subcontractor_id: string | null
  assigned_to_user_id: string | null
  created_by_user_id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  due_date: string
  task_type: string
  origin_role: string
  target_role: string
  metadata?: {
    blockers?: string[]
    quick_actions?: string[]
    tags?: string[]
    project_name?: string
    [key: string]: unknown
  }
  created_at: string
  updated_at: string
}

interface Subcontractor {
  id: string
  organization_id: string
  company_name: string
  contact_name: string
  contact_info: {
    email: string
    phone: string
  }
  trade_type: string
  license_number: string
  status: string
  compliance_score: number
  risk_level: string
  last_activity_at: string
  created_at: string
  updated_at: string
}

interface ComplianceGap {
  type: string
  policy_type: string
  severity: string
  description: string
  required_amount?: number
  current_amount?: number
}

interface ComplianceScore {
  id: string
  project_id: string
  subcontractor_id: string
  overall_score: number
  status: 'compliant' | 'warning' | 'critical'
  gaps: ComplianceGap[]
  notes?: string
  last_evaluated_at: string
  expires_at: string
}

interface Project {
  id: string
  name: string
  description: string
  manager_org_id: string
  compliance_status: string
}

export default function EnhancedManagerDashboard() {
  const { forsured } = useDatabase()
  const navigate = useNavigate()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showAddContractorModal, setShowAddContractorModal] = useState(false)

  // Use lexicon for dynamic labels
  const { getContractorLabel } = useLexicon()

  // Data state
  const [tasks, setTasks] = useState<Task[]>([])
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([])
  const [complianceScores, setComplianceScores] = useState<ComplianceScore[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch all data on mount
  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true)
      setError(null)

      try {
        // Fetch all data sources in parallel
        const [tasksResult, subsResult, complianceResult, projectsResult] = await Promise.all([
          forsured('tasks').select('*').order('due_date', { ascending: true }),
          forsured('subcontractors').select('*'),
          forsured('compliance_scores').select('*'),
          forsured('projects').select('*'),
        ])

        if (tasksResult.error) throw tasksResult.error
        if (subsResult.error) throw subsResult.error
        if (complianceResult.error) throw complianceResult.error
        if (projectsResult.error) throw projectsResult.error

        setTasks(tasksResult.data || [])
        setSubcontractors(subsResult.data || [])
        setComplianceScores(complianceResult.data || [])
        setProjects(projectsResult.data || [])
      } catch (err) {
        const error = err as Error
        setError(error)
        toast.error(error.message || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [forsured])

  // Computed metrics
  const totalSubcontractors = subcontractors.filter((s) => s.status === 'active').length
  const activeProjects = projects.length

  // Task metrics using new status values
  const urgentTasks = useMemo(() => {
    return tasks
      .filter(
        (t) =>
          (t.priority === 'urgent' || t.priority === 'high') &&
          (t.status === 'pending' || t.status === 'in_progress')
      )
      .slice(0, 5)
  }, [tasks])

  const tasksOverdue = useMemo(() => {
    return tasks.filter((t) => {
      const dueDate = new Date(t.due_date)
      return dueDate < new Date() && t.status !== 'completed' && t.status !== 'cancelled'
    }).length
  }, [tasks])

  const tasksInProgress = useMemo(() => {
    return tasks.filter((t) => t.status === 'in_progress').length
  }, [tasks])

  // Note: "blocked" status doesn't exist in new schema, check metadata.blockers instead
  const tasksBlocked = useMemo(() => {
    return tasks.filter((t) => t.metadata?.blockers && t.metadata.blockers.length > 0).length
  }, [tasks])

  // Build critical compliance items from compliance_scores gaps
  const criticalItems = useMemo(() => {
    const items: Array<{
      type: string
      subcontractor: string
      project: string
      severity: string
      dueDate: string
    }> = []

    complianceScores.forEach((score) => {
      if (score.gaps && score.gaps.length > 0) {
        const subcontractor = subcontractors.find((s) => s.id === score.subcontractor_id)
        const project = projects.find((p) => p.id === score.project_id)

        score.gaps.forEach((gap) => {
          items.push({
            type: gap.description || gap.type,
            subcontractor: subcontractor?.company_name || 'Unknown',
            project: project?.name || 'Unknown',
            severity: gap.severity?.toLowerCase() || 'medium',
            dueDate: score.expires_at ? new Date(score.expires_at).toLocaleDateString() : 'ASAP',
          })
        })
      }
    })

    return items
  }, [complianceScores, subcontractors, projects])

  // Utility functions imported from ../../ui

  // Show loading state
  if (loading) {
    return (
      <LoadingContainer>
        <Loader2
          size={32}
          style={{ animation: 'spin 1s linear infinite', color: 'var(--color-blue-10)' }}
        />
        <Text muted>Loading dashboard...</Text>
      </LoadingContainer>
    )
  }

  // Show error state
  if (error) {
    return (
      <ErrorContainer>
        <AlertTriangle size={48} style={{ color: 'var(--color-red-10)' }} />
        <Text size="lg" weight="semibold">
          Failed to load dashboard
        </Text>
        <Text muted>{error.message}</Text>
      </ErrorContainer>
    )
  }

  // Show empty state when no projects exist
  if (projects.length === 0) {
    return (
      <Stack gap={16}>
        <Text size="lg" muted>
          Manage {getContractorLabel(true).toLowerCase()} compliance across your projects
        </Text>
        <EmptyState
          icon={FolderPlus}
          title="No Projects Yet"
          description={`Create your first project to start managing ${getContractorLabel(true).toLowerCase()} compliance.`}
          action={{
            label: 'Create Project',
            onClick: () => navigate('/manager/projects/new'),
          }}
        />
      </Stack>
    )
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-background)',
    borderRadius: 8,
    border: '1px solid var(--color-border)',
    padding: 20,
  }

  const iconBoxStyle = (color: string): React.CSSProperties => ({
    width: 40,
    height: 40,
    backgroundColor: `var(--color-${color}-3)`,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  })

  // Priority colors now imported from ../../ui

  // Helper for priority text color (derived from background)
  const getPriorityTextColor = (priority: string) => {
    return getPriorityBackground(priority).replace('-3)', '-11)')
  }

  // Get organization ID from first project (GC's organization)
  const organizationId = projects[0]?.manager_org_id || ''

  // Get existing emails for validation
  const existingEmails = useMemo(() => {
    return subcontractors
      .map((s) => s.contact_info?.email?.toLowerCase())
      .filter((email): email is string => !!email)
  }, [subcontractors])

  return (
    <Stack gap={24}>
      <Row alignItems="center" justifyContent="space-between">
        <Text size="lg" muted>
          Manage {getContractorLabel(true).toLowerCase()} compliance across your projects
        </Text>
        {organizationId && (
          <Button
            variant="primary"
            size="sm"
            onPress={() => setShowAddContractorModal(true)}
            style={{
              backgroundColor: 'var(--color-blue-10)',
              color: 'white',
            }}
          >
            <Row alignItems="center" gap={6}>
              <UserPlus size={16} />
              <Text style={{ color: 'white', fontSize: 14 }}>Add {getContractorLabel(false)}</Text>
            </Row>
          </Button>
        )}
      </Row>

      <Grid columns={{ base: 1, sm: 2, lg: 4 }} gap={16}>
        <Card style={cardStyle}>
          <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 12 }}>
            <Stack style={iconBoxStyle('blue')}>
              <Users size={20} style={{ color: 'var(--color-blue-10)' }} />
            </Stack>
            <Text size="2xl" weight="bold">
              {totalSubcontractors}
            </Text>
          </Row>
          <Text size="sm" weight="medium" muted>
            Active {getContractorLabel(true)}
          </Text>
          <Text size="xs" muted style={{ marginTop: 4 }}>
            Across {activeProjects} projects
          </Text>
        </Card>

        <Card style={cardStyle}>
          <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 12 }}>
            <Stack style={iconBoxStyle('green')}>
              <CheckCircle size={20} style={{ color: 'var(--color-green-10)' }} />
            </Stack>
            <Text size="2xl" weight="bold">
              {tasks.length - tasksOverdue}
            </Text>
          </Row>
          <Text size="sm" weight="medium" muted>
            Tasks On Track
          </Text>
          <Text size="xs" muted style={{ marginTop: 4 }}>
            {tasksInProgress} in progress
          </Text>
        </Card>

        <Card style={cardStyle}>
          <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 12 }}>
            <Stack style={iconBoxStyle('red')}>
              <Clock size={20} style={{ color: 'var(--color-red-10)' }} />
            </Stack>
            <Text size="2xl" weight="bold" style={{ color: 'var(--color-red-10)' }}>
              {tasksOverdue}
            </Text>
          </Row>
          <Text size="sm" weight="medium" muted>
            Overdue Tasks
          </Text>
          <Text size="xs" muted style={{ marginTop: 4 }}>
            Require immediate action
          </Text>
        </Card>

        <Card style={cardStyle}>
          <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 12 }}>
            <Stack style={iconBoxStyle('orange')}>
              <AlertTriangle size={20} style={{ color: 'var(--color-orange-10)' }} />
            </Stack>
            <Text size="2xl" weight="bold" style={{ color: 'var(--color-orange-10)' }}>
              {tasksBlocked}
            </Text>
          </Row>
          <Text size="sm" weight="medium" muted>
            Blocked Tasks
          </Text>
          <Text size="xs" muted style={{ marginTop: 4 }}>
            Waiting on dependencies
          </Text>
        </Card>
      </Grid>

      <Card
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: 8,
          border: '1px solid var(--color-border)',
        }}
      >
        <Row
          alignItems="center"
          justifyContent="space-between"
          style={{ padding: 24, borderBottom: '1px solid var(--color-border)' }}
        >
          <Stack>
            <Text size="xl" weight="semibold">
              Urgent Tasks
            </Text>
            <Text size="sm" muted style={{ marginTop: 4 }}>
              High priority items requiring attention
            </Text>
          </Stack>
          <Row alignItems="center" gap={8}>
            <Text size="2xl" weight="bold" style={{ color: 'var(--color-orange-10)' }}>
              {urgentTasks.length}
            </Text>
            <AlertTriangle size={20} style={{ color: 'var(--color-orange-10)' }} />
          </Row>
        </Row>
        <Stack padding={24} gap={12}>
          {urgentTasks.map((task) => {
            const dueDate = formatDueDate(task.due_date)
            const projectName =
              task.metadata?.project_name ||
              projects.find((p) => p.id === task.project_id)?.name ||
              'Unknown Project'
            const blockers = task.metadata?.blockers || []
            return (
              <Row
                key={task.id}
                onClick={() => setSelectedTask(task)}
                alignItems="flex-start"
                justifyContent="space-between"
                style={{
                  padding: 16,
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                <Row alignItems="flex-start" gap={12} flex={1}>
                  <Stack
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      marginTop: 6,
                      backgroundColor: getPriorityColor(task.priority),
                    }}
                  />
                  <Stack flex={1}>
                    <Row alignItems="center" gap={8} style={{ marginBottom: 4 }}>
                      <Text size="sm" weight="semibold">
                        {task.title}
                      </Text>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          backgroundColor: getPriorityBackground(task.priority),
                          color: getPriorityTextColor(task.priority),
                          fontSize: 10,
                          fontWeight: 500,
                          textTransform: 'uppercase',
                        }}
                      >
                        {task.priority}
                      </span>
                      {blockers.length > 0 && (
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            backgroundColor: 'var(--color-red-3)',
                            color: 'var(--color-red-11)',
                            fontSize: 10,
                            fontWeight: 500,
                          }}
                        >
                          BLOCKED
                        </span>
                      )}
                    </Row>
                    <Text size="sm" muted style={{ marginBottom: 8 }}>
                      {task.description}
                    </Text>
                    <Row alignItems="center" gap={12}>
                      <Row alignItems="center" gap={4}>
                        <Building size={12} />
                        <Text size="xs" muted>
                          {projectName}
                        </Text>
                      </Row>
                      <Row alignItems="center" gap={4}>
                        <Calendar size={12} />
                        <Text size="xs" style={{ color: dueDate.color }}>
                          {dueDate.text}
                        </Text>
                      </Row>
                      {blockers.length > 0 && (
                        <Row alignItems="center" gap={4}>
                          <AlertTriangle size={12} style={{ color: 'var(--color-red-10)' }} />
                          <Text size="xs" style={{ color: 'var(--color-red-10)' }}>
                            {blockers.length} blocker{blockers.length > 1 ? 's' : ''}
                          </Text>
                        </Row>
                      )}
                    </Row>
                  </Stack>
                </Row>
                <Button variant="secondary" size="sm" onPress={() => setSelectedTask(task)}>
                  View Details
                </Button>
              </Row>
            )
          })}
        </Stack>
      </Card>

      <Card
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: 8,
          border: '1px solid var(--color-border)',
        }}
      >
        <Row
          alignItems="center"
          justifyContent="space-between"
          style={{ padding: 24, borderBottom: '1px solid var(--color-border)' }}
        >
          <Stack>
            <Text size="xl" weight="semibold">
              Critical Compliance Items
            </Text>
            <Text size="sm" muted style={{ marginTop: 4 }}>
              Issues requiring immediate attention
            </Text>
          </Stack>
          <Row alignItems="center" gap={8}>
            <Text size="2xl" weight="bold" style={{ color: 'var(--color-red-10)' }}>
              {criticalItems.length}
            </Text>
            <Shield size={20} style={{ color: 'var(--color-red-10)' }} />
          </Row>
        </Row>
        <Stack padding={24} gap={12}>
          {criticalItems.map((item, index) => (
            <Row
              key={index}
              alignItems="flex-start"
              justifyContent="space-between"
              style={{ padding: 16, border: '1px solid var(--color-border)', borderRadius: 8 }}
            >
              <Row alignItems="flex-start" gap={12} flex={1}>
                <Stack
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    marginTop: 6,
                    backgroundColor:
                      item.severity === 'critical' ? 'var(--color-red-9)' : 'var(--color-orange-9)',
                  }}
                />
                <Stack flex={1}>
                  <Row alignItems="center" gap={8} style={{ marginBottom: 4 }}>
                    <Text size="sm" weight="semibold">
                      {item.type}
                    </Text>
                    <StatusBadge
                      status={item.severity === 'critical' ? 'critical' : 'warning'}
                      size="sm"
                    />
                  </Row>
                  <Text size="sm" muted style={{ marginBottom: 4 }}>
                    {item.subcontractor}
                  </Text>
                  <Row alignItems="center" gap={12}>
                    <Row alignItems="center" gap={4}>
                      <Building size={12} />
                      <Text size="xs" muted>
                        {item.project}
                      </Text>
                    </Row>
                    <Row alignItems="center" gap={4}>
                      <Calendar size={12} />
                      <Text size="xs" muted>
                        Due {item.dueDate}
                      </Text>
                    </Row>
                  </Row>
                </Stack>
              </Row>
              <Button variant="secondary" size="sm">
                Review
              </Button>
            </Row>
          ))}
        </Stack>
      </Card>

      <EnhancedTaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdateTask={(taskId, updates) => {
          console.log('Updating task:', taskId, updates)
          setSelectedTask(null)
        }}
      />

      {/* Manual contractor creation modal */}
      {organizationId && (
        <ManualUserCreateModal
          isOpen={showAddContractorModal}
          onClose={() => setShowAddContractorModal(false)}
          role="contractor"
          organizationId={organizationId}
          existingEmails={existingEmails}
          onSuccess={(userId) => {
            console.log('Manual contractor created:', userId)
            // Refresh subcontractors list
            forsured('subcontractors')
              .select('*')
              .then(({ data }) => {
                if (data) setSubcontractors(data)
              })
          }}
        />
      )}
    </Stack>
  )
}
