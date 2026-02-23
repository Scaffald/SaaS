---
sidebar_position: 0
---

# Accordion

Accordion component from Scaffald UI component library.

## Import

```tsx
import { Accordion } from '@scaffald/ui';
```

## Basic Usage

```tsx
import { Accordion } from '@scaffald/ui';

export default function Example() {
  return (
    <Accordion>
      Content
    </Accordion>
  );
}
```

## Props

See the [TypeScript definitions](https://github.com/Scaffald/ui/blob/main/src/components/Accordion/Accordion.tsx) for the complete props API.

### Common Props

All Accordion components accept standard React Native [`View` props](https://reactnative.dev/docs/view#props).

## Variants

See component props for available variants.

## Examples

### Advanced Usage

```tsx
// Example implementation
<Accordion variant="default">
  Example content
</Accordion>
```

## Headless Hook (`useAccordion`)

For power users who need complete control over the visual presentation but want to leverage the robust state management and accessibility logic of the Accordion, you can use the `useAccordion` and `useAccordionItem` headless hooks.

```tsx
import { useAccordion, useAccordionItem } from '@scaffald/ui';

function CustomAccordion() {
  const accordion = useAccordion({ mode: 'multiple' });

  return (
    <CustomProvider value={accordion}>
      <CustomAccordionItem value="1" />
      <CustomAccordionItem value="2" />
    </CustomProvider>
  );
}
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
