# Scaffald ATS — Feature-Complete Design Brief

**Date:** 2026-09-10
**Status:** Design brief for a full redesign of the ATS surface
**Audience:** A designer (human or AI) who has not seen this codebase

---

## 0. How to use this document

This is a **design brief**, not an engineering plan. It answers: what screens exist,
who uses them, what data each element shows, what states each screen can be in, and
what the interactions are. It deliberately says little about how any of it is
implemented.

Every screen is tagged with a build status, because a redesign needs to know the
difference between "improve this" and "invent this":

| Tag | Meaning |
|---|---|
| **BUILT** | Exists, wired to real data, in production use. Redesign the surface, keep the behavior. |
| **PARTIAL** | Exists and is partly wired. Some regions are real, some are placeholder. Noted per region. |
| **MOCK** | Screen exists, renders hardcoded sample data. Treat the layout as a sketch, not a constraint. |
| **NEW** | Does not exist. Specified from the product vision. Greenfield. |

**Section 12 lists the known UI debt** — the things the current build gets wrong.
A redesign that reproduces them faithfully has failed. Read it before drawing anything.

---

## 1. Product context

Scaffald is a construction-industry hiring marketplace. Its ATS is not a single
product — it is one pipeline engine rendered four different ways for four
different audiences who transact with each other:

```
                         ┌──────────────────┐
                         │   Job posting    │
                         └────────┬─────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
      ┌───────▼──────┐   ┌────────▼────────┐  ┌───────▼────────┐
      │  Recruiter   │──▶│ Hiring company  │◀─│   Applicant    │
      │  (agency)    │   │   (employer)    │  │   (worker)     │
      └───────┬──────┘   └────────┬────────┘  └───────┬────────┘
              │                   │                   │
              └─────────┬─────────┘                   │
                        │                             │
                ┌───────▼────────┐                    │
                │  NationSearch  │────────────────────┘
                │  (background   │  secure intake + status
                │   screening)   │
                └────────────────┘
```

**The thesis:** every other ATS is built for the employer. Scaffald's differentiator
is that the applicant gets an honest view of where they stand, and that recruiters
and employers carry **public transparency stats** — response rate, time-to-first-
contact, ghost rate — computed from pipeline data they cannot self-report. Applicants
choose where to apply partly on those numbers.

The redesign should make that thesis legible. Today the employer surface looks like
a generic ATS; nothing about it signals that the candidate can see in.

### The monetization mechanic (affects several screens)

Scaffald takes a **success fee** on placement, and this is not a billing detail
tucked into settings — it sits inside the hiring flow and shapes two screens:

1. **Candidate contact details are locked** until the employer pays the upfront
   success fee. Name, title, location, score, résumé and screening answers are
   visible; email and phone are not.
2. **Moving a candidate to Hired opens a payment step.** The confirm dialog becomes
   a checkout: fee schedule, Stripe payment element, and a legal acknowledgement
   (an anti-circumvention clause — "keep communication and hires on-platform").
   The status change does not commit until payment confirms.

This is the most commercially important interaction in the product and currently the
ugliest. It deserves real design attention rather than a modal with a form in it.

---

## 2. The four audiences

| Audience | Who they actually are | Their surface | Status |
|---|---|---|---|
| **Hiring company** | An office manager at a 5-person contractor, or an HR team at a 500-person GC. Wide range of sophistication. | `/office` — pipeline, scheduling, compliance, integrations | **BUILT** |
| **Recruiter** | A staffing agency placing candidates into multiple client companies from one posting. | Not built. Would extend `/office`. | **NEW** |
| **Applicant** | A tradesperson. Often on a phone, often on site, often between jobs. Low tolerance for opacity. | `/jobs/applications` | **PARTIAL** |
| **NationSearch** | The sole background-screening provider. Two processors and an owner-operator running a screening business *inside* Scaffald. | `/office/ats/checks`, `/office/ats/admin` | **PARTIAL** |

### Named personas from the source research

- **Jodie** — owner/operator of NationSearch. Inherited the business, runs QA on
  every report personally, competes with Checkr on accuracy and human judgment
  rather than speed of automation. Her constraint: *"What we report is what we can
  legally report. What you do with it, how you grade it, is up to you."* The system
  must never make a hire/no-hire recommendation.
- **Melissa and Adam** — NationSearch processors. Live in a case queue all day.
  Phone calls to county clerks, mail requests to Wyoming, chasing runners. Their
  screen is a work queue, not a dashboard.
- **The office manager** — hiring company. Posts three jobs a year. Everything must
  be obvious without training.
- **The tradesperson** — applicant. Has applied to eleven places and heard back from
  two. Wants to know which of the nine are still alive.

---

## 3. Platform and design-system constraints

**Read this before drawing.** These are hard constraints — a design that ignores
them cannot be built without a rewrite.

### Runtime

- **Expo / React Native, rendered to web, iOS and Android from one codebase.**
  Every screen here is React Native primitives, not HTML. There is no CSS
  stylesheet, no `:hover` on native, no CSS grid.
- Layout is flexbox only. `Row`, `Stack`, `Grid`, `ScrollView` are the primitives.
- Web is the primary ATS target (employers work at a desk), but the same components
  render on phones and must not break.

### Design system: `@scaffald/ui`

A first-party component library (migrated off Tamagui in Feb 2026). A redesign
should compose these rather than invent parallel components:

