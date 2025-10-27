# Scaffald Styleguide

A Bootstrap 2-inspired component gallery built on top of the Expo + Tamagui stack.

## Local development

```bash
pnpm install
pnpm --filter expo-app styleguide:audit
pnpm --filter expo-app web
```

Open [http://localhost:8081/styleguide](http://localhost:8081/styleguide) to browse the docs.

## Updating the audit report

The audit metadata powers the approval queue and tech stack summary. Regenerate it whenever dependencies or component exports change:

```bash
pnpm --filter expo-app styleguide:audit
```

## Structure

- `app/styleguide/_components` — Styleguide-only primitives (layout shell, code blocks).
- `app/styleguide/_data` — Generated audit report + navigation metadata.
- `app/styleguide/**` — MDX-style TSX pages grouped by section.

## Outstanding work

Refer to the **Approval Queue** page inside the styleguide for pending TODOs before shipping to production.
