/**
 * Task Factory
 *
 * Creates real task records in the database for testing.
 * No mocking of owned code
 */

import { CreatedTestData, testSupabase } from "../testDb";
import { FactoryOptions, testId } from "./index";

export interface TestTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  project_id: string;
  organization_id: string;
  assigned_to_user_id?: string;
  due_date?: string;
  created_at: string;
}

interface CreateTaskOptions extends FactoryOptions {
  title?: string;
  description?: string;
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high" | "urgent";
  projectId: string;
  organizationId: string;
  assignedToUserId?: string;
  dueDate?: Date;
}

/**
 * Create a test task with defaults
 */
export async function createTestTask(
  options: CreateTaskOptions,
): Promise<TestTask> {
  const taskData = {
    title: options.title || `Test Task ${testId()}`,
    description: options.description,
    status: options.status || "pending",
    priority: options.priority || "medium",
    project_id: options.projectId,
    organization_id: options.organizationId,
    assigned_to_user_id: options.assignedToUserId,
    due_date: options.dueDate?.toISOString(),
  };

  const { data: result, error } = await testSupabase
    .schema("forsured" as never)
    .from("tasks")
    .insert(taskData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test task: ${error.message}`);
  }

  // Track for cleanup
  if (options.track !== false && options.tracker) {
    options.tracker.tasks.push(result.id);
  }

  return result as TestTask;
}

/**
 * Create multiple tasks for a project
 */
export async function createTestTasks(
  projectId: string,
  organizationId: string,
  count: number,
  options: Partial<CreateTaskOptions> & FactoryOptions = {},
): Promise<TestTask[]> {
  const tasks: TestTask[] = [];

  for (let i = 0; i < count; i++) {
    const task = await createTestTask({
      projectId,
      organizationId,
      title: options.title ? `${options.title} ${i + 1}` : `Task ${i + 1}`,
      status: options.status,
      priority: options.priority,
      dueDate: options.dueDate,
      tracker: options.tracker,
      track: options.track,
    });
    tasks.push(task);
  }

  return tasks;
}

/**
 * Create tasks with various statuses for testing dashboards
 */
export async function createTestTasksByStatus(
  projectId: string,
  organizationId: string,
  options: FactoryOptions = {},
): Promise<TestTask[]> {
  const statuses: Array<{
    status: "pending" | "in_progress" | "completed" | "cancelled";
    priority: "low" | "medium" | "high" | "urgent";
  }> = [
    { status: "pending", priority: "high" },
    { status: "pending", priority: "medium" },
    { status: "in_progress", priority: "high" },
    { status: "completed", priority: "medium" },
  ];

  const tasks: TestTask[] = [];

  for (const { status, priority } of statuses) {
    const task = await createTestTask({
      projectId,
      organizationId,
      status,
      priority,
      title: `${status} ${priority} task`,
      ...options,
    });
    tasks.push(task);
  }

  return tasks;
}

/**
 * Create an overdue task for testing
 */
export async function createOverdueTestTask(
  projectId: string,
  organizationId: string,
  options: Partial<CreateTaskOptions> & FactoryOptions = {},
): Promise<TestTask> {
  // Set due date to yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return createTestTask({
    projectId,
    organizationId,
    title: options.title || "Overdue Task",
    status: "pending",
    priority: options.priority || "high",
    dueDate: yesterday,
    ...options,
  });
}
