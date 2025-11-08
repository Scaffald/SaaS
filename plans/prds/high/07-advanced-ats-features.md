# PRD: Advanced ATS (Applicant Tracking System) Features

**Status:** High Priority
**Effort Estimate:** 2-3 weeks
**Dependencies:** Team Management, Notification System, Email System
**Related Features:** Job Management, Application Management, Organization Management

---

## 1. Overview

The Advanced ATS Features build upon the existing 76%-complete ATS foundation to add interview scheduling, offer management, candidate communication tracking, bulk operations, and advanced analytics. These features transform the basic application tracking into a complete hiring workflow tool that supports organizations through every stage from application to onboarding.

The existing ATS provides application submission, tracking, and basic review via Kanban board. Advanced features add the critical later-stage workflows: scheduling interviews, making offers, tracking communications, and analyzing hiring performance.

**Ecosystem Context:** In skilled trades hiring, the post-application workflow is crucial. Organizations need to schedule multiple interview rounds (technical skills, safety review, manager interview), extend offers with specific terms (hourly rate, project details, start date), and track extensive candidate communications. Advanced ATS features ensure no candidates fall through the cracks and hiring proceeds efficiently.

---

## 2. Goals & Objectives

### Primary Goal
Complete the ATS workflow by adding interview scheduling, offer management, bulk operations, and analytics that support organizations from application through onboarding.

### Secondary Goals
1. **Interview Management** - Schedule, track, and record interviews efficiently
2. **Offer Workflow** - Create, extend, and manage job offers seamlessly
3. **Bulk Operations** - Handle multiple candidates efficiently for high-volume hiring
4. **Communication History** - Track all candidate interactions in one place
5. **Hiring Analytics** - Measure and optimize hiring performance

### Success Criteria
- Organizations using ATS have 40% faster time-to-hire
- Interview scheduling reduces back-and-forth by 60%
- Offer acceptance rate improves by 25% with streamlined workflow
- Hiring analytics used by 70% of active hiring organizations
- Bulk operations save 3+ hours per week for high-volume recruiters

---

## 3. User Stories

### Recruiter
- **As a recruiter**, I want to schedule interviews with candidates so that I can coordinate meeting times efficiently
- **As a recruiter**, I want to create job offers from templates so that I can extend offers quickly
- **As a recruiter**, I want to see all communications with a candidate so that I understand our full interaction history
- **As a recruiter**, I want to move multiple candidates between pipeline stages so that I can process many applications efficiently
- **As a recruiter**, I want to see analytics on my hiring pipeline so that I can identify bottlenecks

### Hiring Manager
- **As a hiring manager**, I want to participate in scheduled interviews so that I can evaluate candidates
- **As a hiring manager**, I want to approve or edit offers before they're extended so that terms align with budget
- **As a hiring manager**, I want to see reference check results so that I can make informed hiring decisions
- **As a hiring manager**, I want to analyze time-to-hire metrics so that I can improve my hiring process

### Candidate/Worker
- **As a candidate**, I want to receive interview invitations with clear details so that I can prepare and attend
- **As a candidate**, I want to accept or decline interview times so that I can indicate my availability
- **As a candidate**, I want to receive job offers with all terms clear so that I can make an informed decision
- **As a candidate**, I want to accept or decline offers so that I can proceed with employment or continue my search

### Organization Admin
- **As an organization admin**, I want to track hiring costs and metrics so that I can optimize our hiring budget
- **As an organization admin**, I want to ensure offer terms are consistent so that we maintain pay equity
- **As an organization admin**, I want to analyze which jobs are hardest to fill so that I can adjust strategy

---

## 4. Functional Requirements

### 4.1 Interview Scheduling

- **Schedule Interviews**
  - Create interview events with date, time, duration
  - Specify interview type (phone screen, technical, in-person, panel)
  - Select interviewer(s) from team members
  - Add interview location or video conference link
  - Include interview agenda or topics
  - Send calendar invitations automatically

- **Candidate Interview Invitation**
  - Send email invitation to candidate
  - Provide interview details (time, location, interviewers, what to bring)
  - Allow candidate to confirm or request reschedule
  - Send reminders (24 hours before, 1 hour before)
  - Provide reschedule/cancel options

