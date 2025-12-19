# CCPA Audit Procedures

**REQ-3: CCPA Compliance Implementation - TASK-20**
**Version:** 1.0
**Last Updated:** December 2025

## Purpose

This document defines audit procedures to verify ongoing CCPA compliance, identify gaps, and ensure continuous improvement of privacy practices.

---

## 1. Audit Framework

### 1.1 Audit Types

| Audit Type | Frequency | Scope | Owner |
|------------|-----------|-------|-------|
| **Internal Review** | Quarterly | Operational compliance | Privacy Team |
| **Comprehensive Audit** | Annual | Full CCPA compliance | Compliance Team |
| **External Audit** | Annual | Independent assessment | Third-party auditor |
| **Ad-hoc Audit** | As needed | Specific concerns | Privacy Lead |

### 1.2 Audit Objectives

1. Verify consumer rights are being honored
2. Confirm data processing meets CCPA requirements
3. Assess effectiveness of technical controls
4. Identify compliance gaps and risks
5. Track remediation of prior findings

---

## 2. Quarterly Internal Review

### 2.1 Review Checklist

#### Consumer Rights

- [ ] All access requests completed within 45 days
- [ ] All deletion requests processed correctly
- [ ] Opt-out requests honored within 15 business days
- [ ] Verification procedures followed for all requests
- [ ] Response quality meets standards

#### Data Handling

- [ ] Data inventory is current
- [ ] Processing activities documented
- [ ] Third-party sharing list accurate
- [ ] Retention schedules being followed
- [ ] Deletion jobs running successfully

#### Technical Controls

- [ ] Access controls reviewed
- [ ] Encryption in place for sensitive data
- [ ] Audit logging functioning
- [ ] Backup scrubbing on schedule
- [ ] Security patches current

### 2.2 Metrics Review

| Metric | Target | Q1 | Q2 | Q3 | Q4 |
|--------|--------|----|----|----|----|
| Request response time (avg days) | < 30 | | | | |
| Requests completed on time (%) | > 95% | | | | |
| Requests denied (%) | < 10% | | | | |
| Opt-out processing time (days) | < 10 | | | | |
| Data incidents | 0 | | | | |

### 2.3 Documentation

**Quarterly Review Report includes:**

1. Executive summary
2. Metrics dashboard
3. Findings and observations
4. Recommendations
5. Action items with owners

---

## 3. Annual Comprehensive Audit

### 3.1 Audit Scope

The annual audit covers all CCPA requirements:

| Area | Requirements Tested |
|------|---------------------|
| **Privacy Notice** | Completeness, accuracy, accessibility |
| **Consumer Rights** | All five rights implementation |
| **Data Inventory** | Categories, sources, sharing |
| **Vendor Management** | DPAs, compliance verification |
| **Technical Safeguards** | Security controls, encryption |
| **Training** | Staff awareness, documentation |
| **Incident Response** | Procedures, testing, notification |

### 3.2 Audit Procedures

#### Phase 1: Planning (Week 1)

1. Define audit scope and objectives
2. Identify key stakeholders
3. Request documentation
4. Schedule interviews
5. Prepare audit workpapers

#### Phase 2: Fieldwork (Weeks 2-3)

1. Review documentation
2. Interview process owners
3. Test controls
4. Sample transactions
5. Walkthrough procedures

#### Phase 3: Analysis (Week 4)

1. Analyze findings
2. Assess risk levels
3. Develop recommendations
4. Draft report
5. Review with management

#### Phase 4: Reporting (Week 5)

1. Finalize findings
2. Present to leadership
3. Agree remediation plans
4. Issue final report
5. Track action items

### 3.3 Testing Procedures

#### Privacy Notice Testing

| Test | Procedure | Evidence |
|------|-----------|----------|
| Notice availability | Navigate to privacy policy from all entry points | Screenshots |
| Content completeness | Compare against CCPA requirements checklist | Documented comparison |
| Update process | Review change history | Version log |
| Spanish translation | Verify translation available if required | Translation review |

#### Consumer Rights Testing

| Right | Sample Size | Test Procedure |
|-------|-------------|----------------|
| Right to Know | 25 requests | Verify timely, complete response |
| Right to Delete | 25 requests | Confirm deletion across systems |
| Right to Correct | 10 requests | Verify corrections applied |
| Right to Opt-Out | 25 requests | Confirm opt-out in all systems |
| Right to Limit | 10 requests | Verify limitation applied |

#### Data Inventory Testing

| Test | Procedure |
|------|-----------|
| Completeness | Compare inventory to actual data stores |
| Accuracy | Verify sample entries against systems |
| Currency | Check last update date, review changes |
| Third parties | Verify all sharing partners listed |

---

## 4. External Audit

### 4.1 Auditor Selection

**Criteria:**

- CCPA/privacy expertise
- Industry experience (insurtech)
- Independence
- References
- Cost-effectiveness

### 4.2 Engagement Scope

**Standard engagement includes:**

1. Policy and procedure review
2. Technical controls assessment
3. Consumer rights process testing
4. Sample transaction testing
5. Remediation recommendations
6. Attestation report

### 4.3 Audit Preparation

**30 days before audit:**

- [ ] Gather all documentation
- [ ] Update data inventory
- [ ] Review prior findings status
- [ ] Prepare evidence binder
- [ ] Brief staff on audit process

**Documentation to prepare:**

| Category | Documents |
|----------|-----------|
| Policies | Privacy policy, retention policy, incident response |
| Procedures | Request handling, verification, deletion |
| Records | Request logs, consent records, training records |
| Technical | System diagrams, access controls, encryption |
| Contracts | DPAs, vendor agreements |

