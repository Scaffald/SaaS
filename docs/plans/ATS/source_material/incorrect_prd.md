## Product Requirements – NationSearch ATS & Background Platform

### 1\. Goals & Scope

**Goal:** 
Create baseline functionality that will be the foundation for other features:
    1. Triggered actions (see ~/.claude/plans/robust-sparking-dove.md)
    2. A configurable flow manager that allows for the use of triggered actions

Initial Features these will be used for: 
    1. Bundling 1,2,3 into a background check flow as a background check company
    2. Bundling 1,2,3 into a recruiting flow for hiring new employees as a recruiter and has jobs posted on scaffald and elsewhere
    3. Bundling 1,2,3 into a recruiting flow for hiring new employees as a company who has jobs posted on scaffald or elsewhere, and/or who has hired a background check company through scaffald , and/or who has hired a recruiter through scaffald

#### Background check flow: 
Build a flexible ATS that can do background-check-screening operations platform that leans on Accio's API as much as possible for Rules, regulations, integrations to data sources, applicant check data being stored in Accio, and everything that Accio does well that is available on Accio's APIs. We are a pretty layer on top that provide's a world class, flexible user experience, that no other ATS can provide because we can move faster and be more flexible and nimble by default than any other company has ever moved because we have the power of AI development at our finger tips: 

-   manage background checks across multiple clients
-   Minimizes manual busywork while preserving human review and judgment, the human touch is paramount
-   Doubles as a lightweight CRM for clients and a workflow tool for cases
-   Enables the background check company to have human touch points with their clients
-   Users of hte system can define your stages, triggers, and actions in their workflow and adjust at will
-   There needs to be an ability to choose what checks you want to do and see the range of costs per background check

#### Recruiter flow:
- ability to post jobs on scaffald and hire, manage hiring across multiple client companies
- The same job post may route candidates to multiple client companies
- same flexibility in the workflows as the background checks flows
- users on scaffald apply and show up in the flow
- You define your stages, triggers, and actions
- If the recruiter needs to ask for a background check and has a background check company retained, they can make a trigger/rule to pass an applicant to their background check company within scaffald

#### Hiring company flow
- same as a recruiter flow, except that you only manage your jobs and candidates

#### Regular users
- You can see your status through any hiring flow or background check flow

#### Other info
- Common functionality
    - Clients can signup for services through a public URL they can access while logged into Scaffald or not, but when they sign up for services they create a Scaffald account.

