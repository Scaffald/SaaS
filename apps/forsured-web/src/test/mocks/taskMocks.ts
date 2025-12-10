/**
 * Mock data factories for Task entities
 * These mocks must be validated against real types (see taskMocks.validation.test.ts)
 */

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'in-review' | 'done' | 'cancelled';
  projectId: string;
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  projectId: string;
  assigneeId?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Mock task factory - creates a valid task object
 */
export function createMockTask(overrides?: Partial<Task>): Task {
  const now = new Date().toISOString();

  return {
    id: `task-${Math.random().toString(36).substring(7)}`,
    title: 'Install safety railings',
    description: 'Install safety railings on balcony',
    status: 'todo',
    projectId: 'proj-1',
    assigneeId: 'user-1',
    createdAt: now,
    updatedAt: now,
    priority: 'medium',
    ...overrides,
  };
}

/**
 * Create multiple mock tasks
 */
export function createMockTasks(count: number, overrides?: Partial<Task>): Task[] {
  return Array.from({ length: count }, (_, i) =>
    createMockTask({
      id: `task-${i + 1}`,
      title: `Task ${i + 1}`,
      ...overrides,
    })
  );
}

/**
 * Mock TasksTable class - simulates database operations
 * Must match the real Supabase/Database API
 */
export class MockTasksTable {
  private tasks: Task[] = [
    createMockTask({ id: 'task-1', title: 'Install railings', status: 'todo' }),
    createMockTask({ id: 'task-2', title: 'Fix roof', status: 'in-progress' }),
    createMockTask({ id: 'task-3', title: 'Paint walls', status: 'done' }),
  ];

  /**
   * Get all tasks
   */
  getAll(): Task[] {
    return [...this.tasks];
  }

  /**
   * Get task by ID
   */
  getById(id: string): Task | undefined {
    return this.tasks.find((task) => task.id === id);
  }

  /**
   * Get tasks by project ID
   */
  getByProjectId(projectId: string): Task[] {
    return this.tasks.filter((task) => task.projectId === projectId);
  }

  /**
   * Create a new task
   */
  create(input: CreateTaskInput): Task {
    // Validate title length (max 255 chars - matches database constraint)
    if (input.title.length > 255) {
      throw new Error('Task title too long (max 255 characters)');
    }

    // Validate title is not empty
    if (!input.title.trim()) {
      throw new Error('Task title is required');
    }

    const now = new Date().toISOString();
    const newTask: Task = {
      id: `task-${Math.random().toString(36).substring(7)}`,
      title: input.title,
      description: input.description,
      status: 'todo',
      projectId: input.projectId,
      assigneeId: input.assigneeId,
      createdAt: now,
      updatedAt: now,
      dueDate: input.dueDate,
      priority: input.priority || 'medium',
    };

    this.tasks.push(newTask);
    return newTask;
  }

  /**
   * Update a task
   */
  update(id: string, updates: Partial<Task>): Task {
    const taskIndex = this.tasks.findIndex((task) => task.id === id);

    if (taskIndex === -1) {
      throw new Error(`Task with id ${id} not found`);
    }

    // Validate status if provided
    if (updates.status && !['todo', 'in-progress', 'in-review', 'done', 'cancelled'].includes(updates.status)) {
      throw new Error('Invalid task status');
    }

    const updatedTask = {
      ...this.tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.tasks[taskIndex] = updatedTask;
    return updatedTask;
  }

  /**
   * Delete a task
   */
  delete(id: string): boolean {
    const taskIndex = this.tasks.findIndex((task) => task.id === id);

    if (taskIndex === -1) {
      return false;
    }

    this.tasks.splice(taskIndex, 1);
    return true;
  }

  /**
   * Reset to initial state (for testing)
   */
  reset(): void {
    this.tasks = [
      createMockTask({ id: 'task-1', title: 'Install railings', status: 'todo' }),
      createMockTask({ id: 'task-2', title: 'Fix roof', status: 'in-progress' }),
      createMockTask({ id: 'task-3', title: 'Paint walls', status: 'done' }),
    ];
  }
}
