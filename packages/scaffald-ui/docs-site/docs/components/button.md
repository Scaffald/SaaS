---
sidebar_position: 1
---

# Button

Interactive button component with multiple variants and sizes. Supports icons, loading states, and accessibility features.

## Import

```tsx
import { Button } from '@scaffald/ui';
```

## Basic Usage

```tsx
import { Button } from '@scaffald/ui';

export default function Example() {
  return (
    <Button variant="filled" color="primary">
      Click Me
    </Button>
  );
}
```

## Props

See the [TypeScript definitions](https://github.com/Scaffald/ui/blob/main/src/components/Button/Button.tsx) for the complete props API.

### Common Props

All Button components accept standard React Native [`View` props](https://reactnative.dev/docs/view#props).

## Variants

### Visual Variants

- `filled` (default) - Solid background button
- `outline` - Outlined button with transparent background
- `ghost` - Minimal button with no background
- `text` - Text-only button

### Sizes

- `sm` - Small button
- `md` (default) - Medium button
- `lg` - Large button

## Examples

### With Icon

```tsx
// Example: multiple variants
<Stack gap={12} direction="row" flexWrap="wrap">
  <Button variant="filled" color="primary">Filled</Button>
  <Button variant="outline" color="primary">Outline</Button>
  <Button variant="ghost" color="primary">Ghost</Button>
</Stack>
```

## Accessibility

- ✅ Keyboard navigation support
- ✅ Screen reader compatible
- ✅ ARIA attributes included
- ✅ Focus management

## Design Tokens

This component uses the following design tokens:

- Colors: `colors.{semantic}.{theme}.{variant}`
- Spacing: `spacing.*`
- Typography: `typography.*`

See [Design Tokens](../tokens/overview) for more information.

## Related Components

- [Link](./link)
- [IconButton](./iconbutton)
- [ButtonGroup](./buttongroup)

## Changelog

See [GitHub Releases](https://github.com/Scaffald/ui/releases) for version history.
