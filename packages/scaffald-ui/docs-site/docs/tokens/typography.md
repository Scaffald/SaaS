---
sidebar_position: 4
---

# Typography Tokens

Consistent typography styles for text across your application.

## Heading Styles

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `typography.h1` | 32px | Bold | Page titles |
| `typography.h2` | 28px | Bold | Section headers |
| `typography.h3` | 24px | Semibold | Subsection headers |
| `typography.h4` | 20px | Semibold | Card titles |
| `typography.h5` | 18px | Medium | Small headers |
| `typography.h6` | 16px | Medium | Overlines |

## Body Styles

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `typography.bodyLarge` | 18px | Regular | Large body text |
| `typography.body` | 16px | Regular | Default body text |
| `typography.bodySmall` | 14px | Regular | Small body text |

## UI Text Styles

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `typography.label` | 14px | Medium | Form labels |
| `typography.caption` | 12px | Regular | Captions and hints |

## Usage

```tsx
import { typography } from '@scaffald/ui';

<Text style={typography.h1}>Page Title</Text>
<Text style={typography.body}>Body content goes here.</Text>
<Text style={typography.caption}>Small caption text</Text>
```

## Typography Components

For convenience, Scaffald UI also provides pre-styled typography components:

```tsx
import { H1, H2, H3, Text, Paragraph, Caption, Label } from '@scaffald/ui';

<H1>Page Title</H1>
<Paragraph>Body paragraph content.</Paragraph>
<Caption>Small supporting text</Caption>
<Label>Form Label</Label>
```

## See Also

- [Design Tokens Overview](./overview)
- [Text Component](../components/text)
- [Heading Component](../components/heading)
