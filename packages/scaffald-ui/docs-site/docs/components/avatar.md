---
sidebar_position: 34
---

# Avatar

User profile image component with fallback initials. Supports different sizes and shapes.

## Import

```tsx
import { Avatar } from '@scaffald/ui';
```

## Basic Usage

```tsx
import { Avatar } from '@scaffald/ui';

export default function Example() {
  return (
    <Avatar>
      Content
    </Avatar>
  );
}
```

## Props

See the [TypeScript definitions](https://github.com/Scaffald/ui/blob/main/src/components/Avatar/Avatar.tsx) for the complete props API.

### Common Props

All Avatar components accept standard React Native [`View` props](https://reactnative.dev/docs/view#props).

## Variants

See component props for available variants.

## Examples

### Advanced Usage

```tsx
// Example implementation
<Avatar variant="default">
  Example content
</Avatar>
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
