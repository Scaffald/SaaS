---
sidebar_position: 3
---

# Spacing Tokens

Consistent spacing scale used across all Scaffald UI components.

## Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `spacing[0]` | 0px | No spacing |
| `spacing[1]` | 4px | Minimal spacing |
| `spacing[2]` | 8px | Tight spacing |
| `spacing[3]` | 12px | Compact spacing |
| `spacing[4]` | 16px | Default spacing |
| `spacing[5]` | 20px | Comfortable spacing |
| `spacing[6]` | 24px | Relaxed spacing |
| `spacing[8]` | 32px | Loose spacing |
| `spacing[10]` | 40px | Section spacing |
| `spacing[12]` | 48px | Large section spacing |
| `spacing[16]` | 64px | Extra large spacing |

## Usage

```tsx
import { spacing } from '@scaffald/ui';

// In component styles
<Stack gap={spacing[4]} padding={spacing[6]}>
  <Text>Content with consistent spacing</Text>
</Stack>

// In StyleSheet
const styles = StyleSheet.create({
  container: {
    padding: spacing[4],
    marginBottom: spacing[6],
    gap: spacing[3],
  },
});
```

## Base Unit

The spacing scale uses a **4px base unit**. All values are multiples of 4px, ensuring pixel-perfect alignment across components.

## See Also

- [Design Tokens Overview](./overview)
- [Typography Tokens](./typography)
