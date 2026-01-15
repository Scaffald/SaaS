# Beyond UI - API Inconsistencies Audit

**Date:** 2026-01-15
**Phase:** 1.2 - Consolidate Component APIs
**Status:** In Progress

This document tracks API inconsistencies discovered during the Phase 1.2 audit and their planned resolutions.

## Summary

During the API audit, we identified inconsistencies across components in:
1. Error handling patterns
2. Style prop naming
3. Helper text implementations

## Detailed Findings

### 1. Error Handling Inconsistencies

Components handle errors in three different ways:

| Component | Current API | Issue |
|-----------|-------------|-------|
| **Input** | `error?: string` | Error message as string (good) |
| **Checkbox** | `error?: boolean` | Only boolean state, no message |
| **Toggle** | ❌ No error prop | Missing error handling completely |
| **FormField** | Not audited | Needs review |

**Problem:** Inconsistent developer experience. Input shows error messages, Checkbox only has error state, Toggle has nothing.

**Solution:** Standardize to the pattern defined in API_CONVENTIONS.md:

```typescript
interface StandardErrorProps {
  /** Whether the field has an error */
  error?: boolean

  /** Error message to display */
  errorMessage?: string

  /** Whether to show error state visually */
  showError?: boolean

  /** Validate on blur event */
  validateOnBlur?: boolean
}
```

**Breaking Changes:**
- ✅ Input: Change `error?: string` → `error?: boolean`, add `errorMessage?: string`
- ✅ Checkbox: Add `errorMessage?: string`
- ✅ Toggle: Add `error?: boolean` and `errorMessage?: string`

### 2. Style Prop Naming Inconsistencies

Components use different names for similar style props:

| Component | Container Style | Content Style | Other Styles |
|-----------|----------------|---------------|--------------|
| **Input** | `containerStyle` | `inputStyle` | `labelStyle`, `helperTextStyle` |
| **Checkbox** | `containerStyle` | `checkboxStyle` | `labelStyle`, `helperTextStyle` |
| **Toggle** | `containerStyle` | `toggleStyle` | `labelStyle`, `helperTextStyle` |
| **ModalActions** | `style` ✅ | `buttonsStyle` | `subActionsStyle` |
| **Card** | `style` ✅ | ❌ No content prop | Composition-based |

**Problem:** According to API_CONVENTIONS.md, primary style prop should be `style`, not `containerStyle`.

**Solution:** Standardize to:

```typescript
interface StandardStyleProps {
  /** Primary container style */
  style?: ViewStyle

  /** Content/inner element style */
  contentStyle?: ViewStyle

  /** Label text style */
  labelStyle?: TextStyle

  /** Helper/supporting text style */
  helperTextStyle?: TextStyle
}
```

**Breaking Changes:**
- ✅ Input: Rename `containerStyle` → `style`, `inputStyle` → `contentStyle`
- ✅ Checkbox: Rename `containerStyle` → `style`, `checkboxStyle` → `contentStyle`
- ✅ Toggle: Rename `containerStyle` → `style`, `toggleStyle` → `contentStyle`
- ⚠️ ModalActions: Rename `buttonsStyle` → `contentStyle` (minor)

### 3. ModalActions API Review

Current API for ModalActions:

```typescript
interface ModalActionsProps {
  orientation?: 'center' | 'right'
  primaryAction?: ModalAction
  secondaryAction?: ModalAction
  subActions?: React.ReactNode
  style?: ViewStyle           // ✅ Good
  subActionsStyle?: ViewStyle
  buttonsStyle?: ViewStyle    // ❌ Should be contentStyle
}

interface ModalAction {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  color?: ButtonColor
  disabled?: boolean
  loading?: boolean
}
```

**Analysis:**
- ✅ `style` is correctly used as primary prop
- ✅ `primaryAction` and `secondaryAction` are clear and semantic
- ❌ `buttonsStyle` should be `contentStyle` for consistency
- ✅ `subActionsStyle` is fine (different content region)

