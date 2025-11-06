# Review Analytics Enhancement

## Overview

This enhancement adds comprehensive review analytics and visualization to user profiles, displaying rich aggregated data from the 8-step review wizard.

## Problem Statement

The review system collects extensive data through an 8-step wizard:
1. Technical Skills Ratings
2. Skills Strengths/Improvements Tags
3. Reliability Rating
4. Reliability Tags
5. Collaboration Rating
6. Collaboration Tags
7. Summary Comment
8. Recommendation

However, the profile only displayed minimal data:
- Overall average rating
- Total review count
- Thumbs up/down counts
- Basic review cards

## Solution Architecture

### Phase 1: Database Schema ✅
**File**: `packages/supabase/migrations/20241031_review_enhancements.sql`

Created missing tables:
- `soft_skills` - Catalog of soft skills by category
- `review_category_ratings` - Category-level ratings (reliability, collaboration, etc.)
- `review_soft_skill_votes` - Strength/improvement tags per review

Seeded 25 soft skills across 4 categories:
- Reliability (6 skills)
- Collaboration (7 skills) 
- Professionalism (6 skills)
- Technical (6 skills)

### Phase 2: API Enhancement ✅
**File**: `packages/supabase/functions/trpc/routers/reviews.router.ts`

Added `getReviewAnalytics` endpoint that returns:
```typescript
{
  overall: {
    totalReviews, recommendCount, notRecommendCount, recommendPercentage
  },
  skills: SkillRating[],  // Aggregated skill ratings with frequency
  categories: CategoryRating[],  // Aggregated category ratings
  tags: {
    strengths: TagData[],  // Top 20 most common strengths
    improvements: TagData[]  // Top 20 most common improvements
  },
  timeline: TimelineData[]  // Monthly review trends
}
```

### Phase 3: Component Architecture ✅

**Directory Structure**:
```
packages/core/features/profile/widgets/reviews/
├── types/
│   └── index.ts              ✅ Type definitions
├── hooks/
│   └── useReviewAnalytics.ts ✅ Data fetching hook
└── components/
    ├── TagCloud.tsx          ✅ Tag visualization
    ├── SkillsHeatmap.tsx     🚧 TODO
    ├── CategoryRadar.tsx     🚧 TODO
    ├── ReviewOverviewTab.tsx 🚧 TODO
    ├── ReviewSkillsTab.tsx   🚧 TODO
    ├── ReviewSoftSkillsTab.tsx 🚧 TODO
    └── index.ts              🚧 TODO
```

**Completed Components**:

1. **Type Definitions** (`types/index.ts`)
   - ReviewAnalytics interface
   - SkillRating, CategoryRating, TagData interfaces
   - ReviewWidgetProps type

2. **useReviewAnalytics Hook** (`hooks/useReviewAnalytics.ts`)
   - Fetches analytics data for a user
   - Handles loading states
   - Returns typed analytics data

3. **TagCloud Component** (`components/TagCloud.tsx`)
   - Displays strength/improvement tags
   - Frequency-based sizing
   - Color-coded by type (green for strengths, red for improvements)

### Phase 4: Remaining Implementation 🚧

**Components to Build**:

1. **SkillsHeatmap** (uses BarChart from @app/ui)
   - Horizontal bar chart showing most rated skills
   - Bar height = frequency, color intensity = average rating
   - Sortable by frequency or rating

2. **CategoryRadar** (uses RadarChart from @app/ui)
   - Pentagon/hexagon radar chart for 5 categories
   - Visual comparison of Reliability, Collaboration, Technical Skills, etc.
   - Shows average ratings across all reviews

3. **ReviewOverviewTab**
   - Enhanced version of current summary view
   - Includes: overall stats, category radar, top strengths/improvements
   - Recommendation breakdown (pie chart or percentage bars)

4. **ReviewSkillsTab**
   - Deep dive into technical skill ratings
   - Skills heatmap
   - Individual skill breakdowns
   - Filter by skill category

5. **ReviewSoftSkillsTab**
   - Reliability & collaboration analysis
   - Category-specific tag clouds
   - Trend analysis over time

6. **Main ReviewsWidget Enhancement**
   - Add tabbed interface using Tamagui Tabs
   - Tabs: Overview | Skills | Soft Skills | Reviews
   - Each tab self-manages data fetching
   - Maintain backward compatibility with current widget

## UI Components Available

From `@app/ui/components/charts`:
- ✅ `BarChart` - For skill frequency/ratings
- ✅ `RadarChart` - For category comparisons
- ✅ `LineChart` - For timeline trends
- ✅ `PieChart` - For recommendation distribution

## Integration Points

### Current ReviewsWidget
**File**: `packages/core/features/profile/widgets/ReviewsWidget.tsx`

This file will be refactored to:
1. Import new tab components
2. Add Tamagui Tabs UI
3. Route to appropriate tab component
4. Maintain backward compatibility

### User Profile Page
**File**: `apps/expo/app/dashboard/users/[id]/index.tsx`

