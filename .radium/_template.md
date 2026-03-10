---
pillar: <name>
status: active
last_verified: YYYY-MM-DD
packages:
  - <package paths this pillar covers>
key_files:
  - <critical files agents should know about>
critical_constraints:
  - <one-line constraints agents MUST follow>
---

# <Pillar Name>

## Overview

Brief description of what this pillar covers and why agents need this doc.

## Constraints

### Constraint Name
**Rule:** One-line rule statement.

**Why:** What goes wrong if this is violated.

**Correct:**
```typescript
// correct pattern
```

**Wrong:**
```typescript
// incorrect pattern
```

## Key Files

| File | Purpose |
|------|---------|
| `path/to/file` | What it does |

## Patterns

### Pattern Name
Description and code examples of the canonical way to do things in this pillar.
