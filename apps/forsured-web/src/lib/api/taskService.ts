/**
 * Task Management Workflow & UI
 * Task Correlation with Compliance Score
 * Task Status Auto-Save with Audit Logging and Notifications
 * API service layer for task management operations
 */

import type { Task, TaskPriority, TaskSeverity, TaskStatus } from "../../types";
import {
  countTasksBySeverity,
  enrichTasksWithSeverity,
  enrichTaskWithSeverity,
  formatSeverityBreakdown,
} from "../tasks/severityUtils";
import { logAuditEvent } from "../audit/AuditService";
import { createStatusChangeNotifications } from "../tasks/statusNotificationService";
import { updateComplianceScoreOnStatusChange } from "../tasks/complianceScoreService";
// Task assignment view filtering
import {
  filterTasksForAssignedByMe,
  filterTasksForInbox,
} from "../tasks/taskAssignmentTypeService";
import { supabase } from "../supabase";

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  severity?: TaskSeverity[]; // Filter by severity
  assignee?: string[];
  project_id?: string[];
  task_type?: string[];
  date_range?: {
    start?: string;
    end?: string;
  };
  search?: string;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
  // Severity breakdown for task correlation
  severity_counts?: Record<TaskSeverity, number>;
  severity_summary?: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  mentions: string[];
  created_at: string;
  updated_at: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  uploaded_at: string;
  url: string;
}

export interface TaskHistory {
  id: string;
  task_id: string;
  user_id: string;
  action: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
}

/**
 * Log task status change to audit log
 * This is fire-and-forget - errors are logged but don't block the operation
 */
async function logTaskStatusChange(
  taskId: string,
  oldStatus: TaskStatus | undefined,
  newStatus: TaskStatus,
  userId?: string,
): Promise<void> {
  try {
    // Fire and forget - don't await
    logAuditEvent({
      category: "data_modification",
      action: "update",
      severity: "low",
      table_name: "tasks",
      record_id: taskId,
      resource_type: "task",
      resource_name: `Task ${taskId}`,
      operation: "UPDATE",
      old_data: { status: oldStatus },
      new_data: { status: newStatus },
      changed_fields: ["status"],
      user_id: userId,
      status: "success",
      metadata: {
        event_type: "TASK_STATUS_CHANGED",
        old_status: oldStatus,
        new_status: newStatus,
        timestamp: new Date().toISOString(),
      },
    }).catch((error) => {
      // Log but don't throw - audit failures shouldn't block task updates
      console.error("Failed to log task status change to audit:", error);
    });
  } catch (error) {
    // Log but don't throw - audit failures shouldn't block task updates
    console.error("Failed to log task status change to audit:", error);
  }
}

