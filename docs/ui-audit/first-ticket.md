## Ticket: Getting Started • UI Audit (Bootstrap)

Title
- Getting Started: Initialize UI Audit for {userLevel}

Description
- Prepare the environment for the UI audit.
- Follow these steps:

Steps
1) From the repository root, run:

```bash
node CONTEXT_CACHE/ui-audit-bootstrap.mjs --user-level {userLevel}
```

2) If prompted to add `CONTEXT_CACHE/` to `.gitignore`, do that and rerun the script.
3) If Vibe-Kanban is not running, open a new terminal and run:

```bash
npx vibe-kanban
```

4) When the bootstrap completes, proceed with the DISCOVERY ticket for `{userLevel}`.

References
- Plan: `docs/testing/generalized-ui-testing-plan.md`
- Bootstrap script: `CONTEXT_CACHE/ui-audit-bootstrap.mjs`
- DB schema: `CONTEXT_CACHE/schema.sql`


