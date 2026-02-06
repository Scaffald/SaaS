# Why Beyond-UI?

Beyond-UI (`@unicornlove/beyond-ui`) is the next-generation UI library for the same design system as `@unicornlove/ui`. This doc summarizes why it exists and how it compares to the Tamagui-based UI package.

## Goals

- **Minimal dependencies** – No Tamagui, no heavy chart/editor/DnD runtimes in core. Optional or peer deps for maps, rich text, phone formatting, etc.
- **Token-first** – Colors, spacing, typography, and shadows come from design tokens (Figma Forsured Design System). No theme compiler; just tokens and inline styles.
- **Migration path** – API and component coverage aligned so apps can move from `@unicornlove/ui` to `@unicornlove/beyond-ui` incrementally. See [MIGRATION.md](../MIGRATION.md).
- **Open-source friendly** – Fewer proprietary or heavy dependencies; CONTRIBUTING, CHANGELOG, and clear docs.

## Comparison: Tamagui-based UI vs Beyond-UI

| Aspect | @unicornlove/ui (Tamagui) | @unicornlove/beyond-ui |
|--------|----------------------------|-------------------------|
| **Runtime deps** | Tamagui, @dnd-kit, @tanstack/react-table, @tiptap, awesome-phonenumber, react-dropzone, moti, etc. | Minimal (e.g. lucide-react-native); optional/peer for maps, rich text, DnD |
| **Theme** | Tamagui theme-builder, scaffald-theme (HSL) | Token-based (colors, spacing, typography, borders, shadows, breakpoints) |
| **Styling** | XStack, YStack, `$tokens` | Inline styles + style factories, same tokens |
| **Layout** | Tamagui stacks | Stack, Row, Grid, Box |
| **Responsive** | useWindowDimensions, media in config | useResponsive, useWindowDimensions, Show/Hide, Grid |
| **Platform** | .native / .web file splits | Platform.OS and optional .web files |

Beyond-UI adds **accessibility** (FocusGuard, LiveRegion, SkipLink, useFocusTrap, useFocusRing), **animation** (AnimatedView, transitions, spring/timing configs), **form** (Fieldset, FormField, FormRow, FormActions), **CommandMenu**, **Sidebar**, **Stepper**, **PasswordStrength**, and others, while staying dependency-light.

## When to use Beyond-UI

- You want a **smaller bundle** and fewer runtime dependencies.
- You prefer **tokens + inline styles** over a theme compiler.
- You are **migrating** from @unicornlove/ui and want a documented path.
- You need **cross-platform** (React Native + web) without locking into Tamagui’s stack.

## When the Tamagui-based UI may still fit

- You rely heavily on **Tamagui’s theme/compiler** and don’t plan to move off it.
- You need a **specific Tamagui-only feature** that beyond-ui doesn’t yet mirror.

## Further reading

- [ARCHITECTURE.md](../ARCHITECTURE.md) – Design principles, tokens, component structure.
- [MIGRATION.md](../MIGRATION.md) – Migrating from @unicornlove/ui to beyond-ui.
- [CONTRIBUTING.md](../CONTRIBUTING.md) – How to contribute.
