# StatusIndicator

A labelled status mark — the label is mandatory, so colour is never the only cue. Hand-written from `packages/ui/src/components/StatusIndicator`.

- **Types** `success` (moss `success-500`), `caution` (`warning-500`), `error` (`error-600`), `in-progress` (`primary-500`), `help` (`gray-500`), `undefined` (purple, from the Figma source; avoid in product UI).
- **Variants** `blank` (mark and label only), `light` (ramp-50 wash), `outline` (ramp border), `filled` (ramp fill with white mark and label — only `error-600` and `success-500` clear 4.5:1 with white; `caution` filled is 2.9:1, so use `light` or `outline` for amber).
- **Mark** `iconType` `dot` (8px), `filled` or `linear` glyph. Label is `small-medium` in `text-secondary` (`white` on `filled`).
- Use `in-progress` for a stage in motion and `caution` for a warning; an over-SLA case is a `text-attention` figure, not a status indicator.
- The consumer supplies `type`, `variant`, `iconType` and the `label`.
