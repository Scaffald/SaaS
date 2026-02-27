/**
 * Task type definitions and settings
 * Task type CRUD API
 *
 * Service for managing task type CRUD operations with validation and authorization.
 */

import { TaskPriority, TaskType, TaskTypeCategory } from "../../types";

/**
 * Valid task type categories
 */
export const VALID_CATEGORIES: TaskTypeCategory[] = [
  "document_review",
  "policy_management",
  "compliance",
  "onboarding",
  "custom",
];

/**
 * Valid priority values
 */
export const VALID_PRIORITIES: TaskPriority[] = [
  "low",
  "medium",
  "high",
  "urgent",
];

/**
 * User role for authorization
 */
export type UserRole = "admin" | "broker" | "gc" | "subcontractor";

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
  default_assignee_role?: "broker" | "gc" | "subcontractor";
  auto_assignment_rules?: {
    assign_to_project_manager?: boolean;
    assign_to_role?: "broker" | "gc" | "subcontractor";
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
  default_assignee_role?: "broker" | "gc" | "subcontractor";
  auto_assignment_rules?: {
    assign_to_project_manager?: boolean;
    assign_to_role?: "broker" | "gc" | "subcontractor";
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
  return user.role === "admin";
}

/**
 * Validate category value
 *
 * @param category - Category to validate
 * @returns Validation error if invalid, undefined if valid
 */
export function validateCategory(
  category: string,
): ValidationError | undefined {
  if (!VALID_CATEGORIES.includes(category as TaskTypeCategory)) {
    return {
      field: "category",
      message: `Invalid category. Must be one of: ${
        VALID_CATEGORIES.join(", ")
      }`,
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
export function validatePriority(
  priority: string,
): ValidationError | undefined {
  if (!VALID_PRIORITIES.includes(priority as TaskPriority)) {
    return {
      field: "default_priority",
      message: `Invalid priority. Must be one of: ${
        VALID_PRIORITIES.join(", ")
      }`,
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
export function validateDueDateOffset(
  offset: number,
): ValidationError | undefined {
  if (!Number.isInteger(offset) || offset < 0) {
    return {
      field: "default_due_date_offset",
      message: "Due date offset must be a non-negative integer",
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
      field: "color",
      message: "Color must be a valid hex code (e.g., #3B82F6)",
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
  excludeId?: string,
): Promise<ValidationError | undefined> {
  throw new Error("validateUniqueName not implemented with Supabase");
}

/**
 * Validate create input
 *
 * @param input - Input to validate
 * @returns Array of validation errors
 */
export async function validateCreateInput(
  input: CreateTaskTypeInput,
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  // Required fields
  if (!input.name || input.name.trim() === "") {
    errors.push({ field: "name", message: "Name is required" });
  } else if (input.name.length > 100) {
    errors.push({
      field: "name",
      message: "Name must be 100 characters or less",
    });
  } else {
    const uniqueError = await validateUniqueName(input.name);
    if (uniqueError) errors.push(uniqueError);
  }

  if (!input.category) {
    errors.push({ field: "category", message: "Category is required" });
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
  taskTypeId: string,
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  if (input.name !== undefined) {
    if (input.name.trim() === "") {
      errors.push({ field: "name", message: "Name cannot be empty" });
    } else if (input.name.length > 100) {
      errors.push({
        field: "name",
        message: "Name must be 100 characters or less",
      });
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
export async function getAllTaskTypes(
  category?: TaskTypeCategory,
): Promise<ApiResponse<TaskType[]>> {
  throw new Error("getAllTaskTypes not implemented with Supabase");
}

/**
 * GET /api/task-types/:id - Get single task type
 *
 * @param id - Task type ID
 * @returns API response with task type
 */
export async function getTaskTypeById(
  id: string,
): Promise<ApiResponse<TaskType>> {
  throw new Error("getTaskTypeById not implemented with Supabase");
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
  user: UserContext,
): Promise<ApiResponse<TaskType>> {
  throw new Error("createTaskType not implemented with Supabase");
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
  user: UserContext,
): Promise<ApiResponse<TaskType>> {
  throw new Error("updateTaskType not implemented with Supabase");
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
  user: UserContext,
): Promise<ApiResponse<void>> {
  throw new Error("deleteTaskType not implemented with Supabase");
}

/**
 * Get active task types only
 *
 * @param category - Optional category filter
 * @returns API response with active task types
 */
export async function getActiveTaskTypes(
  category?: TaskTypeCategory,
): Promise<ApiResponse<TaskType[]>> {
  try {
    // TODO: Implement when task_types table is created
    // For now, return empty array to prevent errors
    // This allows the UI to render without breaking
    return {
      success: true,
      data: [],
      statusCode: 200,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : "Failed to fetch task types",
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
