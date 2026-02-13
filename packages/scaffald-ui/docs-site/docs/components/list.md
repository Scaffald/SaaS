---
sidebar_position: 33
---

# List

List component from Scaffald UI component library.

## Import

```tsx
import { List } from '@scaffald/ui';
```

## Basic Usage

```tsx
import { List } from '@scaffald/ui';

export default function Example() {
  return (
    <List>
      Content
    </List>
  );
}
```

## Props

See the [TypeScript definitions](https://github.com/Scaffald/ui/blob/main/src/components/List/List.tsx) for the complete props API.

### Common Props

All List components accept standard React Native [`View` props](https://reactnative.dev/docs/view#props).

## Variants

See component props for available variants.

## Examples

### Advanced Usage

```tsx
// Example implementation
<List variant="default">
  Example content
</List>
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
