# CCPA Incident Response Runbook

**REQ-3: CCPA Compliance Implementation - TASK-20**
**Version:** 1.0
**Last Updated:** December 2025

## Purpose

This runbook provides procedures for responding to security incidents that may require notification under the California Consumer Privacy Act (CCPA) and California's data breach notification law (Cal. Civ. Code § 1798.82).

---

## Table of Contents

1. [Incident Classification](#1-incident-classification)
2. [Immediate Response](#2-immediate-response)
3. [Investigation](#3-investigation)
4. [Notification Requirements](#4-notification-requirements)
5. [Consumer Notification](#5-consumer-notification)
6. [Regulatory Notification](#6-regulatory-notification)
7. [Post-Incident Review](#7-post-incident-review)

---

## 1. Incident Classification

### 1.1 Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| **Critical** | Active breach, data exfiltration confirmed | Immediate | Ransomware, active intrusion |
| **High** | Likely breach, sensitive data at risk | 1 hour | Unauthorized access detected |
| **Medium** | Potential breach, investigation needed | 4 hours | Suspicious activity, anomaly |
| **Low** | Minor security event, no data exposure | 24 hours | Failed login attempts |

### 1.2 Data Types Requiring Notification

**Personal Information (triggers notification if breached):**

- Social Security number
- Driver's license / state ID number
- Financial account number with access code
- Medical / health insurance information
- Biometric data
- Email + password or security question/answer

**Additional CCPA Categories:**

- Precise geolocation
- Racial/ethnic origin
- Religious beliefs
- Union membership
- Genetic data
- Contents of communications

### 1.3 Notification Thresholds

| Affected Residents | CA AG Notification | Consumer Notification |
|-------------------|-------------------|----------------------|
| 1-499 | Not required | Required |
| 500+ | Required | Required |

---

## 2. Immediate Response

### 2.1 First 15 Minutes

**Whoever discovers the incident:**

1. **DO NOT** attempt to fix or investigate alone
2. Contact Security Team immediately: security@forsured.com
3. Document what you observed (screenshots if possible)
4. Preserve evidence - do not modify logs or systems

### 2.2 Incident Response Team Activation

**Security Lead actions (within 30 minutes):**

1. Activate Incident Response Team (IRT)
2. Create incident channel: `#incident-YYYY-MM-DD`
3. Assign Incident Commander
4. Begin incident log

### 2.3 Incident Response Team

| Role | Responsibility | Contact |
|------|---------------|---------|
| Incident Commander | Overall coordination | On-call rotation |
| Security Lead | Technical investigation | security@forsured.com |
| Privacy Lead | CCPA compliance | privacy@forsured.com |
| Legal Counsel | Legal obligations | legal@forsured.com |
| Communications | External messaging | comms@forsured.com |
| Engineering Lead | System remediation | engineering@forsured.com |

### 2.4 Initial Containment

**Priority actions:**

1. Isolate affected systems (if safe to do so)
2. Revoke compromised credentials
3. Block malicious IPs/users
4. Preserve forensic evidence
5. Enable enhanced logging

---

## 3. Investigation

### 3.1 Investigation Checklist

**Within first 4 hours:**

- [ ] Identify attack vector
- [ ] Determine affected systems
- [ ] Identify compromised data types
- [ ] Estimate number of affected individuals
- [ ] Determine California resident count
- [ ] Assess ongoing risk

### 3.2 Data Impact Assessment

**Document for each affected data type:**

| Field | Information Needed |
|-------|-------------------|
| Data type | SSN, financial, medical, etc. |
| Records affected | Count of records |
| CA residents | Count or estimate |
| Data encrypted? | Yes/No |
| Encryption compromised? | Yes/No |
| Data accessed? | Confirmed/Suspected/Unknown |
| Data exfiltrated? | Confirmed/Suspected/Unknown |

### 3.3 Timeline Documentation

Create detailed timeline with:

- Date/time of each event
- Actions taken
- Decisions made
- Personnel involved
- Evidence collected

---

## 4. Notification Requirements

### 4.1 Decision Framework

```
                    Was personal information accessed?
                              │
                    ┌─────────┴─────────┐
                    │                   │
                   No                  Yes
                    │                   │
              No notification     Was data encrypted?
               required                 │
                              ┌─────────┴─────────┐
                              │                   │
                             Yes                  No
                              │                   │
                    Was encryption key     Notification
                       compromised?         REQUIRED
                              │
                    ┌─────────┴─────────┐
                    │                   │
                   No                  Yes
                    │                   │
              No notification      Notification
               required             REQUIRED
```

### 4.2 Notification Timeline

| Event | Deadline | Action |
|-------|----------|--------|
| Discovery | Hour 0 | Clock starts |
| Internal notification | Hour 24 | Notify DPO, Legal, Executive |
| CA AG notification | Hour 72 | If 500+ CA residents affected |
| Consumer notification | "Without unreasonable delay" | After investigation complete |

### 4.3 Exceptions to Notification

Notification may not be required if:

1. Data was encrypted AND encryption key not compromised
2. Misuse of data is not reasonably possible
3. Law enforcement requests delay (documented)

---

## 5. Consumer Notification

### 5.1 Required Content

California law requires notification to include:

1. Description of the incident
2. Types of information involved
3. Steps taken to protect against further breaches
4. Contact information for the company
5. Toll-free numbers for credit bureaus (if applicable)
6. Toll-free FTC number: 1-877-382-4357

### 5.2 Notification Template

```
Subject: Important Security Notice from Forsured

Dear [Name],

We are writing to inform you of a security incident that may have
affected your personal information.

WHAT HAPPENED
On [Date], we discovered [brief description of incident]. Upon
discovery, we immediately [actions taken to contain].

WHAT INFORMATION WAS INVOLVED
The following types of information may have been affected:
- [List data types, e.g., name, email, policy number]

WHAT WE ARE DOING
We have taken the following steps to address this incident:
- [Action 1]
- [Action 2]
- [Action 3]

We have also reported this incident to appropriate authorities.

WHAT YOU CAN DO
We recommend you take the following precautions:
- Monitor your accounts for suspicious activity
- Consider placing a fraud alert on your credit file
- Review your credit reports for unauthorized activity

FREE CREDIT MONITORING
We are offering [X months] of free credit monitoring through
[Provider]. To enroll, visit: [URL]

FOR MORE INFORMATION
If you have questions, please contact us:
- Email: security-incident@forsured.com
- Phone: [toll-free number]
- Hours: [business hours]

Credit Bureau Contact Information:
- Equifax: 1-800-525-6285
- Experian: 1-888-397-3742
- TransUnion: 1-800-680-7289

Federal Trade Commission: 1-877-382-4357 or ftc.gov/idtheft

We sincerely apologize for this incident and any inconvenience it
may cause.

Sincerely,
[Executive Name]
[Title]
Forsured
```

### 5.3 Notification Methods

| Method | When to Use | Documentation |
|--------|-------------|---------------|
| Email | Primary for all | Retain copy + delivery log |
| Portal | Supplementary | Screenshot notification |
| Physical mail | If no email | Certified mail receipt |
| Substitute notice | If cost >$250K or 500K+ affected | Website + media |

---

## 6. Regulatory Notification

### 6.1 California Attorney General

**Required when:** 500+ California residents affected

**Submit to:** https://oag.ca.gov/privacy/databreach/reporting

**Required information:**

1. Business name and contact
2. List of affected CA residents (if under 500)
3. Types of information breached
4. Date of breach
5. Date breach discovered
6. Description of incident
7. Remedial actions taken
8. Copy of consumer notification

### 6.2 Other Regulatory Bodies

| Regulator | When Required | Contact |
|-----------|---------------|---------|
| HHS/OCR | HIPAA data involved | hhs.gov/hipaa |
| SEC | Public company, material impact | sec.gov |
| State AGs | Residents in other states | Varies by state |

### 6.3 Law Enforcement

**Contact if:**
- Criminal activity suspected
- Ongoing threat to others
- Regulatory requirement

**Do NOT delay notification solely for law enforcement unless:**
- Written request from law enforcement
- Documented that notification would impede investigation

---

## 7. Post-Incident Review

### 7.1 Post-Incident Meeting

**Schedule within 2 weeks of incident closure:**

**Attendees:**
- Incident Response Team
- Affected department heads
- Executive sponsor

**Agenda:**
1. Incident timeline review
2. What went well
3. What could improve
4. Action items for future

### 7.2 Root Cause Analysis

Document:

1. **Immediate cause**: What triggered the incident?
2. **Contributing factors**: What allowed it to happen?
3. **Root cause**: Why did contributing factors exist?
4. **Corrective actions**: How do we prevent recurrence?

### 7.3 Lessons Learned Report

| Section | Content |
|---------|---------|
| Executive Summary | Brief overview for leadership |
| Timeline | Detailed chronology |
| Impact Assessment | Data affected, costs incurred |
| Response Evaluation | What worked, what didn't |
| Recommendations | Specific improvements |
| Action Items | Assigned tasks with deadlines |

### 7.4 Documentation Retention

Retain all incident documentation for **minimum 24 months**:

- Incident logs
- Investigation notes
- Notification copies
- AG submission
- Legal correspondence
- Remediation evidence

---

## Appendix A: Quick Response Card

### CRITICAL INCIDENT (Severity: Critical/High)

1. **STOP** - Do not modify systems
2. **CALL** - Security: security@forsured.com
3. **DOCUMENT** - Screenshot, note time
4. **PRESERVE** - Do not delete anything
5. **WAIT** - For IRT instructions

### 72-HOUR CHECKLIST (500+ CA Residents)

- [ ] Hour 0-4: Incident team activated
- [ ] Hour 4-24: Impact assessment complete
- [ ] Hour 24-48: Notification drafted
- [ ] Hour 48-72: CA AG submission ready
- [ ] Hour 72: CA AG notified
- [ ] Post-72h: Consumer notification sent

---

## Appendix B: Contact Quick Reference

| Role | Email | Phone |
|------|-------|-------|
| Security Team | security@forsured.com | [emergency line] |
| Privacy Lead | privacy@forsured.com | [phone] |
| Legal Counsel | legal@forsured.com | [phone] |
| Executive On-Call | exec-oncall@forsured.com | [phone] |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 2025 | Security Team | Initial release |
