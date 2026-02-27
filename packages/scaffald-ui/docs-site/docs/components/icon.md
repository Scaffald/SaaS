---
sidebar_position: 36
---

# Icon

Vector icon component with 1000+ icons from Lucide. Themeable and accessible.

## Import

```tsx
import { Icon } from '@scaffald/ui';
```

## Basic Usage

```tsx
import { Icon } from '@scaffald/ui';

export default function Example() {
  return (
    <Icon>
      Content
    </Icon>
  );
}
```

## Props

See the [TypeScript definitions](https://github.com/Scaffald/ui/blob/main/src/components/Icon/Icon.tsx) for the complete props API.

### Common Props

All Icon components accept standard React Native [`View` props](https://reactnative.dev/docs/view#props).

## Variants

See component props for available variants.

## Examples

### Advanced Usage

```tsx
// Example implementation
<Icon variant="default">
  Example content
</Icon>
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
