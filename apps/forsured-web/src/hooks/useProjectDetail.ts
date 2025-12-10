import { useState, useEffect } from 'react';
import { Project, Task, ComplianceRecord } from '../types';
import { useProjects } from './useProjects';
import { useTasks } from './useTasks';
import { useProjectParticipants } from './useProjectParticipants';
import { useCompliance } from './useCompliance';

interface ProjectDetailData {
  project: Project | null;
  participants: unknown[];
  tasks: Task[];
  compliance: ComplianceRecord | null;
  loading: boolean;
  error: Error | null;
}

export function useProjectDetail(projectId: string): ProjectDetailData {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Use existing hooks for related data
  const { projects } = useProjects();
  const { tasks } = useTasks({});
  const { participants } = useProjectParticipants(projectId);

  // Get compliance using project's client_id once project is loaded
  const { compliance } = useCompliance(project?.client_id);

  useEffect(() => {
    const foundProject = projects.find((p) => p.id === projectId);
    if (foundProject) {
      setProject(foundProject);
      setLoading(false);
    } else if (projects.length > 0) {
      // Projects loaded but this one not found
      setError(new Error('Project not found'));
      setLoading(false);
    }
  }, [projects, projectId]);

  // Filter related data
  const projectTasks = tasks.filter((t) => t.project_id === projectId);

  return {
    project,
    participants: participants || [],
    tasks: projectTasks,
    compliance: compliance || null,
    loading,
    error,
  };
}
