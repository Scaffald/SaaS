<!-- 52e617f9-9787-4dd2-958b-a2a5b79d8df7 09257435-db96-4381-b9c1-de5e4c6b5c39 -->
## Generalized UI Testing Plan (Framework-Agnostic)

### Goal

Create a scalable, ticket-driven Playwright workflow to discover routes, audit UIs, and ship reliable tests. Optimize for parallelism, avoid duplicate work, and offer clear guidance when encountering blockers.

### Principles

- Single source of truth for routes (code or sitemap) + runtime discovery via UI traversal
- Ticket-per-route granularity for parallel execution
- File-based de-dupe cache to avoid searching the task system repeatedly
- Clear decision tree for bugs vs. test adjustments vs. human escalation

### Shared Conventions

- Ticket naming: HELPER-###, AUDIT-###, TEST-R### (Regular), TEST-A### (Admin), TEST-SA### (Super Admin), BUG-####
- File cache for de-dupe: `CONTEXT_CACHE/UI_AUDIT/{USER_LEVEL}/{normalized/route}/route.txt` storing taskId
- Existence of `route.txt` = ticket exists (no need to read file)
- Cleanup task removes `CONTEXT_CACHE/*` at the end
- Add `CONTEXT_CACHE/` to .gitignore

### Phases

#### Phase 1: playwright-discover-routes

Purpose: Systematically discover navigable routes for a user level and spawn per-route audit + test tickets.

- Inputs: `userLevel`, `baseUrl`
- Steps:
  1) Seed candidates from route constants or sitemap if available; otherwise start from known entry points.
  2) Authenticate for the specified user level (helpers/fixtures).
  3) Traverse UI and click all likely navigations: links, buttons, cards, list rows, breadcrumbs, modal actions.
  4) Normalize dynamic URLs (e.g., `/users/123` → `/users/:id`).
  5) For each new route:
     - If `route.txt` missing → create `AUDIT-ROUTE` + `TEST-<UserLevel>` tickets; write `route.txt` with created taskId.
     - If exists → skip creating duplicates.
  6) Create BUG-#### for product defects (e.g., 404/500 on intended routes).
  7) Update the parent AUDIT ticket with a concise checklist (route → created ticket IDs).
- Outputs: Route list, created tickets, bug tickets, cache entries.

##### Task Prompt: playwright-discover-routes (Agent Template)

Inputs

- userLevel: one of "regular" | "admin" | "super-admin"
- baseUrl: string (e.g., http://localhost:8081)

Operational Rules

- Use authenticated session for `userLevel`.
- Normalize dynamic routes (e.g., numeric IDs → `:id`).
- Before creating tickets, check `CONTEXT_CACHE/UI_AUDIT/{USER_LEVEL}/{normalized/route}/route.txt` existence. If present, skip creation.
- When creating tickets, write the primary task ID to `route.txt`.

Checklist

- Seed from code routes or sitemap if available, else explore from dashboard entry.
- Visit pages, enumerate clickable navigations (including within modals) and follow them.
- Record each unique route (normalized) discovered.
- For each new route: create AUDIT-ROUTE + TEST-* tickets; add to parent AUDIT checklist.
- File BUG tickets for 404/500 or broken navigations.

Required Output (JSON)

```json
{
  "userLevel": "regular",
  "baseUrl": "http://localhost:8081",
  "routesDiscovered": ["/dashboard", "/dashboard/profile/general", "/users/:id"],
  "ticketsCreated": [
    {"route": "/dashboard", "auditId": "AUDIT-201", "testId": "TEST-R015"},
    {"route": "/users/:id", "auditId": "AUDIT-202", "testId": "TEST-R016"}
  ],
  "bugs": [
    {"route": "/discover/jobs", "bugId": "BUG-0005", "status": "open", "severity": "high"}
  ],
  "cacheWrites": [
    "CONTEXT_CACHE/UI_AUDIT/regular/dashboard/route.txt",
    "CONTEXT_CACHE/UI_AUDIT/regular/users/:id/route.txt"
  ]
}
```

#### Phase 2: playwright-audit-route

Purpose: Deeply document one route and backstop discovery for nested/linked routes.

- Inputs: `userLevel`, `routePath`, `baseUrl`, linked ticket IDs
- Steps:
  1) Ensure `route.txt` exists (create if missing with this ticket id).
  2) Navigate via documented path and enumerate:
     - Purpose & flow, UI elements, forms/fields (+ validation), buttons/links/modals, lists/tables, filters/search, states (empty/loading/error/success), accessibility notes, data needs.
  3) Click through all sub-navigations on the page (including modals) and repeat de-dupe creation if new routes are found.
  4) Update the linked TEST ticket with coverage checklist, interactions, edge cases, dependencies, data requirements.
  5) Create BUG-#### for product defects; mark related test tickets blocked.
