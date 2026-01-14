/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * EnhancedBrokerDashboard - Broker dashboard using Beyond UI
 * Migrated from Tamagui to Beyond UI
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Filter, Users } from 'lucide-react'
import { Stack, Row, Text } from '@unicornlove/beyond-ui'
import { EmptyState } from '../../ui/EmptyState'
import { useLexicon } from '../../contexts/LexiconContext'
import { useClients } from '../../hooks/useClients'
import { usePolicies } from '../../hooks/usePolicies'
import { useTasks } from '../../hooks/useTasks'
import { useProjects } from '../../hooks/useProjects'
import { useUsers } from '../../hooks/useUsers'
import ComplianceOverviewWidget from '../Broker/ComplianceOverviewWidget'
import ClientsTable from '../Broker/ClientsTable'
import TasksInbox from '../Broker/TasksInbox'
import TaskModal from '../Broker/TaskModal'
import ClientModal from '../Broker/ClientModal'
import Button from '../Common/Button'
import { DashboardSkeleton } from '../Common/SkeletonLoader'
import type { Task, BrokerClient } from '../../types'

export default function EnhancedBrokerDashboard() {
  const navigate = useNavigate()
  // REQ-4: Use lexicon for dynamic labels
  const { t } = useLexicon()
  const { clients, loading: clientsLoading, fetchClients, addClient } = useClients()
  const { policies, loading: policiesLoading } = usePolicies()
  const { tasks, loading: tasksLoading, createTask, updateTask } = useTasks()
  const { projects, loading: projectsLoading } = useProjects()
  const { users, loading: usersLoading } = useUsers()
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined)
  const [projectFilter, setProjectFilter] = useState<string>('all')

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

        <ClientsTable
          clients={filteredClients}
          policies={policies}
          onClientClick={(client: BrokerClient) => navigate(`/broker/clients/${client.id}`)}
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
    </>
  )
}
