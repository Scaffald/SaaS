/**
 * Document Filters Types
 * REQ-284: Document Organization by Client/Project/GC
 */

/**
 * Document types supported in the system
 */
export type DocumentType =
  | 'coi'           // Certificate of Insurance
  | 'license'       // Business License
  | 'contract'      // Contract documents
  | 'w9'            // W-9 Tax Form
  | 'endorsement'   // Policy Endorsement
  | 'other';        // Other documents

/**
 * Document status values
 */
export type DocumentStatus =
  | 'verified'      // Document verified and current
  | 'pending'       // Awaiting verification
  | 'expiring'      // Expiring within 30 days
  | 'expired';      // Document has expired

/**
 * Client option for filter dropdown
 */
export interface ClientOption {
  id: string;
  name: string;
  type: 'gc' | 'subcontractor';
}

/**
 * Project option for filter dropdown
 */
export interface ProjectOption {
  id: string;
  name: string;
  clientId: string;
}

/**
 * Document filter state
 */
export interface DocumentFilterState {
  clientId?: string;
  projectId?: string;
  docType?: DocumentType;
  status?: DocumentStatus;
}

/**
 * Props for DocumentFilterPanel component
 */
export interface DocumentFilterPanelProps {
  /** Current filter state */
  filters: DocumentFilterState;
  /** Callback when filters change */
  onFiltersChange: (filters: DocumentFilterState) => void;
  /** Available clients to filter by */
  clients: ClientOption[];
  /** Available projects to filter by (can be filtered based on selected client) */
  projects: ProjectOption[];
  /** Whether the filter panel is loading */
  loading?: boolean;
  /** Whether to disable all filter inputs */
  disabled?: boolean;
}

/**
 * Document type display labels
 */
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  coi: 'Certificate of Insurance',
  license: 'Business License',
  contract: 'Contract',
  w9: 'W-9 Tax Form',
  endorsement: 'Policy Endorsement',
  other: 'Other',
};

/**
 * Document status display labels
 */
export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  verified: 'Verified',
  pending: 'Pending',
  expiring: 'Expiring Soon',
  expired: 'Expired',
};

/**
 * Document status colors for badges
 */
export const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, string> = {
  verified: 'green',
  pending: 'yellow',
  expiring: 'orange',
  expired: 'red',
};
