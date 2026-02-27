# Why Beyond-UI?

Beyond-UI (`@unicornlove/beyond-ui`) is the UI library for the design system. This doc summarizes why it exists and how it compares to the previous UI package.

## Goals

- **Minimal dependencies** – No heavy chart/editor/DnD runtimes in core. Optional or peer deps for maps, rich text, phone formatting, etc.
- **Token-first** – Colors, spacing, typography, and shadows come from design tokens (Figma Forsured Design System). No theme compiler; just tokens and inline styles.
- **Migration path** – API and component coverage aligned so apps can move from `@unicornlove/ui` to `@unicornlove/beyond-ui` incrementally. See [MIGRATION.md](../MIGRATION.md).
- **Open-source friendly** – Fewer proprietary or heavy dependencies; CONTRIBUTING, CHANGELOG, and clear docs.

## Comparison: previous UI package vs Beyond-UI

| Aspect | Previous (@unicornlove/ui) | @unicornlove/beyond-ui |
|--------|----------------------------|-------------------------|
| **Runtime deps** | Heavy (theme compiler, table, editor, DnD, etc.) | Minimal (e.g. lucide-react-native); optional/peer for maps, rich text, DnD |
| **Theme** | Theme-builder, HSL-based | Token-based (colors, spacing, typography, borders, shadows, breakpoints) |
| **Styling** | Stack components, `$tokens` | Inline styles + style factories, same tokens |
| **Layout** | Stack-based | Stack, Row, Grid, Box |
| **Responsive** | useWindowDimensions, media in config | useResponsive, useWindowDimensions, Show/Hide, Grid |
| **Platform** | .native / .web file splits | Platform.OS and optional .web files |

Beyond-UI adds **accessibility** (FocusGuard, LiveRegion, SkipLink, useFocusTrap, useFocusRing), **animation** (AnimatedView, transitions, spring/timing configs), **form** (Fieldset, FormField, FormRow, FormActions), **CommandMenu**, **Sidebar**, **Stepper**, **PasswordStrength**, and others, while staying dependency-light.

## When to use Beyond-UI

- You want a **smaller bundle** and fewer runtime dependencies.
- You prefer **tokens + inline styles** over a theme compiler.
- You are **migrating** from @unicornlove/ui and want a documented path.
- You need **cross-platform** (React Native + web) with a minimal dependency footprint.

## Further reading

- [ARCHITECTURE.md](../ARCHITECTURE.md) – Design principles, tokens, component structure.
- [CONTRIBUTING.md](../CONTRIBUTING.md) – How to contribute.
