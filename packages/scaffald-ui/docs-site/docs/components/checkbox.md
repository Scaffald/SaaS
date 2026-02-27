---
sidebar_position: 5
---

# Checkbox

Boolean selection control for forms. Supports intermediate state and custom styling.

## Import

```tsx
import { Checkbox } from '@scaffald/ui';
```

## Basic Usage

```tsx
import { Checkbox } from '@scaffald/ui';

export default function Example() {
  return (
    <Checkbox>
      Content
    </Checkbox>
  );
}
```

## Props

See the [TypeScript definitions](https://github.com/Scaffald/ui/blob/main/src/components/Checkbox/Checkbox.tsx) for the complete props API.

### Common Props

All Checkbox components accept standard React Native [`View` props](https://reactnative.dev/docs/view#props).

## Variants

See component props for available variants.

## Examples

### Advanced Usage

```tsx
// Example implementation
<Checkbox variant="default">
  Example content
</Checkbox>
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
