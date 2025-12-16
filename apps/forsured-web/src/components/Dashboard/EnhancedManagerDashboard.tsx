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
} from 'lucide-react'
import { EmptyState, YStack, XStack, Text, Button, Circle, Card, H1, H2, H3 } from '@unicornlove/ui'
import StatusBadge from '../Common/StatusBadge'
import { useMockDatabase } from '../../contexts/DatabaseContext'
import { toast } from 'sonner'
import EnhancedTaskDetailModal from '../Manager/EnhancedTaskDetailModal'
import { useLexicon } from '../../contexts/LexiconContext'

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
  const db = useMockDatabase()
  const navigate = useNavigate()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  // REQ-4: Use lexicon for dynamic labels
  const { t, getContractorLabel } = useLexicon()

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
          db.from('tasks').select('*').order('due_date', { ascending: true }),
          db.from('subcontractors').select('*'),
          db.from('compliance_scores').select('*'),
          db.from('projects').select('*'),
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
  }, [db])

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

  const formatDueDate = (dueAt: string) => {
    const date = new Date(dueAt)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0)
      return {
        text: `${Math.abs(diffDays)}d overdue`,
        color: '$red10' as const,
      }
    if (diffDays === 0) return { text: 'Due today', color: '$orange10' as const }
    if (diffDays === 1) return { text: 'Due tomorrow', color: '$orange10' as const }
    if (diffDays <= 3) return { text: `Due in ${diffDays}d`, color: '$orange10' as const }
    return { text: date.toLocaleDateString(), color: '$color11' as const }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '$red9' as const
      case 'high':
        return '$orange9' as const
      case 'medium':
        return '$blue9' as const
      case 'low':
        return '$gray9' as const
      default:
        return '$gray9' as const
    }
  }

  // Show loading state
  if (loading) {
    return (
      <YStack alignItems="center" justifyContent="center" minHeight={400}>
        <YStack alignItems="center" gap="$4">
          <Loader2 size={32} color="$blue10" style={{ animation: 'spin 1s linear infinite' }} />
          <Text color="$color11">Loading dashboard...</Text>
        </YStack>
      </YStack>
    )
  }

  // Show error state
  if (error) {
    return (
      <YStack alignItems="center" justifyContent="center" minHeight={400}>
        <YStack alignItems="center">
          <YStack marginBottom="$4">
            <AlertTriangle size={48} color="$red10" />
          </YStack>
          <H3 fontSize="$6" fontWeight="600" color="$color12" marginBottom="$2">
            Failed to load dashboard
          </H3>
          <Text color="$color11">{error.message}</Text>
        </YStack>
      </YStack>
    )
  }

  // Show empty state when no projects exist
  if (projects.length === 0) {
    return (
      <YStack gap="$6">
        <YStack>
          <H1 fontFamily="$heading" fontSize="$10" fontWeight="700" color="$color12">
            {t('nav.dashboard')}
          </H1>
          <Text color="$color11" fontSize="$6">
            Manage {getContractorLabel(true).toLowerCase()} compliance across your projects
          </Text>
        </YStack>
        <EmptyState
          icon={FolderPlus}
          title="No Projects Yet"
          description={`Create your first project to start managing ${getContractorLabel(true).toLowerCase()} compliance.`}
          action={{
            label: 'Create Project',
            onClick: () => navigate('/manager/projects/new'),
          }}
        />
      </YStack>
    )
  }

  return (
    <YStack gap="$6">
      <YStack>
        <H1 fontFamily="$heading" fontSize="$10" fontWeight="700" color="$color12">
          {t('nav.dashboard')}
        </H1>
        <Text color="$color11" fontSize="$6">
          Manage {getContractorLabel(true).toLowerCase()} compliance across your projects
        </Text>
      </YStack>

      <XStack flexWrap="wrap" gap="$4" $gtMd={{ flexWrap: 'wrap' }} $gtLg={{ flexWrap: 'wrap' }}>
        <Card
          width="100%"
          $gtMd={{ width: 'calc(50% - 8px)' }}
          $gtLg={{ width: 'calc(25% - 12px)' }}
          backgroundColor="$background"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$borderColor"
          padding="$5"
        >
          <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
            <YStack
              width={40}
              height={40}
              backgroundColor="$blue3"
              borderRadius="$4"
              alignItems="center"
              justifyContent="center"
            >
              <Users size={20} color="$blue10" />
            </YStack>
            <Text fontSize="$9" fontWeight="700" color="$color12">
              {totalSubcontractors}
            </Text>
          </XStack>
          <H3 fontSize="$3" fontWeight="500" color="$color11">
            Active {getContractorLabel(true)}
          </H3>
          <Text fontSize="$2" color="$color10" marginTop="$1">
            Across {activeProjects} projects
          </Text>
        </Card>

        <Card
          width="100%"
          $gtMd={{ width: 'calc(50% - 8px)' }}
          $gtLg={{ width: 'calc(25% - 12px)' }}
          backgroundColor="$background"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$borderColor"
          padding="$5"
        >
          <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
            <YStack
              width={40}
              height={40}
              backgroundColor="$green3"
              borderRadius="$4"
              alignItems="center"
              justifyContent="center"
            >
              <CheckCircle size={20} color="$green10" />
            </YStack>
            <Text fontSize="$9" fontWeight="700" color="$color12">
              {tasks.length - tasksOverdue}
            </Text>
          </XStack>
          <H3 fontSize="$3" fontWeight="500" color="$color11">
            Tasks On Track
          </H3>
          <Text fontSize="$2" color="$color10" marginTop="$1">
            {tasksInProgress} in progress
          </Text>
        </Card>

        <Card
          width="100%"
          $gtMd={{ width: 'calc(50% - 8px)' }}
          $gtLg={{ width: 'calc(25% - 12px)' }}
          backgroundColor="$background"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$borderColor"
          padding="$5"
        >
          <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
            <YStack
              width={40}
              height={40}
              backgroundColor="$red3"
              borderRadius="$4"
              alignItems="center"
              justifyContent="center"
            >
              <Clock size={20} color="$red10" />
            </YStack>
            <Text fontSize="$9" fontWeight="700" color="$red10">
              {tasksOverdue}
            </Text>
          </XStack>
          <H3 fontSize="$3" fontWeight="500" color="$color11">
            Overdue Tasks
          </H3>
          <Text fontSize="$2" color="$color10" marginTop="$1">
            Require immediate action
          </Text>
        </Card>

        <Card
          width="100%"
          $gtMd={{ width: 'calc(50% - 8px)' }}
          $gtLg={{ width: 'calc(25% - 12px)' }}
          backgroundColor="$background"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$borderColor"
          padding="$5"
        >
          <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
            <YStack
              width={40}
              height={40}
              backgroundColor="$orange3"
              borderRadius="$4"
              alignItems="center"
              justifyContent="center"
            >
              <AlertTriangle size={20} color="$orange10" />
            </YStack>
            <Text fontSize="$9" fontWeight="700" color="$orange10">
              {tasksBlocked}
            </Text>
          </XStack>
          <H3 fontSize="$3" fontWeight="500" color="$color11">
            Blocked Tasks
          </H3>
          <Text fontSize="$2" color="$color10" marginTop="$1">
            Waiting on dependencies
          </Text>
        </Card>
      </XStack>

      <Card
        backgroundColor="$background"
        borderRadius="$4"
        borderWidth={1}
        borderColor="$borderColor"
      >
        <XStack
          padding="$6"
          borderBottomWidth={1}
          borderColor="$borderColor"
          alignItems="center"
          justifyContent="space-between"
        >
          <YStack>
            <H2 fontSize="$6" fontWeight="600" color="$color12">
              Urgent Tasks
            </H2>
            <Text fontSize="$3" color="$color11" marginTop="$1">
              High priority items requiring attention
            </Text>
          </YStack>
          <XStack alignItems="center" gap="$2">
            <Text fontSize="$9" fontWeight="700" color="$orange10">
              {urgentTasks.length}
            </Text>
            <AlertTriangle size={20} color="$orange10" />
          </XStack>
        </XStack>
        <YStack padding="$6">
          <YStack gap="$3">
            {urgentTasks.map((task) => {
              const dueDate = formatDueDate(task.due_date)
              const projectName =
                task.metadata?.project_name ||
                projects.find((p) => p.id === task.project_id)?.name ||
                'Unknown Project'
              const blockers = task.metadata?.blockers || []
              return (
                <XStack
                  key={task.id}
                  onPress={() => setSelectedTask(task)}
                  padding="$4"
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$4"
                  hoverStyle={{ borderColor: '$blue8' }}
                  cursor="pointer"
                  alignItems="flex-start"
                  justifyContent="space-between"
                  group
                >
                  <XStack alignItems="flex-start" gap="$3" flex={1}>
                    <Circle
                      size={8}
                      marginTop={2}
                      backgroundColor={getPriorityColor(task.priority)}
                    />
                    <YStack flex={1}>
                      <XStack alignItems="center" gap="$2" marginBottom="$1">
                        <H3
                          fontSize="$3"
                          fontWeight="600"
                          color="$color12"
                          $group-hover={{ color: '$blue10' }}
                        >
                          {task.title}
                        </H3>
                        <XStack
                          paddingHorizontal="$2"
                          paddingVertical="$0.5"
                          borderRadius="$2"
                          backgroundColor={
                            task.priority === 'urgent'
                              ? '$red3'
                              : task.priority === 'high'
                                ? '$orange3'
                                : '$blue3'
                          }
                        >
                          <Text
                            fontSize="$1"
                            fontWeight="500"
                            textTransform="uppercase"
                            color={
                              task.priority === 'urgent'
                                ? '$red11'
                                : task.priority === 'high'
                                  ? '$orange11'
                                  : '$blue11'
                            }
                          >
                            {task.priority}
                          </Text>
                        </XStack>
                        {blockers.length > 0 && (
                          <XStack
                            paddingHorizontal="$2"
                            paddingVertical="$0.5"
                            borderRadius="$2"
                            backgroundColor="$red3"
                          >
                            <Text fontSize="$1" fontWeight="500" color="$red11">
                              BLOCKED
                            </Text>
                          </XStack>
                        )}
                      </XStack>
                      <Text fontSize="$3" color="$color11" marginBottom="$2">
                        {task.description}
                      </Text>
                      <XStack alignItems="center" gap="$3">
                        <XStack alignItems="center" gap="$1">
                          <Building size={12} color="$color10" />
                          <Text fontSize="$2" color="$color10">
                            {projectName}
                          </Text>
                        </XStack>
                        <XStack alignItems="center" gap="$1">
                          <Calendar size={12} color="$color10" />
                          <Text fontSize="$2" color={dueDate.color}>
                            {dueDate.text}
                          </Text>
                        </XStack>
                        {blockers.length > 0 && (
                          <XStack alignItems="center" gap="$1">
                            <AlertTriangle size={12} color="$red10" />
                            <Text fontSize="$2" color="$red10">
                              {blockers.length} blocker{blockers.length > 1 ? 's' : ''}
                            </Text>
                          </XStack>
                        )}
                      </XStack>
                    </YStack>
                  </XStack>
                  <Button
                    onPress={(e) => {
                      e.stopPropagation()
                      setSelectedTask(task)
                    }}
                    paddingHorizontal="$3"
                    paddingVertical="$1.5"
                    fontSize="$2"
                    fontWeight="500"
                    color="$blue10"
                    borderWidth={1}
                    borderColor="$blue10"
                    borderRadius="$2"
                    backgroundColor="transparent"
                    hoverStyle={{ backgroundColor: '$blue2' }}
                  >
                    View Details
                  </Button>
                </XStack>
              )
            })}
          </YStack>
        </YStack>
      </Card>

      <Card
        backgroundColor="$background"
        borderRadius="$4"
        borderWidth={1}
        borderColor="$borderColor"
      >
        <XStack
          padding="$6"
          borderBottomWidth={1}
          borderColor="$borderColor"
          alignItems="center"
          justifyContent="space-between"
        >
          <YStack>
            <H2 fontSize="$6" fontWeight="600" color="$color12">
              Critical Compliance Items
            </H2>
            <Text fontSize="$3" color="$color11" marginTop="$1">
              Issues requiring immediate attention
            </Text>
          </YStack>
          <XStack alignItems="center" gap="$2">
            <Text fontSize="$9" fontWeight="700" color="$red10">
              {criticalItems.length}
            </Text>
            <Shield size={20} color="$red10" />
          </XStack>
        </XStack>
        <YStack padding="$6">
          <YStack gap="$3">
            {criticalItems.map((item, index) => (
              <XStack
                key={index}
                padding="$4"
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$4"
                hoverStyle={{ borderColor: '$blue8' }}
                alignItems="flex-start"
                justifyContent="space-between"
              >
                <XStack alignItems="flex-start" gap="$3" flex={1}>
                  <Circle
                    size={8}
                    marginTop={2}
                    backgroundColor={item.severity === 'critical' ? '$red9' : '$orange9'}
                  />
                  <YStack flex={1}>
                    <XStack alignItems="center" gap="$2" marginBottom="$1">
                      <H3 fontSize="$3" fontWeight="600" color="$color12">
                        {item.type}
                      </H3>
                      <StatusBadge
                        status={item.severity === 'critical' ? 'critical' : 'warning'}
                        size="sm"
                      />
                    </XStack>
                    <Text fontSize="$3" color="$color11" marginBottom="$1">
                      {item.subcontractor}
                    </Text>
                    <XStack alignItems="center" gap="$3">
                      <XStack alignItems="center" gap="$1">
                        <Building size={12} color="$color10" />
                        <Text fontSize="$2" color="$color10">
                          {item.project}
                        </Text>
                      </XStack>
                      <XStack alignItems="center" gap="$1">
                        <Calendar size={12} color="$color10" />
                        <Text fontSize="$2" color="$color10">
                          Due {item.dueDate}
                        </Text>
                      </XStack>
                    </XStack>
                  </YStack>
                </XStack>
                <Button
                  paddingHorizontal="$3"
                  paddingVertical="$1.5"
                  fontSize="$2"
                  fontWeight="500"
                  color="$blue10"
                  borderWidth={1}
                  borderColor="$blue10"
                  borderRadius="$2"
                  backgroundColor="transparent"
                  hoverStyle={{ backgroundColor: '$blue2' }}
                >
                  Review
                </Button>
              </XStack>
            ))}
          </YStack>
        </YStack>
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
    </YStack>
  )
}
