# Career Assessment Feature (RIASEC)

This feature provides RIASEC-based career interest assessment to help users discover career paths that match their interests and skills.

## Overview

The Career Assessment feature integrates with the O*NET 30.0 database to provide:
- **6-dimension interest assessment** (RIASEC: Realistic, Investigative, Artistic, Social, Enterprising, Conventional)
- **Occupation search** with 1,016+ O*NET occupations
- **Career recommendations** based on interest profiles
- **Skills auto-suggestion** from occupation data

## Components

### 1. CareerAssessmentWidget
**File:** `CareerAssessmentWidget.tsx`

Main dashboard widget that combines all career assessment components.

**Usage:**
```tsx
import { CareerAssessmentWidget } from '@app/core/features/career-assessment'

// In dashboard
<CareerAssessmentWidget />
```

**Features:**
- Automatically hides after user completes assessment
- Saves data to `user_preferences` table
- Shows loading and error states
- Toast notifications on success/error

---

### 2. RiasecQuickAssessment
**File:** `components/RiasecQuickAssessment.tsx`

Interactive 6-slider component for rating career interests.

**Usage:**
```tsx
import { RiasecQuickAssessment, type RiasecScores } from '@app/core/features/career-assessment'

const [scores, setScores] = useState<RiasecScores>({
  realistic: 3,
  investigative: 3,
  artistic: 3,
  social: 3,
  enterprising: 3,
  conventional: 3,
})

<RiasecQuickAssessment
  value={scores}
  onChange={setScores}
  disabled={false}
/>
```

**Props:**
- `value: RiasecScores` - Current scores (1-5 for each dimension)
- `onChange: (scores: RiasecScores) => void` - Callback when scores change
- `disabled?: boolean` - Whether sliders are disabled

---

### 3. OccupationSearch
**File:** `components/OccupationSearch.tsx`

Autocomplete search component for O*NET occupations.

**Usage:**
```tsx
import { OccupationSearch } from '@app/core/features/career-assessment'

const [occupationCode, setOccupationCode] = useState('')

<OccupationSearch
  value={occupationCode}
  onChange={(code, title) => {
    setOccupationCode(code)
    console.log('Selected:', title)
  }}
  placeholder="Search for your occupation..."
  disabled={false}
/>
```

**Props:**
- `value?: string` - Current O*NET code selected
- `onChange: (onetCode: string, title: string) => void` - Callback when occupation is selected
- `placeholder?: string` - Input placeholder text
- `disabled?: boolean` - Whether input is disabled

**Features:**
- Debounced search (300ms)
- Minimum 2 characters to trigger search
- Shows top 10 results in dropdown
- Displays occupation title and O*NET code

---

## API Endpoints

### O*NET Router
**Location:** `packages/supabase/functions/trpc/routers/onet.router.ts`

#### 1. Search Occupations
```typescript
api.onet.searchOccupations.useQuery({
  query: 'software developer',
  limit: 10 // optional, default 10, max 50
})

// Returns:
{
  occupations: [
    { onetsoc_code: '15-1252.00', title: 'Software Developers' },
    // ...
  ],
  query: 'software developer'
}
```

#### 2. Save Career Assessment
```typescript
api.onet.saveCareerAssessment.useMutation({
  riasec_scores: {
    realistic: 3,
    investigative: 5,
    artistic: 2,
    social: 4,
    enterprising: 3,
    conventional: 2,
  },
  current_occupation_code: '15-1252.00', // optional
  target_occupation_codes: ['15-1256.00'], // optional
})

// Returns: { success: true }
```

#### 3. Get Assessment Status
```typescript
api.onet.getCareerAssessmentStatus.useQuery()

// Returns:
{
  hasCompleted: true,
  riasec_scores: { ... },
  current_occupation_code: '15-1252.00',
  target_occupation_codes: [],
  completed_at: '2025-10-12T10:00:00Z'
}
```

#### 4. Get Occupation Details
```typescript
api.onet.getOccupation.useQuery({
  onetCode: '15-1252.00'
})

// Returns: Full occupation data from O*NET
```

