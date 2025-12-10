/**
 * Post-Mortem Template
 * REQ-164: Incident Response Plan & Procedures
 */

import { CommunicationTemplate, PostMortem } from '../types';

export const postMortemTemplate: CommunicationTemplate = {
  id: 'post-mortem-report',
  name: 'Post-Mortem Report',
  type: 'post_mortem',
  subject: 'Post-Mortem: {{incidentTitle}} ({{incidentId}})',
  body: `# Incident Post-Mortem Report

## Executive Summary
**Incident ID**: {{incidentId}}
**Severity**: {{severity}}
**Date**: {{incidentDate}}
**Duration**: {{duration}}
**Status**: {{finalStatus}}
**Author**: {{authorName}}
**Completed**: {{completionDate}}

## Summary
{{incidentSummary}}

## Impact
- **Users Affected**: {{usersAffected}}
- **Data Exposed**: {{dataExposed}}
- **Systems Compromised**: {{systemsCompromised}}
- **Financial Impact**: {{financialImpact}}
- **Reputation Impact**: {{reputationImpact}}
- **Regulatory Risk**: {{regulatoryRisk}}

## Timeline
{{detailedTimeline}}

## Root Cause Analysis

### Five Whys Analysis
{{fiveWhys}}

### Contributing Factors
{{contributingFactors}}

## Response Evaluation

### What Went Well
{{whatWentWell}}

### What Could Be Improved
{{whatCouldBeImproved}}

### Response Time Metrics
- **Time to Detect**: {{timeToDetect}}
- **Time to Respond**: {{timeToRespond}}
- **Time to Contain**: {{timeToContain}}
- **Time to Resolve**: {{timeToResolve}}
- **Total Duration**: {{totalDuration}}

**Target vs Actual**:
- Response Time Target: {{responseTarget}}
- Actual Response Time: {{actualResponse}}
- Met Target: {{metTarget}}

## Action Items
{{actionItems}}

## Preventive Measures
{{preventiveMeasures}}

## Lessons Learned
{{lessonsLearned}}

## Regulatory Notifications
{{regulatoryNotifications}}

## Appendices
- Detailed logs: {{logsLink}}
- Evidence repository: {{evidenceLink}}
- Related incidents: {{relatedIncidents}}

---
**Document Classification**: Internal - Confidential
**Retention Period**: 7 years (compliance requirement)
**Distribution**: Security team, Engineering leadership, Legal, Compliance`,
  requiredFields: [
    'incidentId',
    'incidentTitle',
    'severity',
    'incidentDate',
    'duration',
    'finalStatus',
    'authorName',
    'completionDate',
    'incidentSummary',
    'usersAffected',
    'dataExposed',
    'systemsCompromised',
    'financialImpact',
    'reputationImpact',
    'regulatoryRisk',
    'detailedTimeline',
    'fiveWhys',
    'contributingFactors',
    'whatWentWell',
    'whatCouldBeImproved',
    'timeToDetect',
    'timeToRespond',
    'timeToContain',
    'timeToResolve',
    'totalDuration',
    'responseTarget',
    'actualResponse',
    'metTarget',
    'actionItems',
    'preventiveMeasures',
    'lessonsLearned',
    'regulatoryNotifications',
    'logsLink',
    'evidenceLink',
    'relatedIncidents',
  ],
  approvalRequired: true,
  approvers: ['security_lead', 'cto', 'legal_counsel'],
  legalReviewRequired: true,
};

/**
 * Generate post-mortem document from incident data
 */
