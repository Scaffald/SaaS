# Card

A content surface for when a group of things genuinely needs its own ground; hairlines and whitespace come first. Hand-written from `packages/ui/src/components/Card`.

- **Variants** `elevated` (default; `shadow-xs` / `shadow-s` / `shadow-m` for elevation sm / md / lg, `shadow-soft` for the airy dashboard card), `outlined` (1px `border-subtle`, no shadow), `filled` (`bg-subtle`), `glass` (`bg-glass`, `border-ghost`, blur on web).
- **Surface** `surface-card`: white in light, `gray-750` in dark so inputs inside read as inset.
- **Padding** none · 8 · 12 · 16 · 24 · 32 (`sm` … `2xl`). **Radius** every named radius resolves to `radius-l` (7px) except the source's literal `xl` 20 and `3xl` 32, which are iOS-style and not interface steps.
- **Pressed** 0.9 opacity and 0.98 scale when `pressable`; disabled is 0.6 opacity.
- Compose with `Card.Header` (title `h4`, subtitle, trailing action), `Card.Content`, `Card.Footer` (aligned left / center / right / space-between) and `Card.Media`. The consumer supplies children; never a hard-coded background.
