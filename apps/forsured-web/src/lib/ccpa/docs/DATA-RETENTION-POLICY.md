# CCPA Data Retention Policy

**REQ-3: CCPA Compliance Implementation - TASK-20**
**Version:** 1.0
**Last Updated:** December 2025

## Purpose

This policy defines data retention periods for personal information processed by Forsured, ensuring compliance with CCPA requirements while meeting legitimate business and legal obligations.

---

## 1. Policy Overview

### 1.1 Guiding Principles

1. **Data Minimization**: Collect only necessary personal information
2. **Purpose Limitation**: Use data only for disclosed purposes
3. **Storage Limitation**: Retain data only as long as necessary
4. **Deletion Obligation**: Delete data when retention period expires
5. **Exception Documentation**: Document all retention exceptions

### 1.2 Retention Categories

| Category | Default Retention | Justification |
|----------|-------------------|---------------|
| **Active Data** | While relationship active | Service delivery |
| **Archived Data** | Per schedule below | Legal/business need |
| **Deleted Data** | 90-day soft delete | Recovery capability |
| **Permanently Deleted** | Irreversible | CCPA compliance |

---

## 2. Retention Schedule by Data Type

### 2.1 User Account Data

| Data Type | Retention Period | Legal Basis |
|-----------|------------------|-------------|
| Basic identifiers (name, email) | Account life + 2 years | Service records |
| Authentication credentials | Account life | Security |
| Profile information | Account life + 90 days | Service delivery |
| Preferences/settings | Account life | Service delivery |
| Login history | 2 years | Security audit |

### 2.2 Insurance & Financial Data

| Data Type | Retention Period | Legal Basis |
|-----------|------------------|-------------|
| Insurance policies | 7 years from expiry | Cal. Code Regs. 2695.3 |
| Premium payments | 7 years | Tax records |
| Claims history | 7 years from resolution | Insurance regulations |
| Policy documents | 7 years from expiry | Legal compliance |
| Financial transactions | 7 years | IRS requirements |

### 2.3 Compliance Data

| Data Type | Retention Period | Legal Basis |
|-----------|------------------|-------------|
| Compliance scores | 5 years | Audit requirements |
| Compliance issues | 5 years from resolution | Audit requirements |
| Audit logs | 5 years | SOC 2 compliance |
| Certificates/licenses | 2 years from expiry | Verification |

### 2.4 Operational Data

| Data Type | Retention Period | Legal Basis |
|-----------|------------------|-------------|
| Tasks | 2 years from completion | Business records |
| Projects | 5 years from closure | Contract records |
| Documents (user-uploaded) | User-controlled | Service delivery |
| Communications | 3 years | Business records |

### 2.5 Technical & Activity Data

| Data Type | Retention Period | Legal Basis |
|-----------|------------------|-------------|
| Access logs | 2 years | Security |
| Error logs | 1 year | Debugging |
| Analytics (aggregated) | Indefinite | Business intelligence |
| Analytics (individual) | 90 days | Performance monitoring |

---

## 3. CCPA-Specific Requirements

### 3.1 Deletion Request Handling

When a consumer exercises their Right to Delete:

```
Day 0: Deletion request received
        │
        ▼
Day 1-10: Identity verification
        │
        ▼
Day 11-44: Soft delete initiated
        │         │
        │         └─► Data marked for deletion
        │             Access restricted
        │             Recovery possible
        │
Day 45: Request completed
        │
        ▼
Day 45-135: Soft delete period (90 days)
        │
        ▼
Day 135: Permanent deletion
        │
        └─► Data irreversibly destroyed
            Backups scrubbed
            Confirmation logged
```

### 3.2 Retention Exceptions for Deletion Requests

The following data may be retained despite a deletion request:

| Exception | Retention | Examples |
|-----------|-----------|----------|
| **Complete Transaction** | Until complete | Pending claims, active policies |
| **Security/Fraud** | 5 years | Fraud investigation data |
| **Legal Obligation** | Per requirement | Tax records, court orders |
| **Internal Analytics** | Aggregated only | Statistical analysis |
| **Free Speech** | Case-by-case | User-generated content |

### 3.3 Documentation Requirements

For each retention exception applied:

1. Record exception type
2. Document specific legal basis
3. Note expected retention end date
4. Assign review date
5. Notify consumer of partial deletion

---

## 4. Data Deletion Procedures

### 4.1 Standard Deletion

**Soft Delete (Day 0-90):**

1. Mark records with `deleted_at` timestamp
2. Exclude from queries and exports
3. Retain in database for recovery
4. Log deletion event

