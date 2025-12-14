/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Filter, Users } from 'lucide-react';
import EmptyState from '../../ui/EmptyState';
import { useLexicon } from '../../contexts/LexiconContext';
import { useClients } from '../../hooks/useClients';
import { usePolicies } from '../../hooks/usePolicies';
import { useTasks } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import { useUsers } from '../../hooks/useUsers';
import ComplianceOverviewWidget from '../Broker/ComplianceOverviewWidget';
import ClientsTable from '../Broker/ClientsTable';
import TasksInbox from '../Broker/TasksInbox';
import TaskModal from '../Broker/TaskModal';
import Button from '../Common/Button';
import { DashboardSkeleton } from '../Common/SkeletonLoader';
import { Task, BrokerClient } from '../../types';

export default function EnhancedBrokerDashboard() {
  const navigate = useNavigate();
  // REQ-4: Use lexicon for dynamic labels
  const { t } = useLexicon();
  const { clients, loading: clientsLoading, fetchClients } = useClients();
  const { policies, loading: policiesLoading } = usePolicies();
  const { tasks, loading: tasksLoading, createTask, updateTask } = useTasks();
  const { projects, loading: projectsLoading } = useProjects();
  const { users, loading: usersLoading } = useUsers();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [projectFilter, setProjectFilter] = useState<string>('all');

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    await updateTask(taskId, { status: status as any });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleCreateTask = () => {
    setSelectedTask(undefined);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (selectedTask) {
      await updateTask(selectedTask.id, taskData);
    } else {
      await createTask(taskData as any);
    }
    setIsTaskModalOpen(false);
    setSelectedTask(undefined);
  };

  const filteredTasks =
    projectFilter === 'all'
      ? tasks
      : tasks.filter((t) => t.project_id === projectFilter);

  const filteredClients =
    projectFilter === 'all'
      ? clients
      : clients.filter((c) =>
          projects.some((p) => p.id === projectFilter && p.client_id === c.id)
        );

  const isLoading =
    clientsLoading ||
    policiesLoading ||
    tasksLoading ||
    projectsLoading ||
    usersLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Show empty state when no clients exist
  if (clients.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {t('nav.dashboard')}
          </h1>
          <p className="text-text-secondary">
            Comprehensive compliance and task management
          </p>
        </div>
        <EmptyState
          icon={Users}
          title="No Clients Yet"
          description="Start by adding clients to manage their insurance needs and compliance requirements."
          action={{
            label: 'Add Client',
            onClick: () => navigate('/broker/clients/new'),
          }}
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {t('nav.dashboard')}
            </h1>
            <p className="text-text-secondary">
              Comprehensive compliance and task management
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-surface border border-border rounded-lg px-4 py-2">
              <Filter size={18} className="text-text-secondary" />
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="bg-transparent focus:outline-none text-sm text-text-primary"
              >
                <option value="all">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="ghost"
              onClick={fetchClients}
              className="flex items-center space-x-2"
            >
              <RefreshCw size={18} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

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
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(undefined);
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
  );
}
