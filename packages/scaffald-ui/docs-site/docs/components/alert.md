---
sidebar_position: 22
---

# Alert

Inline notification component for contextual messages. Supports different severity levels and actions.

## Import

```tsx
import { Alert } from '@scaffald/ui';
```

## Basic Usage

```tsx
import { Alert } from '@scaffald/ui';

export default function Example() {
  return (
    <Alert>
      Content
    </Alert>
  );
}
```

## Props

See the [TypeScript definitions](https://github.com/Scaffald/ui/blob/main/src/components/Alert/Alert.tsx) for the complete props API.

### Common Props

All Alert components accept standard React Native [`View` props](https://reactnative.dev/docs/view#props).

## Variants

### Severity Levels

- `info` - Informational messages
- `success` - Success confirmations
- `warning` - Warning notices
- `error` - Error messages

## Examples

### Advanced Usage

```tsx
// Example implementation
<Alert variant="default">
  Example content
</Alert>
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
