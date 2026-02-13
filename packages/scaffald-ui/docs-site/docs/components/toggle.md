---
sidebar_position: 7
---

# Toggle

On/off switch component. Alternative to checkbox for boolean states.

## Import

```tsx
import { Toggle } from '@scaffald/ui';
```

## Basic Usage

```tsx
import { Toggle } from '@scaffald/ui';

export default function Example() {
  return (
    <Toggle>
      Content
    </Toggle>
  );
}
```

## Props

See the [TypeScript definitions](https://github.com/Scaffald/ui/blob/main/src/components/Toggle/Toggle.tsx) for the complete props API.

### Common Props

All Toggle components accept standard React Native [`View` props](https://reactnative.dev/docs/view#props).

## Variants

See component props for available variants.

## Examples

### Advanced Usage

```tsx
// Example implementation
<Toggle variant="default">
  Example content
</Toggle>
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
