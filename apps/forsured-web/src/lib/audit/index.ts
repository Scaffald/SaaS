/**
 * Audit Logging System
 *
 * REQ-130: Comprehensive Audit Logging with 7-Year Retention
 *
 * This module provides a complete audit logging system for ForSured with:
 * - WORM (Write Once Read Many) implementation
 * - Hash chaining for tamper detection
 * - 7-year retention with tiered storage (hot/warm/cold)
 * - 8 event categories (authentication, authorization, data_access, data_modification, admin, security, compliance, system)
 * - Real-time alerting
 * - Compliance reporting (GDPR, CCPA, SOC 2)
 *
 * @see plans/51_AUDIT_LOGGING_SYSTEM.md for complete specification
 */

// Core Service
export { AuditService, auditService, initializeAuditService } from './AuditService';

// Convenience Functions
export {
  logAuditEvent,
  queryAuditLogs,
  exportAuditLogs,
  verifyAuditHashChain,
} from './AuditService';

// React Hook
export { useAuditLog } from './useAuditLog';
export type { UseAuditLogReturn } from './useAuditLog';

// Types
export type {
  // Core Types
  AuditLogRecord,
  AuditCategory,
  AuditSeverity,
  AuditStatus,
  AuditOperation,

  // Event Types
  AuthenticationEvent,
  AuthorizationEvent,
  DataAccessEvent,
  DataModificationEvent,
  AdminActionEvent,
  SecurityEvent,
  ComplianceActionEvent,
  SystemEvent,
  AuditEvent,

  // Query Types
  AuditLogFilters,
  AuditLogSearchResult,

  // Verification Types
  HashChainVerificationResult,

  // Storage Types
  StorageTier,
  AuditLogArchiveMetadata,

  // Alert Types
  AuditAlertRule,
  AuditAlert,

  // Report Types
  ComplianceReportType,
  ComplianceReport,
} from './types';

/**
 * Quick Start Guide
 *
 * 1. Initialize the audit service (in your app's entry point):
 * ```tsx
 * import { createClient } from '@supabase/supabase-js';
 * import { initializeAuditService } from '@/lib/audit';
 *
 * const supabase = createClient(url, key);
 * initializeAuditService(supabase);
 * ```
 *
 * 2. Use the React hook in components:
 * ```tsx
 * import { useAuditLog } from '@/lib/audit';
 *
 * function MyComponent() {
 *   const { logDataAccess } = useAuditLog();
 *
 *   useEffect(() => {
 *     logDataAccess('view_document', 'document', documentId);
 *   }, [documentId]);
 * }
 * ```
 *
 * 3. Use the service directly (server-side or utility functions):
 * ```tsx
 * import { logAuditEvent } from '@/lib/audit';
 *
 * await logAuditEvent({
 *   category: 'authentication',
 *   action: 'login_success',
 *   metadata: { email: user.email }
 * });
 * ```
 *
 * 4. Query audit logs:
 * ```tsx
 * import { queryAuditLogs } from '@/lib/audit';
 *
 * const result = await queryAuditLogs({
 *   category: 'security',
 *   severity: 'high',
 *   start_date: '2025-01-01',
 *   limit: 100
 * });
 * ```
 *
 * 5. Export audit logs for compliance:
 * ```tsx
 * import { exportAuditLogs } from '@/lib/audit';
 *
 * const csv = await exportAuditLogs({
 *   start_date: '2025-01-01',
 *   end_date: '2025-12-31'
 * }, 'csv');
 * ```
 *
 * 6. Verify hash chain integrity:
 * ```tsx
 * import { verifyAuditHashChain } from '@/lib/audit';
 *
 * const result = await verifyAuditHashChain(
 *   new Date('2025-01-01'),
 *   new Date('2025-12-31')
 * );
 *
 * if (!result.valid) {
 *   console.error('Hash chain tampering detected!', result.errors);
 * }
 * ```
 */