- **Interview Confirmation**
  - Candidates confirm attendance
  - Notify interviewer(s) of confirmation status
  - Automatic calendar updates
  - Handle candidate no-shows
  - Reschedule workflow

- **Multi-Round Interviews**
  - Schedule sequential interview rounds
  - Track progress through interview stages
  - Auto-advance to next round upon completion
  - Different interviewers per round

- **Interview Notes & Evaluation**
  - Record interview notes during/after interview
  - Structured evaluation forms (skills, culture fit, technical ability)
  - Rating scales (1-5) per evaluation criteria
  - Attach files (technical test results, work samples)
  - Share notes with hiring team
  - Aggregate interview feedback

### 4.2 Offer Management

- **Create Offers**
  - Generate offers from templates
  - Specify offer terms:
    - Job title and description
    - Compensation (hourly/salary, benefits)
    - Start date
    - Work location
    - Employment type (full-time, part-time, contract)
    - Probation period
    - Special terms
  - Include company documents (employee handbook, etc.)
  - Support offer expiration dates

- **Offer Approval Workflow**
  - Submit offer for approval (hiring manager, admin)
  - Track approval status
  - Allow edits during approval
  - Approval notifications
  - Require multiple approvals for senior roles

- **Extend Offers**
  - Send offer email to candidate
  - Provide offer letter (PDF attachment)
  - Include accept/decline buttons
  - Specify response deadline
  - Track offer sent status

- **Offer Response Management**
  - Candidate accepts or declines offer
  - Collect decline reasons
  - Handle counter-offers
  - Negotiate terms workflow (future)
  - Auto-update application status on response
  - Notify hiring team of response

- **Offer Templates**
  - Create reusable offer templates
  - Template variables for personalization
  - Different templates per role/department
  - Template version control
  - Template approval workflow

### 4.3 Reference Checks

- **Request References**
  - Request reference contacts from candidate
  - Candidate provides reference details (name, relationship, contact)
  - Email reference with questionnaire
  - Track reference response status
  - Send reminders for non-responses

- **Reference Questionnaire**
  - Structured questionnaire with standard questions
  - Custom questions per role/organization
  - Rating scales for evaluation criteria
  - Open-ended response fields
  - Verify employment dates and role

- **Reference Review**
  - View all reference responses
  - Flag positive or concerning feedback
  - Share references with hiring team
  - Include references in hiring decision

- **Reference Management**
  - Track all reference checks per candidate
  - Reference check completion status
  - Automated reference collection workflow

### 4.4 Candidate Communication History

- **Communication Tracking**
  - Centralized log of all candidate interactions
  - Track emails sent/received
  - Track in-app messages
  - Track phone calls (manual log entry)
  - Track interview conversations
  - Track offer communications

- **Communication Timeline**
  - Chronological view of all interactions
  - Filter by communication type
  - Search communication content
  - View communication in context of application stage

- **Team Communication**
  - Internal notes on candidate visible to team
  - @mention team members in notes
  - Private notes vs. candidate-visible messages
  - Communication handoff between team members

### 4.5 Bulk Operations

- **Bulk Status Updates**
  - Select multiple candidates
  - Change status for all selected (e.g., rejected, interview scheduled)
  - Add rejection reason for bulk rejects
  - Bulk status change audit log

- **Bulk Pipeline Movement**
  - Move multiple candidates between pipeline stages
  - Drag-and-drop multiple candidates in Kanban view
  - Confirm bulk movements
  - Undo bulk operations

- **Bulk Messaging**
  - Send email to multiple candidates
  - Use message templates
  - Personalize with candidate variables
  - Track sent messages per candidate
  - Schedule bulk messages

- **Bulk Actions**
  - Bulk archive candidates
  - Bulk export candidate data
  - Bulk tag candidates
  - Bulk assign to team member

### 4.6 Onboarding Workflow (Initial)

- **Onboarding Initiation**
  - Trigger onboarding after offer acceptance
  - Send welcome email with next steps
  - Provide onboarding checklist
  - Assign onboarding coordinator

- **Document Collection**
  - Request required documents (I-9, W-4, direct deposit)
  - Track document submission status
  - Store documents securely
  - Send document reminders

- **First Day Preparation**
  - Schedule orientation/first day
  - Notify relevant team members
  - Assign equipment/access
  - Send first day instructions to new hire

### 4.7 Advanced Hiring Analytics