`Accordion` `ActionSheet` `Alert` `Avatar` `AvatarGroup` `Badge` `BottomBar`
`Breadcrumb` `Button` `ButtonGroup` `Card` `Chart` `Checkbox` `Chip` `CommandMenu`
`ContextMenu` `DatePicker` `Dropdown` `EmptyState` `ErrorState` `FileUpload` `Form`
`Grid` `Input` `Kanban` (`KanbanBoard`/`KanbanColumn`/`KanbanCard`) `List` `Modal`
`NavigationList` `NumericStepper` `Pagination` `Popover` `ProgressBar` `Radio`
`ResponsiveSelect` `RichTextEditor` `ScrollArea` `SearchSelect` `SegmentedControl`
`Separator` `Spinner` `StatusIndicator` `Tabs` `TextArea` `Toggle` `Toast`
`Tooltip` `UploadSurface`

Plus a glass-surface family (`GlassSurface`, `GlassPanel`, `GlassWidget`) that is
currently unused on ATS screens.

### Theming

- **Light and dark are both first-class.** Every screen must be specified in both.
- Colors come from tokens shaped `colors.bg[theme].default`, `colors.text[theme].secondary`,
  `colors.border[theme].default`, plus scales (`colors.green[50]`…`colors.green[900]`).
  Never a raw hex. (The metrics dashboard currently hardcodes hex for chart series —
  that is a bug to fix, not a pattern to follow.)
- Theme is read from context, not from a media query.

### Responsive

- **Breakpoint that matters: 768px.** Below it, the kanban board collapses from
  seven side-by-side columns into a `Tabs` control showing one column at a time,
  each tab labeled with the stage name and a count.
- Desktop kanban is a horizontal `ScrollView` — columns are fixed width and the
  board scrolls sideways. Seven columns do not fit on a laptop; expect scrolling
  to be part of the design, and design the scroll affordance deliberately.

### Layout shells

Two existing shells wrap ATS screens; a redesign should either use them or replace
them consciously:

- `OfficeLayout` — breadcrumb + single main region.
- `DashboardLayout` — split `leftContent` / `rightContent`, used by background
  checks and ID verification (main list left, action panel right).

---

## 4. Information architecture

### Built today

```
/office
├── /applications                        Pipeline — kanban + metrics       BUILT
│   └── /:applicationId                  Candidate detail (also a modal)   BUILT
│       └── /inquiry                     Inquiry detail                    BUILT
├── /ats                                 → redirects to /office/applications
│   ├── /metrics                         Pipeline, opened on metrics view  BUILT
│   ├── /scheduling                      Interview scheduling              PARTIAL
│   ├── /self-schedule                   Candidate-facing booking page     PARTIAL
│   ├── /checks                          Background checks (org view)      BUILT
│   ├── /request                         Request a background check        BUILT
│   ├── /admin                           Background checks (admin view)    BUILT
│   └── /id-verifications                ID verification admin + request   BUILT
├── /compliance
│   ├── /eeo-reports                     EEO-1 / adverse impact            BUILT
│   └── /project-hiring                  Project-level hiring compliance   BUILT
├── /integrations
│   ├── /background-checks               Provider configuration            BUILT
│   └── /hris                            HRIS connections                  BUILT
└── /cms/jobs                            Job posting CRUD                  BUILT
    ├── /create
    └── /:id/edit

/jobs                                    (applicant side)
├── /                                    Job search
├── /:id                                 Job detail + apply
├── /saved                               Saved jobs
├── /my-listings                         Jobs the user posted
└── /applications                        My applications                   PARTIAL
    └── /:applicationId                  Application detail                PARTIAL
        ├── /inquiry
        └── /messages
```

### Proposed additions

```
/office
├── /recruiting                          RECRUITER ATS                     NEW
│   ├── /                                Cross-client pipeline
│   ├── /clients                         Client companies
│   │   └── /:clientId                   Client detail + their candidates
│   ├── /presentations                   Candidates presented, awaiting feedback
│   └── /stats                           My public transparency stats
├── /candidates                          Talent pool across all jobs       NEW
└── /flows                               Pipeline stage + rule builder     NEW

/recruiters                              Public recruiter directory        NEW
└── /:slug                               Recruiter profile + public stats  NEW

/companies/:slug/hiring-stats            Public employer stats             NEW

/nationsearch                            NationSearch operations           NEW
├── /cases                               Case queue (kanban)
│   └── /:caseId                         Case detail
├── /clients                             Screening-client CRM
│   └── /:clientId
├── /rules                               State + FCRA reporting rules
└── /intake/:token                       Applicant secure intake (public)

/jobs/applications                       (applicant, upgraded)
└── /                                    Add: honest status, transparency  PARTIAL→
```

---

## 5. Part A — Hiring company ATS (the redesign target)

### A1. Pipeline board — `/office/applications` — **BUILT**

The primary screen of the product. An employer lives here.

**Purpose:** see every candidate across every open job, move them through stages.

**Regions**

1. **Header** — `H2` "Applications", subtitle "{n} total applications".
   Right side: a two-button view toggle, `Kanban` | `Metrics`.
2. **Filter bar** — a subtle-background rounded row containing:
   - *Filter by Job* — `ResponsiveSelect`, options = open jobs (max 100) + "All Jobs"
   - *Filter by Status* — `ResponsiveSelect`
   - *Clear Filters* — appears only when a filter is active
   - Filters are applied server-side; the board shows the filtered set.
3. **Bulk action bar** — appears only when ≥1 card is selected. Blue-tinted strip:
   - "{n} candidate(s) selected"
   - `Clear` · `Compare {n}` (only when 2–5 selected *and* each has an inquiry) ·
     `Send Inquiry to {n}` (primary)
