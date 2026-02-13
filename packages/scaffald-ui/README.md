# @scaffald/ui

> Best-in-class UI framework for Expo (React Native + Web)

**Status**: ✨ Production Ready (v0.1.0)

## Overview

`@scaffald/ui` is a production-ready UI component library built with inline styles for React Native and web. Designed from the Forsured Design System (Figma) with a focus on:

- **Cross-platform**: Native support for React Native (iOS, Android) and web
- **Type-safe**: Full TypeScript support with comprehensive type definitions
- **Accessible**: WCAG 2.1 AA compliant components
- **Performant**: Inline styles with minimal runtime overhead
- **Tested**: >80% test coverage for all components
- **Themeable**: Design tokens mapped directly from Figma

## Installation

```bash
# pnpm
pnpm add @scaffald/ui react react-native

# npm
npm install @scaffald/ui react react-native

# yarn
yarn add @scaffald/ui react react-native
```

## Quick Start

```typescript
import { Button, TextInput, Stack, Row, Tabs } from '@scaffald/ui'

function MyForm() {
  const [value, setValue] = useState('')

  return (
    <Stack gap={16}>
      <TextInput
        label="Email"
        value={value}
        onChangeText={setValue}
        placeholder="Enter your email"
      />
      <Row gap={8}>
        <Button variant="primary" onPress={handleSubmit}>
          Submit
        </Button>
        <Button variant="secondary" onPress={handleCancel}>
          Cancel
        </Button>
      </Row>
    </Stack>
  )
}
```

### Tabs Component

```typescript
import { Tabs } from '@scaffald/ui'

// Basic tabs
<Tabs defaultValue="tab1">
  <Tabs.Item value="tab1">
    <Tabs.Trigger>Summary</Tabs.Trigger>
    <Tabs.Content>Summary content goes here</Tabs.Content>
  </Tabs.Item>
  <Tabs.Item value="tab2">
    <Tabs.Trigger>Transactions</Tabs.Trigger>
    <Tabs.Content>Transactions content goes here</Tabs.Content>
  </Tabs.Item>
</Tabs>

// With variants
<Tabs
  type="line"
  color="primary"
  size="lg"
  orientation="horizontal"
  defaultValue="tab1"
>
  <Tabs.Item value="tab1">
    <Tabs.Trigger iconStart={MyIcon}>Tab 1</Tabs.Trigger>
    <Tabs.Content>Content 1</Tabs.Content>
  </Tabs.Item>
</Tabs>

// With bordered content for visual grouping
<Tabs contentVariant="bordered" defaultValue="tab1">
  <Tabs.Item value="tab1">
    <Tabs.Trigger>Tab 1</Tabs.Trigger>
    <Tabs.Content>
      Content with border, padding, and background for clear visual grouping
    </Tabs.Content>
  </Tabs.Item>
</Tabs>

// With trigger sizing control (auto, equal, or fixed)
<Tabs triggerSizing="equal" fullWidth defaultValue="tab1">
  <Tabs.Item value="tab1">
    <Tabs.Trigger>Tab 1</Tabs.Trigger>
    <Tabs.Content>Content 1</Tabs.Content>
  </Tabs.Item>
  <Tabs.Item value="tab2">
    <Tabs.Trigger>Longer Tab 2</Tabs.Trigger>
    <Tabs.Content>Content 2 - tab width independent of content</Tabs.Content>
  </Tabs.Item>
</Tabs>
```

### Table Component

```typescript
import { Table, TableHeader, TableRow, TableCell, TableColumnHeader, Pagination } from '@scaffald/ui'

// Basic table with search and actions
<Table>
  <TableHeader
    searchValue={searchValue}
    onSearchChange={setSearchValue}
    searchPlaceholder="Search..."
    actions={
      <>
        <Button size="sm" variant="outline">Export</Button>
        <Button size="sm">Add New</Button>
      </>
    }
  />
  <TableRow>
    <TableColumnHeader width={40} />
    <TableColumnHeader sortable>Name</TableColumnHeader>
    <TableColumnHeader sortable>Email</TableColumnHeader>
    <TableColumnHeader>Status</TableColumnHeader>
  </TableRow>
  <TableRow>
    <TableCell width={40}>1</TableCell>
    <TableCell>John Doe</TableCell>
    <TableCell>john@example.com</TableCell>
    <TableCell>Active</TableCell>
  </TableRow>
</Table>
<Pagination totalPages={10} />

// Table with expanded rows
<TableRow expanded={expanded} onExpand={setExpanded}>
  <TableCell>Row Content</TableCell>
</TableRow>
<ExpandedTableRow isExpanded={expanded}>
  <View>Additional details...</View>
</ExpandedTableRow>
```

### Chart Components

