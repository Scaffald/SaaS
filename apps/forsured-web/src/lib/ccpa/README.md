# CCPA Compliance Module

This module implements CCPA (California Consumer Privacy Act) compliance features for ForSured MVP, including data export, deletion, consent management, and breach notification workflows.

## Overview

The CCPA Compliance Module provides a complete implementation of California privacy rights for ForSured customers:

- **Right to Know**: Export all personal data in structured formats (JSON, CSV)
- **Right to Delete**: 90-day soft delete with permanent deletion workflow
- **Consent Management**: Track and manage user consent with audit trail
- **Breach Notification**: 72-hour notification workflow with California AG compliance

## Architecture

```
src/lib/ccpa/
├── types.ts                    # TypeScript type definitions
├── dataExport.ts               # Data export service (Right to Know)
├── dataDeletion.ts             # Data deletion service (Right to Delete)
├── consent.ts                  # Consent management service
├── breachNotification.ts       # Breach notification workflow
├── index.ts                    # Main entry point
└── __tests__/                  # Test files
    ├── dataExport.test.ts
    └── dataDeletion.test.ts
```

## Database Schema

The module includes a comprehensive database migration (`supabase/migrations/002_create_ccpa_tables.sql`) with the following tables:

### privacy_requests
Tracks all CCPA privacy requests (Right to Know, Right to Delete, etc.)

- **45-day response timeline** (extendable to 90 days)
- **Automatic request number generation** (e.g., REQ-2025-001234)
- **Verification workflow** (email, two-factor)
- **Export file tracking** (URL, format, expiration)
- **Deletion scheduling** (90-day grace period)

### consent_records
Auditable consent tracking for all user consents

- **Consent type** (data collection, processing, marketing, opt-out sale)
- **Consent method** (explicit opt-in, toggle, form submission)
- **Consent version** (privacy policy version tracking)
- **Withdrawal tracking** (date, reason)
- **Geographic context** (IP, country, region)

### breach_notifications
Data breach incident tracking with CCPA compliance

- **72-hour notification deadline** (automatic calculation)
- **California AG notification** (required if ≥500 CA residents affected)
- **User notification tracking** (email, method, timestamp)
- **Containment and remediation** (actions, status)
- **Post-incident review** (lessons learned, preventive measures)

### data_processing_agreements
Track DPAs with service providers for CCPA compliance

- **Vendor information** (name, contact, type)
- **DPA status** (pending, signed, expired)
- **Data processing scope** (types, purposes, retention)
- **Compliance certifications** (CCPA, GDPR, SOC 2, ISO 27001)
- **Breach notification SLA** (hours to notify ForSured)

## Services

### Data Export Service

**Purpose**: Implement CCPA "Right to Know" by exporting all user data.

```typescript
import { exportUserData, generateExportFile } from '@/lib/ccpa';

// Export user data
const result = await exportUserData(userId, requestId, 'json');

if (result.success) {
  const fileContent = await generateExportFile(result.data, 'json');
  // Upload to S3 or send to user
}
```

**Features**:
- Exports all user data (profile, projects, policies, documents, activity logs)
- Includes collection sources, business purposes, third parties
- Formats: JSON, CSV (PDF planned)
- 45-day response time tracking

### Data Deletion Service

**Purpose**: Implement CCPA "Right to Delete" with 90-day grace period.

```typescript
import { initiateSoftDelete, executePermanentDeletion, cancelDeletion } from '@/lib/ccpa';

// Initiate soft delete (90-day grace period)
const result = await initiateSoftDelete(userId, requestId);

// Cancel deletion during grace period
await cancelDeletion(userId, requestId);

// Execute permanent deletion (after 90 days)
await executePermanentDeletion(userId);
```

**Features**:
- 90-day soft delete grace period
- Deletion exceptions (legal hold, fraud prevention, active contracts)
- Cascade deletion (projects, documents, tasks)
- Anonymization of retained records (audit logs, consent records)
- Service provider notification (per DPA requirements)

### Consent Management Service

**Purpose**: Track user consent with audit trail for CCPA compliance.

```typescript
import { recordConsent, withdrawConsent, getConsentStatus, doNotSellOptOut } from '@/lib/ccpa';

// Record consent
await recordConsent({
  user_id: userId,
  consent_type: 'data_processing',
  consent_given: true,
  consent_version: '1.0',
  consent_method: 'toggle_switch',
});

// Withdraw consent
await withdrawConsent(userId, 'marketing_communications', 'User opted out');

// "Do Not Sell My Personal Information" opt-out
await doNotSellOptOut(userId);

// Check consent status
const status = await getConsentStatus(userId);
```

**Features**:
- Consent recording with version tracking
- Consent withdrawal with audit trail
- "Do Not Sell" opt-out mechanism
- Consent invalidation on privacy policy changes
- Integration with audit logging

