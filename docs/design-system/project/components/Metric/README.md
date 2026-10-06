# Metric

MetricBlock is the one way a figure is presented anywhere: label above, figure, delta beneath. Hand-written from `packages/ui/src/components/Metric`.

- **Label** `h6` uppercase kicker in `text-tertiary`, tracked 1.2px. **Figure** `h2` (30/34) semibold, tabular numerals, `text-primary` — or `text-attention` when `emphasis` is set. **Delta** `small` in `text-tertiary`, `fg-success` for `positive`, `text-attention` for `attention`.
- **MetricRow** lays blocks out with `border-default` hairline rules between cells and above and below when `bordered`. Below 640px the cells stack and the rules turn horizontal, so no divider is ever orphaned at a wrap.
- `attention` means act on this (overdue, over-SLA); it is never the error colour.
- The consumer supplies `label`, `value` (string, number or a node), optional `delta`, `tone` and `emphasis`; `minColumnWidth` defaults to 140.
