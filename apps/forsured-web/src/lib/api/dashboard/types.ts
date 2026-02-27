/**
 * Manager Dashboard - Type Definitions
 * Dashboard-specific types for real-time compliance metrics
 */

import { ComplianceStatus, TaskPriority, TaskStatus, PolicyType } from '../../../types';

/**
 * Overall dashboard metrics aggregated from all subcontractors
 */
export interface DashboardOverview {
  overall_compliance_score: number; // 0-100
  total_subcontractors: number;
  compliant_count: number;
  warning_count: number;
  critical_count: number;
  total_projects: number;
  active_projects: number;
  last_updated: string;
}

/**
 * Individual subcontractor compliance score
 */
export interface SubcontractorScore {
  id: string;
  company_name: string;
  compliance_score: number; // 0-100
  status: ComplianceStatus;
  open_tasks_count: number;
  policies_expiring_count: number;
  last_updated: string;
  project_count: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Task summary grouped by priority
 */
export interface TaskSummary {
  total_open_tasks: number;
  high_priority_count: number;
  medium_priority_count: number;
  low_priority_count: number;
  urgent_count: number;
  overdue_count: number;
  due_today_count: number;
  last_updated: string;
}

/**
 * Policy expiring within specified timeframe
 */
export interface ExpiringPolicy {
  id: string;
  policy_number: string;
  policy_type: PolicyType;
  subcontractor_id: string;
  subcontractor_name: string;
  expiration_date: string;
  days_remaining: number;
  project_count: number; // Number of active projects affected
  status: 'active' | 'expired';
}

/**
 * Activity event types for the feed
 */
export type ActivityEventType =
  | 'policy_uploaded'
  | 'policy_updated'
  | 'policy_expired'
  | 'task_created'
  | 'task_completed'
  | 'compliance_score_changed'
  | 'subcontractor_added'
  | 'project_status_changed';

/**
 * Activity feed event
 */
export interface ActivityEvent {
  id: string;
  event_type: ActivityEventType;
  description: string;
  subcontractor_id?: string;
  subcontractor_name?: string;
  project_id?: string;
  project_name?: string;
  user_id?: string;
  user_name?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

/**
 * Compliance trend data point for charting
 */
export interface ComplianceTrendData {
  date: string;
  overall_score: number;
  compliant_count: number;
  warning_count: number;
  critical_count: number;
}

/**
 * Detailed drill-down data for a specific metric
 */
export interface DrillDownData {
  metric_name: string;
  current_value: number;
  previous_value: number;
  change_percentage: number;
  trend_data: ComplianceTrendData[];
  contributing_factors: ContributingFactor[];
}

/**
 * Contributing factor to a metric
 */
export interface ContributingFactor {
  name: string;
  value: number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

/**
 * Subcontractor detail panel data
 */
export interface SubcontractorDetail {
  id: string;
  company_name: string;
  compliance_score: number;
  status: ComplianceStatus;
  policies: SubcontractorPolicyInfo[];
  open_tasks: SubcontractorTaskInfo[];
  recent_activity: ActivityEvent[];
  compliance_history: ComplianceTrendData[];
}

/**
 * Policy info for subcontractor detail
 */
export interface SubcontractorPolicyInfo {
  id: string;
  policy_number: string;
  policy_type: PolicyType;
  provider: string;
  expiration_date: string;
  days_remaining: number;
  status: 'active' | 'expired' | 'expiring_soon';
}

/**
 * Task info for subcontractor detail
 */
export interface SubcontractorTaskInfo {
  id: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string;
  days_until_due?: number;
}

/**
 * Dashboard filter options
 */
export interface DashboardFilters {
  project_ids?: string[];
  subcontractor_search?: string;
  status_filter?: ComplianceStatus[];
  date_range?: {
    start: string;
    end: string;
  };
}

/**
 * Export report configuration
 */
export interface ExportConfig {
  format: 'pdf' | 'csv';
  include_charts?: boolean;
  filters?: DashboardFilters;
  report_date: string;
}

/**
 * Real-time update payload
 */
export interface DashboardUpdate {
  updated_at: string;
  changed_metrics: {
    overview?: Partial<DashboardOverview>;
    subcontractor_scores?: SubcontractorScore[];
    task_summary?: Partial<TaskSummary>;
    new_activities?: ActivityEvent[];
  };
}

// =============================================================================
// Task Severity and Risk Distribution Types
// =============================================================================

import { TaskSeverity } from '../../../types';

/**
 * Task summary including severity breakdown
 * Extends TaskSummary with severity-based metrics
 */
export interface TaskSeveritySummary extends TaskSummary {
  // Severity breakdown
  severity_counts: Record<TaskSeverity, number>;
  severity_summary: string;
  urgent_severity_count: number; // critical + high
}

/**
 * Risk distribution based on task severity
 * Correlates tasks with compliance risk levels
 */
export interface RiskDistribution {
  /** Total tasks analyzed */
  total_tasks: number;
  /** Tasks by severity level */
  severity_breakdown: Record<TaskSeverity, number>;
  /** Risk level assessment based on severity distribution */
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  /** Clients with compliance gaps (critical tasks) */
  clients_with_gaps: number;
  /** Total clients */
  total_clients: number;
  /** Compliance rate (clients without critical tasks / total clients) */
  compliance_rate: number;
  /** Human-readable summary */
  summary: string;
  /** Correlation explanation */
  correlation_explanation: string;
  /** Last updated timestamp */
  last_updated: string;
}

/**
 * Client risk profile based on task severity
 */
export interface ClientRiskProfile {
  client_id: string;
  client_name: string;
  /** Number of tasks by severity */
  task_severity_counts: Record<TaskSeverity, number>;
  /** Overall risk level based on task severity */
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  /** Whether client has critical tasks (compliance gap) */
  has_compliance_gap: boolean;
  /** Number of urgent tasks (critical + high) */
  urgent_task_count: number;
}
