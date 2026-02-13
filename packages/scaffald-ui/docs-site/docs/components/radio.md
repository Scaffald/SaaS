---
sidebar_position: 6
---

# Radio

Mutually exclusive selection control. Group multiple radios for single-choice scenarios.

## Import

```tsx
import { Radio } from '@scaffald/ui';
```

## Basic Usage

```tsx
import { Radio } from '@scaffald/ui';

export default function Example() {
  return (
    <Radio>
      Content
    </Radio>
  );
}
```

## Props

See the [TypeScript definitions](https://github.com/Scaffald/ui/blob/main/src/components/Radio/Radio.tsx) for the complete props API.

### Common Props

All Radio components accept standard React Native [`View` props](https://reactnative.dev/docs/view#props).

## Variants

See component props for available variants.

## Examples

### Advanced Usage

```tsx
// Example implementation
<Radio variant="default">
  Example content
</Radio>
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
