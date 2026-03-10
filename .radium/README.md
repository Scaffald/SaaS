# Radium — Per-Pillar Constraint Documentation

Radium docs are constraint references that AI agents (Claude Code, Cursor, etc.) **must read before modifying code** in the corresponding area.

## Why This Exists

AI agents infer patterns from source files and frequently get them wrong at scale. These docs provide explicit, scannable constraints so agents don't have to guess. One doc per pillar replaces 15K+ tokens of file exploration with a 2-3K token constraint reference.

## Structure

Each doc covers one major pillar of the application:

| Pillar | File | Scope |
|--------|------|-------|
| @scaffald/ui | `scaffald-ui.md` | UI components, tokens, styling |
| @scaffald/sdk | `scaffald-sdk.md` | SDK hooks, mutations, cache patterns |
| Expo & Core App | `app-expo.md` | App routes, layouts, navigation, auth |
| Supabase & Backend | `supabase-backend.md` | Edge functions, migrations, RLS |
| CI & Deployment | `ci-deployment.md` | Build config, version pins, CI |

## When to Update

- **Bug fix from agent misunderstanding?** Update the relevant `.radium/` doc in the same PR.
- **New non-obvious constraint discovered?** Add it to the appropriate pillar doc.
- **Quarterly:** Review `last_verified` dates; re-verify docs older than 90 days.

## When to Create a New Doc

If a feature area:
1. Has caused bugs from agent misunderstanding, AND
2. Doesn't fit cleanly into an existing pillar doc

Then create a new `.radium/<feature>.md` using `_template.md`.

## Frontmatter Schema

Every doc has YAML frontmatter with at minimum:

```yaml
---
pillar: <name>
status: active | migrating | deprecated
last_verified: YYYY-MM-DD
packages:
  - <package paths this pillar covers>
key_files:
  - <critical files agents should know about>
critical_constraints:
  - <one-line constraints agents MUST follow>
---
```

## Integration

- **Claude Code**: `docs/agents/CLAUDE.md` contains a lookup table pointing to these docs
- **Cursor**: `.cursor/rules/radium-lookup.mdc` references these docs
- **Verification**: `pnpm radium:check` runs grep-based constraint validation
