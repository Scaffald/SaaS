/**
 * REQ-261: Task Type Definitions & Settings Page
 * TASK-2: Build Task Type CRUD API Endpoints
 *
 * Service for managing task type CRUD operations with validation and authorization.
 */

import { TaskType, TaskTypeCategory, TaskPriority } from '../../types';
import MockDatabase from '../../utils/mockDataStore';

/**
 * Valid task type categories
 */
export const VALID_CATEGORIES: TaskTypeCategory[] = [
  'document_review',
  'policy_management',
  'compliance',
  'onboarding',
  'custom',
];

/**
 * Valid priority values
 */
export const VALID_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

/**
 * User role for authorization
 */
export type UserRole = 'admin' | 'broker' | 'gc' | 'subcontractor';

/**
 * User context for authorization
 */
export interface UserContext {
  id: string;
  role: UserRole;
}

/**
 * API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

/**
 * Input for creating a task type
 */
export interface CreateTaskTypeInput {
  name: string;
  description?: string;
  default_priority?: TaskPriority;
  default_due_date_offset?: number;
  category: TaskTypeCategory;
  icon?: string;
  color?: string;
  default_assignee_role?: 'broker' | 'gc' | 'subcontractor';
  auto_assignment_rules?: {
    assign_to_project_manager?: boolean;
    assign_to_role?: 'broker' | 'gc' | 'subcontractor';
  };
  is_active?: boolean;
}

/**
 * Input for updating a task type
 */
