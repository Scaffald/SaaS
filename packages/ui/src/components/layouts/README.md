# Layout Components

This directory contains reusable layout components that provide consistent structure and design across the application.

## Components Overview

### AppHeader
A standardized header component with consistent design, spacing, and hamburger menu.

**Features:**
- Responsive hamburger menu (mobile only)
- Search bar with customizable behavior
- Notification button
- Customizable left and right content
- Consistent spacing and styling

**Usage:**
```tsx
import { AppHeader } from '@app/ui'

<AppHeader
  title="Page Title"
  showMenuButton={true}
  showSearch={true}
  showNotifications={true}
  onMenuPress={() => openDrawer()}
  onSearchChange={(query) => handleSearch(query)}
  onNotificationPress={() => openNotifications()}
/>
```

### PageLayoutWrapper
A comprehensive layout wrapper that combines header and content areas.

**Features:**
- Single or two-column layout options
- Integrated header management
- Responsive design
- Full page and padded content options

**Usage:**
```tsx
import { PageLayoutWrapper } from '@app/ui'

// Single column layout
<PageLayoutWrapper
  header={{ title: "Dashboard" }}
  layout="single-column"
  padded={true}
>
  <DashboardContent />
</PageLayoutWrapper>

// Two column layout
<PageLayoutWrapper
  header={{ title: "Settings" }}
  layout="two-column"
  twoColumnProps={{
    sidebar: <SettingsMenu />,
    isHomePage: false
  }}
>
  <SettingsContent />
</PageLayoutWrapper>
```

### TwoColumnLayout
Enhanced two-column layout with flexible configuration.

**Features:**
- Responsive sidebar (hidden on mobile for non-home pages)
- Customizable sidebar widths
- Loading skeleton support
- Flexible content padding and centering

**Usage:**
```tsx
import { TwoColumnLayout } from '@app/ui'

<TwoColumnLayout
  sidebar={<SidebarContent />}
  isHomePage={false}
  sidebarWidth={300}
  sidebarWidthLg={400}
  contentPadding="$6"
  centerContent={true}
>
  <MainContent />
</TwoColumnLayout>
```

### SingleColumnLayout
Simple single-column layout for dashboard and discover pages.

**Features:**
- Optional content centering
- Configurable max width
- Flexible padding options

**Usage:**
```tsx
import { SingleColumnLayout } from '@app/ui'

<SingleColumnLayout
  centered={true}
  maxWidth={1200}
  padding="$4"
>
  <PageContent />
</SingleColumnLayout>
```

## Layout Patterns

### Dashboard Root Pages
Use `PageLayoutWrapper` with `layout="single-column"` and `padded={true}`:

```tsx
<PageLayoutWrapper
  header={{ title: "Dashboard" }}
  layout="single-column"
  padded={true}
>
  <DashboardContent />
</PageLayoutWrapper>
```

### Settings/Profile Pages
Use `PageLayoutWrapper` with `layout="two-column"`:

```tsx
<PageLayoutWrapper
  header={{ title: "Settings" }}
  layout="two-column"
  twoColumnProps={{
    sidebar: <SettingsMenu />,
    isHomePage: false
  }}
>
  <SettingsContent />
</PageLayoutWrapper>
```

### Discover Pages
Use `PageLayoutWrapper` with `hideHeader={true}`:

```tsx
<PageLayoutWrapper
  hideHeader={true}
  fullPage={true}
>
  <DiscoverMap />
</PageLayoutWrapper>
```

## Migration Guide

### From Old HomeLayout
Replace the old `HomeLayout` with the new `PageLayoutWrapper`:

**Before:**
```tsx
<HomeLayout fullPage padded headerTitle="Settings">
  <SettingsContent />
</HomeLayout>
```

**After:**
```tsx
<PageLayoutWrapper
  header={{ title: "Settings" }}
  layout="single-column"
  fullPage={true}
  padded={true}
>
  <SettingsContent />
</PageLayoutWrapper>
```

### From Old TwoColumnLayout Usage
The new `TwoColumnLayout` is more flexible:

**Before:**
```tsx
<TwoColumnLayout sidebar={<Menu />} isHomePage={false}>
  <Content />
</TwoColumnLayout>
```

**After:**
```tsx
<TwoColumnLayout
  sidebar={<Menu />}
  isHomePage={false}
  sidebarWidth={300}
  contentPadding="$6"
  centerContent={true}
>
  <Content />
</TwoColumnLayout>
```

## Best Practices

1. **Consistent Headers**: Always use `AppHeader` for consistent header design
2. **Responsive Design**: Use `PageLayoutWrapper` for automatic responsive behavior
3. **Two-Column Pages**: Use `layout="two-column"` for settings, profile, and similar pages
4. **Single-Column Pages**: Use `layout="single-column"` for dashboard and content pages
5. **Discover Pages**: Use `hideHeader={true}` for full-screen experiences
6. **Loading States**: Use skeleton components for better UX during loading

## Accessibility

All layout components include proper accessibility attributes:
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader friendly structure
- Focus management for modals and drawers
