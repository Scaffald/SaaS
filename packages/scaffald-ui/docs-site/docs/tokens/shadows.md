---
sidebar_position: 5
---

# Shadow Tokens

Elevation shadows for creating depth in your UI.

## Shadow Scale

| Token | Elevation | Usage |
|-------|-----------|-------|
| `shadows.sm` | Low | Subtle elevation (cards, inputs) |
| `shadows.md` | Medium | Default elevation (dropdowns, popovers) |
| `shadows.lg` | High | Prominent elevation (modals, sheets) |
| `shadows.xl` | Very high | Maximum elevation (dialogs, overlays) |
| `shadows['2xl']` | Highest | Dramatic elevation (hero cards) |

## Usage

```tsx
import { shadows } from '@scaffald/ui';

<Card style={shadows.md}>
  Elevated card content
</Card>

// Or in StyleSheet
const styles = StyleSheet.create({
  dropdown: {
    ...shadows.lg,
    backgroundColor: 'white',
    borderRadius: 8,
  },
});
```

## Platform Differences

- **Web**: Shadows use CSS `box-shadow`
- **iOS**: Shadows use `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`
- **Android**: Shadows use `elevation`

Scaffald UI handles platform differences automatically when you use the shadow tokens.

## See Also

- [Design Tokens Overview](./overview)
- [Card Component](../components/card)
