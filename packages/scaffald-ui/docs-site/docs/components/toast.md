---
sidebar_position: 23
---

# Toast

Toast component from Scaffald UI component library.

## Import

```tsx
import { Toast } from '@scaffald/ui';
```

## Basic Usage

```tsx
import { Toast } from '@scaffald/ui';

export default function Example() {
  return (
    <Toast>
      Content
    </Toast>
  );
}
```

## Props

See the [TypeScript definitions](https://github.com/Scaffald/ui/blob/main/src/components/Toast/Toast.tsx) for the complete props API.

### Common Props

All Toast components accept standard React Native [`View` props](https://reactnative.dev/docs/view#props).

## Variants

See component props for available variants.

## Examples

### Advanced Usage

```tsx
// Example implementation
<Toast variant="default">
  Example content
</Toast>
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
