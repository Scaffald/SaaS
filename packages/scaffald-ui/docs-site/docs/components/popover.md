---
sidebar_position: 41
---

# Popover

Popover component from Scaffald UI component library.

## Import

```tsx
import { Popover } from '@scaffald/ui';
```

## Basic Usage

```tsx
import { Popover } from '@scaffald/ui';

export default function Example() {
  return (
    <Popover>
      Content
    </Popover>
  );
}
```

## Props

See the [TypeScript definitions](https://github.com/Scaffald/ui/blob/main/src/components/Popover/Popover.tsx) for the complete props API.

### Common Props

All Popover components accept standard React Native [`View` props](https://reactnative.dev/docs/view#props).

## Variants

See component props for available variants.

## Examples

### Advanced Usage

```tsx
// Example implementation
<Popover variant="default">
  Example content
</Popover>
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

No related components.

## Changelog

See [GitHub Releases](https://github.com/Scaffald/ui/releases) for version history.
