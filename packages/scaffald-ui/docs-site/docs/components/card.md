---
sidebar_position: 31
---

# Card

Container component for grouping related content. Supports headers, footers, and various visual styles.

## Import

```tsx
import { Card } from '@scaffald/ui';
```

## Basic Usage

```tsx
import { Card } from '@scaffald/ui';

export default function Example() {
  return (
    <Card>
      <Text>Card Content</Text>
    </Card>
  );
}
```

## Props

See the [TypeScript definitions](https://github.com/Scaffald/ui/blob/main/src/components/Card/Card.tsx) for the complete props API.

### Common Props

All Card components accept standard React Native [`View` props](https://reactnative.dev/docs/view#props).

## Variants

See component props for available variants.

## Examples

### Advanced Usage

```tsx
// Example implementation
<Card variant="default">
  Example content
</Card>
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

- [Container](./container)
- [Divider](./divider)

## Changelog

See [GitHub Releases](https://github.com/Scaffald/ui/releases) for version history.