**Permanent Delete (Day 90+):**

1. Remove records from production database
2. Queue backup scrubbing job
3. Verify deletion across all systems
4. Generate deletion certificate

### 4.2 Anonymization (When Deletion Not Possible)

For data that must be retained (e.g., financial records):

1. Remove direct identifiers (name, email, SSN)
2. Replace user_id with anonymous token
3. Aggregate where possible
4. Retain only legally required fields

**Anonymization Standards:**

- k-anonymity: k ≥ 5
- No unique combinations of quasi-identifiers
- Suppress small cell counts (< 5)

### 4.3 Backup Handling

| Backup Type | Scrubbing Frequency | Method |
|-------------|---------------------|--------|
| Daily incremental | Weekly | Restore, delete, re-backup |
| Weekly full | Monthly | Restore, delete, re-backup |
| Monthly archive | Quarterly | Restore, delete, re-archive |
| Disaster recovery | Annual | Full refresh |

---

## 5. Third-Party Data Sharing

### 5.1 Deletion Propagation

When user data is deleted, notify third parties:

| Third Party | Notification Method | SLA |
|-------------|---------------------|-----|
| Scaffald Platform | Webhook | 24 hours |
| Payment processors | API call | 48 hours |
| Analytics providers | Deletion API | 72 hours |
| Email providers | Suppression list | 24 hours |

### 5.2 Third-Party Retention Requirements

| Provider | Their Retention | Our Action |
|----------|-----------------|------------|
| Supabase | Per our instruction | Direct deletion |
| AWS S3 | Per lifecycle policy | Object deletion |
| SendGrid | 90 days | Suppression request |

---

## 6. Retention Review Process

### 6.1 Quarterly Review

**Review checklist:**

- [ ] Audit records past retention date
- [ ] Verify scheduled deletions executed
- [ ] Review exception requests
- [ ] Update retention schedule if needed
- [ ] Document review findings

### 6.2 Annual Review

**Comprehensive assessment:**

1. Review all retention periods
2. Assess legal/regulatory changes
3. Evaluate business justifications
4. Update policy as needed
5. Executive sign-off

### 6.3 Retention Override Requests

Business units may request retention extensions:

1. Submit override request form
2. State business justification
3. Obtain Privacy Lead approval
4. Document in exception register
5. Set review date (max 1 year)

---

## 7. Implementation Guidelines

### 7.1 Database Implementation

```sql
-- Example: Soft delete implementation
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN deletion_reason TEXT;
ALTER TABLE users ADD COLUMN permanent_delete_after TIMESTAMPTZ;

-- Example: RLS policy excluding deleted records
CREATE POLICY users_not_deleted ON users
    FOR SELECT USING (deleted_at IS NULL);
```

### 7.2 Application Implementation

```typescript
// Example: Deletion scheduling
interface DeletionSchedule {
  userId: string;
  softDeleteAt: Date;
  permanentDeleteAt: Date; // softDeleteAt + 90 days
  retainedData: {
    type: string;
    reason: string;
    retainUntil: Date;
  }[];
}
```

### 7.3 Automated Cleanup Jobs

| Job | Frequency | Action |
|-----|-----------|--------|
| `daily_soft_delete` | Daily | Mark expired active data |
| `daily_permanent_delete` | Daily | Remove 90+ day soft deletes |
| `weekly_backup_scrub` | Weekly | Remove deleted from incrementals |
| `monthly_audit` | Monthly | Generate retention report |

---

## 8. Compliance Monitoring

### 8.1 Key Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Deletion request backlog | < 10 | > 25 |
| Average deletion time | < 45 days | > 35 days |
| Overdue deletions | 0 | > 0 |
| Exception rate | < 5% | > 10% |

### 8.2 Audit Trail Requirements

Log all retention-related actions:

- Data marked for deletion
- Deletion executed
- Exception applied
- Override requested
- Review completed

Retain audit logs for 5 years.

---

## Appendix A: Quick Reference

### Retention Summary Table

| Data Category | Active | Archived | Max |
|---------------|--------|----------|-----|
| User accounts | Life | +2 years | 2 years |
| Insurance data | Life | +7 years | 7 years |
| Compliance data | Life | +5 years | 5 years |
| Operational data | Life | +2-5 years | 5 years |
| Technical logs | N/A | 1-2 years | 2 years |

### Deletion Timeline

- Day 0: Request received
- Day 10: Verification complete
- Day 45: Soft delete complete
- Day 135: Permanent deletion

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 2025 | Privacy Team | Initial release |