- You can see statistics about recruiting companies - time to hire, jobs available 
    - [Note to agent: let's try to come up with other statistics that applicants would want to know about the recruiters before they work with them]
    - [Note to agent: let's try to come up with other statistics that companies would want to know about the recruiting company before they hire them]
- You can see statistics about the job posting itself 
    - if the job is being routed to mulitple client companies
    - the number of people who have applied for their jobs, how many people were a match for the job and were in the area, statistics about people who are available in the area and known to scaffald for that job, [Note to agent: let's try to come up with other statistics that applicants would wnat to know about the jobs before they work with them]
- Companies can see statistics about the background check companies - [Note to agent: let's try to come up with other statistics that companies would wnat to know about the background check companies before they work with them]





------  NOTE TO AGENT -- We will use the info above and you interviewing me, to update and build out the document below. The rest of the document is likley not correct. I have made some update to remove things that do not belong. What is above has not been fully integrated yet. As we go through the items below and the other notes in the ./plans/ats/ directory we may find things that adjust what's above or below this line, that is expected. -----







**Scope (MVP):**

-   Client onboarding & configuration
-   Applicant intake & background-order orchestration
-   Rules engine for search scope & reporting
-   Provider abstraction layer (Accio-first)
-   Notes, auditing, and basic CRM (contacts, tasks, last touch)
-   Email/SMS communication templates

---

### 2\. Personas

1.  **Jodie / Owner-Operator**
    -   Needs: clear control of rules, visibility, QA, documentation for liability.
2.  **Processor / Researcher (e.g., Melissa, Adam)**
    -   Needs: guided workflows, case queues, easy notes, clear what to do next.
3.  **Client Admin / HR**
    -   Needs: simple ordering, status tracking, reports; sometimes self-service.
4.  **Applicant**
    -   Needs: easy, secure form to submit data, understand consents, minimal friction.
5. 


---

### 3\. High-Level Architecture

-   **Web app (Scaffold-style)**
    -   UI for Jodie & team, client admins, limited applicant view.
-   **Rules engine**
    -   Encodes FCRA, state rules, client policies, and operational preferences.
-   **Provider abstraction layer**
    -   Normalized interface to:
        -   Accio (primary)
        -   BIS, CBI
        -   TransUnion
        -   Runners / county portals
-   **Workflow engine**
    -   Orchestrates long-running steps (e.g., waiting on runners, county clerks, on-site inspections).
-   **Storage**
    -   Client configs, rules, notes, tasks, communication logs, minimal PII (processor, not custodian, where possible).

---

### 4\. Client Onboarding & Configuration

#### 4.1 Lead & Proposal Management

**Requirements**

-   Public intake form (or internal “new lead” form) capturing:
    -   Company info, contact person
    -   Where they’re based; where they hire
    -   Which services they want:
        -   Criminal (county/statewide/federal)
        -   Multijurisdictional database search
        -   MVR
        -   Employment verification
        -   Education verification
        -   Civil searches
        -   Credit reports
        -   Drug testing
-   Internal record with stages:
    -   `New → Proposal Sent → Follow-up → Agreement Out → Active / Lost`
-   Store proposal details per lead:
    -   Packages offered
    -   Component pricing, markups
    -   Scope options discussed (e.g., 5-year lookback, 2 counties)
-   Tasking:
    -   Auto-create follow-up tasks:
        -   After proposal sent
        -   If no response after N days

#### 4.2 Agreement & Credit Configuration

**Requirements**

-   Ability to generate agreements based on selected services:
    -   Core services agreement
    -   -   Optional credit addendum when credit is selected
-   Track for each client:
    -   Whether credit is allowed
    -   Whether the credit addendum is signed
    -   Whether third-party onsite inspection is:
        -   Pending
        -   Completed
-   Workflow for credit onboarding:
    -   When `credit = requested` & agreements signed:
        -   Create task: send to third-party inspector
        -   Track inspection status (5–10 days)
        -   When inspection complete: workflow step to send paperwork to TransUnion
        -   Store TransUnion codes and map them to Accio configuration

#### 4.3 Account & Package Setup (Accio Integration)

**Requirements**

-   From the ATS, trigger creation/config of the client in Accio via API:
    -   Clone from a reference “pricebook” template
    -   Modify:
        -   Packages (e.g., Basic, Standard, Executive)
        -   Included components (criminal, MVR, employment, education, civil, database)
        -   Add-to-Crim rules:
            -   X counties
            -   Y years of address history
            -   Rules for statewide vs county
        -   AKA (alias) search policy:
            -   On/off
            -   Max number of names
-   Persist in our system:
    -   The client’s scope/policy settings as structured data:
        -   Lookback rules
        -   States/countries where they hire
        -   Address-history rules
        -   AKA policy
        -   Special jurisdiction rules (e.g., must call clerk in X county; use runner Y in CA)

---

### 5\. Rules & Compliance Engine

#### 5.1 Legal & Jurisdiction Rules

**Requirements**

-   Encode baseline rules for:
    -   FCRA (7-year default reporting)
    -   Federal expectations (10-year for certain screenings)
-   State-level overrides, including:
    -   **California**
        -   DOB removed from public criminal terminals
        -   Limitations on reporting first marijuana offenses
    -   **Florida**
        -   Adjudication withheld can be reported, but:
            -   Must be flagged as such
            -   System warns:

Do not use as sole basis for adverse action under FCRA

-   **Wyoming**
    -   Confidentiality state; no runners; must mail or follow defined manual process
-   **Georgia**
    -   Track which offense types or timeframes cannot be reported (configurable table)
-   Ability to add/modify state rules over time:
    -   Admin UI for Jodie to maintain a rules library.

#### 5.2 Client-Specific Policies

**Requirements**

-   For each client, store policy preferences, such as:
    -   Theft thresholds (e.g., “theft over $50k”)
    -   Whether they care about:
        -   Certain civil infractions
        -   Older serious offenses (e.g., >10 years, like murder/sex offenses)
    -   Sector-specific constraints:
        -   Healthcare / vulnerable populations vs construction vs tech
-   System behavior:
    -   **Reporting**: You still report what is *legally reportable*.
    -   **Grading**: System explicitly does *not* make hire/no-hire decisions.
    -   UI can highlight:

This offense may violate client policy

(informational flag)

-   Always preserve NationSearch’s stance:

What we can legally report, we will report. Grading/decisions are the employer’s.

#### 5.3 Natural-Language Rule Builder (Phase 2+)

**Requirements (later phase)**

-   Admin can describe rules in plain English:
    -   Example:

For CA candidates, look back 7 years for county criminal; for federal roles, also run 10-year federal.

-   AI proposes structured rule configuration:
    -   Admin approves/edits before activation.

---

### 6\. Applicant Intake & Background Order Workflow

#### 6.1 Applicant Intake

**Requirements**

-   Support two intake modes:
    1.  **Client-driven order**
        -   Client logs in, selects package, enters candidate’s email.
        -   System sends invite; candidate fills out detailed form.
    2.  **NationSearch-driven order**
        -   Staff creates case; sends QR code/link or logs applicant info from fax/phone.
-   Applicant form:
    -   Full name, middle name
    -   All known AKAs (previous married names, name changes)
    -   DOB
    -   SSN (with clear explanation: identifier, not magic)
    -   Address history (for configured period)
    -   DL number & issuing state
    -   Consents:
        -   FCRA consent
        -   State-specific disclosures
        -   Credit consent if applicable
-   Security:
    -   HTTPS, expiring links, minimal data retention where possible.

#### 6.2 Background Order Construction

**Requirements**

-   After intake + client policy lookup:
    -   System computes an “order plan”:
        -   Which jurisdictions (counties/states/federal) to search
        -   Which data sources/providers to use (Accio, BIS, runners, CBI, etc.)
        -   Multijurisdictional database inclusion/exclusion rules, with required confirmatory searches
-   Preview & override:
    -   Internal staff can review/adjust the computed plan before submitting.
-   Submission:
    -   Push order to Accio via API:
        -   Package + components
        -   Applicants’ identifiers
    -   For providers not behind Accio:
        -   Trigger separate calls (BIS, CBI, etc.) via our provider layer.

#### 6.3 Manual & Runner Steps

**Requirements**

-   For jurisdictions requiring manual work:
    -   Auto-create tasks such as:

Call Pueblo County clerk with DOB and name to confirm case number

Email runner in Contra Costa County with applicant details

    - “Prepare and mail WY court request”
    

-   Integrations:
    -   Store contact info / access method per jurisdiction:
        -   API
        -   Email
        -   Portal
        -   Phone
        -   Mail
-   Workflow characteristics:
    -   Tasks can be “waiting on external” and resume flow when data is entered.

---

### 7\. Provider Abstraction Layer

**Requirements**

-   Define normalized operations like:
    -   `runCriminalSearch(jurisdiction, identifiers, scopeRules)`
    -   `runCreditSearch(clientId, applicantId)`
    -   `runMVRSearch(state, identifiers)`
-   Implement provider adapters:
    -   Accio (primary)
    -   BIS (Colorado criminal)
    -   CBI (CO arrests)
    -   TransUnion (credit)
    -   Runners (implemented as “manual/external provider” with tasks/emails)
-   Configurable routing table:
    -   Per state/county:
        -   Which provider(s) to use and in what order (e.g., Accio → BIS → runner)
-   Long-term:
    -   Ability to route different clients differently (e.g., premium clients use faster but more expensive providers).

---

### 8\. Reporting, QA, and Notes

#### 8.1 Result Aggregation & Review

**Requirements**

-   Pull results from Accio (and other providers) into a unified case view.
-   Show:
    -   Per-component status (Pending / Complete / Exception)
    -   Found records with:
        -   Jurisdiction
        -   Case numbers
        -   Offense, disposition, dates
-   Encourage human QA:
    -   UI for Melissa/Jodie to:
        -   Confirm identity matches
        -   Mark questionable records for further inquiry
        -   Add clarifying notes.

#### 8.2 Reporting Rules Application

**Requirements**

-   Before final report generation:
    -   Apply legal and client rules:
        -   Exclude non-reportable items per state/FCRA
        -   Flag items with special caveats (e.g., “adjudication withheld,” “older than 7 years but within 10”).
-   Final report:
    -   Clear disclaimer:

NationSearch reports what is legally reportable. Risk/grading decisions are made by the employer.

-   FCRA and other required language printed as per regulation.

#### 8.3 Audit Logging & Notes

**Requirements**

-   Per client, candidate, and case:
    -   Timeline of all actions:
        -   Orders placed
        -   Provider calls
        -   Task creations/completions
        -   Manual calls/emails (logged or recorded/transcribed if VOIP integrated)
-   Notes system:
    -   Structured notes:
        -   Type: client instruction / court clerk info / applicant dispute / QA decision, etc.
        -   Who wrote it, when
    -   Examples:

Spoke to Pueblo clerk; confirmed warrant belongs to applicant; DOB matches.

Client requested verbal disclosure of >10-year-old homicide; no written record in report.

-   Searchable:
    -   By client, applicant, case ID, jurisdiction.

---

### 9\. Client Relationship & Task Management (Lightweight CRM)

**Requirements**

-   Client record:
    -   Contacts (HR, legal, billing)
    -   Services enabled
    -   Policies & rules
    -   Integration status (Accio, SAML, payroll/ATS, etc.)
-   Tasks:
    -   Call/email follow-ups for:
        -   New clients (post-onboarding check-in)
        -   Existing clients on cadence (e.g., every 90 days)
        -   Collections / reminders
    -   Auto-generation rules:

No contact for 120 days → create ‘check-in’ task

-   Views:
    -   “Clients not contacted in N days”

Clients with open onboarding steps (e.g., credit inspection pending)

---

### 10\. Client & User Access

**Requirements**

-   **Client portal:**
    -   View submitted orders & statuses
    -   Download completed reports
    -   Place new orders (if allowed)
    -   Limited settings view (e.g., authorized packages, contact info)
-   **Internal users:**
    -   Separate roles:
        -   Admin (Jodie)
        -   Processor/Researcher
        -   Accounting
    -   Permissions aligned with:
        -   View/change rules
        -   Create client accounts
        -   Process cases
        -   See billing info

---

### 11\. Communications (Email/SMS)

**Requirements**

-   Templates for:
    -   Applicant invites
    -   Applicant reminders
    -   Client notifications (order received, completed, needs additional info)
    -   Adverse action workflows (pre-adverse, adverse, copy of report notices) where legally needed
-   Integration with email providers:
    -   Re-use your “email gateway” pattern if possible:
        -   Allow use of SES, SendGrid, etc., but keep config in one place.
-   Logs:
    -   Every email/SMS associated with client/applicant/case.

---

### 12\. AI Use (Guardrails)

**Requirements**

-   AI should:
    -   Help draft rules (interpret human text into structured rules)
    -   Suggest workflow automation
    -   Draft/edit email/SMS templates
    -   Help summarize notes/transcripts for internal use
-   AI should **not**:
    -   Make hire/no-hire decisions
    -   Override FCRA/state rules
    -   Fabricate data or infer identity beyond available identifiers