No changes needed - widget is self-contained and will automatically show enhanced UI.

## Migration Steps

### 1. Run Database Migration
```bash
# Apply new tables and seed data
pnpm supa migration:up
# Or for production
pnpm supa db push
```

### 2. Generate TypeScript Types
```bash
pnpm supa:generate
```

### 3. Test Analytics Endpoint
```typescript
// Test in browser console or API client
const analytics = await api.reviews.getReviewAnalytics.query({
  subjectId: 'user-uuid-here'
});
console.log(analytics);
```

### 4. Implement Remaining Components
Build components in this order:
1. SkillsHeatmap (simplest chart component)
2. CategoryRadar (requires data transformation)
3. ReviewOverviewTab (combines multiple components)
4. ReviewSkillsTab & ReviewSoftSkillsTab
5. Main widget refactor with tabs

### 5. Testing Strategy
- **Unit Tests**: Test data transformations in analytics endpoint
- **Component Tests**: Test each visualization component
- **Integration Tests**: Test full widget with real data
- **Visual Tests**: Verify responsive design on mobile/web
- **Performance Tests**: Ensure charts render efficiently

## Design Decisions

### Self-Contained Components
Each tab component manages its own data fetching using `useReviewAnalytics` hook. This ensures:
- No prop drilling
- Easy to test
- Can be used independently
- Better performance (only active tab fetches)

### Cross-Platform Charts
Using Tamagui-based chart components from `@app/ui` ensures:
- Works on web, iOS, and Android
- Consistent styling
- Accessible
- Performant

### Backward Compatibility
The enhanced widget maintains the same props interface:
```typescript
interface ReviewWidgetProps {
  userId: string
  showEdit?: boolean
  variant?: 'full' | 'compact'
}
```

Compact variant can show condensed analytics or fallback to current view.

## Performance Considerations

### Data Aggregation
- Aggregation happens server-side in tRPC endpoint
- Reduces client-side processing
- Returns only top 20 tags to limit payload size
- Timeline grouped by month (not daily) for reasonable data size

### Lazy Loading
- Each tab loads data only when active
- Charts render on-demand
- Use React.memo for expensive chart components

### Caching
- tRPC queries cached by React Query
- 5-minute stale time for analytics data
- Invalidate cache on new review submission

## Future Enhancements

### Phase 5: Advanced Features (Future)
- Export analytics to PDF/CSV
- Compare user to industry averages
- Skill endorsements from connections
- Review response/rebuttal system
- Review helpfulness voting
- Filter reviews by date range
- Skill certification verification badges

### Phase 6: Admin Analytics (Future)
- Platform-wide review statistics
- Review quality scoring
- Fraud detection
- Automated review moderation

## Testing Checklist

- [ ] Database migration applies cleanly
- [ ] Soft skills seeded correctly
- [ ] Analytics endpoint returns correct data
- [ ] TagCloud renders with proper sizing
- [ ] SkillsHeatmap shows accurate data
- [ ] CategoryRadar displays all categories
- [ ] Tabs switch correctly
- [ ] Mobile responsive design works
- [ ] Dark mode styling correct
- [ ] Loading states handled
- [ ] Empty states handled
- [ ] Error states handled
- [ ] Performance acceptable (< 2s load)

## Dependencies

### New Dependencies
None - uses existing packages

### Existing Dependencies
- `@trpc/server` - API layer
- `tamagui` - UI components
- `@app/ui` - Chart components
- `expo-crypto` - UUID generation
- `zod` - Schema validation

## Rollout Plan

### Phase 1: Database & API (Completed)
- ✅ Create migration
- ✅ Seed soft skills
- ✅ Add analytics endpoint
- ✅ Fix linting/type errors

### Phase 2: Core Components (In Progress)
- ✅ Create type definitions
- ✅ Create data fetching hook
- ✅ Build TagCloud component
- 🚧 Build SkillsHeatmap
- 🚧 Build CategoryRadar

### Phase 3: Tab Components (TODO)
- 🚧 Build ReviewOverviewTab
- 🚧 Build ReviewSkillsTab
- 🚧 Build ReviewSoftSkillsTab

### Phase 4: Integration (TODO)
- 🚧 Refactor main ReviewsWidget
- 🚧 Add tabbed interface
- 🚧 Test integration
- 🚧 Update documentation

### Phase 5: Deploy (TODO)
- 🚧 Run migration in staging
- 🚧 QA testing
- 🚧 Run migration in production
- 🚧 Monitor performance
- 🚧 Gather user feedback

## Success Metrics

- Increased user engagement with reviews
- More complete review data collection
- Better insight into user strengths/weaknesses
- Improved hiring decisions based on rich data
- Positive user feedback on enhanced analytics

## Notes

- All chart components are cross-platform (web, iOS, Android)
- Analytics endpoint is public (no auth required for viewing)
- Review submission still requires authentication
- Soft skills catalog can be expanded via database seeding
- Tag frequency affects visual weight in cloud
- Timeline data grouped by month for better UX
