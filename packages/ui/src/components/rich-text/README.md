# Rich Text Editor

Cross-platform rich text editing component for profile descriptions, experience details, and other formatted text fields.

## Overview

This component provides a consistent rich text editing experience across web and React Native using:
- **TipTap** for web (React)
- **TenTap** for React Native (planned)

Content is stored as **TipTap JSON** format in the database with auto-generated plain text for search indexing.

## Features

### Supported Formatting
- **Bold**, **Italic**, **Underline**
- Bullet lists
- Numbered lists

### Security
- All HTML/content is sanitized
- Only allowed marks and nodes are permitted
- No links, headers, or custom HTML allowed

### Character Limits
- Database enforces 5000 character limit on plain text
- Frontend limits are configurable per field:
  - Profile about: 500 chars
  - Experience description: 1000 chars
  - Education description: 500 chars
  - Job description: 3000 chars
  - Organization description: 1000 chars

## Usage

### Basic Example

```tsx
import { RichTextEditor } from '@unicornlove/ui'
import type { JSONContent } from '@tiptap/core'
import { useState } from 'react'

function MyComponent() {
  const [content, setContent] = useState<JSONContent | null>(null)

  return (
    <RichTextEditor
      value={content}
      onChange={setContent}
      fieldType="PROFILE_ABOUT"
      showCharacterCount
    />
  )
}
```

### With Custom Limits

```tsx
<RichTextEditor
  value={content}
  onChange={setContent}
  fieldType="JOB_DESCRIPTION"
  maxLength={2000}  // Override default 3000
  placeholder="Describe the role..."
  minHeight={200}
/>
```

### With Form Integration

```tsx
import { Controller } from 'react-hook-form'

<Controller
  name="description"
  control={control}
  render={({ field }) => (
    <RichTextEditor
      value={field.value}
      onChange={field.onChange}
      fieldType="EXPERIENCE_DESCRIPTION"
      error={errors.description?.message}
    />
  )}
/>
```

## Database Schema

### Tables with Rich Text Support

1. **private.profile** - `about_rich`, `about_plain`
2. **private.user_experience** - `description_rich`, `description_plain`
3. **private.user_education** - `description_rich`, `description_plain`
4. **public.jobs** - `description_rich`, `description_plain`
5. **public.organizations** - `description_rich`, `description_plain`

### JSON Format

Content is stored as TipTap JSON:

```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "Hello ",
          "marks": []
        },
        {
          "type": "text",
          "text": "world",
          "marks": [{ "type": "bold" }]
        }
      ]
    }
  ]
}
```

### Plain Text Extraction

The `about_plain` / `description_plain` columns are automatically maintained by database triggers for full-text search.

## Utility Functions

### Sanitization

```tsx
import { sanitizeTipTapJSON } from '@unicornlove/ui'

const sanitized = sanitizeTipTapJSON(userContent)
```

### Plain Text Extraction

```tsx
import { extractPlainText } from '@unicornlove/ui'

const plainText = extractPlainText(content)
const charCount = plainText.length
```

### Validation

```tsx
import { validateCharacterLimit } from '@unicornlove/ui'

const isValid = validateCharacterLimit(content, 500)
```

### Empty Content Check

```tsx
import { isContentEmpty } from '@unicornlove/ui'

const isEmpty = isContentEmpty(content)
```

### Plain Text Conversion

```tsx
import { plainTextToTipTap } from '@unicornlove/ui'

// Convert existing plain text to rich text format
const richText = plainTextToTipTap('Hello world')
```

## Props

### RichTextEditorProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `JSONContent \| null` | No | Current content as TipTap JSON |
| `onChange` | `(content: JSONContent) => void` | No | Callback when content changes |
| `fieldType` | `RichTextField` | Yes | Field type for limits/placeholder |
| `placeholder` | `string` | No | Custom placeholder text |
| `maxLength` | `number` | No | Custom character limit |
| `disabled` | `boolean` | No | Whether editor is disabled |
| `readOnly` | `boolean` | No | Whether editor is read-only |
| `showCharacterCount` | `boolean` | No | Show character count (default: true) |
| `autoFocus` | `boolean` | No | Auto-focus on mount |
| `minHeight` | `number` | No | Minimum height in pixels (default: 120) |
| `error` | `string` | No | Error message to display |
| `testID` | `string` | No | Test ID for testing |

### Field Types

```typescript
type RichTextField = 
  | 'PROFILE_ABOUT'
  | 'EXPERIENCE_DESCRIPTION'
  | 'EDUCATION_DESCRIPTION'
  | 'JOB_DESCRIPTION'
  | 'ORGANIZATION_DESCRIPTION'
  | 'CERTIFICATION_DESCRIPTION'
```

## Zod Schema Integration

Create schemas for rich text fields:

```typescript
import { z } from 'zod'

const richTextSchema = z.object({
  type: z.literal('doc'),
  content: z.array(z.any()),
}).nullable()

export const profileSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  about_rich: richTextSchema,
})
```

## Migration from Plain Text

Existing plain text data is automatically migrated to rich text format by the database migration. The migration:

1. Adds `*_rich` and `*_plain` columns
2. Converts existing plain text to TipTap JSON
3. Sets up triggers for automatic plain text extraction
4. Creates full-text search indexes

## Best Practices

### 1. Always Sanitize User Input

The component automatically sanitizes content, but always validate on the backend too.

### 2. Use Appropriate Field Types

Choose the correct `fieldType` to get appropriate character limits and placeholders.

### 3. Handle Empty State

```tsx
import { isContentEmpty } from '@unicornlove/ui'

// Check if content is empty before saving
if (!isContentEmpty(content)) {
  await saveContent(content)
}
```

### 4. Validate Character Limits

```tsx
import { validateCharacterLimit, RICH_TEXT_LIMITS } from '@unicornlove/ui'

const limit = RICH_TEXT_LIMITS.PROFILE_ABOUT
if (!validateCharacterLimit(content, limit)) {
  // Show error
}
```

### 5. Store Both Rich and Plain Text

Always save both `*_rich` and `*_plain` fields. The plain text is auto-generated by database triggers but can also be computed client-side if needed.

## Troubleshooting

### Content Not Updating

Make sure you're comparing content properly:

```tsx
// Use JSON comparison, not reference equality
const hasChanged = JSON.stringify(oldContent) !== JSON.stringify(newContent)
```

### Character Count Doesn't Match

The character count uses plain text extraction, which may differ from the visible text length. Use `extractPlainText()` to get the same count the editor uses.

### Styling Issues

The editor uses Tamagui styling. Ensure your theme provides the necessary tokens:
- `$borderColor`
- `$background`
- `$gray1` to `$gray10`
- `$blue4` to `$blue10`
- `$red9`, `$red10`
- `$yellow10`

## Future Enhancements

- React Native implementation with TenTap
- Read-only display component
- Markdown export
- Copy/paste from Word/Google Docs
- Collaborative editing

## Support

For issues or questions, check:
- [TipTap Documentation](https://tiptap.dev/)
- [TenTap Documentation](https://github.com/10play/10tap-editor)
- Project-specific issues in the repository
