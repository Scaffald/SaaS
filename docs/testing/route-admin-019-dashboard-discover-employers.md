# Route Documentation: /dashboard/discover/employers

**Route ID**: admin-route-explore-008
**Task ID**: 1b9f89ef-8b30-4d2b-b51c-48f8a258a01a
**User Type**: Admin
**Test User**: ewongagent@gmail.com
**Documentation Date**: 2025-11-02
**Status**: Documented via code analysis

## Overview

The Discover Employers route provides a comprehensive interface for discovering and browsing employer organizations. The route implements a two-panel adaptive layout with employer listings on the left and search/filter controls on the right.

## Route Architecture

**File Structure**:
- `packages/core/features/discover/discover-employers-screen.tsx` - Main screen component
- `packages/core/features/discover/discover-employers-left.tsx` - Left panel (employer listings)
- `packages/core/features/discover/discover-employers-right.tsx` - Right panel (search & filters)
- `packages/core/features/discover/components/EmployerCard.tsx` - Employer card component

**Layout Pattern**: Two-panel adaptive layout (left/right panels)

## UI Elements Documentation

### Left Panel: Employer Listings

#### Loading State
- **Spinner**: Large blue spinner centered in panel
- **Loading Text**: "Loading employers..." in gray text below spinner

#### Empty State
- **Heading**: "No employers found" (large, bold, dark text)
- **Subtext**: "Try adjusting your filters or search query" (smaller, gray text)
- **Layout**: Centered vertically and horizontally with gap spacing

#### Employer List View
- **Result Count**: Shows "{count} Employer" or "{count} Employers" at top
- **Scrollable List**: Vertical scroll view of employer cards with consistent spacing
- **Card Spacing**: $3 gap between cards, $4 padding around container

### Employer Card Component

Each employer card displays:

#### Header Section
- **Company Icon**: Building2 icon (blue, 20px)
- **Company Name**: Large, bold text (fontSize: $6, fontWeight: 700)
- **Industry Badge**: Blue text showing industry name (Construction, Manufacturing, etc.)

#### Description Section
- **Description Text**: Up to 3 lines of truncated company description
- **Font**: Medium size ($4), gray color ($color11)

#### Details Section (Icons with Text)
1. **Location**
   - Icon: MapPin (16px, gray)
   - Text: Street address or zip code, fallback to "Location not specified"

2. **Employee Count** (if available)
   - Icon: Users (16px, gray)
   - Text: Employee count range + "employees"

3. **Website** (if available)
   - Icon: ExternalLink (16px, gray)
   - Text: Website URL (truncated, protocol stripped, blue color)

#### Actions
- **View Details Button**: Full-width blue button at bottom
  - Text: "View Details"
  - Theme: Blue
  - Size: $3
  - Action: Logs employer details (TODO: Open detail modal or navigate)

#### Interaction States
- **Hover**: Background changes to hover color, border color highlights
- **Press**: Background changes to press color
- **Cursor**: Pointer on entire card (clickable)

### Right Panel: Search & Filter Controls

#### Header Section
- **Title**: "Search & Filter" (large, bold, fontSize: $6)
- **Subtitle**: "Find employers that match your interests" (small, gray)
- **Clear Button**: Red "Clear" button with X icon (only shows when filters active)

#### Search Section
- **Label**: "Search" with Search icon (16px)
- **Input Field**:
  - Placeholder: "Search employers..."
  - Size: $4
  - Searches: Name, description, industry name
  - Real-time filtering on text change

#### Industry Filter Section
- **Header**: "Industries" with Filter icon (16px)
- **Industry Buttons**: Vertical list of industry options
  - Industries: Construction, Manufacturing, Engineering, Technology, Healthcare, Education
  - **Unselected State**: Outlined variant, default theme
  - **Selected State**: Blue theme, outlined variant
  - **Size**: $3
  - **Interaction**: Toggle selection on press

#### Active Filters Summary (Conditional)
Shows only when filters are active:
- **Section Title**: "Active Filters" (bold)
- **Search Summary**: "Search: {query}" (gray label, blue value)
- **Industry Summary**: "Industries: {list}" (gray label, blue values separated)

