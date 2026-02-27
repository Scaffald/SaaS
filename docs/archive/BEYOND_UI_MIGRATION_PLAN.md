# Beyond-UI Migration: Comprehensive Plan

**Status:** In Progress
**Current Errors:** 17,244 TypeScript errors
**Goal:** 0 errors, full beyond-ui compatibility

---

## Executive Summary

The beyond-ui migration is **~40% complete**. While component imports have been migrated, there are significant API mismatches that need resolution. This plan categorizes all issues and provides a phased approach to completion.

## Error Breakdown

| Category | Count | Priority | Approach |
|----------|-------|----------|----------|
| Missing Component Exports | 1,554 | CRITICAL | Build wrappers (Option A) |
| Type Assignment Errors | 8,844 | HIGH | Refactor props (Option B) |
| Property Access Errors | 3,524 | HIGH | Fix shorthand props |
| Tamagui Tokens | 2,382 | MEDIUM | Systematic replacement |
| Spacing Index Errors | 254 | MEDIUM | Use literal values |
| Other | 686 | LOW | Case-by-case |

---

## Part 1: Missing Beyond-UI Component Exports

### Category A: Card System Components

**Missing:**
- `CardActions` - Used in 3 files
- `CardBadges` - Used in 2 files
- `CardMetadata` - Used in 4 files
- `SelectableCard` - Used in 3 files
- `BadgeConfig` (type) - Used in 2 files
- `MetadataItem` (type) - Used in 4 files

**Impact:** JobCard, OrganizationCard, ProfileCard components broken

**Solution:** Build composite components using existing `Card`, `CardHeader`, `CardContent`, `CardFooter`

**Files Affected:**
- `components/jobs/JobCard.tsx`
- `components/organizations/OrganizationCard.tsx`
- `components/profile/ProfileCard.tsx`

**Implementation:**
```typescript
// Create: packages/beyond-ui/src/components/Card/CardMetadata.tsx
export interface MetadataItem {
  icon: LucideIcon
  text: string
  color?: string
}

export function CardMetadata({ items }: { items: MetadataItem[] }) {
  const { theme } = useThemeContext()
  return (
    <Row gap={12} wrap>
      {items.map((item, i) => (
        <Row key={i} gap={4} align="center">
          <item.icon size={16} color={item.color || colors.icon[theme].secondary} />
          <Text size="sm" color="secondary">{item.text}</Text>
        </Row>
      ))}
    </Row>
  )
}
```

---

### Category B: Tab System Components

**Missing:**
- `Tab` - TypeScript suggests using `Tabs` (correct)
- `TabGroup` - Not in beyond-ui
- `TabGroupProps` - Not in beyond-ui

**Impact:** Navigation components broken (AssessmentsTabs, ProfileTabs, OfficeLayout)

**Beyond-UI Has:** `Tabs` with compound component API:
```tsx
<Tabs defaultValue="tab1">
  <Tabs.Item value="tab1">
    <Tabs.Trigger>Tab 1</Tabs.Trigger>
    <Tabs.Content>Content 1</Tabs.Content>
  </Tabs.Item>
</Tabs>
```

**Solution:** Create compatibility wrapper OR refactor to use Tabs API directly

**Files Affected:**
- `components/navigation/AssessmentsTabs.tsx`
- `components/navigation/ProfileTabs.tsx`
- `components/layouts/OfficeLayout.tsx`

**Recommendation:** **Refactor to Tabs API** (cleaner, better typed)

---

### Category C: UI Primitives

**Missing from beyond-ui (should import from react-native):**
- `ScrollView` - 3 occurrences
- `View` - 2 occurrences
- `Image` - 1 occurrence

**Files Affected:**
- `components/notifications/NotificationPopover.tsx`
- `components/ui/DataTable.tsx`
- `components/ui/SoftSkillsRadarGrid.tsx`
- `components/ui/ImageUpload.tsx`
- `features/api-keys/APIKeyScopesManager.tsx`

