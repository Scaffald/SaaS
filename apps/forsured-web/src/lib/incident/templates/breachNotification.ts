/**
 * Breach Notification Template
 * REQ-164: Incident Response Plan & Procedures
 * CCPA/GDPR compliant customer breach notification
 */

import { CommunicationTemplate } from '../types';

export const breachNotificationTemplate: CommunicationTemplate = {
  id: 'breach-notification-customer',
  name: 'Customer Breach Notification',
  type: 'customer',
  subject: 'Important Security Notice - Your ForSured Account',
  body: `Dear {{customerName}},

We are writing to inform you of a security incident that may have affected your ForSured account.

**What Happened**
On {{incidentDate}}, we discovered {{incidentDescription}}. We immediately took action to contain the issue and have since {{remediationSummary}}.

**What Information Was Involved**
{{dataTypesExposed}}

**What We Are Doing**
- Fully investigated the incident and identified the root cause
- Implemented additional security measures to prevent similar incidents
- {{additionalActions}}

**What You Can Do**
- Reset your password immediately: {{passwordResetLink}}
- Enable two-factor authentication: {{twoFactorLink}}
- Monitor your account for suspicious activity
- Review your recent account activity: {{activityLink}}
- Contact us with questions: security@forsured.com

**More Information**
For more details about this incident, visit: {{incidentDetailsLink}}

We sincerely apologize for this incident and any inconvenience or concern it may cause. The security of your information is our highest priority, and we are committed to maintaining your trust.

If you have any questions or concerns, please don't hesitate to contact our security team at security@forsured.com or our support team at support@forsured.com.

Sincerely,
The ForSured Security Team

---
This notification is provided in compliance with applicable data breach notification laws including the California Consumer Privacy Act (CCPA) and General Data Protection Regulation (GDPR).

Incident Reference: {{incidentId}}
Notification Date: {{notificationDate}}`,
  requiredFields: [
    'customerName',
    'incidentDate',
    'incidentDescription',
    'remediationSummary',
    'dataTypesExposed',
    'additionalActions',
    'passwordResetLink',
    'twoFactorLink',
    'activityLink',
    'incidentDetailsLink',
    'incidentId',
    'notificationDate',
  ],
  approvalRequired: true,
  approvers: ['legal_counsel', 'ceo', 'communications_lead'],
  timingRequirements: 'CCPA: 72 hours from discovery, GDPR: 72 hours from awareness',
  legalReviewRequired: true,
};

/**
 * Fill in breach notification template with incident data
 */
export function generateBreachNotification(data: {
  customerName: string;
  incidentDate: string;
  incidentDescription: string;
  remediationSummary: string;
  dataTypesExposed: string;
  additionalActions: string;
  passwordResetLink: string;
  twoFactorLink: string;
  activityLink: string;
  incidentDetailsLink: string;
  incidentId: string;
  notificationDate: string;
}): { subject: string; body: string } {
  let body = breachNotificationTemplate.body;
  let subject = breachNotificationTemplate.subject;

  // Replace all placeholders
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    body = body.replace(new RegExp(placeholder, 'g'), value);
    subject = subject.replace(new RegExp(placeholder, 'g'), value);
  });

  return { subject, body };
}
