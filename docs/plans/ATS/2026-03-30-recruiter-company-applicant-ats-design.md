# Spec 3: Recruiter ATS, Hiring Company ATS & Applicant Transparency View

## Overview

Scaffald's jobs board is a marketplace where recruiters, hiring companies, and applicants interact. All three use the same primitives — Flow Engine for pipeline management, Nevar for automation rules — configured differently for each role.

NationSearch is the sole background check provider and integrates seamlessly into both recruiter and company flows.

This spec covers the WHAT and WHY. Engineers determine the HOW.

---

## How the Three Flows Relate

| User | What They Do | Their Flow |
|---|---|---|
| **Recruiting Company** | Posts jobs on behalf of client companies. Sources, screens, and routes candidates. Same job may route to multiple companies. | Recruiter ATS |
| **Hiring Company** | Posts their own jobs, manages their own candidates. May hire a recruiter. May use NationSearch. | Company ATS |
| **Applicant** | Applies for jobs, works with recruiters, goes through hiring flows and possibly background checks. Wants transparency. | Applicant View |

### What's Shared Across All Flows

- The flow engine, kanban, and rule builder UI are identical
- NationSearch integration works the same way (trigger from any flow)
- Applicant-facing experience is consistent regardless of who manages the flow
- Tracking, audit, and transparency data feeds the same stats system
- All users and companies are Scaffald records — no parallel databases

### Key Differences

| Aspect | Recruiter | Hiring Company |
|---|---|---|
| Jobs | Posts on behalf of clients. Same job may route to multiple companies. | Posts their own jobs only. |
| Candidates | Manages across multiple client companies. | Manages for their own positions only. |
| Background checks | Can trigger via NationSearch on behalf of a client. | Can trigger via NationSearch directly. |
| Flow customization | Configures stages and rules per client or globally. | Configures stages and rules for their pipeline. |
| Client visibility | Client companies see candidates presented to them only. | N/A — they are the client. |

---

## Part 1: Recruiter ATS

### Goals

1. Let recruiting companies manage candidates across multiple client companies from one dashboard
2. Post jobs on Scaffald's jobs board — the same job posting can route candidates to multiple client companies
3. Provide the same flow engine + Nevar flexibility — recruiters define their own stages, rules, and automations
4. Enable seamless handoff to NationSearch when a client requires a background check
5. Track everything for transparency stats — time to hire, response rates, candidate experience

### Users

1. **Recruiter (staff)** — Sources candidates, manages pipelines, communicates with clients and applicants
2. **Recruiter Admin** — Configures flows, rules, client relationships, billing
3. **Client Company (HR contact)** — Views candidates being presented, provides feedback, makes hire/no-hire decisions
4. **Applicant** — Applies through Scaffald, sees status, interacts with recruiter

### User Journeys

#### Journey 1: Recruiter Posts a Job

1. Recruiter creates a job posting on Scaffald — title, description, requirements, location, compensation range
2. Associates the job with one or more client companies ("This role is for Acme Construction and also for Summit Engineering — both need senior project managers")
3. Job goes live on Scaffald's jobs board
4. Applicants see one posting but the recruiter can route them to different client companies based on fit

#### Journey 2: Applicant Applies

1. Applicant finds the job on Scaffald, clicks Apply
2. Goes through the application flow (screening questions, resume, etc.)
3. Application lands in the recruiter's flow at the initial stage
4. Recruiter sees the new applicant in their kanban board

#### Journey 3: Recruiter Works Their Pipeline

1. Recruiter opens their dashboard — kanban board of all active candidates across all jobs and client companies
2. Can filter by: job, client company, stage, date range
3. Moves candidates through stages: Screening → Phone Interview → Client Presentation → Client Interview → Offer → Hired
4. At "Client Presentation" stage, the client company's HR contact gets notified and can view the candidate profile + recruiter's notes
5. Client provides feedback directly in Scaffald ("Yes, schedule interview" / "Pass" / "Need more info")
6. Recruiter tracks all communication and decisions

#### Journey 4: Background Check Triggered

1. Candidate reaches a stage where background check is required (configured via Nevar rule)
2. System creates a case in NationSearch's flow automatically
3. Recruiter sees status in their own pipeline ("BG Check: In Progress → Complete")
4. Results summary flows back when done