```typescript
import {
  BarChart,
  LinearChart,
  DonutChart,
  CircleChart,
  MiniLinearChart,
  Chart
} from '@scaffald/ui'

// Bar Chart with variants
<BarChart
  data={[10, 20, 15, 30, 25]}
  variant="1" // '1' | '2' | '3' for different bar widths
  colors={['#3b82f6', '#10b981', '#f59e0b']}
/>

// Linear Chart with period support
<LinearChart
  data={[
    { x: 0, y: 10 },
    { x: 1, y: 20 },
    { x: 2, y: 15 },
  ]}
  period="month" // 'week' | 'month' | 'year'
  showShadow={true}
/>

// Donut Chart with size variants
<DonutChart
  data={[
    { label: 'A', value: 30 },
    { label: 'B', value: 50 },
    { label: 'C', value: 20 },
  ]}
  size="md" // '3x-small' | '2x-small' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2x-large'
  colorScheme="primary" // 'primary' | 'colorful'
  showLabel={true}
  showPercentage={true}
/>

// Circle Chart (progress indicator)
<CircleChart
  value={75} // 0-100
  size="md" // 'sm' | 'md' | 'lg' | 'xl'
  showLabel={true}
/>

// Mini Linear Chart for dashboards
<MiniLinearChart
  data={[10, 20, 15, 30, 25]}
  shadow={true}
  width={112}
  height={59}
/>

// Main Chart with grid and axes
<Chart
  type="linear"
  xAxisLabels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']}
  yAxisLabels={[0, 20, 40, 60, 80, 100]}
  period="month"
  showGrid={true}
>
  <LinearChart data={chartData} />
</Chart>
```

## Design Tokens

Access Figma design tokens directly:

```typescript
import { colors, spacing, typography, borderRadius, gradients } from '@scaffald/ui/tokens'

// Colors from Figma Forsured Design System
colors.primary[600]  // #d54e21
colors.gray[50]      // #f9fafb
colors.success[500]  // #10b978

// Spacing scale
spacing[4]           // 12
namedSpacing.lg      // 24

// Typography (Roboto)
typography.fonts.body      // 'Roboto'
typography.fontSizes.md    // 16

// Border radius
borderRadius.m             // 10

// Gradients (reference existing color tokens)
gradients.gray[900].colors  // ['#141c25', '#1a232d'] for React Native
gradients.gray[900].css     // 'linear-gradient(180deg, #141c25 0%, #1a232d 100%)' for web
gradients.named['warm-flame'].colors  // ['#fb923c', '#fb7185']
```

## Current Components

### Phase 0 (✅ Complete)
- **Design Tokens**: colors, spacing, typography, borders, shadows, animations, breakpoints, gradients

### Phase 1 (🚧 In Progress)
- **Primitives**: Box, Stack, Row, Flex
- **Hooks**: useMediaQuery, useBreakpoint, useWindowDimensions

### Phase 2 (📅 Planned)
- **Button**: Primary, secondary, outlined, ghost, danger variants
- **Input**: TextInput, TextArea, NumberInput, PasswordInput, SearchInput
- **Selection**: Checkbox, Radio, Switch

### Phase 3 (✅ Complete)
- **Tabs**: Tab navigation with multiple variants (default, line, shadow), colors (gray, primary), sizes (sm, md, lg), and orientations (horizontal, vertical)

### Phase 4+ (📅 Future)
- Alert, Toast, Dialog, Popover, Select, and more...

## Documentation

- [Why Beyond-UI?](docs/WHY_BEYOND_UI.md) – Rationale and when to use beyond-ui.
- [Imports and exports](docs/IMPORTS_AND_EXPORTS.md) – Main entry vs subpath imports (`/tokens`, `/onboarding`) for tree-shaking.
- [Dependencies](docs/DEPENDENCIES.md) – Dependency policy and audit (required vs optional peers).
- [ARCHITECTURE.md](ARCHITECTURE.md) – Design principles, tokens, component structure.
- [CONTRIBUTING.md](CONTRIBUTING.md) – How to contribute.

## Feature parity with @unicornlove/ui

Beyond-UI is built to replace the previous UI library while staying dependency-light. The following areas are implemented or documented:

| Area | Status | Notes |
|------|--------|--------|
| **Phase A** (quick wins) | ✅ | FieldError, LoadingOverlay, FullscreenSpinner, SaveStatusIndicator, SavingModal, EmptyState, ErrorState, LoadingState, useWindowDimensions, SkeletonForm/SkeletonList/SkeletonBox, TableActionBar, TableAddRecordModal, TableColumnVisibilityModal |
| **Phase B** (form/input) | ✅ | ResponsiveSelect, AdaptiveSelectSheet, PhoneNumberInput, RangeSlider, Checklist; ToggleCard → SelectionCard |
| **Phase C** (composites) | ✅ | Image picker, Kanban, Onboarding, Cookie consent |
| **Phase D** (domain) | ✅ | Address (AddressAutocomplete, AddressForm, LocationListInput), Maps, Rich text (minimal + TipTap as children), IconSelector, Charts (StackedBarChart, PopulationPyramid), NotificationTag; OfficeTabs/OfficeAccordion → [Tabs/Accordion](MIGRATION.md#officetabs-and-officeaccordion) |
| **Phase E** (polish) | ✅ | CONTRIBUTING, CHANGELOG, WHY_BEYOND_UI, theme migration guide, dependency audit, subpath exports |

See [Why Beyond-UI?](docs/WHY_BEYOND_UI.md) for rationale and migration notes.

## Development Roadmap

See the [full roadmap](/Users/clay/.claude/plans/abstract-spinning-bachman.md) for detailed implementation plans.

**MVP Target**: v0.1.0 (10-12 weeks)
- Phase 0: Package setup + design tokens ✅
- Phase 1: Layout primitives (Week 3-4)
- Phase 2: Core components (Week 5-8)
- Phase 3: Feedback components (Week 9-10)

## Testing

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

## Building

```bash
# Build package
pnpm build

# Watch mode
pnpm watch

# Type check
pnpm typecheck
```

## License

MIT © Scaffald

## Related Packages

- Legacy UI package has been superseded by Beyond UI.
<!-- Automated sync test Fri Feb 13 01:46:52 EST 2026 -->
