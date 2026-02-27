---
sidebar_position: 0
---

# CommandMenuItem

CommandMenuItem component from Scaffald UI component library.

## Import

```tsx
import { CommandMenuItem } from '@scaffald/ui';
```

## Basic Usage

```tsx
import { CommandMenuItem } from '@scaffald/ui';

export default function Example() {
  return (
    <CommandMenuItem>
      Content
    </CommandMenuItem>
  );
}
```

## Props

See the [TypeScript definitions](https://github.com/Scaffald/ui/blob/main/src/components/CommandMenuItem/CommandMenuItem.tsx) for the complete props API.

### Common Props

All CommandMenuItem components accept standard React Native [`View` props](https://reactnative.dev/docs/view#props).

## Variants

See component props for available variants.

## Examples

### Advanced Usage

```tsx
// Example implementation
<CommandMenuItem variant="default">
  Example content
</CommandMenuItem>
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
