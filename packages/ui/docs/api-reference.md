# API Reference

Complete API documentation for @unicornlove/ui components.

## Components

### Form Components

#### Input
```tsx
import { Input } from '@unicornlove/ui'

<Input placeholder="Enter text..." />
```

#### PhoneNumberInput
```tsx
import { PhoneNumberInput } from '@unicornlove/ui'

<PhoneNumberInput
  value={phone}
  onChange={setPhone}
  countryCode="US"
/>
```

#### Checkbox
```tsx
import { Checkbox } from '@unicornlove/ui'

<Checkbox checked={isChecked} onCheckedChange={setChecked} />
```

### Layout Components

#### Card
```tsx
import { Card } from '@unicornlove/ui'

<Card p="$4">
  <Text>Card content</Text>
</Card>
```

#### Sheet
```tsx
import { Sheet } from '@unicornlove/ui'

<Sheet open={isOpen} onOpenChange={setOpen}>
  <Sheet.Frame>
    <Sheet.Content>Content</Sheet.Content>
  </Sheet.Frame>
</Sheet>
```

### Navigation Components

#### Breadcrumb
```tsx
import { Breadcrumb } from '@unicornlove/ui'

<Breadcrumb
  items={[
    { label: 'Home', route: '/' },
    { label: 'Page', route: '/page' },
  ]}
/>
```

### Data Display

#### Charts
```tsx
import { BarChart, LineChart, PieChart } from '@unicornlove/ui'

<BarChart data={chartData} />
```

### Utilities

#### Phone Validation
```tsx
import { formatPhoneNumber, isValidPhoneNumber } from '@unicornlove/ui/types/phone'

const formatted = formatPhoneNumber('1234567890', 'US')
const isValid = isValidPhoneNumber('1234567890', 'US')
```

#### Geographic Types
```tsx
import type { Boundary, Coordinate } from '@unicornlove/ui/types/geographic'

const coordinate: Coordinate = [-84.5555, 42.7325]
const boundary: Boundary = [
  [-84.5555, 42.7325],
  [-84.5556, 42.7326],
  [-84.5557, 42.7325],
]
```

## Complete Component List

See the package exports for a complete list of available components. All components are exported from the main entry point:

```tsx
import {
  Button,
  Card,
  Input,
  // ... all other components
} from '@unicornlove/ui'
```

