/**
 * useAuditLog Hook
 *
 * React hook for easy audit logging from components
 *
 * Usage:
 * ```tsx
 * const { logEvent } = useAuditLog();
 *
 * await logEvent({
 *   category: 'data_access',
 *   action: 'view_document',
 *   metadata: { document_id: '123' }
 * });
 * ```
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback } from 'react';
import { logAuditEvent } from './AuditService';
import type { AuditLogRecord } from './types';

export interface UseAuditLogReturn {
  /**
   * Log an audit event
   */
  logEvent: (event: Partial<AuditLogRecord>) => Promise<void>;

  /**
   * Log authentication event
   */
  logAuth: (
    action: string,
    metadata?: Record<string, any>,
    status?: 'success' | 'failure'
  ) => Promise<void>;

  /**
   * Log data access event
   */
  logDataAccess: (
    action: string,
    resourceType: string,
    resourceId: string,
    metadata?: Record<string, any>
  ) => Promise<void>;

  /**
   * Log data modification event
   */
  logDataModification: (
    action: 'create' | 'update' | 'delete',
    tableName: string,
    recordId: string,
    metadata?: Record<string, any>
  ) => Promise<void>;

  /**
   * Log compliance action
   */
  logCompliance: (
    action: string,
    metadata?: Record<string, any>
  ) => Promise<void>;

  /**
   * Log security event
   */
  logSecurity: (
    action: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    metadata?: Record<string, any>
  ) => Promise<void>;
}

/**
 * Hook for audit logging
 */
export function useAuditLog(): UseAuditLogReturn {
  /**
   * Generic event logging
   */
  const logEvent = useCallback(async (event: Partial<AuditLogRecord>) => {
    try {
      await logAuditEvent(event);
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Never fail the application due to audit logging
    }
  }, []);

  /**
   * Log authentication event
   */
  const logAuth = useCallback(
    async (
      action: string,
      metadata?: Record<string, any>,
      status: 'success' | 'failure' = 'success'
    ) => {
      await logEvent({
        category: 'authentication',
        action,
        severity: status === 'failure' ? 'medium' : 'low',
        status,
        metadata,
      });
    },
    [logEvent]
  );

  /**
   * Log data access event
   */
  const logDataAccess = useCallback(
    async (
      action: string,
      resourceType: string,
      resourceId: string,
      metadata?: Record<string, any>
    ) => {
      await logEvent({
        category: 'data_access',
        action,
        severity: 'low',
        resource_type: resourceType,
        record_id: resourceId,
        metadata: {
          ...metadata,
          resource_type: resourceType,
          resource_id: resourceId,
        },
      });
    },
    [logEvent]
  );

  /**
   * Log data modification event
   */
  const logDataModification = useCallback(
    async (
      action: 'create' | 'update' | 'delete',
      tableName: string,
      recordId: string,
      metadata?: Record<string, any>
    ) => {
      await logEvent({
        category: 'data_modification',
        action,
        severity: action === 'delete' ? 'high' : 'medium',
        table_name: tableName,
        record_id: recordId,
        metadata: {
          ...metadata,
          table_name: tableName,
          record_id: recordId,
        },
      });
    },
    [logEvent]
  );

  /**
   * Log compliance action
   */
  const logCompliance = useCallback(
    async (action: string, metadata?: Record<string, any>) => {
      await logEvent({
        category: 'compliance',
        action,
        severity: 'medium',
        metadata,
      });
    },
    [logEvent]
  );

  /**
   * Log security event
   */
  const logSecurity = useCallback(
    async (
      action: string,
      severity: 'low' | 'medium' | 'high' | 'critical',
      metadata?: Record<string, any>
    ) => {
      await logEvent({
        category: 'security',
        action,
        severity,
        metadata,
      });
    },
    [logEvent]
  );

  return {
    logEvent,
    logAuth,
    logDataAccess,
    logDataModification,
    logCompliance,
    logSecurity,
  };
}

/**
 * Example Usage:
 *
 * 1. Log Document View:
 * ```tsx
 * const { logDataAccess } = useAuditLog();
 *
 * useEffect(() => {
 *   logDataAccess('view_document', 'document', documentId, {
 *     document_name: doc.name,
 *     document_type: doc.type
 *   });
 * }, [documentId]);
 * ```
 *
 * 2. Log Failed Login:
 * ```tsx
 * const { logAuth } = useAuditLog();
 *
 * try {
 *   await signIn(email, password);
 *   await logAuth('login_success', { email });
 * } catch (error) {
 *   await logAuth('login_failure', { email, error: error.message }, 'failure');
 * }
 * ```
 *
 * 3. Log Data Modification:
 * ```tsx
 * const { logDataModification } = useAuditLog();
 *
 * await updatePolicy(policyId, updates);
 * await logDataModification('update', 'policies', policyId, {
 *   fields_changed: Object.keys(updates),
 *   policy_number: policy.policy_number
 * });
 * ```
 *
 * 4. Log Compliance Evaluation:
 * ```tsx
 * const { logCompliance } = useAuditLog();
 *
 * const result = await evaluateCompliance(projectId, subcontractorId);
 * await logCompliance('compliance_evaluation_run', {
 *   project_id: projectId,
 *   subcontractor_id: subcontractorId,
 *   compliance_score: result.score,
 *   risk_level: result.risk_level
 * });
 * ```
 *
 * 5. Log Security Event:
 * ```tsx
 * const { logSecurity } = useAuditLog();
 *
 * if (suspiciousActivity) {
 *   await logSecurity('suspicious_activity', 'high', {
 *     activity_type: 'rapid_api_calls',
 *     call_count: callCount,
 *     duration_ms: duration
 *   });
 * }
 * ```
 */