**Recommendation:** Rename `buttonsStyle` → `contentStyle`

## Migration Strategy

### Phase 1: Add Deprecated Props (Non-Breaking)

Add new props while keeping old ones with deprecation warnings:

```typescript
export interface InputProps {
  /** @deprecated Use `style` instead. Will be removed in v2.0 */
  containerStyle?: ViewStyle

  /** Container style */
  style?: ViewStyle

  /** @deprecated Use `contentStyle` instead. Will be removed in v2.0 */
  inputStyle?: ViewStyle

  /** Input field style */
  contentStyle?: ViewStyle

  /** @deprecated Use `errorMessage` instead. Will be removed in v2.0 */
  error?: string

  /** Whether field has error */
  error?: boolean

  /** Error message to display */
  errorMessage?: string
}
```

### Phase 2: Runtime Warnings

Add console warnings in development:

```typescript
if (process.env.NODE_ENV !== 'production') {
  if (containerStyle) {
    console.warn('Input: `containerStyle` is deprecated. Use `style` instead.')
  }
  if (typeof error === 'string') {
    console.warn('Input: Passing string to `error` is deprecated. Use `errorMessage` instead.')
  }
}
```

### Phase 3: Codemods

Provide automated migration scripts:

```bash
npx @unicornlove/beyond-ui-codemod v1-to-v2 --component=Input --prop=containerStyle
```

### Phase 4: Remove in v2.0

Complete removal of deprecated props in next major version.

## Implementation Checklist

### Input Component
- [ ] Add `style` prop (alias for `containerStyle`)
- [ ] Add `contentStyle` prop (alias for `inputStyle`)
- [ ] Change `error` from `string` to `boolean`
- [ ] Add `errorMessage` prop
- [ ] Add deprecation warnings
- [ ] Update types
- [ ] Update Storybook stories
- [ ] Update documentation

### Checkbox Component
- [ ] Add `style` prop (alias for `containerStyle`)
- [ ] Add `contentStyle` prop (alias for `checkboxStyle`)
- [ ] Add `errorMessage` prop
- [ ] Add deprecation warnings
- [ ] Update types
- [ ] Update Storybook stories
- [ ] Update documentation

### Toggle Component
- [ ] Add `style` prop (alias for `containerStyle`)
- [ ] Add `contentStyle` prop (alias for `toggleStyle`)
- [ ] Add `error` prop (boolean)
- [ ] Add `errorMessage` prop
- [ ] Add deprecation warnings
- [ ] Update types
- [ ] Update Storybook stories
- [ ] Update documentation

### ModalActions Component
- [ ] Rename `buttonsStyle` to `contentStyle`
- [ ] Add deprecation warning for `buttonsStyle`
- [ ] Update types
- [ ] Update Storybook stories
- [ ] Update documentation

## Timeline

- **Week 2**: Complete Input, Checkbox, Toggle standardization
- **Week 2**: Update ModalActions
- **Week 2**: Create migration guide and codemods
- **Week 2**: Update all documentation and Storybook

## Breaking Changes Summary

Will be documented in `MIGRATION_V0_TO_V1.md`:

### Style Props
```tsx
// Before
<Input containerStyle={{}} inputStyle={{}} />
<Checkbox containerStyle={{}} checkboxStyle={{}} />
<Toggle containerStyle={{}} toggleStyle={{}} />

// After
<Input style={{}} contentStyle={{}} />
<Checkbox style={{}} contentStyle={{}} />
<Toggle style={{}} contentStyle={{}} />
```

### Error Handling
```tsx
// Before
<Input error="Invalid email" />
<Checkbox error={true} />

// After
<Input error={true} errorMessage="Invalid email" />
<Checkbox error={true} errorMessage="Selection required" />
<Toggle error={true} errorMessage="Must be enabled" />
```

## Notes

- Maintain backward compatibility during transition period
- All changes follow patterns established in API_CONVENTIONS.md
- Priority on developer experience and consistency
- Breaking changes acceptable for v1.0 given maturity goals
