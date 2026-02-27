---
sidebar_position: 32
---

# Table

Table component from Scaffald UI component library.

## Import

```tsx
import { Table } from '@scaffald/ui';
```

## Basic Usage

```tsx
import { Table } from '@scaffald/ui';

export default function Example() {
  return (
    <Table>
      Content
    </Table>
  );
}
```

## Props

See the [TypeScript definitions](https://github.com/Scaffald/ui/blob/main/src/components/Table/Table.tsx) for the complete props API.

### Common Props

All Table components accept standard React Native [`View` props](https://reactnative.dev/docs/view#props).

## Variants

See component props for available variants.

## Examples

### Advanced Usage

```tsx
// Example implementation
<Table variant="default">
  Example content
</Table>
```

## Headless Hook (`useTable`)

For complete control over data grids, virtualization, and sorting logic, use the `useTable` hook. It handles complex SaaS table interactions (filtering, selecting, expanding) entirely independent of the view layer.

```tsx
import { useTable } from '@scaffald/ui';

function CustomDataGrid({ data, columns }) {
  const table = useTable({
    data,
    columns,
    pageSize: 50,
  });

  return (
    <View>
      {/* Build your own virtualized grid here using table.displayData */}
    </View>
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