4. **Board** — seven columns.

**The seven columns**

| Column | Label shown | Contains | Color role |
|---|---|---|---|
| new | New Applications | `new` | neutral |
| screen | Screening | `screen` | yellow |
| inquired | Inquired | `inquired` | purple |
| interview | Interview | `interview` | red (**wrong — see §12**) |
| offer | Offer | `offer` | green tint |
| hired | Hired | `hired` | green solid |
| rejected | Closed | `rejected` **and** `withdrawn` | red |

*Design note:* `withdrawn` deliberately shares the terminal column — nobody works a
withdrawn candidate, so it does not earn board width — but the two must stay
visually distinguishable, because the funnel and EEO adverse-impact math treat
"we passed" and "they left" as different events. Today that's a small grey pill
reading "Withdrawn by candidate". It is easy to miss.

**Card contents** (current)

- Candidate name
- Job title
- "Withdrawn by candidate" pill, terminal column only
- Footer row: "{n}d ago" (days since applied) · "{n} attachments"

**Card data available but not currently shown** — the redesign should decide
deliberately what earns space:
score (0–100), avatar photo, source (Scaffald / referral / external board / social /
company website / other), union status (member, local number, journeyman level,
prevailing-wage eligible), assignee, team, inquiry state, days *in current stage*
(distinct from days since applied — this is the staleness signal and it is missing),
pay range, target start date.

**Interactions**

- **Drag a card between columns** → status change. Validated client-side before the
  request; an invalid move is refused.
- **Tap a card** → candidate detail modal.
- **Select cards** → bulk bar.
- Drag requires 8px of movement before it activates, so a tap still reads as a tap.

**Allowed transitions** (enforced; the board should make illegal moves feel illegal
rather than failing after the drop)

```
new       → screen, rejected
screen    → inquired, interview, rejected
inquired  → interview, offer, rejected
interview → offer, rejected
offer     → hired, rejected
hired     → (terminal)
rejected  → (terminal)
withdrawn → (terminal, candidate-initiated only)
```

Two moves are **critical** and open a confirmation step: → `rejected` and → `hired`.

**States**

| State | Current treatment | Notes for redesign |
|---|---|---|
| Loading | Centered spinner + "Loading applications…" | Full-screen spinner replaces the whole board, including the header. Skeleton columns would be better. |
| Error | Centered "Error Loading Applications" + message | No retry affordance. Add one. |
| Empty (no applications at all) | Seven empty columns each reading "No applications" | Seven copies of the same message. Needs a single first-run state: what to do to get candidates. |
| Empty (filtered to nothing) | Same as above | Must be distinguishable from genuinely empty, and offer "clear filters". |
| Empty column | "No applications" | Fine, but should read as a drop target during a drag. |
| Dense | Unbounded column height | No pagination or virtualization. Design for a column with 200 cards. |
| Dragging | Card follows cursor; target column drops to 0.9 opacity | Weak. The drop target needs to be unmistakable, and illegal targets should be visibly closed. |

**Mobile (<768px):** `Tabs`, one column at a time. Each tab shows the stage label and
a count badge. Drag-and-drop across tabs is not usable — mobile needs an explicit
"move to stage" control on the card, which does not exist today.

---

### A2. Candidate detail — modal **and** `/office/applications/:applicationId` — **BUILT**

Same content renders in both places: the modal on the board, and a linkable route so
a recruiter can send a colleague a URL.

**Regions, top to bottom**

1. **Identity row** — avatar (24px — far too small), candidate title, location.
   *The candidate's name is not in this header.* It is in the modal chrome only.
2. **Score badge** — large number + "Application Score". Color-coded:
   ≥80 green · ≥60 blue · <60 red.
3. **Union status badge** — when present: member/non-member, union name, local
   number, journeyman level, prevailing-wage eligibility. Construction-specific and
   a genuine differentiator; currently rendered as a plain badge.
4. **Quick actions** — `Advance to Interview` (green) · `Reject` (red) ·
   `Send Message` · `Assign to me` (only with a team) — **the first three do nothing
   today; see §12.**
5. **Assignee** — "Current assignee: {name}" or "Unassigned".
6. **Meta row** — Applied (long date) · Job · Experience (years).
7. **Six tabs.**

**The six tabs**

| Tab | Content | Status |
|---|---|---|
| **Profile** | Candidate profile. Contact details (email, phone) are **locked** behind the success fee — lock copy: *"Complete the upfront success fee to unlock contact information."* or, when the candidate has no worker account, *"This candidate does not have a linked worker account yet."* Skills, certifications and work history are optional fields the employer payload may not carry — absent must not render as "none". | BUILT |
| **Application** | Screening answers (current location, willing to relocate, years experience, work authorization, earliest start date), custom question answers, attachments (résumé, cover letter, portfolio — filename, size, uploaded date). | BUILT |
| **Notes** | Internal team notes with @mentions of team members. Not visible to the candidate. | BUILT |
| **Messages** | Two-way messaging with the candidate, with reusable message templates. | BUILT |
| **Activity** | Stage-change history: from → to, who, when, reason. | BUILT |
| **Inquiry** | The Scaffald-specific pre-offer negotiation instrument — employment type, schedule, working hours, workdays, start/end dates, rate range, travel, overtime, driver's licence — each field flagged negotiable or not. Modes: create / view / edit, plus a draft state ("Finish Draft"). | BUILT |