**Solution:** Change imports:
```typescript
// BEFORE
import { ScrollView } from '@unicornlove/beyond-ui'

// AFTER
import { ScrollView } from 'react-native'
```

---

### Category D: Dialog Component

**Missing:** `Dialog`

**Impact:** API key modals broken

**Beyond-UI Has:** `AlertDialog` (similar API)

**Files Affected:**
- `features/api-keys/APIKeyCreateModal.tsx`
- `features/api-keys/APIKeyScopesManager.tsx`

**Solution:** Use `AlertDialog` instead or create Dialog wrapper

---

### Category E: Specialized Components

**Missing:**
- `XGroup` - Layout component
- `Boundary`, `Coordinate` - Map components
- `IndividualSkillRadarChart` - Chart component
- `SizableText` - Text variant
- `isWeb` - Platform utility
- `MediaTypeOptions` - Expo image picker type

**Solution:**
- `XGroup` → Use `Row` or `Stack`
- Map components → May need custom implementation
- Chart → May need chart library integration
- `SizableText` → Use `Text` with size prop
- `isWeb` → Import from `react-native` Platform
- `MediaTypeOptions` → Import from `expo-image-picker`

---

## Part 2: Type Assignment Errors (8,844)

### Issue: Invalid Prop Shorthands

**Problem:** Tamagui shorthand props don't exist in beyond-ui

**Common Invalid Props:**
```typescript
ai="center"        // alignItems
jc="space-between" // justifyContent
f={1}              // flex
mt={8}             // marginTop
```

**Solution:** Use full prop names
```typescript
// BEFORE
<Stack ai="center" jc="space-between" f={1} mt={8}>

// AFTER
<Stack align="center" justify="space-between" flex={1} style={{ marginTop: 8 }}>
```

**Affected:** ~16 occurrences (high impact across codebase)

---

### Issue: Invalid Size Values

**Problem:** `size="xs"` not valid for Button/Text

**Beyond-UI Sizes:**
- Button: `sm`, `md`, `lg`
- Text: `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl`, `5xl`, `6xl`, `7xl`, `8xl`, `9xl`

**Solution:** Map `xs` → `sm` for Button, keep for Text

**Files Affected:**
- `components/certifications/CertificationCheckbox.tsx`
- `components/certifications/CertificationChip.tsx`
- `components/certifications/CertificationProofCard.tsx`

---

### Issue: Invalid Theme Prop

**Problem:** `theme="dark"` passed to components that don't accept it

**Solution:** Remove theme prop, use `useThemeContext()` instead

---

### Issue: Number Type for TextSize

**Problem:** `<Text size={4}>` - numbers not valid

**Solution:** Use string sizes: `<Text size="lg">`

---

## Part 3: Tamagui Color Tokens (2,382 remaining)

**Progress:** ~400 fixed (auth, personality, drawer, organizations)
**Remaining:** 2,382 tokens across codebase

### Systematic Replacement Strategy

**Use Agent for Bulk Replacement:**
```bash
# By feature area
- forms/ (500+ tokens)
- profile/ (400+ tokens)
- jobs/ (300+ tokens)
- applications/ (250+ tokens)
- teams/ (200+ tokens)
- office/ (732+ tokens)
```

### Token Mapping Reference

