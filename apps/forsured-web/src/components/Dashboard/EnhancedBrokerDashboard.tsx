/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Filter, Users } from 'lucide-react'
import { EmptyState, YStack, XStack, Text } from '@unicornlove/ui'
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
import Button from '../Common/Button'
import { DashboardSkeleton } from '../Common/SkeletonLoader'
import type { Task, BrokerClient } from '../../types'

export default function EnhancedBrokerDashboard() {
  const navigate = useNavigate()
  // REQ-4: Use lexicon for dynamic labels
  const { t } = useLexicon()
  const { clients, loading: clientsLoading, fetchClients } = useClients()
  const { policies, loading: policiesLoading } = usePolicies()
  const { tasks, loading: tasksLoading, createTask, updateTask } = useTasks()
  const { projects, loading: projectsLoading } = useProjects()
  const { users, loading: usersLoading } = useUsers()
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
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
      <YStack gap="$6">
        <YStack>
          <Text fontSize="$8" fontWeight="700" color="$color12">
            {t('nav.dashboard')}
          </Text>
          <Text color="$color11">Comprehensive compliance and task management</Text>
        </YStack>
        <EmptyState
          icon={Users}
          title="No Clients Yet"
          description="Start by adding clients to manage their insurance needs and compliance requirements."
          action={{
            label: 'Add Client',
            onClick: () => navigate('/broker/clients/new'),
          }}
        />
      </YStack>
    )
  }

  return (
    <>
      <YStack gap="$6">
        <XStack alignItems="center" justifyContent="space-between">
          <YStack>
            <Text fontSize="$8" fontWeight="700" color="$color12">
              {t('nav.dashboard')}
            </Text>
            <Text color="$color11">Comprehensive compliance and task management</Text>
          </YStack>
          <XStack alignItems="center" gap="$3">
            <XStack
              alignItems="center"
              gap="$2"
              backgroundColor="$background"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
              paddingHorizontal="$4"
              paddingVertical="$2"
            >
              <Filter size={18} color="var(--color11)" />
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                style={{
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '14px',
                  color: 'var(--color12)',
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
            </XStack>
            <Button variant="ghost" onClick={fetchClients}>
              <XStack alignItems="center" gap="$2">
                <RefreshCw size={18} />
                <Text>Refresh</Text>
              </XStack>
            </Button>
          </XStack>
        </XStack>

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
      </YStack>

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
    </>
  )
}
