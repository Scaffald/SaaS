---
sidebar_position: 27
---

# Spinner

Loading indicator for async operations. Multiple sizes and colors available.

## Import

```tsx
import { Spinner } from '@scaffald/ui';
```

## Basic Usage

```tsx
import { Spinner } from '@scaffald/ui';

export default function Example() {
  return (
    <Spinner>
      Content
    </Spinner>
  );
}
```

## Props

See the [TypeScript definitions](https://github.com/Scaffald/ui/blob/main/src/components/Spinner/Spinner.tsx) for the complete props API.

### Common Props

All Spinner components accept standard React Native [`View` props](https://reactnative.dev/docs/view#props).

## Variants

See component props for available variants.

## Examples

### Advanced Usage

```tsx
// Example implementation
<Spinner variant="default">
  Example content
</Spinner>
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
