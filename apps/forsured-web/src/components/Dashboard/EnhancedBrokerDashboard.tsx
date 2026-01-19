/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * EnhancedBrokerDashboard - Broker dashboard using Beyond UI
 * Migrated from Tamagui to Beyond UI
 * REQ-12: Manual user creation support
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Filter, Users, UserPlus } from 'lucide-react'
import { Stack, Row, Text } from '@unicornlove/beyond-ui'
import { EmptyState } from '../../ui/EmptyState'
import { useLexicon } from '../../contexts/LexiconContext'
import { useClients } from '../../hooks/useClients'
import { usePolicies } from '../../hooks/usePolicies'
import { useTasks } from '../../hooks/useTasks'
import { useProjects } from '../../hooks/useProjects'
import { useUsers } from '../../hooks/useUsers'
import { useAuth } from '../../contexts/AuthContext'
import ComplianceOverviewWidget from '../Broker/ComplianceOverviewWidget'
import TasksInbox from '../Broker/TasksInbox'
import TaskModal from '../Broker/TaskModal'
import ClientModal from '../Broker/ClientModal'
import Button from '../Common/Button'
import { DashboardSkeleton } from '../Common/SkeletonLoader'
import { ManualUserCreateModal, type ManualUserRole } from '../ManualUsers'
import type { Task, BrokerClient } from '../../types'

export default function EnhancedBrokerDashboard() {
  const navigate = useNavigate()
  // REQ-4: Use lexicon for dynamic labels
  const { t, getContractorLabel } = useLexicon()
  const { profile } = useAuth()
  const { clients, loading: clientsLoading, fetchClients, addClient } = useClients()
  const { policies, loading: policiesLoading } = usePolicies()
  const { tasks, loading: tasksLoading, createTask, updateTask } = useTasks()
  const { projects, loading: projectsLoading } = useProjects()
  const { users, loading: usersLoading } = useUsers()
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined)
  const [projectFilter, setProjectFilter] = useState<string>('all')

  // REQ-12: Manual user creation state
  const [showManualUserModal, setShowManualUserModal] = useState(false)
  const [manualUserRole, setManualUserRole] = useState<ManualUserRole>('contractor')

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    await updateTask(taskId, { status: status as any })
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setIsTaskModalOpen(true)
  }

  const handleCreateTask = () => {
    setSelectedTask(undefined)
    setIsTaskModalOpen(true)
  }

  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (selectedTask) {
      await updateTask(selectedTask.id, taskData)
    } else {
      await createTask(taskData as any)
    }
    setIsTaskModalOpen(false)
    setSelectedTask(undefined)
  }

  const handleSaveClient = async (clientData: Partial<BrokerClient>) => {
    await addClient(clientData as Omit<BrokerClient, 'id' | 'created_at' | 'updated_at'>);
    setIsClientModalOpen(false);
  };

  const filteredTasks =
    projectFilter === 'all' ? tasks : tasks.filter((t) => t.project_id === projectFilter)

  const filteredClients =
    projectFilter === 'all'
      ? clients
      : clients.filter((c) => projects.some((p) => p.id === projectFilter && p.client_id === c.id))

  const isLoading =
    clientsLoading || policiesLoading || tasksLoading || projectsLoading || usersLoading

  // REQ-12: Get organization ID for manual user creation
  // For brokers, use the first project's broker_org_id or derive from profile
  const organizationId = useMemo(() => {
    // Try to get from first project's broker organization
    const firstProject = projects[0] as any
    if (firstProject?.broker_org_id) {
      return firstProject.broker_org_id
    }
    // Fallback to profile ID as organization context
    return profile?.id || ''
  }, [projects, profile])

  // REQ-12: Get existing emails for validation
  const existingEmails = useMemo(() => {
    const emails: string[] = []
    clients.forEach((c) => {
      if (c.contact_email) {
        emails.push(c.contact_email.toLowerCase())
      }
    })
    users.forEach((u: any) => {
      if (u.email) {
        emails.push(u.email.toLowerCase())
      }
    })
    return emails
  }, [clients, users])

  // REQ-12: Open manual user modal with role
  const handleOpenManualUserModal = (role: ManualUserRole) => {
    setManualUserRole(role)
    setShowManualUserModal(true)
  }

  if (isLoading) {
    return <DashboardSkeleton />
  }

  // Show empty state when no clients exist
  if (clients.length === 0) {
    return (
      <>
        <Stack gap={24}>
          <Stack>
            <Text size="2xl" weight="bold">
              {t('nav.dashboard')}
            </Text>
            <Text muted>Comprehensive compliance and task management</Text>
          </Stack>
          <EmptyState
            icon={Users}
            title="No Clients Yet"
            description="Start by adding clients to manage their insurance needs and compliance requirements."
            action={{
              label: 'Add Client',
              onClick: () => setIsClientModalOpen(true),
            }}
          />
        </Stack>
        <ClientModal
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          onSave={handleSaveClient}
        />
      </>
    )
  }

  return (
    <>
      <Stack gap={24}>
        <Row alignItems="center" justifyContent="space-between">
          <Stack>
            <Text size="2xl" weight="bold">
              {t('nav.dashboard')}
            </Text>
            <Text muted>Comprehensive compliance and task management</Text>
          </Stack>
          <Row alignItems="center" gap={12}>
            <Row
              alignItems="center"
              gap={8}
              style={{
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 8,
                paddingBottom: 8,
              }}
            >
              <Filter size={18} />
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                style={{
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '14px',
                  color: 'var(--color-text)',
                  border: 'none',
                }}
              >
                <option value="all">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </Row>
            <Button variant="ghost" onPress={fetchClients}>
              <Row alignItems="center" gap={8}>
                <RefreshCw size={18} />
                <Text>Refresh</Text>
              </Row>
            </Button>
            {/* REQ-12: Manual user creation buttons */}
            {organizationId && (
              <>
                <Button
                  variant="secondary"
                  onPress={() => handleOpenManualUserModal('contractor')}
                >
                  <Row alignItems="center" gap={6}>
                    <UserPlus size={16} />
                    <Text>Add {getContractorLabel(false)}</Text>
                  </Row>
                </Button>
              </>
            )}
          </Row>
        </Row>

        <ComplianceOverviewWidget
          clients={filteredClients}
          policies={policies}
          projects={projects}
          tasks={filteredTasks}
        />

        <TasksInbox
          tasks={filteredTasks}
          onTaskClick={handleTaskClick}
          onCreateTask={handleCreateTask}
          onUpdateTaskStatus={handleUpdateTaskStatus}
        />
      </Stack>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false)
          setSelectedTask(undefined)
        }}
        onSave={handleSaveTask}
        task={selectedTask}
        clients={clients}
        policies={policies}
        projects={projects}
        users={users}
        currentUserId={users[0]?.id}
      />

      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSave={handleSaveClient}
      />

      {/* REQ-12: Manual user creation modal */}
      {organizationId && (
        <ManualUserCreateModal
          isOpen={showManualUserModal}
          onClose={() => setShowManualUserModal(false)}
          role={manualUserRole}
          organizationId={organizationId}
          existingEmails={existingEmails}
          onSuccess={(userId) => {
            console.log('Manual user created:', userId)
            // Refresh clients list
            fetchClients()
          }}
        />
      )}
    </>
  )
}
