---
sidebar_position: 24
---

# Modal

Overlay dialog component for focused interactions. Includes backdrop, animations, and focus management.

## Import

```tsx
import { Modal } from '@scaffald/ui';
```

## Basic Usage

```tsx
import { Modal } from '@scaffald/ui';

export default function Example() {
  return (
    <Modal>
      Content
    </Modal>
  );
}
```

## Props

See the [TypeScript definitions](https://github.com/Scaffald/ui/blob/main/src/components/Modal/Modal.tsx) for the complete props API.

### Common Props

All Modal components accept standard React Native [`View` props](https://reactnative.dev/docs/view#props).

## Variants

See component props for available variants.

## Examples

### Confirmation Dialog

```tsx
// Example implementation
<Modal variant="default">
  Example content
</Modal>
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
