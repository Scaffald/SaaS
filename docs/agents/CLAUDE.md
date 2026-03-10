# CLAUDE.md

> **Canonical Source**: All project-specific context lives in `AGENTINFO.md`. Read/update that file first; this file adds Claude-specific guidance.

## Radium Docs (.radium/)

Before modifying code in any area, **READ the corresponding pillar doc first**.

| Pillar | Doc | Top Constraint |
|--------|-----|---------------|
| @scaffald/ui | `.radium/scaffald-ui.md` | `colors.bg[theme]` not `colors.background[theme]` |
| @scaffald/sdk | `.radium/scaffald-sdk.md` | Always spread `UseMutationOptions` |
| Expo & Core App | `.radium/app-expo.md` | Never conditional-render navigator wrappers |
| Supabase & Backend | `.radium/supabase-backend.md` | Migrations are sequential, never modified |
| CI & Deployment | `.radium/ci-deployment.md` | `@hookform/resolvers` ~3.1.0 only |

## Pre-Edit Checklist

Before modifying any file:
1. Identify which pillar the file belongs to → read that `.radium/` doc
2. Editing UI components or tokens? → `.radium/scaffald-ui.md`
3. Creating/editing SDK hooks? → `.radium/scaffald-sdk.md`
4. Editing app routes or layouts? → `.radium/app-expo.md`
5. Editing edge functions or migrations? → `.radium/supabase-backend.md`
6. Editing build config, CI, or dependencies? → `.radium/ci-deployment.md`

## References

- **Project-Specific Info**: See `AGENTINFO.md` for complete project context
- **Cursor Rules**: See `.cursor/rules/` directory for development rules
- **Anthropic Best Practices**: https://www.anthropic.com/engineering/claude-code-best-practices
