/**
 * AuditService - Comprehensive Audit Logging Service
 *
 * Implements Comprehensive Audit Logging with 7-Year Retention
 *
 * Features:
 * - Event logging for 8 categories (authentication, authorization, data_access, data_modification, admin, security, compliance, system)
 * - WORM (Write Once Read Many) enforcement
 * - Hash chaining for tamper detection
 * - Failed event retry mechanism
 * - Real-time alert rule checking
 * - Context enrichment (IP, user-agent, geolocation)
 */

// Note: Using browser's global crypto (Web Crypto API), not Node.js crypto module
import type {
  AuditLogRecord,
  AuditSeverity,
  AuditLogFilters,
  AuditLogSearchResult,
  HashChainVerificationResult,
  AuditAlertRule,
  AuditAlert,
} from './types';

// Supabase client - will be injected or imported based on project setup
// For now, using a placeholder that should be replaced with actual Supabase client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabaseClient: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initializeAuditService(client: any) {
  supabaseClient = client;
}

/**
 * Main Audit Service class
 */
export class AuditService {
  private requestId: string;
  private sessionId: string;
  private alertRules: AuditAlertRule[] = [];

  constructor() {
    this.requestId = this.generateUUID();
    this.sessionId = this.getSessionId();
    this.initializeAlertRules();
  }

  /**
   * Log an audit event
   * This is the primary method for recording audit events
   *
   * @param event - Audit event to log
   * @returns Promise<void>
   */
  async log(event: Partial<AuditLogRecord>): Promise<void> {
    try {
      // Enrich event with context
      const enrichedEvent = await this.enrichEvent(event);

      // Validate required fields
      this.validateEvent(enrichedEvent);

      // Insert into database
      const { error } = await this.insertAuditLog(enrichedEvent);

      if (error) {
        console.error('Failed to log audit event:', error);
        // Queue for retry
        this.queueFailedEvent(enrichedEvent);
      } else {
        // Check for alert rules (async, non-blocking)
        this.checkAlertRules(enrichedEvent).catch(err => {
          console.error('Alert rule check failed:', err);
        });
      }
    } catch (error) {
      console.error('Audit logging error:', error);
      // Never fail the application due to audit logging
      // Queue for retry
      this.queueFailedEvent(event);
    }
  }

  /**
   * Batch log multiple events (for performance)
   * @param events - Array of audit events
   */
  async logBatch(events: Partial<AuditLogRecord>[]): Promise<void> {
    const enrichedEvents = await Promise.all(
      events.map(event => this.enrichEvent(event))
    );

    const { error } = await supabaseClient
      .schema('forsured')
      .from('audit_log')
      .insert(enrichedEvents);

    if (error) {
      console.error('Failed to batch log audit events:', error);
      enrichedEvents.forEach(event => this.queueFailedEvent(event));
    }
  }

