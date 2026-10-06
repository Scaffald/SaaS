# Tabs

The primary partition of a list screen — folder tabs beside the search field and the "Filters & sort" flyout. Hand-written from `packages/ui/src/components/Tabs`.

- **Types** `line` (2px indicator under the selected trigger, 1px `border-default` rail), `default` (selected trigger fills `bg-emphasis`, `radius-xs`), `shadow` (selected trigger lifts on `bg-default` with `shadow-tabs`).
- **Sizes** sm 32px, md 36px, lg 44px; padding 16 horizontal, 6 / 8 / 12 vertical. Labels are `small-medium` at every size.
- **Colour** `primary` selected is `primary-600` text and indicator (6.7:1 on white; dark uses `primary-300`), `gray` selected is `text-primary`. Unselected is `text-tertiary`; hover `bg-subtle`; disabled `text-disabled`.
- **Layout** horizontal or vertical (vertical triggers are 115 / 125 / 136 wide with a right-edge indicator); `scrollable` for long sets; `fullWidth` or `triggerSizing="equal"` to share the rail.
- Compose `Tabs` → `Tabs.Item value` → `Tabs.Trigger` + `Tabs.Content`. The consumer supplies values, labels and `onValueChange`.
