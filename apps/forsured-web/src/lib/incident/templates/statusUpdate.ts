/**
 * Incident Status Update Template
 * Incident Response Plan & Procedures
 */

import { CommunicationTemplate } from '../types';

export const statusUpdateTemplate: CommunicationTemplate = {
  id: 'status-update-internal',
  name: 'Incident Status Update',
  type: 'internal',
  subject: 'Incident {{incidentId}} Status Update - {{timestamp}}',
  body: `**INCIDENT STATUS UPDATE**

**Incident ID**: {{incidentId}}
**Severity**: {{severity}}
**Status**: {{currentStatus}}
**Update Time**: {{timestamp}}
**Updated By**: {{updatedBy}}

**Current Situation**
{{currentSituation}}

**Actions Taken Since Last Update**
{{actionsTaken}}

**Next Steps**
{{nextSteps}}

**Impact Assessment**
- Users Affected: {{usersAffected}}
- Systems Affected: {{systemsAffected}}
- Service Status: {{serviceStatus}}

**Timeline**
- Detected: {{detectedAt}}
- Responded: {{respondedAt}}
- Duration: {{duration}}

**Team Members Involved**
{{teamMembers}}

**Next Update**: {{nextUpdateTime}}

For questions or additional information, contact {{incidentCommander}}.`,
  requiredFields: [
    'incidentId',
    'severity',
    'currentStatus',
    'timestamp',
    'updatedBy',
    'currentSituation',
    'actionsTaken',
    'nextSteps',
    'usersAffected',
    'systemsAffected',
    'serviceStatus',
    'detectedAt',
    'respondedAt',
    'duration',
    'teamMembers',
    'nextUpdateTime',
    'incidentCommander',
  ],
  approvalRequired: false,
  approvers: ['incident_commander'],
  legalReviewRequired: false,
};

/**
 * Customer-facing status update template
 */
export const customerStatusUpdateTemplate: CommunicationTemplate = {
  id: 'status-update-customer',
  name: 'Customer Status Update',
  type: 'customer',
  subject: 'Service Update - {{serviceName}}',
  body: `Dear {{customerName}},

We want to update you on the {{issueType}} we've been addressing.

**Current Status**
{{customerFacingSituation}}

**What We're Doing**
{{customerFacingActions}}

**Expected Resolution**
{{expectedResolution}}

**What You Can Do**
{{customerActions}}

We appreciate your patience and will continue to keep you informed. Our next update will be sent {{nextUpdateTime}}.

For real-time updates, visit our status page: {{statusPageLink}}

If you have questions, contact our support team at support@forsured.com.

Thank you for your understanding.

The ForSured Team`,
  requiredFields: [
    'customerName',
    'serviceName',
    'issueType',
    'customerFacingSituation',
    'customerFacingActions',
    'expectedResolution',
    'customerActions',
    'nextUpdateTime',
    'statusPageLink',
  ],
  approvalRequired: true,
  approvers: ['communications_lead', 'incident_commander'],
  legalReviewRequired: false,
};

/**
 * Generate status update message
 */
export function generateStatusUpdate(
  data: Record<string, string>,
  template: CommunicationTemplate = statusUpdateTemplate
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
