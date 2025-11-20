# Remaining useMedia Instances Analysis

This document lists the 13 remaining instances of `useMedia` in the codebase and categorizes them as either:
- **Logic-based** (appropriate to keep) - Used for calculations, conditional rendering, or behavior
- **Styling-based** (could potentially be replaced) - Used for styling props

## Summary

- **Total remaining**: 13 instances
- **Logic-based (keep)**: 12 instances
- **Styling-based (review)**: 1 instance (OfficeTabs - conditional rendering, but could potentially use Adapt)

## Detailed Analysis

### 1. Breadcrumb (`packages/ui/src/components/Breadcrumb.tsx`)
- **Usage**: `const isMobile = media.sm`
- **Purpose**: Determines which breadcrumb items to display (logic for item calculation)
- **Category**: ✅ **Logic-based** - Keep as-is
- **Reason**: Controls which items are shown, not styling

### 2. ProfileCard (`packages/ui/src/components/cards/ProfileCard.tsx`)
- **Usage**: `const titleNumberOfLines = media.sm ? 3 : 2`
- **Purpose**: Sets `numberOfLines` prop for text truncation
- **Category**: ✅ **Logic-based** - Keep as-is
- **Reason**: Controls text truncation behavior, not styling

### 3. NewsCard (`packages/ui/src/components/cards/NewsCard.tsx`)
- **Usage**: `const titleNumberOfLines = media.sm ? 3 : 2` and `descriptionNumberOfLines = media.sm ? 4 : 3`
- **Purpose**: Sets `numberOfLines` props for text truncation
- **Category**: ✅ **Logic-based** - Keep as-is
- **Reason**: Controls text truncation behavior, not styling

### 4. CardHeader (`packages/ui/src/components/cards/CardHeader.tsx`)
- **Usage**: `const titleNumberOfLines = media.sm ? 2 : 1` and `subtitleNumberOfLines = media.sm ? 2 : 1`
- **Purpose**: Sets `numberOfLines` props for text truncation
- **Category**: ✅ **Logic-based** - Keep as-is
- **Reason**: Controls text truncation behavior, not styling

### 5. OfficeTabs (`packages/ui/src/components/navigation/OfficeTabs.tsx`)
- **Usage**: `const isSmallScreen = media.sm` - used for conditional rendering
- **Purpose**: Renders horizontal ScrollView on mobile, vertical YStack on desktop
- **Category**: ⚠️ **Logic-based (conditional rendering)** - Could potentially use Adapt component
- **Reason**: Different component structure based on screen size
- **Note**: This is conditional rendering, not styling. Could use Tamagui's `Adapt` component, but current approach is valid.

### 6. PhoneNumberInput (`packages/ui/src/components/inputs/PhoneNumberInput.tsx`)
- **Usage**: `const isMobile = media.sm` - used with `Adapt` component
- **Purpose**: Uses `Adapt when={isMobile}` to render Sheet on mobile, Select on desktop
- **Category**: ✅ **Logic-based** - Keep as-is
- **Reason**: Uses Tamagui's Adapt pattern for conditional rendering

### 7. AvatarCropModal (`packages/ui/src/components/image-picker/AvatarCropModal.tsx`)
- **Usage**: `const isMobile = media.sm` - used for size calculations and conditional rendering
- **Purpose**: 
  - Calculates `maxDisplaySize` based on screen size
  - Conditionally renders Sheet vs Dialog
- **Category**: ✅ **Logic-based** - Keep as-is
- **Reason**: Size calculations and conditional rendering

### 8. SkillSearchModal (`packages/ui/src/components/skills/SkillSearchModal.tsx`)
- **Usage**: `const isMobile = media.sm` - used for conditional rendering
- **Purpose**: Conditionally renders Sheet on mobile, Dialog on desktop
- **Category**: ✅ **Logic-based** - Keep as-is
- **Reason**: Conditional rendering (similar to ResponsiveModal)

### 9. ResponsiveModal (`packages/ui/src/components/ResponsiveModal.tsx`)
- **Usage**: `const isMobile = media.sm` - used for conditional rendering
- **Purpose**: Conditionally renders Sheet on mobile, Dialog on desktop
- **Category**: ✅ **Logic-based** - Keep as-is
- **Reason**: Conditional rendering pattern

### 10. useOfficeRouteProtection (`packages/core/utils/auth/useOfficeRouteProtection.ts`)
- **Usage**: `const isTabletOrAbove = media.gtSm` - used in useEffect
- **Purpose**: Redirects mobile users away from Office routes
- **Category**: ✅ **Logic-based** - Keep as-is
- **Reason**: Routing logic, not styling

### 11. TeamAnalyticsCharts (`packages/core/features/office/teams/components/TeamAnalyticsCharts.tsx`)
- **Usage**: `const isSmallScreen = media.sm` - used for chart sizing
- **Purpose**: Calculates chart dimensions, spacing, and ScrollView horizontal prop
- **Category**: ✅ **Logic-based** - Keep as-is
- **Reason**: Chart sizing calculations

### 12. OfficeFlyoutMenu (`packages/core/features/office-navigation/components/OfficeFlyoutMenu.tsx`)
- **Usage**: `const isSmallScreen = media.sm` - used for width calculation
- **Purpose**: Calculates `menuWidth = isSmallScreen ? Math.min(width - 32, 400) : 360`
- **Category**: ✅ **Logic-based** - Keep as-is
- **Reason**: Width calculation based on screen size

### 13. discover-map-screen (`packages/core/features/discover/discover-map-screen.tsx`)
- **Usage**: `const isSmallScreen = media.sm || isNativeMobile` - used extensively for view logic
- **Purpose**: 
  - Controls mobile view mode (map vs list)
  - Conditionally renders different UI components
  - Controls sheet visibility
  - Position calculations
- **Category**: ✅ **Logic-based** - Keep as-is
- **Reason**: Complex view logic and conditional rendering

## Conclusion

All 13 remaining instances are **logic-based** and appropriate to keep. They are used for:
- Conditional rendering (Sheet vs Dialog, different component structures)
- Calculations (sizing, positioning, width calculations)
- Behavior control (text truncation, routing, view modes)

None of these are pure styling uses that could be replaced with media query props. The migration from `useMedia` to Tamagui media queries (`$md`, `$sm`) has been successfully completed for all styling-related usage.