- Outputs: Updated TEST ticket, optional new route tickets, bug tickets.

##### Task Prompt: playwright-audit-route (Agent Template)

**⚠️ IMPORTANT**: For detailed templates and improved instructions, see `docs/testing/route-task-review.md`

Inputs

- userLevel: "regular" | "admin" | "super-admin"
- routePath: normalized path (e.g., "/dashboard/profile/skills")
- baseUrl: string (default: http://localhost:8081)
- linkedTestId: string (TEST-*) - may need to be created
- userEmail: "zach@unicorn.love" (super-admin) | "ewongagent@gmail.com" (admin) | test user (regular)

Checklist

- **Use Playwright MCP tools** to explore the route (not standard Playwright API)
- Authenticate as the specified user email for the user level
- Confirm or write `route.txt` for this route
- **Document ALL Playwright MCP commands used** in a command log
- Fully and comprehensively investigate ALL features:
  - All UI elements (forms, buttons, links, tables, modals, etc.)
  - All interactive features (clicks, form submissions, navigation)
  - All states (empty, loading, error, success)
  - All edge cases and error handling
- Exercise all sub-navigation (including modal actions) and spawn tickets for newly discovered routes not in cache
- **Create TEST ticket** with comprehensive instructions:
  - File location (`tests/{userLevel}/{normalizedRoutePath}.spec.ts`)
  - How to run the test
  - Verification checklist
  - Branch information (merge into `bernier-playwright`)
  - Reference to Playwright command log
- Create BUG tickets with repro and severity when defects block coverage
- **Set blocking relationships**: BUG tickets block TEST tickets; update TEST ticket to indicate blocking

Required Output (JSON)

```json
{
  "route": "/dashboard/profile/skills",
  "auditNotes": {
    "elements": ["skill tags input", "save button"],
    "states": ["empty", "loading", "success"],
    "dataNeeds": ["profile complete", "at least 1 skill"]
  },
  "subRoutesCreated": [
    {"route": "/dashboard/profile/certifications", "auditId": "AUDIT-205", "testId": "TEST-R018"}
  ],
  "testTicketUpdated": "TEST-R017"
}
```

#### Phase 3: playwright-write-test

Purpose: Implement and stabilize tests for the route.

- Inputs: `userLevel`, `routePath`, `testFilePath`, linked tickets
- Steps:
  1) Verify blockers resolved (HELPER tasks, data, auth state).
  2) Author tests under `tests/{userLevel}/{normalized/route}.spec.ts`:
     - Setup/auth fixtures, navigation path, coverage checklist, edge cases, state checks, basic a11y.
  3) Run tests; if failing, observe actual UI (selectors, flow) and adapt the test unless it’s a product bug.
  4) If bug: create BUG-####, mark this ticket `todo` + `blocked by` the bug; add reproduction and logs.
  5) Update TEST ticket with file paths, commands, and status.
- Outputs: Passing tests; updated TEST ticket.

##### Task Prompt: playwright-write-test (Agent Template)

Inputs

- userLevel: "regular" | "admin" | "super-admin"
- routePath: normalized path
- testFilePath: repo-relative path
- linkedAuditId: string
- linkedTestId: string

Checklist

- Ensure HELPER tasks and data preconditions are satisfied.
- Implement navigation and coverage steps described in the linked audit.
- Prefer resilient selectors (roles, labels, testIds when available) and robust waits tied to user-visible states.
- If encountering defects, create BUG and set current ticket to `todo` + `blocked by` BUG.
- Update TEST ticket with file path and run commands.

In-Review Checklist

- Test passes locally and is deterministic.
- Coverage checklist items are implemented or explicitly justified if skipped.
- Linked BUGs, if any, are referenced in the TEST ticket and block appropriately.
- CI-friendly: no hard sleeps; uses locators and expected states.