#### Journey 5: Client Company Views Their Candidates

1. Client company logs into Scaffald, sees a "Recruiting" tab showing candidates being presented by their recruiter
2. Can view candidate profiles, leave feedback, approve/reject
3. Cannot see candidates being presented to other companies through the same job posting
4. Sees aggregate stats: how many candidates screened, how many presented, time from posting to presentation

### Multi-Company Job Routing

This is the unique recruiter capability:
- Each candidate gets a **separate flow item per client company** they're routed to
- The recruiter decides which client(s) to present each candidate to
- A candidate can be in "Client Interview" at Company A and "Client Presentation" at Company B simultaneously
- Each client company only sees their own candidates — never another company's pipeline
- The recruiter sees everything across all companies in one unified view

### Default Recruiter Flow Stages

| Stage | Type | Purpose |
|---|---|---|
| New Application | initial | Candidate just applied |
| Screening | active | Recruiter reviewing resume, qualifications |
| Phone Screen | active | Initial phone/video call |
| Client Presentation | active | Candidate packaged and presented to client company |
| Client Review | active | Waiting on client feedback |
| Client Interview | active | Client is interviewing the candidate |
| Background Check | active | NationSearch check in progress |
| Offer | active | Offer extended |
| Hired | terminal | Candidate accepted and placed |
| Rejected | terminal | Not moving forward |
| Withdrawn | terminal | Candidate withdrew |

### Example Nevar Rules

| Trigger | Rule | Action |
|---|---|---|
| `flow.item.created` | Always | Send confirmation email to applicant |
| `flow.item.entered_stage` (Client Presentation) | Always | Notify client HR contact with candidate summary |
| `flow.item.entered_stage` (Background Check) | If client has NationSearch | Create NationSearch case automatically |
| `flow.item.stale` (Client Review, > 3 days) | Always | Send reminder to client contact |
| `flow.item.stale` (Screening, > 48h) | Always | Create task: "Review new application" |
| `flow.item.entered_stage` (Hired) | Always | Update job stats, notify applicant, log placement |
| `flow.item.entered_stage` (Rejected) | Always | Send respectful rejection email to applicant |

---

## Part 2: Hiring Company ATS

### Goals

1. Let companies manage their own hiring pipeline directly — no recruiter middleman needed
2. Post jobs on Scaffald's jobs board and manage applicants through a configurable flow
3. Optionally hire a recruiter through Scaffald — recruiter's candidates merge into the company's pipeline
4. Optionally use NationSearch for background checks — triggered from the flow
5. Simple enough for a 5-person company's office manager, powerful enough for a 500-person HR team

### Users

1. **Hiring Manager** — Posts jobs, reviews candidates, makes decisions
2. **HR Admin** — Configures flows, manages settings, runs reports
3. **Team Member** — Views candidates for their team's roles, leaves feedback (e.g., after interview)
4. **Applicant** — Applies, sees status, communicates

### How It Differs From Recruiter ATS

The hiring company flow is simpler:
- One company, their own jobs, their own candidates
- No multi-company routing
- No client presentation layer
- But they might *receive* candidates from a recruiter — those appear in their pipeline the same as direct applicants, tagged with source

### User Journeys

#### Journey 1: Company Posts a Job

1. Company creates a job posting — title, description, requirements, location, compensation
2. Chooses visibility: Scaffald jobs board only, or also distribute externally (future feature)
3. Job goes live. Applicants on Scaffald can find and apply.

#### Journey 2: Company Receives Applications

1. Applicant applies through Scaffald
2. Application appears in the company's hiring flow at the initial stage
3. If the company has hired a recruiter through Scaffald, recruiter-sourced candidates also appear — tagged "via [Recruiter Name]"
4. Hiring manager sees all candidates in one kanban, regardless of source

#### Journey 3: Company Works Their Pipeline

1. Hiring manager opens dashboard — kanban board of candidates per job
2. Reviews applications, moves candidates through stages
3. At "Interview" stage, can assign team members as interviewers — they get notified and can leave structured feedback ("Strong hire" / "Hire" / "No hire" + notes)
4. Interview feedback is visible to the hiring manager, not the applicant
5. At decision stage, hiring manager makes offer or rejects

