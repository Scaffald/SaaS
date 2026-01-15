/**
 * App UI Utilities
 * Centralized exports for app-specific UI components and utilities
 */

// Layout utilities
export {
  PageContainer,
  PageHeader,
  CardGrid,
  SectionCard,
  ContentSection,
  LoadingContainer,
  ErrorContainer,
  FormSection,
  type PageContainerProps,
  type PageHeaderProps,
  type CardGridProps,
  type SectionCardProps,
  type ContentSectionProps,
  type LoadingContainerProps,
  type ErrorContainerProps,
  type FormSectionProps,
} from './layout'

// Priority utilities
export {
  getPriorityColor,
  getPriorityBackground,
  getPriorityLabel,
  getPriorityStyle,
  type TaskPriority,
} from './priority'

// Status utilities
export {
  getStatusColor,
  getStatusBackground,
  getStatusLabel,
  getStatusStyle,
  isSuccessStatus,
  isErrorStatus,
  isWarningStatus,
  type TaskStatus,
  type ComplianceStatus,
  type DocumentStatus,
  type AckStatus,
  type Status,
} from './status'

// Spacing utilities
export {
  spacing,
  gap,
  padding,
  appSpacing,
  appGap,
  appPadding,
} from './spacing'

// Theme utilities
export {
  formatDueDate,
  getComplianceScoreColor,
  getRiskLevelColor,
  getRiskLevelBackground,
  formatCurrency,
  formatRelativeDate,
  getSeverityColor,
  getSeverityBackground,
} from './theme-utils'

// Existing UI components (re-export for convenience)
export { EmptyState, type EmptyStateProps } from './EmptyState'
export { default as Accordion } from './Accordion'
export { default as Avatar } from './Avatar'
export { default as Breadcrumbs } from './Breadcrumbs'
export { default as Checkbox } from './Checkbox'
export { default as CodeBlock } from './CodeBlock'
export { default as Divider } from './Divider'
export { default as Pagination } from './Pagination'
export { default as Progress } from './Progress'
export { default as Radio } from './Radio'
export { default as Switch } from './Switch'
export { default as Tabs } from './Tabs'
export { default as Tooltip } from './Tooltip'
