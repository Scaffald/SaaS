---
sidebar_position: 0
---

# Input

Input component from Scaffald UI component library.

## Import

```tsx
import { Input } from '@scaffald/ui';
```

## Basic Usage

```tsx
import { Input } from '@scaffald/ui';

export default function Example() {
  return (
    <Input>
      Content
    </Input>
  );
}
```

## Props

See the [TypeScript definitions](https://github.com/Scaffald/ui/blob/main/src/components/Input/Input.tsx) for the complete props API.

### Common Props

All Input components accept standard React Native [`View` props](https://reactnative.dev/docs/view#props).

## Variants

See component props for available variants.

## Examples

### Advanced Usage

```tsx
// Example implementation
<Input variant="default">
  Example content
</Input>
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
