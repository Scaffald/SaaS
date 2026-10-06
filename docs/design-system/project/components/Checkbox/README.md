# Checkbox

A binary or indeterminate choice with its label beside it; a tree of them is `CheckboxTree`. Hand-written from `packages/ui/src/components/Checkbox`.

- **Sizes** md 20px with `radius-xs`, sm 16px with `radius-xxxs`; a 1.5px border.
- **Colour** unchecked is `white` (transparent in dark) with `border-default`; checked `primary` fills `primary-600` with a white check (`gray` fills `gray-700`); hover on an unchecked box tints `gray-50`. Error is `border-error`, filled `error-600`. Disabled checked is `primary-200`.
- **Label** `small-medium` `text-primary`; helper text `small` `text-tertiary`; `optional` appends "(optional)".
- The consumer supplies `checked` / `indeterminate`, `onChange`, `label` and an `accessibilityLabel` when there is no visible label.
