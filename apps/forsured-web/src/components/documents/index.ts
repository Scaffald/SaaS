/**
 * Document Components Exports
 * REQ-167: Document verification components
 * REQ-284: Document Organization by Client/Project/GC
 */

export { DocumentMetadataEditor } from './DocumentMetadataEditor';
export { OCRFieldDisplay } from './OCRFieldDisplay';
export { ValidationFeedback } from './ValidationFeedback';
export { DocumentPreview } from './DocumentPreview';
export { AuditHistoryPanel } from './AuditHistoryPanel';
export { DocumentFilterPanel } from './DocumentFilterPanel';
export { DocumentList } from './DocumentList';
export { DocumentBreadcrumb } from './DocumentBreadcrumb';
export type { DocumentBreadcrumbProps } from './DocumentBreadcrumb';

// Re-export types from document-filters
export type {
  DocumentFilterState,
  DocumentFilterPanelProps,
  DocumentType,
  DocumentStatus,
  ClientOption,
  ProjectOption,
} from '../../types/document-filters';
export {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_COLORS,
} from '../../types/document-filters';
