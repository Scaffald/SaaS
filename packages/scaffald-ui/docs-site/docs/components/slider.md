---
sidebar_position: 8
---

# Slider

Range input component for numeric values. Supports steps and custom formatting.

## Import

```tsx
import { Slider } from '@scaffald/ui';
```

## Basic Usage

```tsx
import { Slider } from '@scaffald/ui';

export default function Example() {
  return (
    <Slider>
      Content
    </Slider>
  );
}
```

## Props

See the [TypeScript definitions](https://github.com/Scaffald/ui/blob/main/src/components/Slider/Slider.tsx) for the complete props API.

### Common Props

All Slider components accept standard React Native [`View` props](https://reactnative.dev/docs/view#props).

## Variants

See component props for available variants.

## Examples

### Advanced Usage

```tsx
// Example implementation
<Slider variant="default">
  Example content
</Slider>
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