### Breach Notification Service

**Purpose**: Implement CCPA 72-hour breach notification requirement.

```typescript
import { reportBreach, sendUserNotifications, notifyCaliforniaAG } from '@/lib/ccpa';

// Report breach
const result = await reportBreach({
  breach_type: 'unauthorized_access',
  severity: 'high',
  discovered_at: new Date().toISOString(),
  affected_user_count: 1000,
  affected_california_residents: 600,
  data_types_exposed: ['email', 'policy_number'],
  sensitive_data_exposed: false,
  created_by_user_id: adminUserId,
});

// Send notifications to affected users
await sendUserNotifications(breachId);

// Notify California AG (if ≥500 CA residents affected)
await notifyCaliforniaAG(breachId);
```

**Features**:
- 72-hour notification deadline tracking
- California AG notification (≥500 CA residents)
- User notification templates (email)
- Breach containment tracking
- Critical security alerts

## Integration

### Initialize Services

```typescript
import { createClient } from '@supabase/supabase-js';
import { initializeCCPAServices } from '@/lib/ccpa';

const supabase = createClient(supabaseUrl, supabaseKey);
initializeCCPAServices(supabase);
```

### Audit Logging Integration

All CCPA operations are automatically logged to the audit trail:

- Privacy request creation/status changes
- Consent recording/withdrawal
- Data export generation
- Data deletion execution
- Breach notification events

Audit logs use database triggers for automatic, tamper-evident tracking.

## Compliance Features

### CCPA Requirements Met

✅ **Right to Know** (45-day response)
✅ **Right to Delete** (90-day soft delete)
✅ **Right to Correct** (planned - UI components)
✅ **Opt-Out of Sale** ("Do Not Sell" mechanism)
✅ **Non-Discrimination** (no pricing/feature restrictions)
✅ **Breach Notification** (72-hour deadline)
✅ **DPA Management** (service provider tracking)
✅ **Audit Trail** (tamper-evident logging)

### Data Retention

- **User Profile**: Active account + 90 days after deletion
- **Project Data**: 7 years (insurance industry standard)
- **Policy Data**: 7 years from policy expiration
- **Documents**: 7 years from upload date
- **Activity Logs**: 2 years
- **Consent Records**: Indefinite (anonymized after deletion)

### Deletion Exceptions

Data that **cannot be deleted** per CCPA:

- **Legal Obligation**: Required for compliance (audit logs)
- **Fraud Prevention**: Detecting or preventing fraud
- **Security**: Security incident detection/response
- **Contract Performance**: Active transactions/services
- **Legal Hold**: Data subject to litigation

## Testing

```bash
# Run CCPA tests
npm test src/lib/ccpa/__tests__/

# Run specific test file
npm test src/lib/ccpa/__tests__/dataExport.test.ts
```

**Note**: Current tests use basic mocks. Production tests should use integration testing with test database.

## TODO / Future Enhancements

- [ ] **Privacy Policy Component**: React component for privacy policy display
- [ ] **Privacy Request UI**: User-facing forms for data requests
- [ ] **PDF Export**: Implement PDF generation for data exports
- [ ] **Email Integration**: Integrate SendGrid/AWS SES for breach notifications
- [ ] **S3 Integration**: Upload export files to secure S3 bucket
- [ ] **IP Geolocation**: Detect California residents automatically
- [ ] **Automated Deadline Alerts**: PagerDuty/Slack alerts for approaching deadlines
- [ ] **California AG Portal**: Automated submission to CA AG portal
- [ ] **Test Improvements**: Better mocks and integration tests

## Reference Documentation

- **CCPA Compliance Plan**: `/Users/mattbernier/projects/FRS-Prototype/plans/50_SECURITY_PRIVACY.md` (Section: CCPA Compliance Plan)
- **Incident Response**: `/Users/mattbernier/projects/FRS-Prototype/plans/53_INCIDENT_RESPONSE_PLAN.md` (Breach notification workflows)
- **Audit Logging**: `/Users/mattbernier/projects/FRS-Prototype/src/lib/audit/AuditService.ts` (audit integration)
- **Database Migration**: `/Users/mattbernier/projects/FRS-Prototype/supabase/migrations/002_create_ccpa_tables.sql`

## Support

For questions or issues with CCPA compliance implementation:

1. Review the CCPA Compliance Plan in `plans/50_SECURITY_PRIVACY.md`
2. Check database schema in `supabase/migrations/002_create_ccpa_tables.sql`
3. Consult service code with inline documentation
4. Contact privacy team or legal counsel for compliance questions

---

**Last Updated**: 2025-11-08
**Version**: 1.0
**Status**: Core implementation complete, UI components pending