  /**
   * Query audit logs with filters
   * @param filters - Search filters
   * @returns Search result with pagination
   */
  async query(filters: AuditLogFilters): Promise<AuditLogSearchResult> {
    let query = supabaseClient.schema('forsured').from('audit_log').select('*', { count: 'exact' });

    // Apply filters
    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date);
    }
    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.action) {
      query = query.eq('action', filters.action);
    }
    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters.organization_id) {
      query = query.eq('organization_id', filters.organization_id);
    }
    if (filters.resource_type) {
      query = query.eq('resource_type', filters.resource_type);
    }
    if (filters.resource_id) {
      query = query.eq('record_id', filters.resource_id);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    // Apply pagination
    const limit = filters.limit || 100;
    const offset = filters.offset || 0;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to query audit logs: ${error.message}`);
    }

    return {
      logs: data || [],
      total_count: count || 0,
      page: Math.floor(offset / limit) + 1,
      page_size: limit,
      has_more: (count || 0) > offset + limit,
    };
  }

  /**
   * Export audit logs to CSV or JSON
   * @param filters - Search filters
   * @param format - Export format (csv or json)
   * @returns Formatted export string
   */
  async export(
    filters: AuditLogFilters,
    format: 'csv' | 'json' = 'csv'
  ): Promise<string> {
    // Query all matching logs (no pagination)
    const result = await this.query({ ...filters, limit: 100000 });

    if (format === 'json') {
      return JSON.stringify(result.logs, null, 2);
    }

    // CSV format
    const headers = [
      'id',
      'created_at',
      'category',
      'action',
      'severity',
      'user_id',
      'organization_id',
      'resource_type',
      'resource_name',
      'status',
      'ip_address',
      'metadata',
    ];

    const rows = result.logs.map(log =>
      headers.map(key => {
        const value = log[key as keyof AuditLogRecord];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      })
    );

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }

  /**
   * Verify hash chain integrity for a date range
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Verification result
   */
  async verifyHashChain(
    startDate: Date,
    endDate: Date
  ): Promise<HashChainVerificationResult> {
    const { data, error } = await supabaseClient.rpc(
      'verify_audit_log_hash_chain',
      {
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
      }
    );

    if (error) {
      throw new Error(`Hash chain verification failed: ${error.message}`);
    }

    const result = data[0];
    return {
      valid: result.valid,
      errors: result.errors || [],
      verified_count: result.verified_count,
      failed_count: result.error_count,
    };
  }

  /**
   * Retry failed audit events from queue
   */
  async retryFailedEvents(): Promise<number> {
    const queue = this.getFailedEventQueue();
    let successCount = 0;

    for (const event of queue) {
      const { error } = await this.insertAuditLog(event);
      if (!error) {
        // Remove from queue on success
        this.removeFromQueue(event);
        successCount++;
      }
    }

    return successCount;
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  /**
   * Enrich event with context and defaults
   */
  private async enrichEvent(
    event: Partial<AuditLogRecord>
  ): Promise<AuditLogRecord> {
    const user = await this.getCurrentUser();
    const ipAddress = await this.getUserIpAddress();

    return {
      category: event.category!,
      action: event.action!,
      severity: event.severity || this.inferSeverity(event),
      user_id: event.user_id || user?.id,
      organization_id: event.organization_id || user?.organization_id,
      ip_address: event.ip_address || ipAddress,
      user_agent: event.user_agent || this.getUserAgent(),
      request_id: event.request_id || this.requestId,
      session_id: event.session_id || this.sessionId,
      status: event.status || 'success',
      metadata: event.metadata || {},
      table_name: event.table_name,
      record_id: event.record_id,
      resource_type: event.resource_type,
      resource_name: event.resource_name,
      operation: event.operation,
      old_data: event.old_data,
      new_data: event.new_data,
      changed_fields: event.changed_fields,
      impersonated_by_user_id: event.impersonated_by_user_id,
      country_code: event.country_code,
      region: event.region,
      city: event.city,
      error_message: event.error_message,
    };
  }

  /**
   * Validate required event fields
   */
  private validateEvent(event: AuditLogRecord): void {
    if (!event.category) {
      throw new Error('Audit event must have a category');
    }
    if (!event.action) {
      throw new Error('Audit event must have an action');
    }
  }

  /**
   * Infer severity based on category and action
   */
  private inferSeverity(event: Partial<AuditLogRecord>): AuditSeverity {
    if (event.category === 'security') return 'high';
    // Data deletions are high severity
    if (event.category === 'data_modification' && event.action === 'delete') return 'high';
    if (event.category === 'admin') return 'medium';
    if (event.category === 'compliance') return 'medium';
    if (event.category === 'data_modification') return 'medium';
    if (event.status === 'failure' || event.status === 'denied') return 'medium';
    return 'low';
  }

  /**
   * Insert audit log into database
   */
  private async insertAuditLog(event: AuditLogRecord) {
    if (!supabaseClient) {
      throw new Error('Supabase client not initialized. Call initializeAuditService() first.');
    }

    return await supabaseClient.schema('forsured').from('audit_log').insert(event);
  }

  /**
   * Get current session ID (stored in sessionStorage)
   */
  private getSessionId(): string {
    if (typeof window === 'undefined') {
      // Server-side: generate new session ID
      return this.generateUUID();
    }

    let sessionId = sessionStorage.getItem('audit_session_id');
    if (!sessionId) {
      sessionId = this.generateUUID();
      sessionStorage.setItem('audit_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Get current authenticated user
   */
  private async getCurrentUser() {
    if (!supabaseClient) return null;

    try {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      return user;
    } catch {
      return null;
    }
  }

  /**
   * Get user's IP address via API
   */
  private async getUserIpAddress(): Promise<string | undefined> {
    if (typeof window === 'undefined') return undefined;

    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return undefined;
    }
  }

  /**
   * Get user agent string
   */
  private getUserAgent(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    return navigator.userAgent;
  }

  /**
   * Queue failed event for retry
   */
  private queueFailedEvent(event: Partial<AuditLogRecord>): void {
    if (typeof window === 'undefined') return;

    const queue = this.getFailedEventQueue();
    queue.push(event);
    // Limit queue size to prevent memory issues
    const limitedQueue = queue.slice(-1000);
    localStorage.setItem('audit_failed_queue', JSON.stringify(limitedQueue));
  }

  /**
   * Get failed event queue from localStorage
   */
  private getFailedEventQueue(): Partial<AuditLogRecord>[] {
    if (typeof window === 'undefined') return [];

    try {
      const queue = localStorage.getItem('audit_failed_queue');
      return queue ? JSON.parse(queue) : [];
    } catch {
      return [];
    }
  }

  /**
   * Remove event from failed queue
   */
  private removeFromQueue(event: Partial<AuditLogRecord>): void {
    if (typeof window === 'undefined') return;

    const queue = this.getFailedEventQueue();
    const filtered = queue.filter(e => e.request_id !== event.request_id);
    localStorage.setItem('audit_failed_queue', JSON.stringify(filtered));
  }

  /**
   * Generate UUID v4
   */
  private generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Initialize default alert rules
   */
  private initializeAlertRules(): void {
    this.alertRules = [
      {
        name: 'Multiple Failed Logins',
        description: 'Detect brute force login attempts',
        severity: 'high',
        enabled: true,
        condition: (events: AuditLogRecord[]) => {
          const failedLogins = events.filter(
            e =>
              e.category === 'authentication' &&
              e.action === 'login_failure'
          );
          return failedLogins.length >= 5;
        },
        action: async (events: AuditLogRecord[]) => {
          await this.sendAlert({
            rule_name: 'Multiple Failed Logins',
            severity: 'high',
            title: 'Multiple Failed Login Attempts Detected',
            message: `User attempted ${events.length} failed logins`,
            events,
          });
        },
      },
      {
        name: 'Suspicious Data Access',
        description: 'Detect unusual data access patterns',
        severity: 'critical',
        enabled: true,
        condition: (events: AuditLogRecord[]) => {
          const dataAccess = events.filter(e => e.category === 'data_access');
          if (dataAccess.length < 100) return false;

          // Check if accessing many records quickly (< 1 minute)
          const firstEvent = new Date(dataAccess[0].created_at!);
          const lastEvent = new Date(dataAccess[dataAccess.length - 1].created_at!);
          const durationMs = lastEvent.getTime() - firstEvent.getTime();

          return durationMs < 60000; // Less than 1 minute
        },
        action: async (events: AuditLogRecord[]) => {
          await this.sendAlert({
            rule_name: 'Suspicious Data Access',
            severity: 'critical',
            title: 'Suspicious Data Access Pattern Detected',
            message: `User accessed ${events.length} records in under 1 minute`,
            events,
          });
        },
      },
      {
        name: 'Unauthorized Admin Action',
        description: 'Detect unauthorized admin action attempts',
        severity: 'high',
        enabled: true,
        condition: (events: AuditLogRecord[]) => {
          return events.some(
            e => e.category === 'admin' && e.status === 'denied'
          );
        },
        action: async (events: AuditLogRecord[]) => {
          await this.sendAlert({
            rule_name: 'Unauthorized Admin Action',
            severity: 'high',
            title: 'Unauthorized Admin Action Attempt',
            message: `User attempted unauthorized admin action: ${events[0].action}`,
            events,
          });
        },
      },
    ];
  }

  /**
   * Check alert rules for recent events
   */
  private async checkAlertRules(event: AuditLogRecord): Promise<void> {
    if (!event.user_id) return;

    // Get recent events for this user (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentEvents = await this.query({
      user_id: event.user_id,
      start_date: fiveMinutesAgo.toISOString(),
      limit: 1000,
    });

    const allEvents = [...recentEvents.logs, event];

    // Check each alert rule
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      if (rule.condition(allEvents)) {
        console.log(`Alert triggered: ${rule.name}`);
        await rule.action(allEvents);
      }
    }
  }

  /**
   * Send alert notification
   */
  private async sendAlert(alert: Omit<AuditAlert, 'id' | 'triggered_at' | 'acknowledged'>): Promise<void> {
    const fullAlert: AuditAlert = {
      id: this.generateUUID(),
      triggered_at: new Date().toISOString(),
      acknowledged: false,
      ...alert,
    };

    // Log the alert as a security event
    await this.log({
      category: 'security',
      action: 'alert_triggered',
      severity: alert.severity,
      metadata: {
        alert_id: fullAlert.id,
        rule_name: alert.rule_name,
        title: alert.title,
        message: alert.message,
        event_count: alert.events.length,
      },
    });

    // TODO: Integrate with actual alerting service (email, Slack, PagerDuty, etc.)
    console.warn('SECURITY ALERT:', fullAlert);
  }
}

// =============================================================================
// SINGLETON INSTANCE & CONVENIENCE METHODS
// =============================================================================

export const auditService = new AuditService();

/**
 * Convenience method to log an audit event
 * @param event - Audit event to log
 */
export const logAuditEvent = (event: Partial<AuditLogRecord>) =>
  auditService.log(event);

/**
 * Convenience method to query audit logs
 * @param filters - Search filters
 */
export const queryAuditLogs = (filters: AuditLogFilters) =>
  auditService.query(filters);

/**
 * Convenience method to export audit logs
 * @param filters - Search filters
 * @param format - Export format
 */
export const exportAuditLogs = (
  filters: AuditLogFilters,
  format: 'csv' | 'json' = 'csv'
) => auditService.export(filters, format);

/**
 * Convenience method to verify hash chain
 * @param startDate - Start date
 * @param endDate - End date
 */
export const verifyAuditHashChain = (startDate: Date, endDate: Date) =>
  auditService.verifyHashChain(startDate, endDate);
