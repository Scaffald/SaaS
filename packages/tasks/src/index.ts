/**
 * @frs/tasks
 *
 * Task management components for the Unicorn UI system.
 */

// TaskCard
export { TaskCard } from './TaskCard'
export type { TaskCardProps, TaskStatus, TaskPriority } from './TaskCard'

// TasksInbox
export { TasksInbox } from './TasksInbox'
export type { TasksInboxProps, Task } from './TasksInbox'

// CommentThread
export { CommentThread } from './CommentThread'
export type { CommentThreadProps, Comment } from './CommentThread'

// TaskStatusDropdown (REQ-288)
export { TaskStatusDropdown } from './TaskStatusDropdown'
export type { TaskStatusDropdownProps } from './TaskStatusDropdown'
export type { TaskStatus as DropdownTaskStatus } from './TaskStatusDropdown'

// TaskHistoryTimeline (REQ-288)
export { TaskHistoryTimeline } from './TaskHistoryTimeline'
export type {
  TaskHistoryTimelineProps,
  HistoryEvent,
  HistoryEventType,
} from './TaskHistoryTimeline'
