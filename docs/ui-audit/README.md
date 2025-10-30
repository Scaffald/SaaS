## UI Auditing Kit

This kit provides a scalable, SQLite-driven workflow to discover routes, audit UI behavior, and implement comprehensive Playwright tests with minimal ticket churn and strong parallelization.

### Why this approach

- Local SQLite registry prevents duplicate work via UNIQUE constraints
- "Right-time" ticket creation lets agents start as soon as a route is discovered
- Batch creation + sharded workers maximize throughput without race conditions
- Minimal ticket bodies with linked artifacts keep MCP token usage low

### Quick start

1) Ensure you're at the repository root
2) Run the bootstrap script:

```bash
node CONTEXT_CACHE/ui-audit-bootstrap.mjs --user-level regular
```

This will:
- Initialize `CONTEXT_CACHE/ui_audit.db` (via `sqlite3` if available)
- Verify `.gitignore` contains `CONTEXT_CACHE/`
- Remind you to start Vibe-Kanban (`npx vibe-kanban`) if not already running

### Ticket lifecycle (high level)

- Discovery (per user level): crawl UI, UPSERT normalized routes in SQLite (status='discovered')
- Right-time emission: create AUDIT-ROUTE tickets immediately for new routes (status → 'audit_queued')
- Audit (per route): deep dive + sub-route discovery; on complete set status='audited'
- Test batching: create TEST tickets for audited routes (status → 'test_queued')
- Test implementation: write and stabilize tests; on pass set status='tested'; on bug, create BUG and block

### Artifacts & docs

- Plan: `docs/testing/generalized-ui-testing-plan.md`
- Operational plan snapshot: `/general.plan.md`
- Bootstrap: `CONTEXT_CACHE/ui-audit-bootstrap.mjs`
- DB schema: `CONTEXT_CACHE/schema.sql`

### Normalization rules

- Lowercase, strip trailing slash
- Replace volatile segments with tokens: `/users/123` → `/users/:id`

### Concurrency & claiming

- All DB transitions done atomically with UPSERT + guarded updates
- Agents claim work by transitioning status to `*_in_progress` with a lease

### Creating the first ticket

See `docs/ui-audit/first-ticket.md` for a ready-to-use DISCOVERY ticket template.