| Tamagui Token | Beyond-UI Equivalent |
|--------------|---------------------|
| `$background` | `colors.bg[theme].default` |
| `$borderColor` | `colors.border[theme].default` |
| `$color1` | `colors.text[theme].onPrimary` |
| `$color2` | `colors.bg[theme].subtle` |
| `$color3` | `colors.bg[theme].muted` |
| `$color4` | `colors.bg[theme].default` |
| `$color5` | `colors.bg[theme].inactive` |
| `$color7` | `colors.border[theme].subtle` |
| `$color10` | `colors.text[theme].tertiary` |
| `$color11` | `colors.text[theme].secondary` |
| `$color12` | `colors.text[theme].primary` |
| `$red8/$red9` | `colors.border[theme].error` / `colors.bg[theme].error` |
| `$red10/$red11` | `colors.text[theme].error` |
| `$blue2` | `colors.bg[theme].info` |
| `$blue8/$blue9` | `colors.border[theme].info` / `colors.bg[theme].primary` |
| `$blue10/$blue11` | `colors.text[theme].info` |
| `$green9/$green10` | `colors.bg[theme].success` / `colors.text[theme].success` |
| `$yellow8` | `colors.border[theme].warning` |

---

## Part 4: Spacing Index Errors (254)

**Problem:** `spacing[3]` doesn't exist

**Valid Indices:** 0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96, 128, 160, 192, 256, 384, 512, 768

**Solution:** Use literal values or valid indices
```typescript
// BEFORE
<Row gap={spacing[3]}>

// AFTER
<Row gap={12}>  // or spacing[2] if 8px is acceptable
```

---

## Part 5: Property Access Errors (3,524)

### Issue: Responsive Props

**Problem:** `$md`, `$lg` props don't exist

**Example:**
```typescript
// BEFORE
<Stack $md={{ padding: 16 }}>

// AFTER - Use media queries or conditional rendering
<Stack style={{ padding: isMobile ? 8 : 16 }}>
```

---

### Issue: Missing Required Props

**Problem:** `currentIndex` missing from Breadcrumb

**Files Affected:**
- `components/layouts/DashboardLayout.tsx`
- `components/layouts/OfficeLayout.tsx`

**Solution:** Add missing props

---

## Implementation Phases

### Phase 1: Quick Wins (1-2 hours)
- ✅ Fix direct color token usage (auth components) - **DONE**
- ✅ Fix Tamagui tokens in high-priority components - **PARTIAL (400 fixed)**
- [ ] Fix primitive imports (ScrollView, View, Image) - 5 files
- [ ] Fix invalid size props - 3 files
- [ ] Fix spacing indices - ~30 files

**Expected Error Reduction:** 17,244 → ~16,500 (~700 errors)

---

### Phase 2: Build Missing Components (4-6 hours)
- [ ] Create CardMetadata, CardActions, CardBadges - 3 components
- [ ] Create SelectableCard wrapper - 1 component
- [ ] Create Tab/TabGroup compatibility layer OR refactor to Tabs - Decision needed
- [ ] Export from beyond-ui package
- [ ] Update consuming files

**Expected Error Reduction:** 16,500 → ~15,000 (~1,500 errors)

---

### Phase 3: Fix Type Errors (6-8 hours)
- [ ] Fix shorthand props (ai, jc, f, mt) - ~100 files
- [ ] Fix invalid theme props - ~50 files
- [ ] Fix responsive props ($md, $lg) - ~40 files
- [ ] Add missing required props - ~10 files

**Expected Error Reduction:** 15,000 → ~7,000 (~8,000 errors)

---

### Phase 4: Systematic Tamagui Token Replacement (8-12 hours)
Use agents to parallelize by feature area:
- [ ] Agent 1: forms/ directory (500 tokens)
- [ ] Agent 2: profile/ directory (400 tokens)
- [ ] Agent 3: jobs/ + applications/ (550 tokens)
- [ ] Agent 4: teams/ + organizations/ (350 tokens)
- [ ] Agent 5: office/ directory (732 tokens)
- [ ] Manual: Remaining edge cases (~200 tokens)

**Expected Error Reduction:** 7,000 → ~2,000 (~5,000 errors)

---

### Phase 5: Cleanup & Edge Cases (4-6 hours)
- [ ] Fix specialized components (maps, charts)
- [ ] Handle Dialog → AlertDialog migration
- [ ] Fix XGroup → Row/Stack
- [ ] Address remaining type errors
- [ ] Clean up config files

