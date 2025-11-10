# PRD: Job & Inquiry Management Extensions

**Status:** Medium Priority
**Effort Estimate:** 2-3 weeks
**Dependencies:** Job Management (basic), ATS
**Related Features:** Applications, Worker Profiles, Notifications

---

## 1. Overview

Job & Inquiry Management Extensions add advanced job features (templates, bulk posting, scheduling, archiving) and a structured inquiry system for direct candidate evaluation. These features support high-volume hiring and enable organizations to assess candidates systematically before formal applications.

**Ecosystem Context:** Large contractors post dozens of similar jobs and need templating and bulk operations. The inquiry system allows organizations to evaluate workers' fit before inviting formal applications, saving time for both parties.

---

## 2. Goals & Objectives

### Primary Goal
Enable efficient high-volume job posting and provide structured candidate inquiry workflows for better hiring decisions.

### Secondary Goals
1. **Job Efficiency** - Reduce time to post similar jobs via templates
2. **Inquiry System** - Evaluate candidate fit before formal application process
3. **Job Lifecycle** - Manage jobs from scheduling to archiving
4. **Bulk Operations** - Post and manage multiple jobs efficiently
5. **Hiring Requests** - Direct outreach to qualified workers

### Success Criteria
- Organizations using templates save 60% time on job posting
- Inquiry system reduces unqualified applications by 40%
- Bulk operations handle 20+ jobs efficiently
- Direct hiring requests have 2x response rate vs. regular posts

---

## 3. User Stories

### Employer/Organization
- **As an employer**, I want to create job templates so that I can quickly post similar positions
- **As an employer**, I want to send inquiries to workers so that I can assess fit before formal applications
- **As an employer**, I want to bulk post jobs so that I can hire for multiple projects efficiently
- **As an employer**, I want to schedule future job posts so that timing aligns with project starts

### Worker
- **As a worker**, I want to receive hiring inquiries so that I can explore opportunities without formal application
- **As a worker**, I want to respond to inquiries efficiently so that I can express interest quickly

---

## 4. Functional Requirements

### 4.1 Job Templates

**Template Creation**
- Create from existing job
- Save new job as template
- Template name and description
- Template categories (by trade, role, location)

**Template Content**
- Job title pattern
- Description template with variables
- Required skills
- Default compensation range
- Standard requirements

**Template Usage**
- Browse template library
- Apply template to new job
- Customize after applying
- Update template from successful jobs

### 4.2 Inquiry System

**Create Inquiries**
- Send inquiry to specific worker
- Include job details
- Ask specific questions
- Request employment details
- Set response deadline

**Inquiry Questions**
- Availability for project
- Wage expectations
- Experience with specific tasks
- Certifications confirmation
- References availability

**Worker Response**
- Accept/decline inquiry
- Answer questions
- Provide additional details
- Counter-offer terms

**Inquiry Management**
- Track inquiry status
- View responses
- Convert inquiry to formal application
- Bulk inquiries to multiple workers

### 4.3 Direct Hiring Requests

**Create Hiring Requests**
- Select worker from search/profiles
- Specify job opportunity
- Include compensation offer
- Set project details and timeline
- Request immediate response

**Worker Response**
- Accept, decline, or negotiate
- Request more information
- Schedule discussion call
- Provide availability

**Request Templates**
- Save request templates
- Personalize per worker
- Track request success rates

### 4.4 Bulk Job Operations

**Bulk Job Posting**
- Upload multiple jobs via CSV
- Job posting wizard for similar roles
- Duplicate and modify jobs
- Post to multiple locations

**Bulk Job Management**
- Edit multiple jobs at once
- Close multiple jobs
- Extend multiple job deadlines
- Archive completed projects

### 4.5 Job Scheduling

**Schedule Future Posts**
- Set publish date/time
- Auto-publish on schedule
- Edit scheduled jobs before publishing
- Cancel scheduled posts

**Auto-Close Jobs**
- Set job expiration date
- Auto-close after hire
- Auto-close after deadline
- Extend deadlines

### 4.6 Job Archiving & History

**Archive Jobs**
- Archive filled positions
- Archive expired posts
- Archive canceled projects
- Maintain archive for reporting

**Job History**
- View historical job posts
- Analyze successful jobs
- Clone previous jobs
- Track job performance over time

### 4.7 Advanced Job Details

**Detailed Job Information**
- Shift and schedule specifics
- Benefits package details
- Overtime policies and rates
- Travel compensation
- Physical requirements
- Equipment provided vs. required
- Safety requirements
- Weather considerations

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Job template application < 2 seconds
- Bulk job post (20 jobs) < 30 seconds
- Inquiry creation < 3 seconds

### 5.2 Scalability
- Support 1000+ job templates per organization
- Handle 100+ simultaneous inquiries
- Process 50+ jobs in bulk operations

---

## 6. Success Metrics

- Template usage saves 60% posting time
- Inquiry response rate > 70%
- Bulk operations adoption by high-volume hirers: 80%
- Direct requests get 2x response rate

---

## 7. Related Features

- **Job Management:** Core job posting
- **ATS:** Inquiry conversion to applications
- **Notifications:** Inquiry and request notifications

---

## 8. Implementation Notes

### API Endpoints
- `job.createTemplate`, `job.bulkPost`, `job.schedulePost`
- `inquiry.create`, `inquiry.respond`, `inquiry.convertToApplication`
- `hiring.sendRequest`, `hiring.respondToRequest`

### Database Tables
- `job_templates`, `job_schedule`
- `inquiries`, `inquiry_responses`
- `hiring_requests`, `hiring_request_responses`

---

*PRD Version: 1.0*
*Last Updated: January 2025*