#### Journey 4: Company Hires a Recruiter Through Scaffald

1. Company browses recruiters on Scaffald (recruiter directory)
2. Engages a recruiter for a specific role or ongoing
3. Recruiter gets access to post jobs on behalf of this company and present candidates
4. Presented candidates appear in the company's pipeline with the recruiter as source
5. Company can see recruiter transparency stats before engaging

#### Journey 5: Background Check Triggered

1. Candidate reaches BG Check stage, Nevar rule fires, NationSearch case created
2. Company sees status in their pipeline
3. Results summary visible when complete

### Default Hiring Company Flow Stages

| Stage | Type | Purpose |
|---|---|---|
| Applied | initial | New application received |
| Screening | active | HR reviewing qualifications |
| Phone Screen | active | Initial phone/video call |
| Interview | active | On-site or video interview with team |
| Background Check | active | NationSearch check (if configured) |
| Offer | active | Offer extended, waiting on response |
| Hired | terminal | Accepted and onboarding |
| Rejected | terminal | Not moving forward |
| Withdrawn | terminal | Candidate withdrew |

### Example Nevar Rules

| Trigger | Rule | Action |
|---|---|---|
| `flow.item.created` | Always | Send confirmation email to applicant |
| `flow.item.entered_stage` (Interview) | If interviewers assigned | Send calendar invite with candidate summary |
| `flow.item.entered_stage` (Background Check) | If NationSearch enabled | Create NationSearch case |
| `flow.item.stale` (Screening, > 72h) | Always | Remind hiring manager: "X applications need review" |
| `flow.item.entered_stage` (Offer) | Always | Notify HR admin for offer letter preparation |
| `flow.item.entered_stage` (Rejected) | Always | Send rejection email (configurable template and delay) |
| `flow.item.entered_stage` (Hired) | Always | Trigger onboarding checklist, update job posting |

---

## Part 3: Applicant View & Transparency

### Goals

1. Give applicants clear, honest visibility into where they stand — across all applications, recruiters, and background checks
2. Surface transparency stats that hold recruiters, companies, and NationSearch accountable
3. Make Scaffald the platform where applicants *want* to apply because they know they'll be treated fairly
4. Collect the data that powers these stats from day one, even if not all stats are surfaced immediately

### What the Applicant Sees

**My Applications Dashboard** — a single view of everything:
- All active applications (direct to companies and through recruiters)
- Current status of each in applicant-friendly language
- Background check status (if applicable)
- Historical applications with outcomes
- Their Scaffald profile (skills, certifications, work history — enriched over time)

### Status Translation

Applicants don't see internal stages. They see honest but non-internal labels:

| Internal Stage | Applicant Sees |
|---|---|
| Applied / Screening | Application received |
| Phone Screen | In review |
| Client Presentation (recruiter) | Being considered |
| Interview / Client Interview | Interview stage |
| Background Check | Background check in progress |
| Offer | Offer extended |
| Hired | Congratulations! |
| Rejected | Not selected |
| Withdrawn | Withdrawn |

Applicants get *honest* status but not *internal* detail. "Being considered" is true — the recruiter is presenting them. They don't need to know which company or competitive details.

### Transparency Stats

Three categories, all derived from flow engine data:

#### Recruiter Stats (visible to applicants and companies before engaging)

- Average time from application to first contact
- % of applicants who received a response (vs ghosted)
- Average time from screening to placement
- Number of successful placements (last 12 months)
- Applicant satisfaction rating (post-process survey)
- % of candidates who would work with this recruiter again
- Specialization areas and industries

#### Company Stats (visible to applicants before applying)

- Average time to hire (from posting to offer)
- % of applicants who received a response
- Average time to first response
- Number of open positions vs hires made
- Interview-to-offer ratio
- Applicant satisfaction rating
- Whether they use background checks (and through whom)

#### NationSearch Stats (visible to companies before engaging)

- Average turnaround time
- Accuracy rate
- Dispute rate and resolution time
- Client satisfaction rating
- FCRA compliance record
- Years in business, states covered

### How Stats Are Computed

All stats derive from flow engine transition data:
- **Time metrics** — computed from transition records (time between stages)
- **Response rates** — items that moved past initial stage vs items that went directly to Rejected or went stale
- **Satisfaction ratings** — post-completion surveys triggered by Nevar rules
- **Placement/hire counts** — items that reached terminal "Hired" stage