---

## Database Schema

### Migration 018: Career Assessment Fields
**File:** `packages/supabase/migrations/018_add_career_assessment_to_preferences.sql`

Adds to `user_preferences` table:
- `riasec_scores` (JSONB) - Stores 6 interest scores (1-5)
- `current_occupation_code` (TEXT) - FK to `onet.occupation_data`
- `target_occupation_codes` (TEXT[]) - Array of goal occupations
- `career_assessment_completed_at` (TIMESTAMPTZ) - Completion timestamp

**RIASEC Scores Structure:**
```json
{
  "realistic": 3,
  "investigative": 4,
  "artistic": 2,
  "social": 5,
  "enterprising": 3,
  "conventional": 2
}
```

---

## RIASEC Dimensions

**R** - **Realistic**: Hands-on, tools, machines, building
**I** - **Investigative**: Problem-solving, analysis, research
**A** - **Artistic**: Creativity, self-expression, design
**S** - **Social**: Helping people, teaching, service
**E** - **Enterprising**: Leading, persuading, business
**C** - **Conventional**: Organizing, data, procedures

---

## Integration Guide

### 1. Add to Dashboard

```tsx
// In dashboard/dashboard-index-left.tsx
import { CareerAssessmentWidget } from '@app/core/features/career-assessment'

export function DashboardIndexLeft() {
  return (
    <YStack gap="$4">
      <PrerequisiteWidget />
      <CareerAssessmentWidget />
      {/* Other widgets */}
    </YStack>
  )
}
```

### 2. Apply Database Migration

```bash
# Start local Supabase
pnpm supa start

# Migration will auto-apply
# Or manually apply:
pnpm supa migration up
```

### 3. Verify Types

```bash
# Generate types from database
pnpm supa:generate
```

---

## Testing

### Manual Testing Steps

1. **Complete Prerequisites** (if not already done)
2. **View Dashboard** - CareerAssessmentWidget should appear
3. **Rate Interests** - Move all 6 sliders
4. **Search Occupation** - Type "software" and select from results
5. **Submit Assessment** - Click "Complete Assessment"
6. **Verify Save** - Widget should disappear
7. **Check Database** - Verify `user_preferences` has RIASEC data

### API Testing

```typescript
// Test occupation search
const { data } = await api.onet.searchOccupations.useQuery({
  query: 'engineer',
  limit: 5
})
console.log('Search results:', data)

// Test save assessment
const save = await api.onet.saveCareerAssessment.useMutation()
await save.mutateAsync({
  riasec_scores: { realistic: 4, investigative: 5, /* ... */ }
})

// Test get status
const status = await api.onet.getCareerAssessmentStatus.useQuery()
console.log('Assessment complete?', status.hasCompleted)
```

---

## Future Enhancements (Phase 2+)

- **Career Recommendations Widget** - Show top career matches
- **Skills Gap Widget** - Display missing skills for target occupation
- **Career Explorer** - Full career discovery interface
- **Full RIASEC Assessment** - 30+ question detailed assessment
- **Enhanced Job Matching** - Multi-dimensional compatibility scoring

See `docs/features/onet-roadmap.md` for complete roadmap.

---

## Troubleshooting

### Widget Not Appearing
- Check if user has completed prerequisites
- Verify user hasn't already completed assessment
- Check console for API errors

### Search Not Working
- Verify O*NET database is seeded
- Check `onet.search_occupations()` function exists
- Test API endpoint directly: `api.onet.searchOccupations.useQuery()`

### Save Failing
- Check user authentication
- Verify migration 018 applied
- Check `user_preferences` table RLS policies

---

## Dependencies

- **React Hook Form** - Form management
- **Zod** - Schema validation
- **tRPC** - Type-safe API
- **Tamagui** - UI components
- **O*NET 30.0** - Occupation database (pre-seeded)

---

## Related Documentation

- [O*NET Integration Plan](../../../docs/features/onet-integration.md)
- [O*NET Roadmap](../../../docs/features/onet-roadmap.md)
- [O*NET Database README](../../../packages/supabase/onet/README.md)