**Inquiry deserves emphasis in the redesign.** It is the most distinctive thing in
this ATS and it is buried in the sixth tab of a modal. It's a structured offer
conversation — the employer states terms and marks what's negotiable, the candidate
responds section by section, and both sides can compare multiple inquiries
side-by-side. No mainstream ATS has this.

**States:** loading (spinner + "Loading inquiry…"), no inquiry yet (empty + "Start
Inquiry"), draft, view, edit, and a comparison overlay for 2–5 candidates.

---

### A3. Status change confirmation — **BUILT**, and the most important screen to redesign

Opens on drag-to-`rejected` or drag-to-`hired`. Two very different jobs in one
component.

**Rejection path**
- Candidate name, from-status → to-status
- **Reason is required** — confirm stays disabled until non-empty
- Confirm / Cancel

**Hire path — this is a checkout, not a confirmation**
- Derives the hire value: total hire value, job duration, start date
- Shows a **fee schedule** (upfront portion + remainder)
- Creates a payment intent; renders a Stripe payment element
- A **legal acknowledgement checkbox** — the anti-circumvention clause. The live
  copy is a placeholder reading *"TODO: Replace with the final anti-circumvention
  clause before launch…"* — **real copy is needed before this ships.**
- The status change commits only after payment confirms. Toast on success:
  "Upfront fee paid / Hire confirmed successfully."
- Failure: inline error + error toast, status unchanged.

**States:** initializing intent · intent ready · payment processing · paid ·
already-paid (skip straight to confirm) · payment error · intent-creation error.

Asking someone to pay a placement fee inside a drag-and-drop confirmation dialog is
the wrong frame. This is a moment worth celebrating and worth being precise about.
Consider a dedicated step or sheet with the fee math shown plainly.

---

### A4. Metrics — `/office/applications` (Metrics view) and `/office/ats/metrics` — **BUILT**

**Controls:** date-range select (default 30 days).

**Panels**

1. **Stage distribution** — count per stage, all eight statuses including `withdrawn`
   counted separately from `rejected`.
2. **Conversion funnel** — cumulative "reached this stage or beyond" through
   new → screen → inquired → interview → offer → hired, with percentages.
3. **Source of hire** — Scaffald / referral / external board / social media /
   company website / other.
4. **Time to hire** — days from application to the recorded `hired` transition.
   When no hire transition exists the honest answer is *null*, not a guess — the
   design needs a "not recorded" treatment rather than a zero.

**States:** loading, empty (no applications in range — must not render an empty
funnel as if it were a real zero), sparse (below a sample threshold the numbers are
noise and should be labeled as such).

Charts use `Chart` from the design system. Series colors are currently hardcoded hex
and must move to tokens.

---

### A5. Interview scheduling — `/office/ats/scheduling` — **PARTIAL**

Tabbed screen. Wiring status differs per tab, and the screen carries a
`SampleDataNotice` where it is showing samples — preserve that honesty in the
redesign, and remove the notice only when the data behind it is real.

| Region | Status |
|---|---|
| Calendar connections (Google/Outlook) | **MOCK** — hardcoded connection list |
| Availability windows | **MOCK** — hardcoded windows |
| Interview slots | **BUILT** — real employer slots |
| Scheduling links | **BUILT** — real, with create-link modal |
| Candidate names on slots | **BUILT** — resolved from applications |

**Interactions:** add slot (modal), create scheduling link (modal), search/filter
candidates.

### A6. Candidate self-scheduling — `/office/ats/self-schedule` — **PARTIAL**

The candidate-facing booking page reached from a scheduling link token.

- **With a token:** live — real link, real slots, real booking.
- **Without a token:** demo mode with sample org "Apex Construction LLC" and job
  "Senior Electrician", so the employer can preview it.

**Regions:** org + job header, available slots grouped by date, booking confirmation.
**States:** loading, no slots available, booked (confirmation), expired/invalid link.

This is the only employer-built screen a *candidate* sees. It should feel like the
applicant surface, not the office one.

### A7. EEO compliance reporting — `/office/compliance/eeo-reports` — **BUILT**

Wired to real EEO data. Period selector, adverse-impact flag count, breakdowns by
protected class across the hiring funnel.

**Handle with unusual care.** An earlier version of this screen rendered fabricated
adverse-impact numbers indistinguishable from real ones — the highest-risk defect
found in the August audit. Rules for the redesign:

- Never render a plausible number that isn't real.
- "Declined to state" is a real response category and must be shown, not dropped.
- Below the minimum sample size, show the suppression, not an estimate.
- An adverse-impact flag is a legal signal — it must be unmissable and must link to
  what it means.

### A8. Background checks — `/office/ats/checks`, `/request`, `/admin` — **BUILT**

`DashboardLayout` split: list on the left, navigation/action panel on the right.

- **`/checks`** — the org's background checks, statuses, results
- **`/request`** — request a check for a candidate
- **`/admin`** — cross-org admin view
- **`/office/integrations/background-checks`** — provider configuration

Live webhooks update status. This is the employer end of the NationSearch
integration described in Part D.

### A9. ID verification — `/office/ats/id-verifications` — **BUILT**

Split layout: admin list left, request panel right, with an organization selector
that drives both.

### A10. Job posting — `/office/cms/jobs/create`, `/:id/edit` — **BUILT**

A long form in eleven sections. Three of them configure ATS behavior directly and
belong in the redesign's scope even though the form lives in the CMS:

| Section | Why it matters to the ATS |
|---|---|
| Job metadata | title, type, dates |
| Location & scheduling | |
| Compensation & benefits | feeds the inquiry rate range |
| Enhanced requirements | |
| Soft skills requirements | |
| **Application screening** | defines the screening questions candidates answer |
| **Score threshold** | the 0–100 score shown on every card |
| **Auto-rejection** | rules that reject below threshold without human review |
| Application process | |
| Distribution & visibility | |
| Compliance & analytics | EEO collection |

Auto-rejection is the highest-stakes configuration in the product — it silently ends
applications. Whatever the redesign does here, the employer must understand exactly
what they just switched on, and the applicant-facing consequence must be honest.

---

## 6. Part B — Recruiter ATS — **NEW**

Entirely greenfield. A staffing agency posts one job and routes candidates from it
into several client companies.

### The distinguishing mechanic: multi-company routing

- One job posting can serve **multiple client companies**.
- A candidate routed to two clients gets **one pipeline item per client**. The same
  person can be at *Client Interview* with Acme and *Client Presentation* with
  Summit, simultaneously.
- **Each client sees only their own candidates.** Never another client's pipeline,
  never the fact that a candidate is also being presented elsewhere.
- The recruiter sees everything, in one board, filterable by client.

This is the whole design problem of Part B: representing one human in several
simultaneous, mutually invisible pipelines without making the recruiter's board
unreadable.

### B1. Recruiter pipeline — `/office/recruiting`

Same kanban grammar as the employer board, plus a client dimension.

**Default stages:** New Application · Screening · Phone Screen · Client Presentation ·
Client Review · Client Interview · Background Check · Offer · Hired · Rejected ·
Withdrawn

That is eleven columns — too many for one horizontal board. The design needs an
answer: grouped stages, a client-swimlane layout, a list mode, or a collapsed board.

**Card must carry:** candidate, job, **which client**, stage age, and a signal when
the same candidate is live with another client.

**Filters:** job, client company, stage, date range, source.

### B2. Client companies — `/office/recruiting/clients`, `/clients/:id`

Each client: active roles, candidates presented, feedback outstanding, time in
Client Review, contract terms, contacts.

### B3. Presentation queue — `/office/recruiting/presentations`

Candidates presented and awaiting a client decision. The recruiter's aging problem
lives here — a candidate sitting three days in Client Review is a candidate about to
be lost. Staleness should be the organizing principle of this screen.

### B4. Client-side review — an employer-context screen

The hiring company's view of a recruiter's candidates. A "Recruiting" area inside
their normal office surface showing only candidates presented to *them*, with three
decisive actions: **Schedule interview** · **Pass** · **Need more info**, plus
free-text feedback. Aggregate stats: screened, presented, time from posting to
presentation.

This screen is used by someone who logs in rarely and needs to make a decision in
under a minute. It should be the simplest screen in the product.

### B5. Recruiter public profile — `/recruiters/:slug` (public)

The transparency surface, and the reason a candidate would choose to work with one
recruiter over another:

- Average time from application to first contact
- **% of applicants who received a response** (the anti-ghosting number)
- Average time from screening to placement
- Placements in the last 12 months
- Applicant satisfaction (post-process survey)
- % who would work with this recruiter again
- Specializations and industries

**Data integrity rules that the design must express:**
- A stat below the minimum sample size (~10 completed pipelines) is not displayed —
  and its absence must be explained, not silently blank.
- Rolling 12-month window.
- Recruiters see their own numbers before they go public.
- Nothing here is self-reported.

---

## 7. Part C — Applicant transparency — **PARTIAL**

Currently `/jobs/applications` renders a list of the user's applications with a
status badge, an activity timeline, and per-application detail, inquiry and message
screens. The pieces exist; the *product idea* does not yet.

### C1. My applications — `/jobs/applications` — **PARTIAL → redesign**

One place showing everything: applications direct to companies, applications via
recruiters, and any background check in flight.

**Per application:** company or recruiter, job, honest status, when it last moved,
whether the ball is in the applicant's court, and what happens next.

**Status translation — non-negotiable.** Applicants never see internal stage names:

| Internal stage | Applicant sees |
|---|---|
| new / screen | Application received |
| inquired | In review |
| Client Presentation *(recruiter)* | Being considered |
| interview / Client Interview | Interview stage |
| Background Check | Background check in progress |
| offer | Offer extended |
| hired | Congratulations! |
| rejected | Not selected |
| withdrawn | Withdrawn |

The principle: **honest, not internal.** "Being considered" is true — the recruiter
is presenting them. They don't need to know to whom, or against whom.

**States:** no applications yet (with a route into job search), all applications
closed, application gone stale with no employer response (this is a *feature* — say
so plainly: "No response in 14 days"), and offer-extended (needs a real response
affordance).

### C2. Application detail — `/jobs/applications/:id` — **PARTIAL**

What was submitted, current honest status, timeline of what has happened, messages
with the employer, the inquiry to review and respond to section by section, and any
background-check status with FCRA rights.

### C3. Employer and recruiter stats, before applying — **NEW**

On a job listing and on a company page:

- Average time to hire
- % of applicants who received a response
- Average time to first response
- Open positions vs hires made
- Interview-to-offer ratio
- Applicant satisfaction
- Whether they run background checks, and through whom

Same suppression rules as recruiter stats. This is the screen that makes the
marketplace two-sided in more than name.

### C4. Post-process survey — **NEW**

Fires when an application reaches a terminal stage. Short:

- How was your experience with {company/recruiter}? (1–5)
- Were you kept informed? (Y/N)
- How long did it take vs expectation? (Faster / As expected / Slower)
- Would you apply through them again? (Y/N)
- Optional free text

Must be answerable on a phone in under thirty seconds, including after a rejection —
which is a hard tone problem worth solving explicitly.

---

## 8. Part D — NationSearch background-check operations — **PARTIAL**

NationSearch runs its screening business inside Scaffald. Employer-side screens (A8)
exist; the operational side does not.

### The stance, which the UI must encode

> NationSearch reports what is legally reportable. Grading and risk decisions are the
> employer's responsibility.

No hire/no-hire recommendation. No risk score. No red/green verdict on a person.
The system surfaces findings, flags caveats, and stops.

### D1. Case queue — `/nationsearch/cases` — **NEW**

A processor's whole working day. Kanban.

**Stages:** Intake · Order Review · Submitted · Partial Results · Manual Research ·
QA Review · Report Ready · Delivered · Adverse Action · Disputed · On Hold · Cancelled

**Common paths**
```
Intake → Order Review → Submitted → Partial Results → QA Review → Report Ready → Delivered
                                  → Manual Research → QA Review
Report Ready → Adverse Action → Delivered
any active → On Hold → (back to previous)
Delivered → Disputed → QA Review → Report Ready (re-issue)
```

**Card:** applicant, client, package, age in stage, blocking task if any, assignee.
Staleness matters more here than anywhere else in the product — a case sitting in
Submitted for five days is a phone call someone forgot to make. Age should be the
loudest thing on the card.

### D2. Case detail — `/nationsearch/cases/:id` — **NEW**

- Applicant identifiers: name, AKAs, DOB, SSN, address history, driver's licence
- Order plan: which components, which jurisdictions, why — auto-constructed from the
  client's scope rules plus the candidate's address history, then **reviewed and
  adjustable by a processor before submission**
- Findings per component, with jurisdiction, case number, offense, disposition, dates
- **Typed notes** — client instruction, court clerk info, applicant dispute, QA
  decision, verbal disclosure, scope exception. Every one timestamped and attributed.
  This is the litigation-defense layer; it is the most important content on the
  screen and must be first-class, not a comment box.
- Manual tasks: "Call Pueblo County clerk to confirm warrant", "Mail request — WY"
- Full audit timeline

### D3. QA review — **NEW**

Jodie reviews every report before it goes out. She needs: findings beside the
reporting rules that apply, what will be excluded and why, what carries a caveat,
and one approve/return decision. Speed matters — this is a bottleneck by design.

### D4. Reporting rules admin — `/nationsearch/rules` — **NEW**

**Configuration, never code.** A table Jodie maintains: state, rule type, effective
date, rule content.

Encoded examples: FCRA 7-year default, 10-year for certain federal screenings;
California — DOB removed from public terminals, limits on first marijuana offenses;
Florida — adjudication withheld reportable but must carry an FCRA caveat; Wyoming —
confidentiality state, mail only, no runners; Georgia — offense-type restrictions.

New state rules arrive regularly. The screen must make adding one feel routine.

### D5. Screening-client CRM — `/nationsearch/clients` — **NEW**

Not Salesforce. A focused relationship layer:

- Services enabled (criminal, MVR, employment, education, credit, drug, civil)
- Scope policy: lookback (2/5/7/10 years), county vs statewide vs federal, which
  states, AKA handling and its cost/risk tradeoff
- Integration status (provider account configured, credit onboarding complete)
- Where they hire — drives which state rules apply
- Billing: package, pricing tier, custom pricing
- Their stated risk policies (theft thresholds, sector concerns)
- Self-serve or NationSearch-ordered (~40/60 split today)
- Contacts: HR, legal, billing
- Every interaction logged; proposal history; volume trend

**Views:** client list (sortable by last contact, volume, status, onboarding stage) ·
**"Needs attention"** (not contacted in 90+ days, open onboarding steps, declining
volume) · client detail · task inbox by due date.

**Client onboarding is its own pipeline:** New Lead → Proposal Sent → Follow-up →
Agreement Out → Credit Onboarding → Configuring Account → Active / Lost.
Credit onboarding is a multi-week sub-flow: third-party on-site inspection →
TransUnion paperwork → codes configured. The UI must show a client parked there for
three weeks as normal, not as stalled.

### D6. Applicant secure intake — `/nationsearch/intake/:token` — **NEW** (public)

Reached by emailed link or QR code. Replaces a faxed handwritten release.

**Collects:** legal name, AKAs, DOB, SSN, address history, driver's licence, consents.

**Requirements:** plain-English explanation of what is collected and why, before the
fields. Consent language a person can actually read. Works on a phone, one-handed,
on a job site, possibly on bad signal. Save-and-resume. Confirmation with an expected
timeline.

This form asks a stranger for their Social Security number. Design it so that feels
safe and legitimate — it is the moment the applicant decides whether this is a real
company or a phishing attempt.

### D7. Applicant check status — **NEW**

"In progress" → "Review" → "Complete", plus FCRA rights, dispute route, and, on an
adverse finding, the pre-adverse notice → waiting period → adverse action sequence
rendered as something a person can follow.

---

## 9. Cross-cutting design requirements

### Status vocabulary — fix the drift

Three different label sets exist for the same eight statuses:

| Status | Board column | Filter dropdown | Metrics |
|---|---|---|---|
| new | "New Applications" | "New" | "New" |
| screen | "Screening" | "Screening" | "Screening" |
| inquired | "Inquired" | *(missing)* | "Inquiry" |
| interview | "Interview" | "Interview" | "Interview" |
| offer | "Offer" | "Offer" | "Offer" |
| hired | "Hired" | "Hired" | "Hired" |
| rejected | "Closed" | "Rejected" | "Rejected" |
| withdrawn | "Closed" + pill | *(missing)* | *(counted separately)* |

**Pick one vocabulary and apply it everywhere,** including the applicant-facing
translation table in §7.

### Empty, loading, error — one pattern each

The design system ships `EmptyState`, `LoadingState` and `ErrorState`. Today screens
hand-roll all three inconsistently. Every screen in this brief needs all three
specified, and:

- **Empty ≠ filtered-empty.** Different copy, different actions.
- **Every error offers a retry.**
- Loading should preserve layout (skeletons), not replace the screen with a spinner.

### Permissions

| Role | Sees |
|---|---|
| Hiring manager | Their org's candidates, all stages |
| HR admin | Same + configuration + compliance reports |
| Team member / interviewer | Only candidates for their team's roles; leaves structured feedback; cannot see other interviewers' feedback before submitting their own |
| Recruiter staff | All candidates across all their clients |
| Client contact | Only candidates presented to *them* |
| Applicant | Their own applications, translated statuses, never internal notes or feedback |
| NationSearch processor | Assigned cases |
| NationSearch owner | Everything + QA + rules + CRM |

**Hard privacy boundaries the UI must never leak:**
- A client company must never see another client's candidates on a shared posting.
- An applicant must never see internal notes, scores, interview feedback, or that
  they are being compared against others.
- Contact details stay locked until the success fee is paid.

### Copy rules

- **Never fabricate a number.** Missing data says "not recorded", never `0` or `—`
  where a real value would go.
- **Never imply a recommendation on a background check.**
- Applicant-facing copy: honest, not internal (§7).
- Rejection copy is read by a person who just got bad news. Write it that way.
- Replace the placeholder legal copy in the hire flow (§A3) before launch.

### Accessibility

- Drag-and-drop needs a keyboard equivalent — a "move to stage" control on every
  card. Today the board is unusable without a pointer.
- Status is currently communicated by column color alone in places; it needs a
  non-color signal.
- Score color coding (green/blue/red) fails for colorblind users without a label.
- Target sizes must work on a phone in work gloves. This is a construction product.

---

## 10. Data reference

The pipeline item, field by field, as the employer surface actually receives it.
"optional" means the field may be genuinely absent — **absent is not the same as
empty**, and the design must not render "no certifications" for a candidate whose
certifications simply weren't loaded.

```
Application
  id
  organizationId?          workerUserId?
  status                   new | screen | inquired | interview | offer
                           | hired | rejected | withdrawn
  source?                  scaffald | referral | external_board
                           | social_media | company_website | other
  appliedAt                updatedAt
  score                    0–100

  candidate
    id  name  location  photo  title  yearsExperience
    email?                 locked behind success fee
    phone?                 locked behind success fee
    skills?                [{ name, proficiency: beginner|intermediate
                              |advanced|expert }]
    certifications?        [{ name, state?, issueDate? }]
    experience?            [{ title, company, duration, description }]

  job
    id  title  location  payRange
    company?  organizationId?
    payRangeMinCents?  payRangeMaxCents?
    payRangeType?      hourly | salary | contract | project
    employmentType?    targetStartDate?

  team?                    { id, name?, assignedUserId? }

  unionStatus?
    isUnionMember  unionName?  localNumber?  membershipId?
    journeymanStatus?  apprentice | journeyman | master
    prevailingWageEligible?

  screeningAnswers
    currentLocation  willingToRelocate  yearsExperience
    isAuthorizedToWork  earliestStartDate

  customAnswers            [{ question, answer }]

  attachments
    resume?      { filename, size, uploadedAt }
    coverLetter? { filename, size, uploadedAt }
    portfolio?   { filename, size, uploadedAt }

  stageHistory             [{ fromStage, toStage, changedBy,
                              changedAt, reason? }]

  inquiry?
    id
    sections               [{ section_name, accepted_by, accepted_at }]
    comments               [{ sender_id, read_by[] }]
    capabilityResponses    [{ capability_name }]
```

Notes and messages are **not** on this object — each tab fetches its own. A count
badge on those tabs requires a separate request, which is why they show no count
today.

---

## 11. The pipeline engine underneath (context, not a design constraint)

All four surfaces are meant to run on one generic engine — items move through
user-defined stages via configurable transitions, every move recorded immutably, and
each move emits an event that user-configured automation rules can act on.

Why a designer should care:

1. **Stages are configurable, not hardcoded.** Any board must survive an org adding
   a stage. Seven columns is today's default, not a law.
2. **A stage-builder screen is in scope** (`/office/flows`): add stages, set colors
   and types (initial / active / terminal / archived), define which transitions are
   legal. Validation: at least one initial, at least one terminal, no orphans.
3. **A rule-builder screen is in scope.** Non-technical users write automation:
   *when* an item enters Client Presentation, *if* the client has screening enabled,
   *then* create a background-check case. Available triggers: item created,
   transitioned, entered stage, exited stage, assigned, completed, **stale**.
4. **Staleness is a first-class product concept.** "Sitting in Screening for 48
   hours" is a designed state, not an edge case, and it drives both the automation
   and the transparency stats.
5. **Every transparency stat in §6 and §7 is derived from transition records.**
   Nothing is self-reported. The design can promise that credibly.

---

## 12. Known UI debt — fix, don't reproduce

Found by reading the current implementation. A redesign that faithfully reproduces
the existing screens will inherit all of these.

| # | Problem | Where |
|---|---|---|
| 1 | **Three quick-action buttons do nothing.** "Advance to Interview", "Reject" and "Send Message" on candidate detail have no handlers. They render, they press, nothing happens. | `CandidateDetailContent.tsx:236–246` |
| 2 | **Candidate name is missing from the detail header.** The identity row shows title and location only; the name exists solely in the modal chrome, so the route version has no name at the top. | `CandidateDetailContent.tsx:207–218` |
| 3 | **Avatar is 24px** on the candidate detail header — smaller than the body text beside it. | `CandidateDetailContent.tsx:210` |
| 4 | **Status filter is missing two statuses.** No "Inquired", no "Withdrawn" — one of which is a full board column. | `ApplicationsFilters.tsx:77–85` |
| 5 | **Minimum-score filter has no control.** The state exists and is sent to the API; nothing renders it. Dead filter. | `ApplicationsFilters.tsx` |
| 6 | **Interview column is red.** Same red as rejected/closed. Advancing a candidate reads as a warning. | `ApplicationsKanbanBoard.tsx:79` |
| 7 | **Cards show days since *applied*, not days *in stage*.** The staleness signal — the one number that says "act on this" — isn't on the card. | `ApplicationsKanbanBoard.tsx:615` |
| 8 | **Score, source, union status and assignee never appear on cards** despite being available and being the reasons an employer would pick one card over another. | `ApplicationsKanbanBoard.tsx:539–571` |
| 9 | **Empty board shows "No applications" seven times** and offers no way forward. | `ApplicationsKanbanBoard.tsx:605` |
| 10 | **Loading replaces the entire screen** — header, filters and all — with one centered spinner. | `office-applications-screen.tsx:86–100` |
| 11 | **The error state has no retry.** | `office-applications-screen.tsx:108–119` |
| 12 | **Drag-and-drop is pointer-only.** No keyboard path, and on mobile the tab layout makes cross-stage moves impossible. | `ApplicationsKanbanBoard.tsx` |
| 13 | **Illegal drops fail silently after the drop** rather than being visibly closed during the drag. | `useApplicationStatusChange.ts:104–107` |
| 14 | **Placeholder legal copy is live** in the hire payment flow: *"TODO: Replace with the final anti-circumvention clause before launch."* | `ApplicationStatusChangeModal.tsx:244` |
| 15 | **Notes and Messages tabs show no counts** because each tab fetches its own data. An employer cannot tell there are twelve unread messages without opening the tab. | `CandidateDetailContent.tsx:313–320` |
| 16 | **Metrics chart colors are hardcoded hex**, so they don't respond to theme. | `ATSMetricsDashboard.tsx:33–67` |
| 17 | **Withdrawn is a small grey pill** in a red column — easy to misread as a rejection, which is exactly the conflation the data model works to prevent. | `ApplicationsKanbanBoard.tsx:547–561` |
| 18 | **Mock calendar connections and availability** still render on the scheduling screen alongside real slots and links. | `CalendarSchedulingScreen.tsx:117,127` |

---

## 13. Open questions

1. **Board width.** The recruiter flow has eleven stages, NationSearch twelve. Seven
   already overflows a laptop. Does the redesign introduce stage grouping, swimlanes,
   a list mode, or a collapsed board?
2. **Recruiter surface placement.** Does the recruiter ATS live under `/office` with
   a mode switch, or as a separate top-level section?
3. **Where the inquiry lives.** It is the most distinctive feature in the product and
   currently the sixth tab of a modal. Should it be a first-class screen or stage?
4. **Hire checkout.** Stay a modal, become a full step, or a dedicated route?
5. **How loud are transparency stats to the employer?** Showing an employer their own
   ghost rate is the mechanism that changes behavior — and the thing most likely to
   generate complaints. How prominent, and where?
6. **Mobile employer scope.** Is the full pipeline expected to be workable on a
   phone, or is mobile read-plus-triage with real work on desktop?

---

## 14. Provenance

**Source documents** (all in `docs/plans/ATS/`)

| File | What it is |
|---|---|
| `2026-03-30-recruiter-company-applicant-ats-design.md` | Recruiter + hiring company + applicant transparency vision |
| `2026-03-30-nationsearch-background-check-ats-design.md` | NationSearch operations PRD |
| `2026-03-30-flow-engine-package-design.md` | The pipeline engine all four surfaces run on |
| `source_material/jodie_convo.md` | Raw notes from the NationSearch owner interview |
| `source_material/background_check_notes.md` | Expanded background-check requirements |
| `source_material/incorrect_prd.md` | Superseded — named as incorrect; do not use |
| `recruiter-company-applicant-prototype.html` | Clickable prototype (March) |
| `nationsearch-prototype.html` | Clickable prototype (March) |

**Build reality** established by reading the implementation, plus the `/office` ATS
audit of 2026-08-03 — epic [#539](https://github.com/Scaffald/SaaS/issues/539),
children #524–#538, all thirteen children now closed. The audit's summary was *"a
good database, a good UI, and no wire between them"*; the wire is in. What remains is
that the UI was drawn against mock data and never revisited once real data arrived —
which is what §12 is a list of.

**Key implementation files**

```
apps/scaffald/app/(admin)/office/applications/    routes
apps/scaffald/app/(admin)/office/ats/             routes
packages/scf-core/features/office/applications/   pipeline, cards, detail, metrics
packages/scf-core/features/office/scheduling/     interview scheduling
packages/scf-core/features/office/compliance/     EEO
packages/scf-core/features/background-check/      employer-side checks
packages/scf-core/features/inquiries/             the inquiry instrument
packages/scf-core/features/applications/          applicant side
packages/ui/src/components/                       design system
```