- **Pipeline Analytics**
  - Application-to-interview conversion rate
  - Interview-to-offer conversion rate
  - Offer acceptance rate
  - Rejection reasons breakdown
  - Drop-off analysis by stage

- **Time-Based Metrics**
  - Average time-to-hire (application to offer acceptance)
  - Average time in each pipeline stage
  - Time-to-first-response
  - Time-to-schedule-interview
  - Interviewer availability impact on timing

- **Cost Analytics**
  - Cost-per-hire (advertising, recruiter time, etc.)
  - Source effectiveness (where best candidates come from)
  - ROI per hiring source
  - Recruiter efficiency metrics

- **Job Performance Analytics**
  - Hard-to-fill positions identification
  - Time-to-fill trends over time
  - Application volume trends
  - Quality-of-hire scores
  - Retention of hires (future: track beyond hiring)

- **Hiring Team Performance**
  - Applications reviewed per recruiter
  - Average response time per recruiter
  - Interview completion rates
  - Offer acceptance rates by recruiter

- **Dashboards & Reports**
  - Executive hiring dashboard
  - Recruiter performance dashboard
  - Job-level analytics
  - Exportable reports (CSV, PDF)
  - Scheduled report delivery (weekly/monthly)

---

## 5. Non-Functional Requirements

### 5.1 Performance
- **Response Times**
  - Interview schedule creation < 3 seconds
  - Offer generation < 5 seconds
  - Bulk operations (100 candidates) < 10 seconds
  - Analytics dashboard load < 3 seconds
  - Communication history load < 2 seconds

- **Scalability**
  - Support 1000+ active interviews per month
  - Handle 500+ concurrent offers
  - Process bulk operations on 500+ candidates
  - Real-time analytics for 10,000+ applications

### 5.2 Reliability
- **System Uptime**
  - ATS features availability > 99.5%
  - Calendar integration reliability > 99%
  - Email delivery for interviews/offers > 99.5%
  - Data integrity for critical operations (offers, acceptances)

- **Data Integrity**
  - Atomic offer acceptance/decline (no partial state)
  - Interview confirmations are immediately reflected
  - Audit trail for all hiring decisions
  - Backup all candidate communication

### 5.3 Security
- **Access Control**
  - Only authorized team members see candidate data
  - Interview notes only visible to interviewers and hiring team
  - Offer details only visible to authorized approvers
  - Audit log for all data access

- **Data Protection**
  - Encrypt candidate communication
  - Secure offer letter delivery
  - Protect reference check responses
  - GDPR-compliant data handling

### 5.4 Accessibility
- **UI Accessibility**
  - WCAG 2.1 AA compliant interfaces
  - Keyboard navigation for all operations
  - Screen reader support for analytics
  - Clear status indicators

### 5.5 Mobile Experience
- **Mobile Optimization**
  - Mobile interview scheduling
  - Mobile offer review and approval
  - Mobile communication viewing
  - Mobile-friendly analytics dashboards

---

## 6. Success Metrics

### 6.1 Quantitative Metrics

- **Adoption Metrics**
  - % of organizations using interview scheduling > 80%
  - % of organizations using offer management > 70%
  - % of recruiters using bulk operations > 60%
  - % of hiring managers viewing analytics > 50%

- **Efficiency Metrics**
  - Time-to-hire reduction: 40%
  - Interview scheduling time saved: 60%
  - Bulk operations save 3+ hours/week per recruiter
  - Offer creation time: < 5 minutes

- **Quality Metrics**
  - Offer acceptance rate increase: 25%
  - Interview no-show rate < 10%
  - Hiring decision quality improvement (measured by retention)
  - Candidate experience NPS increase

### 6.2 Qualitative Metrics

- **User Satisfaction**
  - Advanced ATS features NPS > 50
  - Recruiter satisfaction with workflow > 4.5/5
  - Hiring manager confidence in hiring decisions
  - Candidate experience with interview/offer process

- **Business Impact**
  - Faster filling of critical positions
  - Better quality hires from data-driven decisions
  - Reduced recruiter workload from bulk operations
  - Improved hiring team collaboration

### 6.3 Operational Metrics

- **System Health**
  - Zero offer delivery failures
  - Calendar sync success rate > 99%
  - Analytics calculation accuracy 100%
  - Interview reminder delivery > 99%

