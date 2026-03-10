---
pillar: "Expo & Core App"
status: active
last_verified: 2026-03-10
packages:
  - apps/scaffald/
  - packages/scf-core/
key_files:
  - apps/scaffald/app/index.tsx
  - apps/scaffald/app/_layout.tsx
  - apps/scaffald/app/dashboard/_layout.tsx
  - packages/scf-core/components/layouts/DashboardLayout.tsx
  - packages/scf-core/features/drawer/DrawerLayout.tsx
  - packages/scf-core/features/drawer/DrawerContent.tsx
critical_constraints:
  - "NEVER conditionally render different wrapper components around Stack/Drawer navigators"
  - "Use useResponsive from @scaffald/ui, NOT useWindowDimensions from react-native-web"
  - "Navigation guards must set state synchronously BEFORE async operations"
  - "Always render DrawerLayout; use overlay for loading, never conditional mount"
  - "ScaffaldProvider must handle null config without crashing"
---

# Expo & Core App — Routes, Layouts, Navigation

## The Navigator Wrapper Rule

**NEVER conditionally render different wrapper components around Stack or Drawer navigators.**

Switching between `<>{children}</>` and `<SomeProvider>{children}</SomeProvider>` causes the entire navigator to unmount/remount, firing all navigation effects simultaneously and exceeding React's max update depth.

```typescript
// ❌ WRONG — conditional wrapper causes remount
if (loading) {
  return <Stack><Spinner /></Stack>
}
return <DrawerLayout><Slot /></DrawerLayout>

// ✅ CORRECT — always render DrawerLayout, overlay loading state
return (
  <DrawerLayout>
    {loading && (
      <View style={StyleSheet.absoluteFill}>
        <Spinner />
      </View>
    )}
    <Slot />
  </DrawerLayout>
)
```

This has caused **7 distinct crashes** in this codebase. The pattern applies to:
- `apps/scaffald/app/dashboard/_layout.tsx` — Drawer navigator
- `ScaffaldJobsSdkProviderFromSession` — SDK context wrapper
- Any component wrapping a `NativeStackNavigator` or `Drawer`

## Navigation Guard Pattern

Navigation guards must set state **synchronously before** calling async operations.

```typescript
// ❌ WRONG — setState inside async function, race condition
useEffect(() => {
  async function navigate() {
    await continueOAuthFlowIfPending()
    setHasNavigated(true)  // Too late — re-render already queued
    router.replace('/dashboard')
  }
  if (!hasNavigated) navigate()
}, [hasNavigated])

// ✅ CORRECT — synchronous guard before async work
useEffect(() => {
  if (hasNavigated) return
  setHasNavigated(true)  // Synchronous — prevents re-entry

  async function performNavigation() {
    await continueOAuthFlowIfPending()
    router.replace('/dashboard')
  }
  performNavigation()
}, [])  // Note: remove router from deps (it's a stable ref)
```

## Root Index Navigation Flow

`apps/scaffald/app/index.tsx` follows this sequence:
1. Check authentication state
2. Check onboarding completion
3. Check prerequisites
4. Navigate to appropriate destination

Each step must complete before the next. The `hasNavigated` guard prevents the effect from re-entering.

## Auth / Onboarding Integration Points

- `continueOAuthFlowIfPending()` — must be called early in the root index
- `ScaffaldJobsSdkProviderFromSession` — wraps SDK context; must handle null session gracefully
- `ScaffaldProvider` — **must handle null config without crashing**. A null config means the user is unauthenticated; the provider should render children without SDK functionality.

## ThemeBridge Stable Callback

`apps/scaffald/app/_layout.tsx` connects the theme system. The `ThemeBridge` component must use a stable callback ref pattern:

```typescript
// ❌ WRONG — new function every render, causes ThemeProvider re-renders
<ThemeProvider onThemeChange={useThemeSetting().set}>

// ✅ CORRECT — stable callback via ref
const onChangeRef = useRef(useThemeSetting().set)
onChangeRef.current = useThemeSetting().set
const handleThemeChange = useCallback((t) => onChangeRef.current(t), [])
<ThemeProvider onThemeChange={handleThemeChange}>
```

**Why:** `useThemeSetting()` creates a new `set` function each call. Passing it directly causes ThemeProvider to re-render, which triggers all 134+ `useThemeContext()` consumers.

## useResponsive vs useWindowDimensions

Always use `useResponsive` from `@scaffald/ui`. See `.radium/scaffald-ui.md` for details.

**Remaining `useWindowDimensions` usages** (not in critical dashboard path, migrate when touched):
- `ProfileCard.tsx`
- `AssessmentsTabs.tsx`
- `OfficeLayout.tsx`
- `ResponsiveSelect.tsx`
- `Onboarding.tsx`
- Auth screens
