---
sidebar_position: 17
---

# Tabs

Tabbed navigation component with multiple visual variants. Supports horizontal and vertical orientations.

## Import

```tsx
import { Tabs } from '@scaffald/ui';
```

## Basic Usage

```tsx
import { Tabs } from '@scaffald/ui';

export default function Example() {
  return (
    <Tabs>
      Content
    </Tabs>
  );
}
```

## Props

See the [TypeScript definitions](https://github.com/Scaffald/ui/blob/main/src/components/Tabs/Tabs.tsx) for the complete props API.

### Common Props

All Tabs components accept standard React Native [`View` props](https://reactnative.dev/docs/view#props).

## Variants

See component props for available variants.

## Examples

### With Content

```tsx
// Example implementation
<Tabs variant="default">
  Example content
</Tabs>
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

- [Breadcrumbs](./breadcrumbs)
- [Pagination](./pagination)

## Changelog

See [GitHub Releases](https://github.com/Scaffald/ui/releases) for version history.