---

## 5. Audit Evidence

### 5.1 Evidence Types

| Type | Examples | Retention |
|------|----------|-----------|
| **Documents** | Policies, procedures, contracts | 5 years |
| **Records** | Request logs, consent records | 5 years |
| **Screenshots** | System configurations, UI | Per audit |
| **Interviews** | Notes from staff discussions | Per audit |
| **Test Results** | Sample testing workpapers | 5 years |

### 5.2 Evidence Standards

All audit evidence must be:

- **Sufficient**: Enough to support conclusions
- **Reliable**: From trustworthy sources
- **Relevant**: Related to audit objectives
- **Timely**: Current as of audit date

### 5.3 Evidence Retention

- Retain all audit workpapers for 5 years
- Store in secure, access-controlled location
- Maintain chain of custody documentation
- Support regulatory inquiries

---

## 6. Findings Classification

### 6.1 Severity Levels

| Level | Definition | Remediation Timeline |
|-------|------------|---------------------|
| **Critical** | Material non-compliance, immediate risk | 30 days |
| **High** | Significant gap, elevated risk | 60 days |
| **Medium** | Moderate gap, manageable risk | 90 days |
| **Low** | Minor issue, best practice improvement | 180 days |
| **Observation** | Enhancement opportunity | As resources allow |

### 6.2 Finding Documentation

Each finding must include:

1. **Condition**: What was observed
2. **Criteria**: What should be (requirement/standard)
3. **Cause**: Why the gap exists
4. **Consequence**: Risk if not addressed
5. **Recommendation**: How to remediate

### 6.3 Sample Finding

```
Finding ID: 2025-Q1-003
Severity: High

CONDITION:
15% of deletion requests (3 of 20 sampled) were not completed
within the 45-day statutory deadline.

CRITERIA:
CCPA requires response to deletion requests within 45 calendar
days, extendable to 90 days with written notice.

CAUSE:
Manual verification process created bottleneck. No automated
alerting for approaching deadlines.

CONSEQUENCE:
Non-compliance with CCPA timeline requirements. Potential
regulatory action and consumer complaints.

RECOMMENDATION:
1. Implement automated deadline alerts at 30, 37, and 44 days
2. Add staffing during high-volume periods
3. Streamline verification process

REMEDIATION PLAN:
Owner: Privacy Lead
Target Date: March 15, 2025
Status: In Progress
```

---

## 7. Remediation Tracking

### 7.1 Action Item Register

| ID | Finding | Owner | Due Date | Status | Evidence |
|----|---------|-------|----------|--------|----------|
| | | | | | |

### 7.2 Status Definitions

| Status | Definition |
|--------|------------|
| **Open** | Not yet started |
| **In Progress** | Actively being worked |
| **Pending Verification** | Complete, awaiting audit verification |
| **Closed** | Verified complete |
| **Accepted Risk** | Management accepted, documented |

### 7.3 Escalation Process

| Condition | Escalation |
|-----------|------------|
| Critical finding not started in 7 days | Privacy Lead → Executive |
| High finding past due | Privacy Lead → Compliance Committee |
| Multiple missed deadlines | Compliance Committee → Board |

---

## 8. Continuous Monitoring

### 8.1 Automated Monitoring

| Control | Monitoring Method | Alert Threshold |
|---------|------------------|-----------------|
| Request deadlines | Daily query | 7 days remaining |
| Deletion queue | Daily job | > 50 items |
| Opt-out processing | Daily check | > 5 days old |
| Access logs | Real-time | Anomalies |

### 8.2 Manual Monitoring

| Activity | Frequency | Owner |
|----------|-----------|-------|
| Request queue review | Weekly | Privacy Analyst |
| Exception review | Weekly | Privacy Lead |
| Vendor compliance check | Monthly | Vendor Manager |
| Policy review | Quarterly | Privacy Team |

### 8.3 Monitoring Dashboard

**Key indicators:**

- Requests in progress (by type)
- Days to deadline (distribution)
- Completion rate (30-day trend)
- Exception rate
- Customer satisfaction

---

## 9. Reporting

### 9.1 Report Types

| Report | Audience | Frequency |
|--------|----------|-----------|
| Operational metrics | Privacy Team | Weekly |
| Compliance dashboard | Management | Monthly |
| Quarterly review | Executives | Quarterly |
| Annual audit report | Board/Regulators | Annual |

### 9.2 Annual Report Contents

1. Executive Summary
2. Audit Scope and Methodology
3. Compliance Assessment by Area
4. Findings Summary
5. Year-over-Year Comparison
6. Remediation Status
7. Recommendations
8. Management Response

---

## Appendix A: Audit Checklists

### Privacy Notice Checklist

- [ ] Categories of PI collected
- [ ] Sources of PI
- [ ] Business purposes
- [ ] Categories shared with third parties
- [ ] Consumer rights explanation
- [ ] Opt-out instructions
- [ ] Contact information
- [ ] Date of last update

### Request Handling Checklist

- [ ] Request logged within 24 hours
- [ ] Acknowledgment sent
- [ ] Verification completed
- [ ] Request processed
- [ ] Response delivered
- [ ] Documentation complete

### Technical Controls Checklist

- [ ] Encryption at rest
- [ ] Encryption in transit
- [ ] Access controls
- [ ] Audit logging
- [ ] Backup procedures
- [ ] Incident detection

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 2025 | Compliance Team | Initial release |