---

## 7. Open Questions & Considerations

### Technical Decisions
1. **Calendar Integration** - Integrate with Google Calendar, Outlook, or build native calendar?
2. **Video Conferencing** - Integrate with Zoom/Teams or provide generic meeting links?
3. **E-Signatures** - Integrate e-signature service (DocuSign, HelloSign) for offer letters?
4. **Analytics Calculation** - Real-time calculation or batch processing overnight?

### Business Decisions
1. **Interview Types** - What standard interview types to support?
2. **Offer Approval** - Require approval for all offers or based on compensation threshold?
3. **Reference Checks** - Mandatory for all hires or optional?
4. **Onboarding Scope** - How deep should ATS onboarding go vs. separate HR system?

### Integration Considerations
1. **HR Systems** - Should ATS integrate with external HR/payroll systems?
2. **Background Checks** - Integration point with background check system
3. **Skills Testing** - Integrate with technical skills assessment platforms?
4. **Recruiting Agencies** - Allow external recruiters limited ATS access?

### Edge Cases
1. **Interview Conflicts** - How to handle scheduling conflicts for interviewers?
2. **Offer Expiration** - What happens if candidate doesn't respond to offer by deadline?
3. **Multiple Offers** - Can candidate receive multiple offers from same organization?
4. **Interview Cancellation** - How to handle last-minute cancellations?

### Future Enhancements
1. **AI-Powered Matching** - Suggest best candidates for jobs using ML
2. **Automated Interview Scheduling** - AI finds optimal times for all parties
3. **Video Interviews** - Built-in video interview platform
4. **Skills Assessments** - Integrated technical testing and evaluation
5. **Diversity Tracking** - DEI metrics and bias detection in hiring

---

## 8. Related Features

### Direct Dependencies
- **Team Management** - Interview participants, offer approvers
- **Notification System** - Interview reminders, offer notifications
- **Email System** - Interview invitations, offer letters
- **Organization Management** - Offer templates, hiring workflows

### Features Depending on This
- **Background Checks** - Initiate checks after offer acceptance
- **Payment System** - Track hiring costs for analytics

### Integration Points
- **Job Management** - Jobs tied to applications
- **Application Management** - Core ATS foundation (76% complete)
- **Worker Profiles** - Candidate information
- **Analytics** - Hiring performance metrics

---

## 9. Implementation Notes

### API Endpoints (tRPC routers)
- `ats.scheduleInterview` - Schedule interview for candidate
- `ats.confirmInterview` - Candidate confirms interview
- `ats.recordInterviewNotes` - Add interview notes and evaluation
- `ats.createOffer` - Create new job offer
- `ats.approveOffer` - Approve offer (hiring manager/admin)
- `ats.extendOffer` - Send offer to candidate
- `ats.respondToOffer` - Candidate accepts/declines offer
- `ats.requestReferences` - Request references from candidate
- `ats.bulkUpdateStatus` - Update status for multiple candidates
- `ats.bulkMoveStage` - Move multiple candidates between stages
- `ats.bulkSendMessage` - Send message to multiple candidates
- `ats.getCommunicationHistory` - Get all communications for candidate
- `ats.getAnalytics` - Get hiring analytics and metrics
- `ats.initiateOnboarding` - Start onboarding workflow

### Database Tables
- `interviews` - Interview schedule and details
- `interview_participants` - Interviewers for each interview
- `interview_evaluations` - Interview notes and ratings
- `offers` - Job offers
- `offer_approvals` - Offer approval workflow tracking
- `reference_checks` - Reference check requests and responses
- `candidate_communications` - Communication log
- `onboarding_checklists` - Onboarding tasks per new hire
- `hiring_analytics` - Pre-computed analytics for performance

### UI Components
- Interview scheduling interface with calendar
- Interview confirmation emails and UI
- Offer creation wizard
- Offer approval interface
- Offer letter viewer (PDF)
- Bulk selection and operation toolbar
- Communication timeline component
- Analytics dashboards with charts
- Reference request interface

### Calendar Integration
- Integrate with calendar APIs (Google Calendar, Outlook)
- Generate .ics files for calendar invitations
- Handle timezone conversions
- Sync interview updates to calendars

---

*PRD Version: 1.0*
*Last Updated: January 2025*
*Owner: Product Team*