export function generatePostMortemDocument(postMortem: PostMortem): string {
  let body = postMortemTemplate.body;

  // Build timeline string
  const timelineText = postMortem.timeline
    .map((event) => `- **${new Date(event.timestamp).toISOString()}** [${event.type}] ${event.description} (${event.actor})`)
    .join('\n');

  // Build five whys string
  const fiveWhysText = postMortem.rootCause.fiveWhys
    .map((why, index) => `${index + 1}. ${why}`)
    .join('\n');

  // Build action items string
  const actionItemsText = postMortem.actionItems
    .map(
      (item) =>
        `- [ ] ${item.description}\n  - Owner: ${item.owner}\n  - Due: ${item.dueDate}\n  - Status: ${item.status}`
    )
    .join('\n');

  // Calculate metrics
  const metrics = postMortem.responseEvaluation.responseTimeMetrics;
  const totalDurationHours = metrics.timeToResolve;

  // Prepare data object
  const data = {
    incidentId: postMortem.incidentId,
    incidentTitle: 'Security Incident', // Should come from incident
    severity: 'P1', // Should come from incident
    incidentDate: new Date(postMortem.createdAt).toLocaleDateString(),
    duration: `${totalDurationHours} hours`,
    finalStatus: 'Resolved',
    authorName: postMortem.completedBy || 'Security Team',
    completionDate: postMortem.completedAt || new Date().toISOString(),
    incidentSummary: postMortem.summary,
    usersAffected: postMortem.impactAssessment.usersAffected.toString(),
    dataExposed: postMortem.impactAssessment.dataExposed
      .map((d) => `${d.recordCount} ${d.types.join(', ')} records (${d.classification})`)
      .join('; '),
    systemsCompromised: postMortem.impactAssessment.systemsCompromised.join(', '),
    financialImpact: `$${postMortem.impactAssessment.estimatedCosts.total.toLocaleString()}`,
    reputationImpact: postMortem.impactAssessment.businessImpact.reputationImpact,
    regulatoryRisk: postMortem.impactAssessment.businessImpact.regulatoryRisk,
    detailedTimeline: timelineText,
    fiveWhys: fiveWhysText,
    contributingFactors: postMortem.rootCause.contributingFactors.map((f) => `- ${f}`).join('\n'),
    whatWentWell: postMortem.responseEvaluation.whatWentWell.map((w) => `- ${w}`).join('\n'),
    whatCouldBeImproved: postMortem.responseEvaluation.whatCouldBeImproved
      .map((w) => `- ${w}`)
      .join('\n'),
    timeToDetect: `${metrics.timeToDetect} minutes`,
    timeToRespond: `${metrics.timeToRespond} minutes`,
    timeToContain: `${metrics.timeToContain} minutes`,
    timeToResolve: `${metrics.timeToResolve} hours`,
    totalDuration: `${totalDurationHours} hours`,
    responseTarget: '60 minutes', // From severity level
    actualResponse: `${metrics.timeToRespond} minutes`,
    metTarget: metrics.timeToRespond <= 60 ? '✓ Yes' : '✗ No',
    actionItems: actionItemsText,
    preventiveMeasures: postMortem.preventiveMeasures.map((m) => `- ${m}`).join('\n'),
    lessonsLearned: postMortem.lessonsLearned.map((l) => `- ${l}`).join('\n'),
    regulatoryNotifications: postMortem.regulatoryNotifications
      .map((n) => `- ${n.type}: Sent to ${n.recipient} on ${n.sentAt} (${n.status})`)
      .join('\n'),
    logsLink: '[Evidence Repository](./evidence)',
    evidenceLink: '[Logs Repository](./logs)',
    relatedIncidents: 'None',
  };

  // Replace all placeholders
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    body = body.replace(new RegExp(placeholder, 'g'), value);
  });

  return body;
}

/**
 * Post-mortem action item template
 */
export interface PostMortemActionItem {
  description: string;
  owner: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'technical' | 'process' | 'training' | 'documentation';
}

/**
 * Generate action item tracking list
 */
export function generateActionItemsList(items: PostMortemActionItem[]): string {
  const grouped = items.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, PostMortemActionItem[]>
  );

  let output = '# Post-Mortem Action Items\n\n';

  Object.entries(grouped).forEach(([category, categoryItems]) => {
    output += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
    categoryItems.forEach((item) => {
      output += `- [ ] **[${item.priority.toUpperCase()}]** ${item.description}\n`;
      output += `  - Owner: ${item.owner}\n`;
      output += `  - Due: ${item.dueDate}\n\n`;
    });
  });

  return output;
}