export interface UpdateTaskTypeInput {
  name?: string;
  description?: string;
  default_priority?: TaskPriority;
  default_due_date_offset?: number;
  category?: TaskTypeCategory;
  icon?: string;
  color?: string;
  default_assignee_role?: 'broker' | 'gc' | 'subcontractor';
  auto_assignment_rules?: {
    assign_to_project_manager?: boolean;
    assign_to_role?: 'broker' | 'gc' | 'subcontractor';
  };
  is_active?: boolean;
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Hex color code regex pattern
 */
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

/**
 * Check if user is authorized as admin
 *
 * @param user - User context
 * @returns True if user is admin
 */
export function isAdmin(user: UserContext): boolean {
  return user.role === 'admin';
}

/**
 * Validate category value
 *
 * @param category - Category to validate
 * @returns Validation error if invalid, undefined if valid
 */
export function validateCategory(category: string): ValidationError | undefined {
  if (!VALID_CATEGORIES.includes(category as TaskTypeCategory)) {
    return {
      field: 'category',
      message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
    };
  }
  return undefined;
}

/**
 * Validate priority value
 *
 * @param priority - Priority to validate
 * @returns Validation error if invalid, undefined if valid
 */
export function validatePriority(priority: string): ValidationError | undefined {
  if (!VALID_PRIORITIES.includes(priority as TaskPriority)) {
    return {
      field: 'default_priority',
      message: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`,
    };
  }
  return undefined;
}

/**
 * Validate due date offset
 *
 * @param offset - Offset to validate
 * @returns Validation error if invalid, undefined if valid
 */
export function validateDueDateOffset(offset: number): ValidationError | undefined {
  if (!Number.isInteger(offset) || offset < 0) {
    return {
      field: 'default_due_date_offset',
      message: 'Due date offset must be a non-negative integer',
    };
  }
  return undefined;
}

/**
 * Validate hex color code
 *
 * @param color - Color to validate
 * @returns Validation error if invalid, undefined if valid
 */
export function validateColor(color: string): ValidationError | undefined {
  if (!HEX_COLOR_PATTERN.test(color)) {
    return {
      field: 'color',
      message: 'Color must be a valid hex code (e.g., #3B82F6)',
    };
  }
  return undefined;
}

/**
 * Validate task type name is unique
 *
 * @param name - Name to check
 * @param excludeId - ID to exclude from check (for updates)
 * @returns Validation error if not unique, undefined if unique
 */
export async function validateUniqueName(
  name: string,
  excludeId?: string
): Promise<ValidationError | undefined> {
  const existing = await MockDatabase.query<TaskType>('task_types', {});
  const duplicate = existing.find(
    (t) => t.name.toLowerCase() === name.toLowerCase() && t.id !== excludeId
  );
  if (duplicate) {
    return {
      field: 'name',
      message: 'A task type with this name already exists',
    };
  }
  return undefined;
}

/**
 * Validate create input
 *
 * @param input - Input to validate
 * @returns Array of validation errors
 */
export async function validateCreateInput(input: CreateTaskTypeInput): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  // Required fields
  if (!input.name || input.name.trim() === '') {
    errors.push({ field: 'name', message: 'Name is required' });
  } else if (input.name.length > 100) {
    errors.push({ field: 'name', message: 'Name must be 100 characters or less' });
  } else {
    const uniqueError = await validateUniqueName(input.name);
    if (uniqueError) errors.push(uniqueError);
  }

  if (!input.category) {
    errors.push({ field: 'category', message: 'Category is required' });
  } else {
    const categoryError = validateCategory(input.category);
    if (categoryError) errors.push(categoryError);
  }

  // Optional fields with validation
  if (input.default_priority) {
    const priorityError = validatePriority(input.default_priority);
    if (priorityError) errors.push(priorityError);
  }

  if (input.default_due_date_offset !== undefined) {
    const offsetError = validateDueDateOffset(input.default_due_date_offset);
    if (offsetError) errors.push(offsetError);
  }

  if (input.color) {
    const colorError = validateColor(input.color);
    if (colorError) errors.push(colorError);
  }

  return errors;
}

/**
 * Validate update input
 *
 * @param input - Input to validate
 * @param taskTypeId - ID of task type being updated
 * @returns Array of validation errors
 */
export async function validateUpdateInput(
  input: UpdateTaskTypeInput,
  taskTypeId: string
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  if (input.name !== undefined) {
    if (input.name.trim() === '') {
      errors.push({ field: 'name', message: 'Name cannot be empty' });
    } else if (input.name.length > 100) {
      errors.push({ field: 'name', message: 'Name must be 100 characters or less' });
    } else {
      const uniqueError = await validateUniqueName(input.name, taskTypeId);
      if (uniqueError) errors.push(uniqueError);
    }
  }

  if (input.category !== undefined) {
    const categoryError = validateCategory(input.category);
    if (categoryError) errors.push(categoryError);
  }

  if (input.default_priority !== undefined) {
    const priorityError = validatePriority(input.default_priority);
    if (priorityError) errors.push(priorityError);
  }

  if (input.default_due_date_offset !== undefined) {
    const offsetError = validateDueDateOffset(input.default_due_date_offset);
    if (offsetError) errors.push(offsetError);
  }

  if (input.color !== undefined) {
    const colorError = validateColor(input.color);
    if (colorError) errors.push(colorError);
  }

  return errors;
}

/**
 * GET /api/task-types - List all task types
 *
 * @param category - Optional category filter
 * @returns API response with task types
 */
export async function getAllTaskTypes(category?: TaskTypeCategory): Promise<ApiResponse<TaskType[]>> {
  try {
    let taskTypes: TaskType[];

    if (category) {
      // Validate category filter
      const categoryError = validateCategory(category);
      if (categoryError) {
        return {
          success: false,
          error: categoryError.message,
          statusCode: 400,
        };
      }
      taskTypes = await MockDatabase.query<TaskType>('task_types', { category });
    } else {
      taskTypes = await MockDatabase.query<TaskType>('task_types', {});
    }

    // Sort by name
    taskTypes.sort((a, b) => a.name.localeCompare(b.name));

    return {
      success: true,
      data: taskTypes,
      statusCode: 200,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch task types',
      statusCode: 500,
    };
  }
}

/**
 * GET /api/task-types/:id - Get single task type
 *
 * @param id - Task type ID
 * @returns API response with task type
 */
export async function getTaskTypeById(id: string): Promise<ApiResponse<TaskType>> {
  try {
    const taskType = MockDatabase.findById<TaskType>('task_types', id);

    if (!taskType) {
      return {
        success: false,
        error: 'Task type not found',
        statusCode: 404,
      };
    }

    return {
      success: true,
      data: taskType,
      statusCode: 200,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch task type',
      statusCode: 500,
    };
  }
}

/**
 * POST /api/task-types - Create new task type (admin only)
 *
 * @param input - Task type data
 * @param user - User context for authorization
 * @returns API response with created task type
 */
export async function createTaskType(
  input: CreateTaskTypeInput,
  user: UserContext
): Promise<ApiResponse<TaskType>> {
  // Authorization check
  if (!isAdmin(user)) {
    return {
      success: false,
      error: 'Unauthorized. Admin access required.',
      statusCode: 403,
    };
  }

  // Validation
  const errors = await validateCreateInput(input);
  if (errors.length > 0) {
    return {
      success: false,
      error: errors.map((e) => `${e.field}: ${e.message}`).join('; '),
      statusCode: 400,
    };
  }

  try {
    const taskType = await MockDatabase.insert<TaskType>('task_types', {
      name: input.name,
      description: input.description,
      default_priority: input.default_priority || 'medium',
      default_due_date_offset: input.default_due_date_offset ?? 7,
      category: input.category,
      icon: input.icon,
      color: input.color,
      default_assignee_role: input.default_assignee_role,
      auto_assignment_rules: input.auto_assignment_rules,
      is_active: input.is_active ?? true,
    });

    return {
      success: true,
      data: taskType,
      statusCode: 201,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create task type',
      statusCode: 500,
    };
  }
}

/**
 * PATCH /api/task-types/:id - Update task type (admin only)
 *
 * @param id - Task type ID
 * @param input - Fields to update
 * @param user - User context for authorization
 * @returns API response with updated task type
 */
export async function updateTaskType(
  id: string,
  input: UpdateTaskTypeInput,
  user: UserContext
): Promise<ApiResponse<TaskType>> {
  // Authorization check
  if (!isAdmin(user)) {
    return {
      success: false,
      error: 'Unauthorized. Admin access required.',
      statusCode: 403,
    };
  }

  // Check task type exists
  const existing = MockDatabase.findById<TaskType>('task_types', id);
  if (!existing) {
    return {
      success: false,
      error: 'Task type not found',
      statusCode: 404,
    };
  }

  // Validation
  const errors = await validateUpdateInput(input, id);
  if (errors.length > 0) {
    return {
      success: false,
      error: errors.map((e) => `${e.field}: ${e.message}`).join('; '),
      statusCode: 400,
    };
  }

  try {
    const updatedTaskType = await MockDatabase.update<TaskType>('task_types', id, input);

    return {
      success: true,
      data: updatedTaskType,
      statusCode: 200,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update task type',
      statusCode: 500,
    };
  }
}

/**
 * DELETE /api/task-types/:id - Delete task type (admin only)
 *
 * @param id - Task type ID
 * @param user - User context for authorization
 * @returns API response
 */
export async function deleteTaskType(
  id: string,
  user: UserContext
): Promise<ApiResponse<void>> {
  // Authorization check
  if (!isAdmin(user)) {
    return {
      success: false,
      error: 'Unauthorized. Admin access required.',
      statusCode: 403,
    };
  }

  // Check task type exists
  const existing = MockDatabase.findById<TaskType>('task_types', id);
  if (!existing) {
    return {
      success: false,
      error: 'Task type not found',
      statusCode: 404,
    };
  }

  try {
    await MockDatabase.delete('task_types', id);

    return {
      success: true,
      statusCode: 200,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete task type',
      statusCode: 500,
    };
  }
}

/**
 * Get active task types only
 *
 * @param category - Optional category filter
 * @returns API response with active task types
 */
export async function getActiveTaskTypes(
  category?: TaskTypeCategory
): Promise<ApiResponse<TaskType[]>> {
  try {
    const filter: Partial<TaskType> = { is_active: true };
    if (category) {
      const categoryError = validateCategory(category);
      if (categoryError) {
        return {
          success: false,
          error: categoryError.message,
          statusCode: 400,
        };
      }
      filter.category = category;
    }

    const taskTypes = await MockDatabase.query<TaskType>('task_types', filter);
    taskTypes.sort((a, b) => a.name.localeCompare(b.name));

    return {
      success: true,
      data: taskTypes,
      statusCode: 200,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch task types',
      statusCode: 500,
    };
  }
}

/**
 * Service instance with all methods
 */
export const taskTypeService = {
  getAllTaskTypes,
  getTaskTypeById,
  createTaskType,
  updateTaskType,
  deleteTaskType,
  getActiveTaskTypes,
  isAdmin,
  validateCategory,
  validatePriority,
  validateDueDateOffset,
  validateColor,
  validateUniqueName,
  validateCreateInput,
  validateUpdateInput,
  VALID_CATEGORIES,
  VALID_PRIORITIES,
};
