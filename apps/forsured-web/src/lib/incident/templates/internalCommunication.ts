/**
 * Internal Communication Templates
 * Incident Response Plan & Procedures
 */

import { CommunicationTemplate } from '../types';

/**
 * Incident alert template - first notification to security team
 */
export const incidentAlertTemplate: CommunicationTemplate = {
  id: 'incident-alert-internal',
  name: 'Incident Alert',
  type: 'internal',
  subject: '🚨 {{severity}} Incident Detected: {{incidentTitle}}',
  body: `**SECURITY INCIDENT ALERT**

**Incident ID**: {{incidentId}}
**Severity**: {{severity}} (Response time: {{responseTime}})
**Type**: {{incidentType}}
**Detected**: {{detectedAt}}
**Detected By**: {{detectedBy}}

**Description**:
{{description}}

**Affected Systems**:
{{affectedSystems}}

**Immediate Actions Required**:
{{immediateActions}}

**Incident Channel**: {{slackChannel}}
**War Room**: {{warRoomLink}}

**Escalation Contacts**:
{{escalationContacts}}

**Next Steps**:
1. Join incident channel: {{slackChannel}}
2. Review initial assessment: {{assessmentLink}}
3. Begin containment procedures: {{playbookLink}}

This is a {{severity}} incident requiring immediate attention.`,
  requiredFields: [
    'severity',
    'incidentTitle',
    'incidentId',
    'responseTime',
    'incidentType',
    'detectedAt',
    'detectedBy',
    'description',
    'affectedSystems',
    'immediateActions',
    'slackChannel',
    'warRoomLink',
    'escalationContacts',
    'assessmentLink',
    'playbookLink',
  ],
  approvalRequired: false,
  approvers: [],
  legalReviewRequired: false,
};

/**
 * Incident resolution notification
 */
export const incidentResolutionTemplate: CommunicationTemplate = {
  id: 'incident-resolution-internal',
  name: 'Incident Resolution Notification',
  type: 'internal',
  subject: '✅ Incident Resolved: {{incidentId}} - {{incidentTitle}}',
  body: `**INCIDENT RESOLVED**

**Incident ID**: {{incidentId}}
**Severity**: {{severity}}
**Title**: {{incidentTitle}}

**Timeline**:
- Detected: {{detectedAt}}
- Responded: {{respondedAt}}
- Contained: {{containedAt}}
- Resolved: {{resolvedAt}}
- Duration: {{duration}}

**Resolution Summary**:
{{resolutionSummary}}

**Final Impact**:
- Users Affected: {{usersAffected}}
- Systems Affected: {{systemsAffected}}
- Data Impact: {{dataImpact}}

**Remediation Actions Taken**:
{{remediationActions}}

**Follow-up Actions**:
{{followupActions}}

**Post-Mortem**:
{{#if requiresPostMortem}}
A post-mortem meeting will be scheduled within 5 business days.
Post-mortem document: {{postMortemLink}}
{{else}}
No post-mortem required for this severity level.
{{/if}}

**Documentation**:
- Full incident report: {{reportLink}}
- Timeline: {{timelineLink}}
- Evidence: {{evidenceLink}}

Thank you to everyone involved in the response.`,
  requiredFields: [
    'incidentId',
    'incidentTitle',
    'severity',
    'detectedAt',
    'respondedAt',
    'containedAt',
    'resolvedAt',
    'duration',
    'resolutionSummary',
    'usersAffected',
    'systemsAffected',
    'dataImpact',
    'remediationActions',
    'followupActions',
    'requiresPostMortem',
    'reportLink',
    'timelineLink',
    'evidenceLink',
  ],
  approvalRequired: false,
  approvers: ['incident_commander'],
  legalReviewRequired: false,
};

/**
 * Escalation notification template
 */
export const escalationNotificationTemplate: CommunicationTemplate = {
  id: 'escalation-notification',
  name: 'Severity Escalation Notification',
  type: 'internal',
  subject: '⚠️ Incident Escalated: {{incidentId}} now {{newSeverity}}',
  body: `**INCIDENT ESCALATION ALERT**

**Incident ID**: {{incidentId}}
**Previous Severity**: {{oldSeverity}}
**New Severity**: {{newSeverity}}
**Escalated By**: {{escalatedBy}}
**Escalation Time**: {{escalationTime}}

**Escalation Reason**:
{{escalationReason}}

**Updated Impact Assessment**:
{{impactAssessment}}

**Additional Resources Required**:
{{additionalResources}}

**New Escalation Contacts**:
{{newContacts}}

**Updated Response Time**: {{newResponseTime}}

**Immediate Actions**:
{{immediateActions}}

Join the incident response now: {{incidentChannel}}`,
  requiredFields: [
    'incidentId',
    'oldSeverity',
    'newSeverity',
    'escalatedBy',
    'escalationTime',
    'escalationReason',
    'impactAssessment',
    'additionalResources',
    'newContacts',
    'newResponseTime',
    'immediateActions',
    'incidentChannel',
  ],
  approvalRequired: false,
  approvers: [],
  legalReviewRequired: false,
};

/**
 * Legal counsel notification template
 */
export const legalNotificationTemplate: CommunicationTemplate = {
  id: 'legal-notification',
  name: 'Legal Counsel Notification',
  type: 'legal',
  subject: 'Legal Review Required: Security Incident {{incidentId}}',
  body: `**LEGAL REVIEW REQUIRED - SECURITY INCIDENT**

**Incident ID**: {{incidentId}}
**Severity**: {{severity}}
**Notification Date**: {{notificationDate}}
**Incident Commander**: {{incidentCommander}}

**Incident Overview**:
{{incidentOverview}}

**Data Exposure**:
{{dataExposure}}

**Affected Jurisdictions**:
{{affectedJurisdictions}}

**Regulatory Implications**:
{{regulatoryImplications}}

**Breach Notification Requirements**:
{{breachNotificationRequirements}}

**Timeline for Legal Review**:
- CCPA Deadline: {{ccpaDeadline}}
- GDPR Deadline (if applicable): {{gdprDeadline}}
- Other Deadlines: {{otherDeadlines}}

**Documents for Review**:
- Incident report: {{incidentReportLink}}
- Impact assessment: {{impactAssessmentLink}}
- Proposed customer notification: {{customerNotificationDraft}}

**Contact**:
{{contactName}} - {{contactEmail}} - {{contactPhone}}

**Urgent Response Requested**:
Please review and advise on notification requirements within {{responseTimeframe}}.`,
  requiredFields: [
    'incidentId',
    'severity',
    'notificationDate',
    'incidentCommander',
    'incidentOverview',
    'dataExposure',
    'affectedJurisdictions',
    'regulatoryImplications',
    'breachNotificationRequirements',
    'ccpaDeadline',
    'gdprDeadline',
    'otherDeadlines',
    'incidentReportLink',
    'impactAssessmentLink',
    'customerNotificationDraft',
    'contactName',
    'contactEmail',
    'contactPhone',
    'responseTimeframe',
  ],
  approvalRequired: false,
  approvers: [],
  legalReviewRequired: false,
};

/**
 * Generate internal communication message
 */
export function generateInternalCommunication(
  data: Record<string, string>,
  template: CommunicationTemplate
): { subject: string; body: string } {
  let body = template.body;
  let subject = template.subject;

  // Replace all placeholders
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    body = body.replace(new RegExp(placeholder, 'g'), value);
    subject = subject.replace(new RegExp(placeholder, 'g'), value);
  });

  return { subject, body };
}
