/**
 * Post-Mortem Manager
 * REQ-164: Incident Response Plan & Procedures
 */

import { PostMortem, ActionItem, Incident } from './types';
import { requiresPostMortem } from './severityLevels';

// In-memory storage (in production, this would be a database)
const postMortems: Map<string, PostMortem> = new Map();

/**
 * Generate unique post-mortem ID
 */
function generatePostMortemId(incidentId: string): string {
  return `PM-${incidentId}`;
}

/**
 * Generate unique action item ID
 */
function generateActionItemId(): string {
  return `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new post-mortem for an incident
 */
export function createPostMortem(incident: Incident): PostMortem {
  if (!requiresPostMortem(incident.severity)) {
    throw new Error(`Post-mortem not required for ${incident.severity} incidents`);
  }

  if (incident.status !== 'resolved' && incident.status !== 'closed') {
    throw new Error('Post-mortem can only be created for resolved or closed incidents');
  }

  const id = generatePostMortemId(incident.id);
  const now = new Date().toISOString();

  const postMortem: PostMortem = {
    id,
    incidentId: incident.id,
    summary: '',
    timeline: [...incident.timeline],
    rootCause: {
      summary: '',
      fiveWhys: [],
      contributingFactors: [],
    },
    impactAssessment: incident.impactAssessment || {
      usersAffected: 0,
      dataExposed: [],
      systemsCompromised: [],
      businessImpact: {
        revenueImpact: 0,
        reputationImpact: 'low',
        regulatoryRisk: 'none',
      },
      estimatedCosts: {
        investigation: 0,
        remediation: 0,
        notification: 0,
        legal: 0,
        total: 0,
      },
    },
    responseEvaluation: {
      whatWentWell: [],
      whatCouldBeImproved: [],
      responseTimeMetrics: {
        timeToDetect: 0,
        timeToRespond: 0,
        timeToContain: 0,
        timeToResolve: 0,
      },
    },
    actionItems: [],
    preventiveMeasures: [],
    regulatoryNotifications: [...incident.notificationsSent],
    lessonsLearned: [],
    createdAt: now,
    updatedAt: now,
  };

  postMortems.set(id, postMortem);
  return postMortem;
}

/**
 * Update post-mortem content
 */
export function updatePostMortem(
  id: string,
  updates: Partial<Omit<PostMortem, 'id' | 'incidentId' | 'createdAt'>>
): PostMortem {
  const postMortem = postMortems.get(id);
  if (!postMortem) {
    throw new Error(`Post-mortem not found: ${id}`);
  }

  const updated: PostMortem = {
    ...postMortem,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  postMortems.set(id, updated);
  return updated;
}

/**
 * Complete a post-mortem
 */
export function completePostMortem(id: string, completedBy: string): PostMortem {
  const postMortem = postMortems.get(id);
  if (!postMortem) {
    throw new Error(`Post-mortem not found: ${id}`);
  }

  // Validate required fields are completed
  if (!postMortem.summary) {
    throw new Error('Post-mortem summary is required');
  }
  if (postMortem.rootCause.fiveWhys.length === 0) {
    throw new Error('Root cause analysis (five whys) is required');
  }
  if (postMortem.actionItems.length === 0) {
    throw new Error('At least one action item is required');
  }

  const updated: PostMortem = {
    ...postMortem,
    completedAt: new Date().toISOString(),
    completedBy,
    updatedAt: new Date().toISOString(),
  };

  postMortems.set(id, updated);
  return updated;
}

/**
 * Add action item to post-mortem
 */
export function addActionItem(
  postMortemId: string,
  description: string,
  owner: string,
  dueDate: string
): ActionItem {
  const postMortem = postMortems.get(postMortemId);
  if (!postMortem) {
    throw new Error(`Post-mortem not found: ${postMortemId}`);
  }

  const actionItem: ActionItem = {
    id: generateActionItemId(),
    description,
    owner,
    dueDate,
    status: 'pending',
  };

  postMortem.actionItems.push(actionItem);
  postMortem.updatedAt = new Date().toISOString();
  postMortems.set(postMortemId, postMortem);

  return actionItem;
}

/**
 * Update action item status
 */
export function updateActionItem(
  postMortemId: string,
  actionItemId: string,
  updates: Partial<Omit<ActionItem, 'id'>>
): ActionItem {
  const postMortem = postMortems.get(postMortemId);
  if (!postMortem) {
    throw new Error(`Post-mortem not found: ${postMortemId}`);
  }

  const actionItemIndex = postMortem.actionItems.findIndex((item) => item.id === actionItemId);
  if (actionItemIndex === -1) {
    throw new Error(`Action item not found: ${actionItemId}`);
  }

  const updated: ActionItem = {
    ...postMortem.actionItems[actionItemIndex],
    ...updates,
  };

  if (updates.status === 'completed' && !updated.completedAt) {
    updated.completedAt = new Date().toISOString();
  }

  postMortem.actionItems[actionItemIndex] = updated;
  postMortem.updatedAt = new Date().toISOString();
  postMortems.set(postMortemId, postMortem);

  return updated;
}

/**
 * Get post-mortem by ID
 */
export function getPostMortem(id: string): PostMortem | null {
  return postMortems.get(id) || null;
}

/**
 * Get post-mortem by incident ID
 */
export function getPostMortemByIncident(incidentId: string): PostMortem | null {
  const pmId = generatePostMortemId(incidentId);
  return postMortems.get(pmId) || null;
}

/**
 * Get all post-mortems
 */
export function getAllPostMortems(filters?: {
  completed?: boolean;
  incidentSeverity?: string;
}): PostMortem[] {
  let results = Array.from(postMortems.values());

  if (filters?.completed !== undefined) {
    results = results.filter((pm) => !!pm.completedAt === filters.completed);
  }

  return results.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Get overdue action items across all post-mortems
 */
export function getOverdueActionItems(): Array<{
  postMortemId: string;
  incidentId: string;
  actionItem: ActionItem;
}> {
  const now = new Date();
  const overdue: Array<{
    postMortemId: string;
    incidentId: string;
    actionItem: ActionItem;
  }> = [];

  postMortems.forEach((pm) => {
    pm.actionItems.forEach((item) => {
      if (item.status !== 'completed' && new Date(item.dueDate) < now) {
        overdue.push({
          postMortemId: pm.id,
          incidentId: pm.incidentId,
          actionItem: item,
        });
      }
    });
  });

  return overdue;
}

/**
 * Calculate response time metrics from incident timeline
 */
export function calculateResponseMetrics(incident: Incident): {
  timeToDetect: number;
  timeToRespond: number;
  timeToContain: number;
  timeToResolve: number;
} {
  const detectedAt = new Date(incident.detectedAt);
  const timeline = incident.timeline;

  // Find first response action
  const firstResponse = timeline.find((e) => e.type === 'action');
  const timeToRespond = firstResponse
    ? (new Date(firstResponse.timestamp).getTime() - detectedAt.getTime()) / 1000 / 60
    : 0;

  // Find containment event
  const containedEvent = timeline.find(
    (e) => e.type === 'action' && e.description.toLowerCase().includes('contain')
  );
  const timeToContain = containedEvent
    ? (new Date(containedEvent.timestamp).getTime() - detectedAt.getTime()) / 1000 / 60
    : 0;

  // Calculate time to resolve
  const resolvedAt = incident.resolvedAt ? new Date(incident.resolvedAt) : new Date();
  const timeToResolve = (resolvedAt.getTime() - detectedAt.getTime()) / 1000 / 60 / 60; // hours

  return {
    timeToDetect: 0, // Would need separate detection timestamp
    timeToRespond,
    timeToContain,
    timeToResolve,
  };
}

/**
 * Clear all post-mortems (for testing purposes)
 */
export function clearAllPostMortems(): void {
  postMortems.clear();
}