export const taskService = {
  /**
   * Get tasks with filtering, search, and pagination
   * Tasks are enriched with calculated severity and include severity breakdown
   */
  async getTasks(
    filters?: TaskFilters,
    page: number = 1,
    page_size: number = 20,
    sort_by: string = "created_at",
    sort_order: "asc" | "desc" = "desc",
  ): Promise<TaskListResponse> {
    const { data, error } = await supabase.schema("forsured").from("tasks")
      .select("*")
      .order(sort_by, { ascending: sort_order === "asc" });

    if (error) throw error;
    let tasks = data || [];

    // Enrich all tasks with calculated severity
    tasks = enrichTasksWithSeverity(tasks);

    // Apply filters
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        tasks = tasks.filter((t) =>
          filters.status!.includes(t.status as TaskStatus)
        );
      }

      if (filters.priority && filters.priority.length > 0) {
        tasks = tasks.filter((t) => filters.priority!.includes(t.priority));
      }

      // Filter by severity
      if (filters.severity && filters.severity.length > 0) {
        tasks = tasks.filter((t) =>
          t.severity && filters.severity!.includes(t.severity)
        );
      }

      if (filters.assignee && filters.assignee.length > 0) {
        tasks = tasks.filter(
          (t) =>
            t.assigned_to_user_id &&
            filters.assignee!.includes(t.assigned_to_user_id),
        );
      }

      if (filters.project_id && filters.project_id.length > 0) {
        tasks = tasks.filter((t) =>
          t.project_id && filters.project_id!.includes(t.project_id)
        );
      }

      if (filters.task_type && filters.task_type.length > 0) {
        tasks = tasks.filter(
          (t) =>
            t.task_type && filters.task_type!.includes(t.task_type as string),
        );
      }

      if (filters.date_range) {
        const { start, end } = filters.date_range;
        if (start) {
          tasks = tasks.filter((t) => t.due_date && t.due_date >= start);
        }
        if (end) {
          tasks = tasks.filter((t) => t.due_date && t.due_date <= end);
        }
      }

      // Search across multiple fields
      if (filters.search) {
        const query = filters.search.toLowerCase();
        tasks = tasks.filter(
          (t) =>
            t.title.toLowerCase().includes(query) ||
            (t.description && t.description.toLowerCase().includes(query)) ||
            (t.project_name && t.project_name.toLowerCase().includes(query)),
        );
      }
    }

    const total = tasks.length;
    const start_index = (page - 1) * page_size;
    const end_index = start_index + page_size;
    const paginated_tasks = tasks.slice(start_index, end_index);

    // Calculate severity breakdown for all matching tasks (before pagination)
    const severity_counts = countTasksBySeverity(tasks);
    const severity_summary = formatSeverityBreakdown(tasks);

    return {
      tasks: paginated_tasks,
      total,
      page,
      page_size,
      has_more: end_index < total,
      severity_counts,
      severity_summary,
    };
  },

  /**
   * Get single task by ID
   * Task is enriched with calculated severity
   */
  async getTask(task_id: string): Promise<Task> {
    const { data, error } = await supabase.schema("forsured").from("tasks")
      .select("*").eq("id", task_id).single();

    if (error) throw error;
    if (!data) throw new Error(`Task not found: ${task_id}`);

    // Enrich task with calculated severity
    return enrichTaskWithSeverity(data);
  },

  /**
   * Update task
   * Updated task is enriched with calculated severity
   * Log status changes to audit log and create notifications
   */
  async updateTask(
    task_id: string,
    updates: Partial<Task>,
    userId?: string,
  ): Promise<Task> {
    // Get current task to capture old status for audit log and notifications
    let oldStatus: TaskStatus | undefined;
    if (updates.status) {
      const { data: existingTask } = await supabase.schema("forsured").from(
        "tasks",
      )
        .select("status")
        .eq("id", task_id)
        .single();
      oldStatus = existingTask?.status;
    }

    const { data: task, error } = await supabase.schema("forsured").from(
      "tasks",
    )
      .update(updates)
      .eq("id", task_id)
      .select()
      .single();

    if (error) throw error;
    if (!task) throw new Error(`Task not found: ${task_id}`);

    // Log status change to audit log (fire-and-forget)
    if (updates.status && updates.status !== oldStatus) {
      logTaskStatusChange(
        task_id,
        oldStatus,
        updates.status as TaskStatus,
        userId,
      );

      // Create status change notifications (fire-and-forget)
      createStatusChangeNotifications(
        task,
        oldStatus,
        updates.status as TaskStatus,
        userId,
      ).catch(
        (error) => {
          console.error("Failed to create status change notifications:", error);
        },
      );

      // Update compliance score on status change (fire-and-forget)
      updateComplianceScoreOnStatusChange(
        task,
        oldStatus,
        updates.status as TaskStatus,
      ).catch(
        (error) => {
          console.error("Failed to update compliance score:", error);
        },
      );
    }

    // Enrich task with calculated severity
    return enrichTaskWithSeverity(task);
  },

  /**
   * Bulk update tasks
   */
  async bulkUpdateTasks(
    task_ids: string[],
    updates: Partial<Task>,
  ): Promise<Task[]> {
    const updated_tasks: Task[] = [];
    for (const id of task_ids) {
      const task = await this.updateTask(id, updates);
      updated_tasks.push(task);
    }
    return updated_tasks;
  },

  /**
   * Add comment to task
   */
  async addComment(
    task_id: string,
    user_id: string,
    content: string,
    mentions: string[] = [],
  ): Promise<TaskComment> {
    const comment = {
      task_id,
      user_id,
      content,
      mentions,
    };

    const { data, error } = await supabase.schema("forsured").from(
      "task_comments",
    ).insert(comment).select().single();

    if (error) throw error;
    return data as TaskComment;
  },

  /**
   * Get comments for task
   */
  async getComments(task_id: string): Promise<TaskComment[]> {
    const { data, error } = await supabase.schema("forsured").from(
      "task_comments",
    )
      .select("*")
      .eq("task_id", task_id)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Upload attachment to Supabase Storage and create task_attachments record
   */
  async uploadAttachment(
    task_id: string,
    file: File,
    uploaded_by: string,
  ): Promise<TaskAttachment> {
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `tasks/${task_id}/${timestamp}_${sanitizedName}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload attachment: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(filePath);

    const attachment = {
      task_id,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      uploaded_by,
      url: urlData.publicUrl,
    };

    const { data, error } = await supabase.schema("forsured").from(
      "task_attachments",
    )
      .insert(attachment)
      .select()
      .single();

    if (error) {
      await supabase.storage.from("documents").remove([filePath]);
      throw error;
    }
    return data as TaskAttachment;
  },

  /**
   * Get attachments for task
   */
  async getAttachments(task_id: string): Promise<TaskAttachment[]> {
    const { data, error } = await supabase.schema("forsured").from(
      "task_attachments",
    )
      .select("*")
      .eq("task_id", task_id)
      .order("uploaded_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get task history
   */
  async getHistory(task_id: string): Promise<TaskHistory[]> {
    const { data, error } = await supabase.schema("forsured").from(
      "task_history",
    )
      .select("*")
      .eq("task_id", task_id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Export tasks to CSV
   */
  async exportTasks(filters?: TaskFilters): Promise<string> {
    const { tasks } = await this.getTasks(filters, 1, 10000);

    // Generate CSV
    const headers = [
      "ID",
      "Title",
      "Status",
      "Priority",
      "Assigned To",
      "Due Date",
      "Created At",
    ];
    const rows = tasks.map((t) => [
      t.id,
      t.title,
      t.status,
      t.priority,
      t.assigned_to_user_id || "Unassigned",
      t.due_date || "",
      t.created_at,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    return csv;
  },

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(): Promise<Task[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase.schema("forsured").from("tasks")
      .select("*")
      .lt("due_date", now)
      .neq("status", "completed")
      .neq("status", "cancelled")
      .order("due_date", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get tasks for user's inbox
   * Returns tasks where:
   * - User is the assignee (including delegated tasks from others)
   * - User is the creator and task is unassigned
   *
   * @param userId - The current user's ID
   * @param filters - Optional additional filters
   * @param page - Page number for pagination
   * @param page_size - Number of items per page
   * @param sort_by - Column to sort by
   * @param sort_order - Sort direction
   */
  async getTasksForInbox(
    userId: string,
    filters?: TaskFilters,
    page: number = 1,
    page_size: number = 20,
    sort_by: string = "created_at",
    sort_order: "asc" | "desc" = "desc",
  ): Promise<TaskListResponse> {
    // Get all tasks first
    const { data, error } = await supabase.schema("forsured").from("tasks")
      .select("*")
      .order(sort_by, { ascending: sort_order === "asc" });

    if (error) throw error;
    let tasks = data || [];

    // Enrich all tasks with calculated severity
    tasks = enrichTasksWithSeverity(tasks);

    // Filter tasks for inbox view
    tasks = filterTasksForInbox(tasks, userId);

    // Apply additional filters
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        tasks = tasks.filter((t) =>
          filters.status!.includes(t.status as TaskStatus)
        );
      }

      if (filters.priority && filters.priority.length > 0) {
        tasks = tasks.filter((t) => filters.priority!.includes(t.priority));
      }

      if (filters.severity && filters.severity.length > 0) {
        tasks = tasks.filter((t) =>
          t.severity && filters.severity!.includes(t.severity)
        );
      }

      if (filters.project_id && filters.project_id.length > 0) {
        tasks = tasks.filter((t) =>
          t.project_id && filters.project_id!.includes(t.project_id)
        );
      }

      if (filters.task_type && filters.task_type.length > 0) {
        tasks = tasks.filter(
          (t) =>
            t.task_type && filters.task_type!.includes(t.task_type as string),
        );
      }

      if (filters.date_range) {
        const { start, end } = filters.date_range;
        if (start) {
          tasks = tasks.filter((t) => t.due_date && t.due_date >= start);
        }
        if (end) {
          tasks = tasks.filter((t) => t.due_date && t.due_date <= end);
        }
      }

      if (filters.search) {
        const query = filters.search.toLowerCase();
        tasks = tasks.filter(
          (t) =>
            t.title.toLowerCase().includes(query) ||
            (t.description && t.description.toLowerCase().includes(query)) ||
            (t.project_name && t.project_name.toLowerCase().includes(query)),
        );
      }
    }

    const total = tasks.length;
    const start_index = (page - 1) * page_size;
    const end_index = start_index + page_size;
    const paginated_tasks = tasks.slice(start_index, end_index);

    const severity_counts = countTasksBySeverity(tasks);
    const severity_summary = formatSeverityBreakdown(tasks);

    return {
      tasks: paginated_tasks,
      total,
      page,
      page_size,
      has_more: end_index < total,
      severity_counts,
      severity_summary,
    };
  },

  /**
   * Get tasks assigned by user to others
   * Returns tasks where:
   * - User is the creator AND
   * - Task is assigned to someone else (not self-assigned, not unassigned)
   *
   * @param userId - The current user's ID
   * @param filters - Optional additional filters
   * @param page - Page number for pagination
   * @param page_size - Number of items per page
   * @param sort_by - Column to sort by
   * @param sort_order - Sort direction
   */
  async getTasksAssignedByMe(
    userId: string,
    filters?: TaskFilters,
    page: number = 1,
    page_size: number = 20,
    sort_by: string = "created_at",
    sort_order: "asc" | "desc" = "desc",
  ): Promise<TaskListResponse> {
    // Get all tasks first
    const { data, error } = await supabase.schema("forsured").from("tasks")
      .select("*")
      .order(sort_by, { ascending: sort_order === "asc" });

    if (error) throw error;
    let tasks = data || [];

    // Enrich all tasks with calculated severity
    tasks = enrichTasksWithSeverity(tasks);

    // Filter tasks for "assigned by me" view
    tasks = filterTasksForAssignedByMe(tasks, userId);

    // Apply additional filters
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        tasks = tasks.filter((t) =>
          filters.status!.includes(t.status as TaskStatus)
        );
      }

      if (filters.priority && filters.priority.length > 0) {
        tasks = tasks.filter((t) => filters.priority!.includes(t.priority));
      }

      if (filters.severity && filters.severity.length > 0) {
        tasks = tasks.filter((t) =>
          t.severity && filters.severity!.includes(t.severity)
        );
      }

      // Note: We skip assignee filter here since this view shows tasks assigned to others
      // Users can filter by specific assignee if needed

      if (filters.project_id && filters.project_id.length > 0) {
        tasks = tasks.filter((t) =>
          t.project_id && filters.project_id!.includes(t.project_id)
        );
      }

      if (filters.task_type && filters.task_type.length > 0) {
        tasks = tasks.filter(
          (t) =>
            t.task_type && filters.task_type!.includes(t.task_type as string),
        );
      }

      if (filters.date_range) {
        const { start, end } = filters.date_range;
        if (start) {
          tasks = tasks.filter((t) => t.due_date && t.due_date >= start);
        }
        if (end) {
          tasks = tasks.filter((t) => t.due_date && t.due_date <= end);
        }
      }

      if (filters.search) {
        const query = filters.search.toLowerCase();
        tasks = tasks.filter(
          (t) =>
            t.title.toLowerCase().includes(query) ||
            (t.description && t.description.toLowerCase().includes(query)) ||
            (t.project_name && t.project_name.toLowerCase().includes(query)),
        );
      }
    }

    const total = tasks.length;
    const start_index = (page - 1) * page_size;
    const end_index = start_index + page_size;
    const paginated_tasks = tasks.slice(start_index, end_index);

    const severity_counts = countTasksBySeverity(tasks);
    const severity_summary = formatSeverityBreakdown(tasks);

    return {
      tasks: paginated_tasks,
      total,
      page,
      page_size,
      has_more: end_index < total,
      severity_counts,
      severity_summary,
    };
  },
};
