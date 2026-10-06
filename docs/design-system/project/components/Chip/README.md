# Chip

A pill for one high-frequency filter dimension or a removable active filter; everything else lives in the "Filters & sort" flyout. Hand-written from `packages/ui/src/components/Chip`.

- **Sizes** sm 24px, md 28px, lg 32px; padding 6 / 8 / 10; icon 16 / 18 / 20; labels are `caption` (sm) or `small` (md, lg) at weight 500.
- **Shape** `radius-max`, 1px `border-default`, `bg-default`; hover `bg-subtle`.
- **Selected** inverts: `text-primary` fill with `text-inverse` label (18.8:1 in both themes). Disabled is 0.4 opacity.
- **Types** `default` · `icon` · `avatar` · `flag` · `brand-icon` · `crypto` change only the leading slot; `closeIcon` adds the 10px × and `onClose`.
- The consumer supplies the label, `selected`, `onPress`, and the leading element for non-default types.
