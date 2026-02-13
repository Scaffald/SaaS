---
sidebar_position: 30
---

# Tooltip

Contextual help text that appears on hover or focus. Accessible and customizable.

## Import

```tsx
import { Tooltip } from '@scaffald/ui';
```

## Basic Usage

```tsx
import { Tooltip } from '@scaffald/ui';

export default function Example() {
  return (
    <Tooltip>
      Content
    </Tooltip>
  );
}
```

## Props

See the [TypeScript definitions](https://github.com/Scaffald/ui/blob/main/src/components/Tooltip/Tooltip.tsx) for the complete props API.

### Common Props

All Tooltip components accept standard React Native [`View` props](https://reactnative.dev/docs/view#props).

## Variants

See component props for available variants.

## Examples

### Advanced Usage

```tsx
// Example implementation
<Tooltip variant="default">
  Example content
</Tooltip>
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
