---
sidebar_position: 0
---

# CommandMenu

CommandMenu component from Scaffald UI component library.

## Import

```tsx
import { CommandMenu } from '@scaffald/ui';
```

## Basic Usage

```tsx
import { CommandMenu } from '@scaffald/ui';

export default function Example() {
  return (
    <CommandMenu>
      Content
    </CommandMenu>
  );
}
```

## Props

See the [TypeScript definitions](https://github.com/Scaffald/ui/blob/main/src/components/CommandMenu/CommandMenu.tsx) for the complete props API.

### Common Props

All CommandMenu components accept standard React Native [`View` props](https://reactnative.dev/docs/view#props).

## Variants

See component props for available variants.

## Examples

### Advanced Usage

```tsx
// Example implementation
<CommandMenu variant="default">
  Example content
</CommandMenu>
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
