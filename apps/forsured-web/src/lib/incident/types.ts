/**
 * Incident Response Types
 * REQ-164: Incident Response Plan & Procedures
 */

/**
 * Incident severity levels with response time targets
 */
export type IncidentSeverity = 'P0' | 'P1' | 'P2' | 'P3';

/**
 * Incident status lifecycle
 */
export type IncidentStatus =
  | 'detected'
  | 'investigating'
  | 'contained'
  | 'eradicating'
  | 'recovering'
  | 'resolved'
  | 'closed';

/**
 * Types of security incidents
 */
export type IncidentType =
  | 'data_breach'
  | 'unauthorized_access'
  | 'ransomware'
  | 'ddos'
  | 'malware'
  | 'insider_threat'
  | 'phishing'
  | 'vulnerability_exploit'
  | 'service_disruption'
  | 'other';

/**
 * Data classification levels
 */
export type DataClassification = 'restricted' | 'confidential' | 'internal' | 'public';

/**
 * Impact levels for business assessment
 */
export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Severity level configuration with response times and escalation
 */
export interface SeverityLevel {
  level: IncidentSeverity;
  name: string;
  description: string;
  examples: string[];
  responseTimeMinutes: number;
  escalationContacts: string[];
  requiresPostMortem: boolean;
}

/**
 * Timeline event during incident response
 */
export interface TimelineEvent {
  id: string;
  timestamp: string; // ISO 8601
  type: 'detection' | 'action' | 'discovery' | 'communication' | 'escalation';
  description: string;
  actor: string; // User or system that performed the action
  evidence: string[]; // Links to logs, screenshots, etc.
  metadata?: Record<string, unknown>;
}

/**
 * Impact assessment for an incident
 */
export interface ImpactAssessment {
  usersAffected: number;
  dataExposed: {
    classification: DataClassification;
    types: string[]; // e.g., 'email', 'SSN', 'policy_number'
    recordCount: number;
  }[];
  systemsCompromised: string[];
  businessImpact: {
    revenueImpact: number; // USD
    reputationImpact: ImpactLevel;
    regulatoryRisk: ImpactLevel;
  };
  estimatedCosts: {
    investigation: number;
    remediation: number;
    notification: number;
    legal: number;
    total: number;
  };
}

/**
 * Contact information for incident response
 */
export interface ContactInfo {
  id: string;
  role: string;
  name: string;
  email: string;
  phone: string;
  secondaryPhone?: string;
  availability: string;
  escalationOrder: number;
}

/**
 * Main incident record
 */
export interface Incident {
  id: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  type: IncidentType;
  title: string;
  description: string;
  detectedAt: string; // ISO 8601
  detectedBy: string;
  assignedTo?: string;
  resolvedAt?: string;
  closedAt?: string;
  timeline: TimelineEvent[];
  impactAssessment?: ImpactAssessment;
  affectedSystems: string[];
  affectedUsers: string[];
  containmentActions: string[];
  remediationActions: string[];
  notificationsSent: NotificationRecord[];
  postMortemId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Notification record for tracking communications
 */
export interface NotificationRecord {
  id: string;
  incidentId: string;
  type: 'internal' | 'customer' | 'regulatory' | 'media' | 'legal';
  recipient: string;
  sentAt: string;
  sentBy: string;
  templateUsed: string;
  status: 'pending' | 'sent' | 'failed' | 'acknowledged';
  acknowledgedAt?: string;
}

/**
 * Post-mortem document
 */
export interface PostMortem {
  id: string;
  incidentId: string;
  completedAt?: string;
  completedBy?: string;
  summary: string;
  timeline: TimelineEvent[];
  rootCause: {
    summary: string;
    fiveWhys: string[];
    contributingFactors: string[];
  };
  impactAssessment: ImpactAssessment;
  responseEvaluation: {
    whatWentWell: string[];
    whatCouldBeImproved: string[];
    responseTimeMetrics: {
      timeToDetect: number; // minutes
      timeToRespond: number; // minutes
      timeToContain: number; // minutes
      timeToResolve: number; // hours
    };
  };
  actionItems: ActionItem[];
  preventiveMeasures: string[];
  regulatoryNotifications: NotificationRecord[];
  lessonsLearned: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Action item from post-mortem
 */
export interface ActionItem {
  id: string;
  description: string;
  owner: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  completedAt?: string;
  blockedReason?: string;
}

/**
 * Communication template
 */
export interface CommunicationTemplate {
  id: string;
  name: string;
  type: 'internal' | 'customer' | 'regulatory' | 'media' | 'post_mortem';
  subject: string;
  body: string;
  requiredFields: string[];
  approvalRequired: boolean;
  approvers: string[];
  timingRequirements?: string;
  legalReviewRequired: boolean;
}

/**
 * Incident metrics for tracking performance
 */
export interface IncidentMetrics {
  // Detection
  meanTimeToDetect: number; // minutes
  falsePositiveRate: number; // percentage

  // Response
  meanTimeToRespond: number; // minutes
  meanTimeToContain: number; // hours
  meanTimeToResolve: number; // days

  // Impact
  incidentsPerMonth: number;
  usersAffectedTotal: number;
  downtimeTotal: number; // minutes
  financialImpactTotal: number; // USD

  // Compliance
  regulatoryNotificationTimeliness: number; // percentage within deadline
  postMortemCompletionRate: number; // percentage completed within 5 days
}

/**
 * Incident creation input
 */
export interface CreateIncidentInput {
  severity: IncidentSeverity;
  type: IncidentType;
  title: string;
  description: string;
  detectedBy: string;
  affectedSystems?: string[];
  affectedUsers?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Incident update input
 */
export interface UpdateIncidentInput {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  assignedTo?: string;
  description?: string;
  affectedSystems?: string[];
  affectedUsers?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Timeline event creation input
 */
export interface AddTimelineEventInput {
  incidentId: string;
  type: TimelineEvent['type'];
  description: string;
  actor: string;
  evidence?: string[];
  metadata?: Record<string, unknown>;
}
