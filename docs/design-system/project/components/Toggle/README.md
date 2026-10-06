# Toggle

An on/off switch that takes effect immediately; use a Checkbox when the choice is submitted with a form. Hand-written from `packages/ui/src/components/Toggle`.

- **Sizes** md 44 × 24 with a 20px thumb, sm 36 × 20 with a 16px thumb; 2px thumb inset; `radius-max`.
- **Colour** `primary` track is `gray-300` off and `primary-500` on (hover one step darker); `gray` is `gray-300` / `gray-600`; `red-green` is `error-500` / `success-500` for a state that is truly good-or-bad. The thumb is always `white`.
- **Motion** the thumb springs (`snappy`) and gives light haptic feedback on native; reduced motion snaps.
- **Disabled** track becomes `bg-disabled` with a `border-disabled` edge; label `text-disabled`.
- The consumer supplies `checked`, `onChange`, `label`, optional `helperText`, and `accessibilityLabel` when unlabelled.
