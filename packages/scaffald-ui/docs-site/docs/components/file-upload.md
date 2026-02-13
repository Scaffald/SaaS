---
sidebar_position: 0
---

# FileUpload

FileUpload component from Scaffald UI component library.

## Import

```tsx
import { FileUpload } from '@scaffald/ui';
```

## Basic Usage

```tsx
import { FileUpload } from '@scaffald/ui';

export default function Example() {
  return (
    <FileUpload>
      Content
    </FileUpload>
  );
}
```

## Props

See the [TypeScript definitions](https://github.com/Scaffald/ui/blob/main/src/components/FileUpload/FileUpload.tsx) for the complete props API.

### Common Props

All FileUpload components accept standard React Native [`View` props](https://reactnative.dev/docs/view#props).

## Variants

See component props for available variants.

## Examples

### Advanced Usage

```tsx
// Example implementation
<FileUpload variant="default">
  Example content
</FileUpload>
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
