# iOS 26 Component Updates — Implementation Plan

## Context

Adding/updating 6 component types to match Apple iOS 26 Figma designs. Most components already exist in `@scaffald/ui` and need visual updates; SegmentedControl is new. Uses the iOS 26 color tokens already added to `colors.ts` (accents, fills, labels, systemGray, etc.) and the Liquid Glass material system.

---

## 1. SegmentedControl — NEW COMPONENT

**Figma specs:**
- Background: `rgba(118,118,128,0.12)` (`fills.tertiary`)
- Height: 32px, pill shape (`borderRadius: 100`)
- Padding: 2px, gap: 4px between segments
- Selected segment: white bg (`borderRadius: 20`), font weight 590 (semibold), 13.3px
- Unselected: font weight 510 (medium), 13.3px
- Supports 2-5 segments
- Dark mode: selected bg changes to lighter gray

**Files to create:**
```
components/SegmentedControl/
├── SegmentedControl.types.ts
├── SegmentedControl.styles.ts
├── SegmentedControl.tsx
└── index.ts
```

**Props:**
```typescript
interface SegmentedControlProps {
  segments: string[]                    // labels
  selectedIndex: number
  onSelectionChange: (index: number) => void
  size?: 'sm' | 'md'                   // 28px vs 32px
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
}
```

**Implementation:** Pressable segments in a row. Selected segment gets white bg pill. Animated sliding indicator (web: CSS transition, native: Animated).

---

## 2. PageControl — NEW COMPONENT

**Figma specs:**
- Dots: 8px circles, 8px gap
- Active dot: `labels.primary` (black/white) at 100% opacity
- Inactive dots: `labels.primary` at 30% opacity
- Container: 44px height, centered
- Supports 2-8+ dots

**Files to create:**
```
components/PageControl/
├── PageControl.types.ts
├── PageControl.styles.ts
├── PageControl.tsx
└── index.ts
```

**Props:**
```typescript
interface PageControlProps {
  totalPages: number
  currentPage: number
  onPageChange?: (page: number) => void
  style?: StyleProp<ViewStyle>
  testID?: string
}
```

---

## 3. ProgressBar — UPDATE EXISTING

**Path:** `components/ProgressBar/`

**Figma specs (iOS 26 style):**
- Track: `fills.primary` = `rgba(120,120,128,0.2)`, 6px height, rounded 3px
- Fill: `accents.blue` = `#0088FF`, 6px, rounded 3px
- Horizontal padding: 16px within 44px height container

**Changes needed in `ProgressBar.styles.ts`:**
- Add iOS 26 variant or update default track/fill styling to match
- Track height: 6px (current may differ)
- Track bg: use `colors.fills.light.primary` / `colors.fills.dark.primary`
- Fill color: use `colors.accents[theme].blue`
- Border radius: 3px

**Approach:** Add `variant?: 'default' | 'ios'` prop to ProgressBar. The `'ios'` variant applies the iOS 26 styling. Keep backward compatibility.

---

## 4. Spinner (Progress Indicator) — UPDATE EXISTING

**Path:** `components/Spinner/`

**Figma specs (iOS 26):**
- 8 spokes at 45° intervals
- Spoke: 4px wide × 10px tall, rounded 4px
- Color: `labels.secondary` = `rgba(60,60,67,0.6)` (light) / `rgba(235,235,245,0.6)` (dark)
- Opacity per spoke: 100%, 87%, 75%, 63%, 51%, 39%, 27%, 15%
- Regular: 30×30px, Small: 22×22px
- Continuously rotating animation

**Changes:** The current Spinner uses `ActivityIndicator`. Add an `'ios'` variant that renders the custom 8-spoke spinner with CSS animation on web. Keep native `ActivityIndicator` as default.

---

## 5. Popover — UPDATE EXISTING

**Path:** `components/Popover/`

**Figma specs (iOS 26):**
- Glass material background (thick)
- Border radius: 38px (large, iPad style) or 13px for smaller popovers
- Shadow: `0px 10px 100px rgba(0,0,0,0.3)`
- Backdrop blur: 65px
- Arrow: 13px protrusion with glass material
- 12 directional positions

**Changes needed in `Popover.styles.ts`:**
- Add `variant?: 'default' | 'glass'` to PopoverProps
- Glass variant: uses `getGlassMaterialStyles('thick', theme)` for background
- Update shadow to iOS 26 spec
- Arrow styling with glass material on web

---

## 6. DatePicker — UPDATE EXISTING

**Path:** `components/DatePicker/`

**Figma specs (iOS 26):**
- Calendar grid: 7-column, compact spacing
- Selected day: blue circle (`accents.blue`)
- Today indicator: blue text
- Month header: bold, with `>` chevron
- Navigation: `<` `>` arrows in blue
- Day labels: SUN-SAT in light gray
- Time row: separator + pill-style time
- Compact trigger: date + time pills with gray bg

**Changes:** Visual polish to match iOS 26 colors. Update selected day styling to use `accents.blue`, header font weight, navigation chevron colors.

---

## 7. Notifications — UPDATE EXISTING

**Path:** `components/NotificationListItem/` and potential new `NotificationStack` component

**Figma specs (iOS 26):**
- Stacked cards (1-3 depth) with offset
- Glass material card with rounded corners
- Title + description text with icon
- Time stamp on right
- Expanded view with full content

**Changes:** Update visual styling to match iOS 26 glass treatment. The stacking behavior may need a new `NotificationStack` wrapper component.

---

## Implementation Order

| Step | Component | Action | Priority |
|------|-----------|--------|----------|
| 1 | SegmentedControl | Create new (4 files) | High |
| 2 | PageControl | Create new (4 files) | High |
| 3 | ProgressBar | Update styles (ios variant) | Medium |
| 4 | Spinner | Update with ios variant | Medium |
| 5 | Popover | Update styles (glass variant) | Medium |
| 6 | DatePicker | Visual polish | Lower |
| 7 | Notifications | Visual polish | Lower |
| 8 | Storybook stories | Create for new + updated | High |
| 9 | Root index.ts | Export new components | High |
| 10 | Typecheck + preview | Verify | High |

## Critical Files

- `components/SegmentedControl/` — NEW (4 files)
- `components/PageControl/` — NEW (4 files)
- `components/ProgressBar/ProgressBar.styles.ts` — UPDATE
- `components/ProgressBar/ProgressBar.types.ts` — UPDATE (add variant prop)
- `components/Spinner/Spinner.tsx` — UPDATE (add ios variant)
- `components/Popover/Popover.styles.ts` — UPDATE (glass variant)
- `tokens/colors.ts` — Already has iOS 26 tokens (accents, fills, labels)
- `index.ts` — Export new components
- `stories/components/Glass/iOS26Components.stories.tsx` — NEW story file

## Verification

1. `pnpm --filter @scaffald/ui typecheck`
2. Storybook preview of all new/updated components
3. Check light + dark mode rendering
4. Verify existing component backward compatibility