#### Separators
- Horizontal separators between major sections for visual hierarchy

## Data Flow

### API Integration
- **Endpoint**: `api.employers.getEmployers.useQuery()`
- **Response**: `{ employers: Employer[] }`
- **Loading State**: Shows spinner while `isLoading === true`

### State Management
- **Search Query**: String state passed from right panel to left panel
- **Selected Industries**: String array passed from right panel to left panel
- **Local State**: Each panel manages its own UI state, communicates via callbacks

### Filtering Logic
Employers are filtered client-side based on:
1. **Search Query** (case-insensitive):
   - Matches against: name, description, industry name
2. **Industry Selection**:
   - Filters to only show employers in selected industries
   - Multiple industries can be selected (OR logic)

## Employer Data Model

```typescript
interface Employer {
  id: string
  name: string
  slug: string
  description: string | null
  website_url: string | null
  employee_count_range: string | null
  annual_revenue_range: string | null
  address: {
    street?: string
    zipCode?: string
  } | null
  industries: {
    id: string
    name: string
  } | null
  created_at: string
}
```

## User Interactions

### Primary Actions
1. **Search Employers**: Type in search field to filter by name, description, or industry
2. **Filter by Industry**: Click industry buttons to toggle selection
3. **Clear Filters**: Click "Clear" button to reset all filters
4. **View Employer Details**: Click card or "View Details" button (currently logs, TODO: open modal/navigate)

### Filter Combinations
- Search + Industry filters work together (AND logic)
- Multiple industries can be selected simultaneously (OR logic)
- Real-time filtering updates list as inputs change

## Accessibility Features

### Visual Indicators
- Color-coded states (blue for selected, gray for inactive)
- Icons paired with text for clarity
- Hover and press states for interactive elements

### Text Truncation
- Description limited to 3 lines with ellipsis
- Website URLs truncated with single line limit
- Maintains readability while preventing layout overflow

## Known TODOs

1. **Employer Detail View**: Currently logs to console, needs modal or navigation implementation
2. **Industry API Integration**: Industries are currently hardcoded, should fetch from API
3. **Selected Employer State**: State is defined but not fully utilized (line 19 in left component)
4. **Revenue Range Display**: Data field exists but not displayed in card

## Testing Considerations

### Functional Tests
- Verify employer list loads from API
- Test search functionality across name, description, and industry
- Test industry filter selection/deselection
- Test combined search + industry filters
- Test clear filters functionality
- Test empty state display when no results
- Test loading state display

### UI/Visual Tests
- Verify card layout and spacing
- Test hover/press states on cards and buttons
- Verify responsive behavior of two-panel layout
- Test text truncation on long descriptions/URLs
- Verify icon alignment and sizing

### Data Tests
- Test with varying employer counts (0, 1, many)
- Test with missing optional fields (description, website, location, employee count)
- Test with long text values (description, company name)
- Verify industry data display

### Performance Tests
- Test with large employer lists (100+ items)
- Verify scroll performance
- Test filter responsiveness with many items

### Accessibility Tests
- Verify keyboard navigation
- Test screen reader compatibility
- Verify color contrast ratios
- Test focus management

## Route Dependencies

### API Routes
- `employers.getEmployers` - Fetches employer list

### UI Components
- Tamagui: YStack, XStack, ScrollView, Text, Input, Label, Button, Card, Spinner, Separator
- Lucide Icons: Search, Filter, X, Building2, MapPin, Users, ExternalLink

### Utilities
- `@app/core/utils/api` - tRPC API client

## Admin-Specific Features

This route is accessible to admin users and displays all employers in the system. There are no special admin-only controls or features visible on this route - it functions as a standard employer discovery interface.

## Related Routes

- `/dashboard/discover/jobs` - Job discovery interface
- `/dashboard/discover/workers` - Worker discovery interface
- `/dashboard/discover/map` - Map-based discovery interface
- Employer detail page (route TBD based on TODO implementation)