**Data integrity rules:**
- Stats require minimum sample size before display (e.g., 10+ completed flows)
- Rolling window (last 12 months) keeps stats current
- Companies and recruiters can see their own stats before they're public — opportunity to improve
- No gaming: stats computed from flow data, not self-reported

### Post-Process Surveys

Triggered by Nevar rules when a flow item reaches a terminal stage:

**For applicants (after Hired or Rejected):**
- "How was your experience with [Recruiter/Company]?" (1-5 stars)
- "Were you kept informed about your application status?" (Yes/No)
- "How long did the process take compared to expectation?" (Faster/As expected/Slower)
- "Would you apply through [Recruiter/Company] again?" (Yes/No)
- Optional free text feedback

**For companies (after a NationSearch engagement):**
- "How was the turnaround time?" (1-5)
- "Were results accurate and complete?" (Yes/No)
- "Would you recommend NationSearch?" (Yes/No)

### Background Check Handoff (Applicant Perspective)

When an applicant's hiring flow triggers a background check:
1. Notified: "As part of your application, [Company] has requested a background check through NationSearch"
2. They see NationSearch's transparency stats (turnaround, accuracy, dispute rate)
3. They receive the secure intake link (same form from NationSearch spec)
4. Their hiring flow status updates to reflect BG check progress
5. When complete, result visible in applicant dashboard with FCRA rights

---

## Technical Guidance (50,000 ft)

### Primitives Available

| Primitive | What It Does | Package |
|---|---|---|
| Flow Engine | Items + stages + freeform transitions + audit trail | `@bernierllc/flow-engine` + `flow-engine-ui` |
| Nevar Rules Engine | Triggers + conditions + actions. Users configure business logic without code. | `@bernierllc/nevar-*` suite |
| Nevar Rule Builder UI | Visual rule configuration for end users | `@bernierllc/nevar-rule-builder-ui` |

### What Engineers Need to Build (Scaffald-Side)

**Recruiter ATS:**
- Multi-company job posting (one job → multiple client companies)
- Per-client flow item routing (separate pipeline per company per candidate)
- Client company view (see only their candidates, leave feedback)
- Recruiter dashboard with cross-company filtering
- Client engagement flow (company hires recruiter through Scaffald)

**Hiring Company ATS:**
- Job posting and application management
- Team member interview assignment and structured feedback
- Recruiter-sourced candidate tagging and attribution
- Recruiter directory browsing with transparency stats

**Applicant View:**
- My Applications dashboard aggregating across all flow types
- Status translation layer (internal stages → applicant-friendly labels, configurable per flow)
- Transparency stats pages for recruiters, companies, and NationSearch
- Post-process survey system (triggered by Nevar, stored as structured data)
- Background check status integration within hiring flow view

**Shared Infrastructure:**
- Stats computation engine (materialized views or scheduled jobs over flow transition data)
- Survey system (Nevar-triggered, structured responses, minimum sample thresholds)
- Source attribution tracking (direct apply vs recruiter referral vs external)
- Applicant-friendly status mapping configuration per flow definition

### What Already Exists in Scaffald

- Job posting, applications, screening, scoring, attachments
- Company and user records
- Background check schema (migrations 032-036)
- tRPC + REST API layer
- SDK for third-party integration
- Application workflow with custom steps

### Data Model Considerations

- **Track everything from day one** — even if transparency stats aren't surfaced in MVP, the transition records and survey responses need to be captured so stats are meaningful when they go live
- **Source attribution on every flow item** — direct apply, recruiter referral, external source. This feeds transparency stats and billing/referral tracking.
- **Multi-flow visibility for applicants** — an applicant may have items in a recruiter flow, a company flow, and a NationSearch flow simultaneously. The applicant dashboard must aggregate across all.
- **Privacy boundaries** — client companies never see other companies' candidates in a multi-company job. Applicants never see internal feedback or competitive info. Recruiters see everything across their clients.

---

## Interactive Prototypes

Prototypes for the recruiter dashboard, hiring company dashboard, and applicant view will be added as separate clickable HTML files, following the same format as the NationSearch prototype.