Required Output (JSON)

```json
{
  "route": "/dashboard/profile/skills",
  "testFile": "tests/regular/dashboard/profile/skills.spec.ts",
  "status": "passing",
  "blockedBy": []
}
```

### Issue Handling Decision Tree

- Failure due to UI mismatch (labels, DOM changes):
  - Adjust selectors/flows; keep tests resilient (roles, labels, testIds when available).
- Failure due to flaky timing/state:
  - Add robust waits tied to user-visible states (not arbitrary sleeps), retry only when justified.
- Failure due to product defect:
  - Create BUG-#### with repro steps, expected vs. actual, severity, logs; block test ticket.
- Unclear expected behavior or ambiguous UX:
  - Add “Open Questions” to the ticket and set `needs-human`; proceed only after clarification.
- Missing data prerequisites:
  - Add data setup notes to the ticket; create HELPER/Data tickets if reusable.

### Parallelization & De-dupe

- DISCOVERY creates many `AUDIT-ROUTE` + `TEST-*` stubs early for parallel pickup.
- All agents check `route.txt` existence before creating tickets.
- Parent AUDIT ticket maintains a concise checklist linking child tasks.

### Ticket Templates

#### TEST-* (Stub at discovery)

Title: `TEST-R###: {UserLevel} • {routePath} — Comprehensive Playwright tests`

Description:

- Discovered in `{AUDIT-ID}`
- Blocking Dependencies: HELPER-002 (login), HELPER-004 (ensureProfileComplete), etc.
- Navigation Path: TBD (to be filled during route audit)
- Coverage Checklist: TBD
- Edge Cases: TBD

#### AUDIT-ROUTE (Per route)

**⚠️ See `docs/testing/route-task-review.md` for comprehensive template**

Title: `AUDIT-###: {UserLevel} • {routePath} — Comprehensive UI exploration using Playwright MCP`

Description Must Include:

- **User credential**: zach@unicorn.love (super-admin) | ewongagent@gmail.com (admin) | test user (regular)
- **Purpose & flow**: What this route does
- **Comprehensive investigation checklist**: All UI elements, interactions, states, data needs
- **Playwright MCP command log**: Document every command used during exploration
- **Sub-route discovery**: Spawn tickets for newly discovered routes
- **TEST ticket creation**: Create with full instructions (file location, how to run, branch info)
- **BUG handling**: Create BUG tickets for defects; set blocking relationships

#### BUG-####

- Steps to reproduce, expected vs actual, environment, logs, severity, impacted roles/routes.

### CONTEXT_CACHE Rules

- Location: `CONTEXT_CACHE/UI_AUDIT/{USER_LEVEL}/{normalized/route}/route.txt`
- Normalization: Replace volatile route segments (ids, uuids, slugs) with parameter tokens (e.g., `:id`). Use lowercase and strip trailing slashes.
- File contents: Write the primary created ticket ID (string). Presence = created; the content need not be read by agents.
- Concurrency: Creation should be attempted with a best-effort atomic write (create directory then write). If file exists, do not overwrite.
- Cleanup: At end of AUDIT cycle, remove `CONTEXT_CACHE/UI_AUDIT/*` safely.
- VCS: Ensure `.gitignore` includes `CONTEXT_CACHE/` to avoid commits.

### Parent AUDIT Mandate (Template)

- Parent ticket must:
  - Link to this plan (`docs/testing/generalized-ui-testing-plan.md`).
  - Require child agents to use the `CONTEXT_CACHE` and de-dupe rules.
  - Track a checklist of routes with linked AUDIT and TEST IDs.
  - Enforce the decision tree for bugs vs test adjustments vs human help.

### Success Criteria

- All discovered routes have TEST tickets
- Each route audited with full coverage checklists
- Tests implemented and passing or correctly blocked by BUG tickets
- `CONTEXT_CACHE` cleaned up at end of cycle

### To-dos

- [x] Define playwright-discover-routes task prompt with inputs/outputs
- [x] Define playwright-audit-route task prompt with coverage template
- [x] Define playwright-write-test task prompt and in-review checklist
- [x] Document CONTEXT_CACHE rules and .gitignore entry
- [x] Add issue decision tree to guidance
- [x] Ensure parent AUDIT task references this plan and mandates usage