**Expected Error Reduction:** 2,000 → ~0

---

## Total Estimated Time

- **Phase 1:** 1-2 hours
- **Phase 2:** 4-6 hours
- **Phase 3:** 6-8 hours
- **Phase 4:** 8-12 hours
- **Phase 5:** 4-6 hours

**Total:** 23-34 hours (3-4 working days)

---

## Success Criteria

- [ ] `pnpm typecheck` exits with 0 errors
- [ ] No Tamagui tokens (`$color`, `$red`, etc.) in codebase
- [ ] All color tokens follow `colors.{semantic}[theme].{variant}` pattern
- [ ] All components use beyond-ui or react-native imports only
- [ ] No responsive props or shorthand props
- [ ] Build succeeds: `pnpm build`
- [ ] Critical user flows tested:
  - [ ] Authentication
  - [ ] Dashboard
  - [ ] Profile editing
  - [ ] Job browsing
  - [ ] Applications
- [ ] Light/dark theme switching works

---

## Risk Mitigation

1. **Git commit after each phase** for easy rollback
2. **Run dev server continuously** for live feedback
3. **Test auth flow immediately** after Phase 2 (highest user impact)
4. **Use agents for bulk replacements** to reduce manual errors
5. **Visual comparison** screenshots before/after major changes

---

## Next Steps

**Immediate Actions:**
1. ✅ Complete Phase 1 quick wins
2. Decide: Tab compatibility layer vs refactor to Tabs
3. Launch Phase 2: Build missing Card components
4. Launch Phase 4 agents in parallel (while doing Phase 2/3)

**Decision Points:**
- **Tab migration:** Wrapper or refactor? (Recommend: refactor for better types)
- **Chart components:** Use existing library or build custom?
- **Map components:** Defer if not critical path?

---

## Files Requiring Immediate Attention

### CRITICAL (Blocks Core Features):
1. `components/jobs/JobCard.tsx` - Job browsing
2. `components/navigation/ProfileTabs.tsx` - Profile navigation
3. `components/layouts/OfficeLayout.tsx` - Office CMS
4. `features/api-keys/APIKeyCreateModal.tsx` - API key management

### HIGH (Affects User Experience):
5. `components/notifications/NotificationPopover.tsx` - Notifications
6. `components/certifications/CertificationCheckbox.tsx` - Certifications
7. `components/ui/DataTable.tsx` - Data tables throughout app
8. All profile component files (20+ files)

### MEDIUM (Backend/Admin Features):
9. Office CMS components (15+ files)
10. Team management components (10+ files)

---

## Appendix: Color Token Quick Reference

**Text Colors:**
```typescript
colors.text[theme].primary      // Main text
colors.text[theme].secondary    // Supporting text
colors.text[theme].tertiary     // Muted text
colors.text[theme].error        // Error messages
colors.text[theme].success      // Success messages
colors.text[theme].warning      // Warning messages
colors.text[theme].info         // Info messages
```

**Background Colors:**
```typescript
colors.bg[theme].default        // Default background
colors.bg[theme].subtle         // Subtle variation
colors.bg[theme].muted          // More muted
colors.bg[theme].inactive       // Disabled/inactive
colors.bg[theme].error          // Error background
colors.bg[theme].errorSubtle    // Light error background
colors.bg[theme].success        // Success background
```

**Border Colors:**
```typescript
colors.border[theme].default    // Default border
colors.border[theme].subtle     // Subtle border
colors.border[theme].error      // Error border
colors.border[theme].success    // Success border
colors.border[theme].info       // Info border
```

**Icon Colors:**
```typescript
colors.icon[theme].primary      // Primary icons
colors.icon[theme].secondary    // Secondary icons
colors.icon[theme].active       // Active state
colors.icon[theme].error        // Error icons
colors.icon[theme].success      // Success icons
```
