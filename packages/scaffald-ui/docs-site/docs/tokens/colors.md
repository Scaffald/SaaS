---
sidebar_position: 2
---

# Color Tokens

Scaffald UI uses semantic color tokens that automatically adapt to light and dark themes.

## Token Structure

```typescript
colors.{semantic}.{theme}.{variant}
```

## Semantic Categories

### Background Colors (`colors.bg`)

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `colors.bg[theme].default` | `#ffffff` | `#1a1a2e` | Main backgrounds |
| `colors.bg[theme].subtle` | `#f9fafb` | `#1f2937` | Subtle backgrounds |
| `colors.bg[theme].muted` | `#f3f4f6` | `#374151` | Muted backgrounds |
| `colors.bg[theme].primary` | `#2563eb` | `#3b82f6` | Primary brand |
| `colors.bg[theme].secondary` | `#7c3aed` | `#8b5cf6` | Secondary brand |
| `colors.bg[theme].success` | `#16a34a` | `#22c55e` | Success states |
| `colors.bg[theme].warning` | `#d97706` | `#f59e0b` | Warning states |
| `colors.bg[theme].error` | `#dc2626` | `#ef4444` | Error states |

### Text Colors (`colors.text`)

| Token | Usage |
|-------|-------|
| `colors.text[theme].primary` | Primary text content |
| `colors.text[theme].secondary` | Secondary/supporting text |
| `colors.text[theme].muted` | Muted/disabled text |
| `colors.text[theme].inverse` | Text on colored backgrounds |

### Border Colors (`colors.border`)

| Token | Usage |
|-------|-------|
| `colors.border[theme].default` | Default borders |
| `colors.border[theme].subtle` | Subtle borders |
| `colors.border[theme].primary` | Primary accent borders |

### Foreground Colors (`colors.fg`)

| Token | Usage |
|-------|-------|
| `colors.fg[theme].default` | Default foreground elements |
| `colors.fg[theme].muted` | Muted foreground elements |
| `colors.fg[theme].primary` | Primary foreground |

### Icon Colors (`colors.icon`)

| Token | Usage |
|-------|-------|
| `colors.icon[theme].default` | Default icon color |
| `colors.icon[theme].muted` | Muted/inactive icons |
| `colors.icon[theme].primary` | Primary accent icons |

## Usage

```tsx
import { colors, useThemeContext } from '@scaffald/ui';

function MyComponent() {
  const { theme } = useThemeContext();

  return (
    <View style={{
      backgroundColor: colors.bg[theme].default,
      borderColor: colors.border[theme].default,
    }}>
      <Text style={{ color: colors.text[theme].primary }}>
        Themed Content
      </Text>
    </View>
  );
}
```

## Common Mistakes

**Wrong:**
```tsx
colors.background[theme].default  // 'background' doesn't exist
colors.text.primary               // Missing theme
```

**Correct:**
```tsx
colors.bg[theme].default          // Use 'bg' not 'background'
colors.text[theme].primary        // Include theme
```

## See Also

- [Design Tokens Overview](./overview)
- [Theming Guide](../guide/theming)
