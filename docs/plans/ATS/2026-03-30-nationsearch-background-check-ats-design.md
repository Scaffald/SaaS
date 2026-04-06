# NationSearch Background Check ATS — PRD & Technical Guidance

## Overview

NationSearch is the sole background check partner on Scaffald. They operate their background screening business through Scaffald — it's both their internal operations tool (managing cases, clients, compliance) and the integration point where Scaffald's recruiters and hiring companies request background checks.

This spec covers the product requirements, user journeys, flow configuration, and 50,000 ft technical guidance. It is intentionally focused on the WHAT and WHY — engineers determine the HOW.

## Goals

1. Give NationSearch a modern, flexible operational platform that replaces manual processes and reduces dependency on Accio's clunky UI
2. Make background checks a seamless part of Scaffald's hiring pipeline — recruiters and companies can trigger a check from within their flow and track status without leaving Scaffald
3. Preserve human judgment and the "human touch" that differentiates NationSearch from Checkr — the system handles busywork, humans handle decisions
4. Build the compliance and audit trail that protects the business legally
5. Enable NationSearch to manage client relationships in the same tool they manage cases

## What This Is NOT

- **Not a marketplace** — NationSearch is the sole background check provider on Scaffald
- **Not a replacement for Accio** — we lean on Accio's API for data sources, regulatory integrations, and report storage. We're a better UI and workflow layer on top.
- **Not an automated decisioning tool** — the system reports what's legally reportable, employers make their own risk decisions

## Users

1. **Jodie (Owner/Operator)** — QA review, rule configuration, client management, compliance oversight
2. **Processors (Melissa, Adam)** — Daily case work, research, phone calls, notes
3. **NationSearch Clients (HR/Admin at companies)** — Order background checks, track status, download reports. These are Scaffald company records with NationSearch-specific relationship data.
4. **Applicants** — Submit their info via secure form, see status of their check. These are Scaffald user records with background-check-specific data layered on.
5. **Scaffald Recruiters/Companies** — Trigger background checks from within their hiring flow, see results

## Data Model Principles

- **Clients = Scaffald company records** with NationSearch-specific data layered on (services enabled, scope policies, Accio config, relationship notes). No separate client database.
- **Applicants = Scaffald user records** with background-check-specific data layered on (the check itself, findings, consents). No separate applicant database.
- **Data enrichment is opt-in.** If a background check collects address history or certification info, the user can choose to add that to their Scaffald profile. We don't silently push data into their profile.
- **Layer on top of existing tables.** Scaffald already has application, job, and company schemas. New ATS features use the flow engine for pipeline tracking. Existing tables stay untouched. Migration can happen later if needed.

---

## User Journeys

### Journey 1: A New Company Wants to Hire NationSearch

A company finds NationSearch through Scaffald (or directly) and wants to start using them for background checks.

1. Company visits NationSearch's page on Scaffald (or a direct URL)
2. Fills out an intake form: company info, where they hire, which services they want (criminal, MVR, employment, education, credit, drug)
3. They see a cost range estimate based on their selections — "Based on your choices, background checks will typically cost $X-$Y per candidate"
4. Submission creates a lead in NationSearch's CRM view and a Scaffald account for the company if they don't have one
5. NationSearch sees the new lead, reviews it, sends a proposal
6. Back and forth until agreement is signed
7. If credit reports were selected: the credit onboarding workflow kicks off (third-party inspection -> TransUnion paperwork -> codes configured in Accio). This is a multi-week sub-flow tracked in the flow engine.
8. NationSearch configures the client's account: scope rules (lookback period, counties, AKA policy), packages, pricing — stored in Scaffald and pushed to Accio via the provider abstraction
9. Client goes active. They can now order background checks.

### Journey 2: A NationSearch Client Orders a Background Check

Two modes — client self-service or NationSearch-driven:

**Self-service (~40% of clients):**
1. Client logs into Scaffald, goes to their NationSearch dashboard
2. Clicks "New Background Check," selects a package
3. Enters candidate's email
4. System sends the candidate a secure link
5. Candidate fills out the intake form (name, DOB, SSN, addresses, DL, AKAs, consents)
6. System auto-constructs the background check order based on client's scope rules + candidate's address history
7. NationSearch processor reviews the order plan, adjusts if needed, submits
8. Order goes to Accio (and other providers as needed)

**NationSearch-driven (~60% of clients):**
1. Client sends info via fax/email/phone
2. Processor creates the case manually in Scaffald
3. Enters applicant info or sends them the secure intake link (QR code option)
4. Same order construction and submission from there

### Journey 3: A Case Moves Through NationSearch's Workflow

The daily operational flow for processors:

1. Processor opens their dashboard — sees a kanban board of all active cases organized by stage
2. Cases in "Pending Results" are waiting on Accio/providers
3. When results come back, case moves to "Review" — processor checks identity matches, flags questionable records, adds notes
4. Some cases need manual steps: "Call Pueblo County clerk to confirm warrant," "Email runner in Contra Costa County." These become tasks attached to the case.
5. Jodie does QA review on completed cases before reports go out
6. Reporting rules are applied: non-reportable items excluded per state/FCRA, caveats flagged
7. Report delivered to client. Case moves to "Complete."
8. If anything was found outside normal scope (e.g., a murder older than 10 years), Jodie handles that through verbal disclosure — logged as a note, not in the report

### Journey 4: A Recruiter on Scaffald Triggers a Background Check

1. Recruiter has an applicant in their hiring flow at the "Background Check" stage
2. They click "Request Background Check" — this fires a Nevar trigger from their flow
3. The action routes the request to NationSearch, creating a case in NationSearch's flow
4. The applicant gets the secure intake link
5. Recruiter sees status updates in their own flow ("BG Check: Pending -> In Review -> Complete")
6. When complete, results summary is visible to the recruiter (what's legally shareable). Full report lives in NationSearch's system.

### Journey 5: NationSearch Manages Client Relationships

1. Jodie opens the CRM view — a NationSearch-scoped view of Scaffald company records with relationship metadata
2. Sees all clients with last contact date, open cases, onboarding status
3. System surfaces "Clients not contacted in 90+ days" and auto-creates follow-up tasks
4. New clients get a check-in task at 30 days post-onboarding
5. Notes on every client interaction are timestamped and searchable
6. At-risk clients (previously churned to Paylocity/Checkr, low volume lately) are flagged

### Journey 6: An Applicant Goes Through a Background Check

1. Applicant receives a secure link (email or QR code)
2. Opens a clean, simple form — explains what's being collected and why, consent language in plain English
3. Fills out: name, AKAs, DOB, SSN, address history, DL, consents
4. Submits. Sees a confirmation with expected timeline.
5. Can check status anytime: "Your background check is in progress" -> "Review" -> "Complete"
6. If there's an adverse finding, FCRA adverse action process is followed (pre-adverse notice -> waiting period -> adverse action notice)

---

## NationSearch Flow Configuration

The flow engine is configured for NationSearch's background check operation. These are the defaults — NationSearch can reconfigure via the flow builder.

### Default Background Check Flow Stages

| Stage | Type | Purpose |
|---|---|---|
| Intake | initial | Applicant info being collected. Waiting on candidate to fill out form. |
| Order Review | active | Processor reviews auto-constructed order plan before submission. |
| Submitted | active | Order sent to Accio/providers. Waiting on results. |
| Partial Results | active | Some components returned, others still pending. |
| Manual Research | active | Requires human action — phone calls, runners, mail. Tasks attached. |
| QA Review | active | Jodie reviews completed results before report generation. |
| Report Ready | active | Report generated, pending delivery to client. |
| Delivered | terminal | Report sent to client. Case closed. |
| Adverse Action | active | Adverse finding — FCRA pre-adverse/adverse process in progress. |
| Disputed | active | Applicant is disputing findings. Investigation in progress. |
| Cancelled | terminal | Case cancelled by client or NationSearch. |
| On Hold | active | Paused — waiting on client input, payment, or other blocker. |

### Expected Transition Paths

Transitions are freeform (any allowed transition can be configured), but these are the common paths:

```
Intake -> Order Review -> Submitted -> Partial Results -> QA Review -> Report Ready -> Delivered
                                      -> Manual Research -> QA Review
                                                         -> Partial Results (data comes back)
                          Submitted -> QA Review (all results back at once)
Report Ready -> Adverse Action -> Delivered
Any active stage -> On Hold -> (return to previous stage)
Any active stage -> Cancelled
Delivered -> Disputed -> QA Review -> Report Ready (re-issue)
```

### Example Nevar Rules

These illustrate how NationSearch would configure automation. They define these rules themselves via the rule builder — no code changes needed.

| Trigger | Rule | Action |
|---|---|---|
| `flow.item.created` | Always | Send applicant the intake link via email/SMS |
| `flow.item.entered_stage` (Submitted) | If client has credit enabled | Create task: "Verify TransUnion codes active" |
| `flow.item.entered_stage` (Manual Research) | If jurisdiction = Wyoming | Create task: "Prepare mail request — WY confidentiality state" |
| `flow.item.entered_stage` (QA Review) | Always | Assign item to Jodie |
| `flow.item.stale` (Intake, > 48hrs) | Always | Send applicant reminder email |
| `flow.item.stale` (Submitted, > 5 days) | Always | Create task: "Follow up with provider on delayed results" |
| `flow.item.entered_stage` (Delivered) | If recruiter originated | Push status update to recruiter's hiring flow |
| `flow.item.entered_stage` (Report Ready) | If adverse findings present | Route to Adverse Action stage instead of Delivered |

### Client Onboarding Flow (Separate Flow Definition)

| Stage | Type |
|---|---|
| New Lead | initial |
| Proposal Sent | active |
| Follow-up | active |
| Agreement Out | active |
| Credit Onboarding | active |
| Configuring Account | active |
| Active | terminal |
| Lost | terminal |

---

## Accio Provider Abstraction

### The Principle

NationSearch has used Accio for years. Accio handles the hard stuff — connections to 50+ state databases, court systems, TransUnion, CBI, BIS, and hundreds of county-level sources. We don't rebuild any of that. We build a better operational layer on top.

### What We Need From Accio

| Capability | What It Does | Why We Need It |
|---|---|---|
| Account Management | Create/configure client accounts from templates, set packages, components, pricing | Client onboarding without logging into Accio's admin UI |
| Order Submission | Submit a background check order with applicant identifiers + selected components | The core handoff — our workflow constructs the order, Accio executes it |
| Status Polling / Webhooks | Know when components complete, partial results available, exceptions found | Drive stage transitions in our flow engine |
| Result Retrieval | Pull back findings — jurisdiction, case numbers, offenses, dispositions, dates | Populate our QA review and report generation |
| Report Generation | Either pull Accio's formatted report or generate our own from raw results | Deliver to clients |

### Provider Abstraction Pattern

```
BackgroundCheckProvider (interface)
  |-- submitOrder(order: OrderRequest): Promise<OrderConfirmation>
  |-- getOrderStatus(orderId: string): Promise<OrderStatus>
  |-- getResults(orderId: string): Promise<CheckResults>
  |-- createClientAccount(config: ClientConfig): Promise<AccountInfo>
  |-- updateClientAccount(accountId: string, patch): Promise<AccountInfo>
  |-- generateReport(orderId: string, rules: ReportingRules): Promise<Report>

AccioProvider implements BackgroundCheckProvider
  |-- (filled in when API docs are available)

MockProvider implements BackgroundCheckProvider
  |-- (for development and testing)
```

### What Lives Where

- **In Accio:** Raw data, provider connections, data source integrations, stored results
- **In Scaffald:** Flow state, transition history, notes, tasks, client configuration/policies, compliance rules, CRM data, audit trail, user-facing UI

### Non-Accio Providers

Some things aren't behind Accio — BIS direct queries, runners, manual county calls. These are modeled as "manual/external providers" that create tasks in the flow rather than API calls. The processor completes the task and enters findings manually. The system treats all providers uniformly from the flow perspective — some just have human steps.

### Engineer Guidance

Design the provider interface first. Build the MockProvider to unblock all UI and workflow development. When Accio API docs arrive, implement AccioProvider against the real API. If Accio's API doesn't match our interface cleanly, the adapter pattern handles the translation.

---

## Compliance & Reporting

### Core Stance

> NationSearch reports what is legally reportable. Grading and risk decisions are the employer's responsibility, not ours.

The system never makes hire/no-hire recommendations. It surfaces findings, flags caveats, and lets the employer decide.

### What the System Needs to Encode

**Federal baseline — FCRA:**
- Default 7-year reporting window for most records
- 10-year window for certain federal screenings and high-security roles
- Adverse action process: pre-adverse notice -> waiting period (typically 5 business days) -> adverse action notice -> copy of report to applicant
- Applicant rights: right to dispute, right to a copy of the report

**State-level overrides (configurable, not hardcoded):**
- The system needs a state rules table that Jodie can maintain
- Examples of what varies by state:
  - California: DOB removed from public terminals, limits on first marijuana offenses
  - Florida: adjudication withheld is reportable but must be flagged with FCRA caveat
  - Wyoming: confidentiality state, mail-only, no runners
  - Georgia: specific offense type restrictions
- New state rules get added regularly — this must be data-driven configuration, not code changes

**Client-level policies:**
- Stored per client: what they care about (theft thresholds, sector-specific concerns like healthcare vs construction)
- System can flag "this finding may be relevant to client's stated policy" as informational
- System never auto-filters findings based on client policy — everything legally reportable gets reported, client decides what matters to them

**Report generation guardrails:**
- Apply state + FCRA rules to exclude non-reportable items
- Flag items with caveats (e.g., "adjudication withheld — see FCRA limitations")
- Include required legal language per regulation
- Jodie reviews every report in QA before delivery — the system supports this, doesn't bypass it

### Audit Trail Requirements

- Every action, note, transition, communication, and decision is logged with who/when/why
- Notes can be typed: client instruction, court clerk info, applicant dispute, QA decision, verbal disclosure, scope exception
- Searchable by client, applicant, case, jurisdiction
- This is the litigation defense layer — if a client misuses information or an applicant disputes, NationSearch can show exactly what they reported and why

### Engineer Guidance

The compliance rules are configuration, not code. Build a rules table with state, rule type, effective date, and rule content. Jodie maintains it through an admin UI. Reports are generated by applying the active rules at generation time. When states change their laws, Jodie updates the table — no deployment needed.

---

## Client Relationship Management

NationSearch needs to manage client relationships in the same place they manage cases. Not a full CRM — a focused, background-check-specific relationship layer on top of Scaffald's existing company records.

### What a Client Record Includes (Layered on Scaffald Company Record)

- NationSearch-specific relationship metadata:
  - Services enabled (criminal, MVR, employment, education, credit, drug, civil)
  - Scope/policy settings (lookback period, county depth, AKA policy, state-specific preferences)
  - Integration status (Accio account configured, credit onboarding complete, etc.)
  - Where they hire (drives which state rules apply)
  - Billing: which package, pricing tier, any custom pricing
  - Risk profile: their stated policies on what they care about
  - Whether they self-serve or rely on NationSearch to order for them
- Contacts: HR, legal, billing — each with role, phone, email, preferred contact method
- Relationship tracking:
  - Every interaction logged: calls, emails, meetings — timestamped with who and what
  - Proposal history: what was offered, pricing, whether they converted
  - Volume tracking: checks per month, trending up or down

### Automated Relationship Management

- Follow-up tasks auto-generated:
  - New clients: 30-day check-in post-onboarding
  - Active clients: configurable cadence (e.g., every 90 days)
  - No contact for 120+ days: auto-surfaces as "at risk"
- Nevar rules power the automation (e.g., "no order placed in 60 days" -> create check-in task)

### Views

- **Client list** — sortable by last contact, volume, status, onboarding stage
- **"Needs attention" view** — clients not contacted recently, open onboarding steps, declining volume
- **Client detail** — Scaffald company record with NationSearch relationship tab (services, policies, notes, cases, tasks)
- **Task inbox** — all follow-up tasks across clients, sorted by due date

### Engineer Guidance

This is a NationSearch-scoped view of Scaffald company records with relationship metadata, notes, and tasks attached. Extend the existing company model — do not create a parallel client database. The flow engine handles onboarding pipeline tracking. Nevar handles automated task creation. The CRM layer is the UI that ties it together.

---

## Technical Guidance (50,000 ft)

### Primitives Available

| Primitive | What It Does | Package |
|---|---|---|
| Flow Engine | Items + stages + freeform transitions + audit trail | `@bernierllc/flow-engine` + `flow-engine-ui` |
| Nevar Rules Engine | Triggers + conditions + actions. Users configure business logic without code. | `@bernierllc/nevar-*` suite |
| Nevar Rule Builder UI | Visual rule configuration for end users | `@bernierllc/nevar-rule-builder-ui` |

### Integration Pattern

1. **At boot:** Register flow trigger definitions (`flow.item.created`, `flow.item.transitioned`, etc.) with Nevar's trigger registry
2. **Flow engine emits triggers** on every state change, assignment, staleness event
3. **Nevar evaluates rules** that NationSearch has configured via the rule builder UI
4. **Actions execute:** send email, create task, assign item, transition to another stage, push status to a recruiter's flow, call an external API
5. **Everything is logged:** flow transitions in the flow engine, rule evaluations in Nevar's audit log, notes and tasks in the application layer

### What Engineers Need to Build (Scaffald-Side)

- NationSearch onboarding pages and intake forms (Scaffald UI)
- Case management views using flow-engine-ui components with domain-specific slots (applicant info, findings, notes)
- Accio provider adapter (MockProvider first, real implementation when docs arrive)
- Compliance rules admin UI and report generation
- CRM views layered on Scaffald company records
- Applicant intake form and status view
- Integration point: recruiter/company flow -> NationSearch flow (Nevar action that creates a case)

### What's Already Built

- Scaffald company and user records
- Application workflow with screening, scoring, attachments
- Background check schema (migrations 032-036)
- tRPC + REST API layer
- SDK for third-party integration

---

## Interactive Prototype

An interactive clickable prototype accompanies this PRD. It covers:

1. NationSearch's page on Scaffald (prospective client view)
2. Client onboarding intake form
3. NationSearch dashboard (case kanban + client summary)
4. Case detail view (results, notes, tasks, timeline)
5. Flow builder (stage and rule configuration)
6. Client view (Scaffald company record + NationSearch relationship tab)
7. Applicant intake form
8. Applicant status view

See the prototype files in `.superpowers/brainstorm/` for the clickable screens.
