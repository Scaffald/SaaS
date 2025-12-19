# CCPA Compliance Implementation Guide

**REQ-3: CCPA Compliance Implementation**
**Last Updated:** December 2025

## Table of Contents

1. [Overview](#overview)
2. [Consumer Rights](#consumer-rights)
3. [System Architecture](#system-architecture)
4. [Request Processing](#request-processing)
5. [Data Categories](#data-categories)
6. [Compliance Timelines](#compliance-timelines)
7. [Integration Points](#integration-points)

---

## Overview

The California Consumer Privacy Act (CCPA), as amended by the California Privacy Rights Act (CPRA), grants California residents specific rights regarding their personal information. This implementation provides comprehensive compliance infrastructure for the Forsured platform.

### Scope

This implementation covers:

- **Data Subject Requests (DSR)**: Right to Know, Delete, Correct, Opt-Out
- **Opt-Out Management**: Sale, Sharing, Targeted Advertising, Profiling
- **Global Privacy Control (GPC)**: Automatic opt-out signal detection
- **Breach Notification**: 72-hour notification workflow
- **Annual Reporting**: CA Attorney General compliance reports

### Compliance Standards

| Requirement | Implementation Status |
|-------------|----------------------|
| 45-day response deadline | ✅ Implemented with deadline tracking |
| Identity verification | ✅ Multi-level verification system |
| Data portability | ✅ JSON, CSV, PDF export formats |
| GPC signal respect | ✅ Automatic detection and opt-out |
| Breach notification | ✅ 72-hour workflow |
| Annual reporting | ✅ CA AG report generation |

---

## Consumer Rights

### Right to Know (Access)

Consumers can request information about:
- Categories of personal information collected
- Specific pieces of personal information
- Sources of collection
- Business purposes for collection
- Third parties with whom data is shared

**Processing Time:** 45 calendar days (extendable by 45 days with notice)

### Right to Delete

Consumers can request deletion of their personal information, subject to exceptions:
- Transaction completion
- Security/fraud prevention
- Legal compliance
- Internal analytics (aggregated)

**Retention Exceptions:**
- Financial records: 7 years (regulatory requirement)
- Compliance records: 5 years
- Legal holds: As required

### Right to Correct

Consumers can request correction of inaccurate personal information.

**Verification:** Enhanced verification required for correction requests.

### Right to Opt-Out

Consumers can opt out of:
- **Sale of Personal Information**: Third-party data sales
- **Sharing for Cross-Context Advertising**: Targeted advertising
- **Profiling**: Automated decision-making

### Right to Limit Sensitive Personal Information

Consumers can limit use of:
- Social Security numbers
- Financial account information
- Precise geolocation
- Biometric data
- Health information

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CCPA Compliance Layer                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Request   │  │   Opt-Out   │  │   Breach    │             │
│  │   Handler   │  │   Manager   │  │  Notifier   │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│  ┌──────┴──────────────┴────────────────┴──────┐              │
│  │              Core CCPA Services              │              │
│  ├──────────────────────────────────────────────┤              │
│  │  • Identity Verification                     │              │
│  │  • Data Collection                           │              │
│  │  • Deadline Tracking                         │              │
│  │  • Audit Logging                             │              │
│  └──────────────────┬───────────────────────────┘              │
│                     │                                           │
│  ┌──────────────────┴───────────────────────────┐              │
│  │            Data Layer (Supabase)              │              │
│  ├───────────────────────────────────────────────┤              │
│  │  • ccpa_requests                              │              │
│  │  • ccpa_opt_outs                              │              │
│  │  • ccpa_request_history (audit)               │              │
│  │  • ccpa_export_downloads                      │              │
│  └───────────────────────────────────────────────┘              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | File | Purpose |
|-----------|------|---------|
| Data Export | `dataExport.ts` | Generate user data exports |
| Data Deletion | `dataDeletion.ts` | Process deletion requests |
| Consent Management | `consent.ts` | Track consent records |
| Breach Notification | `breachNotification.ts` | Handle security incidents |
| CA AG Reporting | `ca-ag-reporting.ts` | Annual compliance reports |
| Forsured Collector | `forsured-data-collector.ts` | App-specific data collection |
| Forsured Deletion | `forsured-deletion-handler.ts` | App-specific deletion |

---

## Request Processing

### Workflow Overview

```
1. Request Received
        │
        ▼
2. Identity Verification
        │
   ┌────┴────┐
   │ Verified │──No──► Deny Request
   └────┬────┘
        │ Yes
        ▼
3. Process Request
        │
   ┌────┴────────────┐
   │ Request Type    │
   └─┬──┬──┬──┬──┬──┘
     │  │  │  │  │
     │  │  │  │  └─► Opt-Out: Update preferences
     │  │  │  └────► Correct: Update data
     │  │  └───────► Delete: Execute deletion
     │  └──────────► Access: Generate export
     └─────────────► Know: Compile disclosure
        │
        ▼
4. Complete Request
        │
        ▼
5. Notify Consumer
```

### Verification Levels

| Level | Method | Use Case |
|-------|--------|----------|
| Standard | Email verification | Access requests |
| Enhanced | Fresh login + email | Deletion, correction |
| Manual | Document review | High-risk requests |

---

## Data Categories

### CCPA Data Categories

| Category | Description | Examples |
|----------|-------------|----------|
| Identifiers | Personal identification | Name, email, phone, user ID |
| Commercial | Transaction data | Purchases, policies, payments |
| Internet Activity | Online behavior | Page views, clicks, searches |
| Geolocation | Location data | IP-based location, addresses |
| Professional | Work information | Company, role, certifications |
| Inferences | Derived data | Risk scores, recommendations |

### Forsured-Specific Data

| Data Type | CCPA Category | Retention |
|-----------|---------------|-----------|
| Insurance Policies | Commercial | 7 years |
| Compliance Scores | Inferences | 5 years |
| Documents | Professional | User-controlled |
| Tasks | Internet Activity | 2 years |
| Projects | Commercial | 5 years |

---

## Compliance Timelines

### Request Response Deadlines

| Event | Deadline | Action |
|-------|----------|--------|
| Request received | Day 0 | Send acknowledgment |
| Verification | Day 10 | Complete identity verification |
| First response | Day 45 | Initial response or extension notice |
| Extended deadline | Day 90 | Final response (if extended) |
| Data delivery | Day 45/90 | Provide data export |

### Breach Notification Timeline

| Event | Deadline | Action |
|-------|----------|--------|
| Breach discovered | Hour 0 | Begin incident response |
| Internal notification | Hour 24 | Notify DPO and leadership |
| CA AG notification | Hour 72 | Notify Attorney General (if 500+ residents) |
| Consumer notification | Without unreasonable delay | Email/portal notification |

---

## Integration Points

### Scaffald Integration

Forsured integrates with the Scaffald platform for centralized CCPA management:

- **Webhook Handler**: Receives export/deletion requests from Scaffald
- **Data Contribution**: Contributes Forsured data to unified exports
- **Deletion Confirmation**: Reports deletion completion to Scaffald

### Third-Party Services

| Service | Purpose | DPA Status |
|---------|---------|------------|
| Supabase | Database & Auth | Signed |
| AWS S3 | Export storage | Signed |
| SendGrid | Email notifications | Signed |

---

## Related Documentation

- [Request Processing Runbook](./REQUEST-PROCESSING-RUNBOOK.md)
- [Incident Response Runbook](./INCIDENT-RESPONSE-RUNBOOK.md)
- [Data Retention Policy](./DATA-RETENTION-POLICY.md)
- [Audit Procedures](./AUDIT-PROCEDURES.md)

---

## Contact

**Data Protection Officer**: privacy@forsured.com
**Compliance Team**: compliance@forsured.com
**Security Team**: security@forsured.com
