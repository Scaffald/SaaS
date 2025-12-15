# CCPA Request Processing Runbook

**REQ-3: CCPA Compliance Implementation - TASK-20**
**Version:** 1.0
**Last Updated:** December 2025

## Purpose

This runbook provides step-by-step procedures for processing California Consumer Privacy Act (CCPA) data subject requests. Follow these procedures to ensure compliance with statutory deadlines and documentation requirements.

---

## Table of Contents

1. [Request Intake](#1-request-intake)
2. [Identity Verification](#2-identity-verification)
3. [Request Processing by Type](#3-request-processing-by-type)
4. [Deadline Management](#4-deadline-management)
5. [Response Delivery](#5-response-delivery)
6. [Denial Procedures](#6-denial-procedures)
7. [Escalation Procedures](#7-escalation-procedures)

---

## 1. Request Intake

### 1.1 Receiving Requests

Requests may be received via:
- **Privacy Portal**: `/dashboard/settings/privacy`
- **Email**: privacy@forsured.com
- **Toll-free number**: (documented in privacy policy)

### 1.2 Initial Processing

**Within 24 hours of receipt:**

1. Log request in CCPA tracking system
2. Generate unique request ID (format: `REQ-YYYYMMDD-XXXX`)
3. Record request details:
   - Date/time received
   - Request type
   - Requester information
   - Submission channel
4. Send acknowledgment to requester

### 1.3 Acknowledgment Template

```
Subject: CCPA Request Received - [Request ID]

Dear [Requester Name],

We have received your California Consumer Privacy Act request submitted
on [Date]. Your request ID is [Request ID].

Request Type: [Right to Know/Delete/Correct/Opt-Out]

We will verify your identity and respond within 45 calendar days. If we
need additional time, we will notify you of an extension.

You can check the status of your request at: [Portal URL]

Questions? Contact privacy@forsured.com

Sincerely,
Forsured Privacy Team
```

---

## 2. Identity Verification

### 2.1 Verification Requirements by Request Type

| Request Type | Verification Level | Method |
|--------------|-------------------|--------|
| Right to Know (Categories) | Standard | Email verification |
| Right to Know (Specific Pieces) | Enhanced | Fresh login + email |
| Right to Delete | Enhanced | Fresh login + email |
| Right to Correct | Enhanced | Fresh login + email |
| Right to Opt-Out | Standard | Email verification |
| Authorized Agent | Manual | Power of attorney review |

### 2.2 Standard Verification Procedure

1. Send verification email to registered email address
2. Email contains unique verification link (valid 24 hours)
3. User clicks link to verify identity
4. System records verification timestamp

### 2.3 Enhanced Verification Procedure

1. Require user to log in with fresh session (within 15 minutes)
2. Send verification email to registered email
3. User must complete both steps within 24 hours
4. For password reset in progress, wait for completion

### 2.4 Manual Verification Procedure

**For authorized agents or unverifiable requests:**

1. Request government-issued ID
2. Request signed authorization (if agent)
3. Compliance team reviews within 5 business days
4. Document verification decision and rationale

### 2.5 Verification Failure

If verification fails after 3 attempts:

1. Send denial notice citing inability to verify
2. Document attempts in request history
3. Close request as "Verification Failed"
4. Inform requester they may resubmit

---

## 3. Request Processing by Type

### 3.1 Right to Know (Access) Requests

**Categories Only:**

1. Verify identity (standard level)
2. Compile list of data categories collected
3. Document sources and purposes
4. Generate disclosure document
5. Deliver via secure portal or email

**Specific Pieces:**

1. Verify identity (enhanced level)
2. Query all data sources for user data
3. Compile data into structured export
4. Generate PDF, JSON, or CSV export
5. Upload to secure storage (24-hour expiry)
6. Send download link to user

### 3.2 Right to Delete Requests

1. Verify identity (enhanced level)
2. Check for applicable exceptions:
   - Pending transactions
   - Legal obligations
   - Security requirements
   - Fraud prevention
3. If no exceptions apply:
   a. Mark data for deletion
   b. Notify third-party processors
   c. Execute deletion within 45 days
   d. Confirm deletion to user
4. If exceptions apply:
   a. Partially fulfill request where possible
   b. Document exceptions cited
   c. Explain to user what was/wasn't deleted

### 3.3 Right to Correct Requests

1. Verify identity (enhanced level)
2. Review requested corrections
3. Evaluate accuracy of current vs. proposed data
4. If correction warranted:
   a. Update data in all systems
   b. Notify third parties if shared
   c. Confirm correction to user
5. If correction denied:
   a. Document rationale
   b. Allow user to submit statement of disagreement

### 3.4 Right to Opt-Out Requests

1. Verify identity (standard level)
2. Apply opt-out preferences:
   - Sale of personal information
   - Sharing for advertising
   - Profiling
3. Update all tracking systems
4. Confirm opt-out to user
5. Honor within 15 business days

---

## 4. Deadline Management

### 4.1 Standard Timeline

| Milestone | Day | Action Required |
|-----------|-----|-----------------|
| Receipt | 0 | Log request, send acknowledgment |
| Verification | 1-10 | Complete identity verification |
| Processing | 11-40 | Execute request |
| Response | 45 | Deliver response to consumer |

### 4.2 Extension Procedures

**Extensions are allowed ONE TIME for 45 additional days when:**
- Request is complex
- High volume of requests received
- Verification is delayed

**To extend:**

1. Before Day 45, send extension notice
2. Document reason for extension
3. Provide new deadline (Day 90)
4. Continue processing

**Extension Notice Template:**

```
Subject: Update on Your CCPA Request - [Request ID]

Dear [Requester Name],

We are writing regarding your CCPA request submitted on [Date].

Due to [complexity of request/high request volume], we need
additional time to complete your request. Under CCPA regulations,
we are extending the response deadline by 45 days.

New Response Deadline: [Date]
Reason for Extension: [Brief explanation]

We will complete your request as soon as possible. You can track
status at: [Portal URL]

Questions? Contact privacy@forsured.com

Sincerely,
Forsured Privacy Team
```

### 4.3 Deadline Alerts

The system generates automatic alerts:

| Days Remaining | Alert Level | Action |
|----------------|-------------|--------|
| 7 days | Warning | Review status, escalate if needed |
| 3 days | Urgent | Prioritize completion |
| 1 day | Critical | Immediate action required |
| 0 days | Overdue | Escalate to management |

---

## 5. Response Delivery

### 5.1 Delivery Methods

| Method | Use Case | Security |
|--------|----------|----------|
| Secure Portal | Default for account holders | Login required |
| Encrypted Email | Alternative for verified users | Password protected |
| Physical Mail | Last resort / special request | Registered mail |

### 5.2 Data Export Delivery

1. Generate export in requested format (JSON, CSV, PDF)
2. Upload to secure S3 storage with 24-hour expiry
3. Generate signed download URL
4. Send notification with download link
5. Limit to 3 downloads per link
6. Log all download activity

### 5.3 Response Documentation

For each completed request, document:

- Request ID
- Request type
- Date received
- Date completed
- Response method
- Data provided (categories)
- Exceptions applied (if any)
- Processor who handled request

---

## 6. Denial Procedures

### 6.1 Valid Grounds for Denial

| Ground | Description | Documentation Required |
|--------|-------------|----------------------|
| Verification Failure | Cannot verify identity | Verification attempt logs |
| No Data Found | No personal information on file | Search records |
| Exception Applies | Legal/security exception | Exception justification |
| Duplicate Request | Same request within 12 months | Previous request reference |
| Fraudulent Request | Evidence of fraud | Fraud investigation notes |

### 6.2 Denial Process

1. Document denial reason with evidence
2. Obtain supervisor approval (if required)
3. Send denial notice to requester
4. Record in audit trail
5. Retain documentation for 24 months

### 6.3 Denial Notice Template

```
Subject: Response to Your CCPA Request - [Request ID]

Dear [Requester Name],

We have reviewed your California Consumer Privacy Act request
submitted on [Date].

Unfortunately, we are unable to fulfill your request for the
following reason:

[Denial Reason - e.g., "We were unable to verify your identity
after multiple attempts."]

Your Rights:
- You may resubmit your request at any time
- You may file a complaint with the California Attorney General
- You may contact us at privacy@forsured.com with questions

Reference: Request ID [Request ID]

Sincerely,
Forsured Privacy Team
```

---

## 7. Escalation Procedures

### 7.1 Escalation Triggers

| Trigger | Escalate To | Response Time |
|---------|-------------|---------------|
| Complex request | Privacy Lead | 24 hours |
| Potential data breach | Security Team | Immediate |
| Legal threat | Legal Counsel | 24 hours |
| Media inquiry | Communications | Immediate |
| Regulatory inquiry | Legal + Executive | Immediate |

### 7.2 Escalation Contacts

| Role | Contact | Backup |
|------|---------|--------|
| Privacy Lead | privacy-lead@forsured.com | compliance@forsured.com |
| Security Team | security@forsured.com | oncall-security@forsured.com |
| Legal Counsel | legal@forsured.com | external-counsel@firm.com |
| Executive Sponsor | exec-privacy@forsured.com | ceo@forsured.com |

### 7.3 Escalation Documentation

For each escalation, document:

- Date/time of escalation
- Request ID
- Reason for escalation
- Person escalated to
- Resolution and outcome
- Lessons learned

---

## Appendix A: Quick Reference Checklist

### New Request Checklist

- [ ] Request logged in system
- [ ] Unique ID assigned
- [ ] Acknowledgment sent
- [ ] Verification initiated
- [ ] Deadline calculated

### Completion Checklist

- [ ] Request fulfilled or denied
- [ ] Response delivered
- [ ] Documentation complete
- [ ] Audit trail updated
- [ ] Request closed in system

---

## Appendix B: SLA Summary

| Metric | Target | Measurement |
|--------|--------|-------------|
| Acknowledgment | 24 hours | Time from receipt |
| Verification | 10 days | Time to verify |
| Response | 45 days | Time to complete |
| Extended Response | 90 days | If extension granted |
| Opt-Out Execution | 15 business days | Time to implement |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 2025 | Privacy Team | Initial release |
