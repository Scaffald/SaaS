---
sidebar_position: 0
---

# Checklist

Checklist component from Scaffald UI component library.

## Import

```tsx
import { Checklist } from '@scaffald/ui';
```

## Basic Usage

```tsx
import { Checklist } from '@scaffald/ui';

export default function Example() {
  return (
    <Checklist>
      Content
    </Checklist>
  );
}
```

## Props

See the [TypeScript definitions](https://github.com/Scaffald/ui/blob/main/src/components/Checklist/Checklist.tsx) for the complete props API.

### Common Props

All Checklist components accept standard React Native [`View` props](https://reactnative.dev/docs/view#props).

## Variants

See component props for available variants.

## Examples

### Advanced Usage

```tsx
// Example implementation
<Checklist variant="default">
  Example content
</Checklist>
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
