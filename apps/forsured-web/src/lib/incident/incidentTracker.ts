/**
 * Incident Tracker Implementation
 * Incident Response Plan & Procedures
 */

import {
  Incident,
  CreateIncidentInput,
  UpdateIncidentInput,
  AddTimelineEventInput,
  TimelineEvent,
  IncidentStatus,
  IncidentSeverity,
} from './types';
import { getSeverityLevel } from './severityLevels';

// In-memory storage (in production, this would be a database)
const incidents: Map<string, Incident> = new Map();
let incidentCounter = 0;

/**
 * Generate unique incident ID in format: INC-YYYY-NNN
 */
function generateIncidentId(): string {
  incidentCounter++;
  const year = new Date().getFullYear();
  const counter = incidentCounter.toString().padStart(3, '0');
  return `INC-${year}-${counter}`;
}

/**
 * Generate unique event ID
 */
function generateEventId(): string {
  return `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate severity level
 */
function validateSeverity(severity: IncidentSeverity): void {
  const level = getSeverityLevel(severity);
  if (!level) {
    throw new Error(`Invalid severity level: ${severity}`);
  }
}

/**
 * Create initial detection timeline event
 */
function createDetectionEvent(input: CreateIncidentInput): TimelineEvent {
  return {
    id: generateEventId(),
    timestamp: new Date().toISOString(),
    type: 'detection',
    description: `Incident detected: ${input.title}`,
    actor: input.detectedBy,
    evidence: [],
    metadata: {
      detectionSource: input.detectedBy,
      severity: input.severity,
    },
  };
}

/**
 * Create a new incident
 */
export function createIncident(input: CreateIncidentInput): Incident {
  validateSeverity(input.severity);

  const now = new Date().toISOString();
  const id = generateIncidentId();
  const detectionEvent = createDetectionEvent(input);

  const incident: Incident = {
    id,
    severity: input.severity,
    status: 'detected',
    type: input.type,
    title: input.title,
    description: input.description,
    detectedAt: now,
    detectedBy: input.detectedBy,
    timeline: [detectionEvent],
    affectedSystems: input.affectedSystems || [],
    affectedUsers: input.affectedUsers || [],
    containmentActions: [],
    remediationActions: [],
    notificationsSent: [],
    metadata: input.metadata || {},
    createdAt: now,
    updatedAt: now,
  };

  incidents.set(id, incident);
  return incident;
}

/**
 * Update an existing incident
 */
export function updateIncident(id: string, input: UpdateIncidentInput): Incident {
  const incident = incidents.get(id);
  if (!incident) {
    throw new Error(`Incident not found: ${id}`);
  }

  if (input.severity) {
    validateSeverity(input.severity);

    // If severity changed, add escalation event
    if (input.severity !== incident.severity) {
      const escalationEvent: TimelineEvent = {
        id: generateEventId(),
        timestamp: new Date().toISOString(),
        type: 'escalation',
        description: `Severity escalated from ${incident.severity} to ${input.severity}`,
        actor: 'system',
        evidence: [],
      };
      incident.timeline.push(escalationEvent);
    }
  }

  // Update fields
  const updated: Incident = {
    ...incident,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  incidents.set(id, updated);
  return updated;
}

/**
 * Get an incident by ID
 */
export function getIncident(id: string): Incident | null {
  return incidents.get(id) || null;
}

/**
 * Get all incidents with optional filtering
 */
export function getAllIncidents(filters?: {
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  type?: string;
}): Incident[] {
  let results = Array.from(incidents.values());

  if (filters?.severity) {
    results = results.filter((inc) => inc.severity === filters.severity);
  }

  if (filters?.status) {
    results = results.filter((inc) => inc.status === filters.status);
  }

  if (filters?.type) {
    results = results.filter((inc) => inc.type === filters.type);
  }

  return results.sort(
    (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
  );
}

/**
 * Add a timeline event to an incident
 */
export function addTimelineEvent(input: AddTimelineEventInput): TimelineEvent {
  const incident = incidents.get(input.incidentId);
  if (!incident) {
    throw new Error(`Incident not found: ${input.incidentId}`);
  }

  const event: TimelineEvent = {
    id: generateEventId(),
    timestamp: new Date().toISOString(),
    type: input.type,
    description: input.description,
    actor: input.actor,
    evidence: input.evidence || [],
    metadata: input.metadata,
  };

  incident.timeline.push(event);
  incident.updatedAt = new Date().toISOString();
  incidents.set(incident.id, incident);

  return event;
}

/**
 * Get incident timeline
 */
export function getIncidentTimeline(incidentId: string): TimelineEvent[] {
  const incident = incidents.get(incidentId);
  if (!incident) {
    throw new Error(`Incident not found: ${incidentId}`);
  }
  return incident.timeline;
}

/**
 * Close an incident
 */
export function closeIncident(id: string, closedBy: string): Incident {
  const incident = incidents.get(id);
  if (!incident) {
    throw new Error(`Incident not found: ${id}`);
  }

  if (incident.status !== 'resolved') {
    throw new Error('Incident must be resolved before closing');
  }

  const now = new Date().toISOString();
  const closeEvent: TimelineEvent = {
    id: generateEventId(),
    timestamp: now,
    type: 'action',
    description: `Incident closed by ${closedBy}`,
    actor: closedBy,
    evidence: [],
  };

  const updated: Incident = {
    ...incident,
    status: 'closed',
    closedAt: now,
    timeline: [...incident.timeline, closeEvent],
    updatedAt: now,
  };

  incidents.set(id, updated);
  return updated;
}

/**
 * Escalate incident severity
 */
export function escalateIncident(
  id: string,
  newSeverity: IncidentSeverity,
  escalatedBy: string,
  reason: string
): Incident {
  const incident = incidents.get(id);
  if (!incident) {
    throw new Error(`Incident not found: ${id}`);
  }

  validateSeverity(newSeverity);

  // Validate that this is actually an escalation (not a downgrade)
  const severityOrder: Record<IncidentSeverity, number> = {
    P0: 4,
    P1: 3,
    P2: 2,
    P3: 1,
  };

  if (severityOrder[newSeverity] <= severityOrder[incident.severity]) {
    throw new Error('Cannot downgrade severity using escalateIncident');
  }

  const now = new Date().toISOString();
  const escalationEvent: TimelineEvent = {
    id: generateEventId(),
    timestamp: now,
    type: 'escalation',
    description: `Severity escalated from ${incident.severity} to ${newSeverity}. Reason: ${reason}`,
    actor: escalatedBy,
    evidence: [],
  };

  // Get escalation contacts for the new severity level
  const newLevel = getSeverityLevel(newSeverity);
  const escalationContacts = newLevel?.escalationContacts || [];

  const updated: Incident = {
    ...incident,
    severity: newSeverity,
    timeline: [...incident.timeline, escalationEvent],
    metadata: {
      ...incident.metadata,
      escalationNotificationsSent: escalationContacts,
      escalatedAt: now,
      escalatedBy,
      escalationReason: reason,
    },
    updatedAt: now,
  };

  incidents.set(id, updated);
  return updated;
}

/**
 * Clear all incidents (for testing purposes)
 */
export function clearAllIncidents(): void {
  incidents.clear();
  incidentCounter = 0;
}
