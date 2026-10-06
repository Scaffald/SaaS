# Input

A labelled text field with helper text or an error beneath, built to fill its column. Hand-written from `packages/ui/src/components/Input`.

- **Shape** at least 40px tall, `radius-l` (7px), 1px `border-default`, `shadow-button` at rest (`classic` type); the `line` type has no radius. Padding 8 × 12; the leading / trailing icon is `icon-muted` at 18px.
- **Text** input and helper text are `small` (12.5/19); the label is `small-medium`. Helper text is `text-tertiary`; an error message is `error-500` (5.0:1 on white).
- **States** hover `border-muted`; focused `primary-600` border plus the `focus-primary` ring; error `border-error`; disabled `bg-disabled` with `text-disabled`. Dark inputs sit on `surface-input`, one shade darker than a card, so they read as inset.
- **Addon** an `externalAddon` ("https://") is a `bg-subtle` prefix cell sharing the border; the field loses its left radius.
- The consumer supplies `label`, `value` / `onChangeText`, `placeholder`, `helperText` or `errorMessage`, and `required`. Width comes from the column: do not fix it.
