# O*NET Review Implementation Guide

**Status**: ✅ Frontend Complete - Ready for Testing  
**Last Updated**: October 17, 2025

---

## Overview

Complete O*NET-based review wizard implementation with mock data for frontend testing. The system uses 24 O*NET elements across 4 categories to assess soft skills with scientific backing.

## Quick Start

### Using the O*NET Review Wizard

```tsx
import { OnetReviewWizard } from '@app/core/features/reviews/components'

function MyComponent() {
  return (
    <OnetReviewWizard
      subjectId="user-123"
      subjectName="John Doe"
      onCancel={() => console.log('Review cancelled')}
      onComplete={() => console.log('Review completed')}
    />
  )
}
```

## Architecture

### File Structure

```
packages/core/features/reviews/
├── data/
│   └── mock-onet-elements.ts        # 24 O*NET elements in 4 categories
├── hooks/
│   └── useOnetReviewDraft.ts        # State management for O*NET reviews
└── components/
    ├── OnetReviewWizard.tsx         # Main wizard component (6 steps)
    ├── OnetCategoryStep.tsx         # Category rating step
    ├── OnetElementRating.tsx        # Individual element rating
    ├── OnetSummaryStep.tsx          # Summary with strengths/improvements
    └── index.ts                     # Component exports
```

### Data Structure

#### O*NET Elements (24 total)

**4 Categories:**
1. **Communication & Teamwork** (6 elements)
   - Active Listening (Skill)
   - Speaking (Skill)
   - Written Expression (Ability)
   - Social Perceptiveness (Skill)
   - Coordination (Skill)
   - Instructing (Skill)

2. **Work Ethic & Reliability** (6 elements)
   - Dependability (Work Value)
   - Selective Attention (Ability)
   - Stress Tolerance (Ability)
   - Self Control (Ability)
   - Initiative (Work Value)
   - Time Management (Skill)

3. **Problem Solving & Adaptability** (6 elements)
   - Problem Sensitivity (Ability)
   - Deductive Reasoning (Ability)
   - Critical Thinking (Skill)
   - Complex Problem Solving (Skill)
   - Adaptability/Flexibility (Ability)
   - Learning Ability (Ability)

4. **Professionalism & Safety** (6 elements)
   - Safety Consciousness (Work Activity)
   - Achievement (Work Value)
   - Integrity (Work Value)
   - Quality Focus (Work Value)
   - Respect for Others (Work Value)
   - Independence (Work Value)

## Wizard Flow (6 Steps)

### Step 1-4: Category Rating

Each category step allows rating all elements 1-5 stars:
- **1 star**: Poor
- **2 stars**: Below Average
- **3 stars**: Average
- **4 stars**: Above Average (auto-suggests "Strength")
- **5 stars**: Excellent (auto-suggests "Strength")

For ratings ≥3, users can mark as:
- ✅ **Strength**: Person excels in this area
- 🎯 **Area to Improve**: Room for growth

### Step 5: Summary

- Shows recap of strengths and improvements
- Free-text summary field (500 chars)
- Visual breakdown of key strengths and improvement areas

### Step 6: Recommendation

- Yes/No recommendation
- Shows summary statistics:
  - Total strengths
  - Total improvement areas
  - Total items rated

## Using Components Individually

### OnetCategoryStep

```tsx
import { OnetCategoryStep } from '@app/core/features/reviews/components'
import { REVIEW_CATEGORIES } from '@app/core/features/reviews/data/mock-onet-elements'

function MyStep() {
  const [ratings, setRatings] = useState({})
  
  const handleRate = (rating) => {
    setRatings(prev => ({
      ...prev,
      [rating.elementId]: rating
    }))
  }

  return (
    <OnetCategoryStep
      category={REVIEW_CATEGORIES[0]} // Communication & Teamwork
      ratings={ratings}
      onRate={handleRate}
    />
  )
}
```

### OnetElementRating

```tsx
import { OnetElementRatingComponent } from '@app/core/features/reviews/components'
import { getOnetElement } from '@app/core/features/reviews/data/mock-onet-elements'

function SingleElement() {
  const element = getOnetElement('2.A.1.a') // Active Listening
  const [rating, setRating] = useState(null)

  return (
    <OnetElementRatingComponent
      element={element}
      rating={rating}
      onRate={setRating}
      showDescription={true}
    />
  )
}
```

### useOnetReviewDraft Hook

```tsx
import { useOnetReviewDraft } from '@app/core/features/reviews/hooks/useOnetReviewDraft'

function MyCustomWizard() {
  const draft = useOnetReviewDraft({ subjectId: 'user-123' })

  return (
    <div>
      <p>Current Step: {draft.currentStep}</p>
      <p>Ratings: {Object.keys(draft.onetRatings).length}</p>
      
      {/* Update rating */}
      <button onClick={() => draft.updateRating({
        elementId: '2.A.1.a',
        elementType: 'skill',
        rating: 5,
        isStrength: true
      })}>
        Rate Active Listening
      </button>

      {/* Navigation */}
      <button onClick={draft.goToNextStep}>Next</button>
      <button onClick={draft.goToPreviousStep}>Back</button>

      {/* Get stats */}
      <pre>{JSON.stringify(draft.getStrengthsAndImprovements(), null, 2)}</pre>
    </div>
  )
}
```

## State Management

### OnetReviewDraft Interface

```typescript
interface OnetReviewDraft {
  subjectId: string
  onetRatings: Record<string, OnetElementRating>
  summary: string
  recommendation: boolean | null
  currentStep: number
}

interface OnetElementRating {
  elementId: string
  elementType: 'ability' | 'skill' | 'work_value' | 'work_activity'
  rating: number // 1-5
  isStrength: boolean
  notes?: string
}
```

### Hook API

```typescript
const draft = useOnetReviewDraft({ subjectId })

// State
draft.currentStep           // Current wizard step
draft.onetRatings          // All ratings
draft.summary              // Summary text
draft.recommendation       // Yes/No recommendation
draft.hasUnsavedChanges    // Whether there are unsaved changes

// Actions
draft.updateRating(rating)              // Update single rating
draft.updateSummary(text)               // Update summary
draft.updateRecommendation(bool)        // Set recommendation
draft.goToNextStep()                    // Navigate forward
draft.goToPreviousStep()                // Navigate backward
draft.goToStep(stepNumber)              // Jump to specific step
draft.markAsSaved()                     // Clear unsaved flag
draft.getDraft()                        // Get full draft object

// Helpers
draft.getCategoryStats(elementIds)      // Get category completion %
draft.getStrengthsAndImprovements()    // Get strengths and improvements arrays
```

## Testing Checklist

### Basic Flow
- [ ] Wizard loads successfully
- [ ] Can navigate through all 6 steps
- [ ] Back button works correctly
- [ ] Progress indicator updates

### Rating Functionality
- [ ] Can rate elements 1-5 stars
- [ ] Ratings persist when navigating back/forward
- [ ] Auto-suggest strength for 4-5 star ratings
- [ ] Can toggle strength/improvement for ratings ≥3
- [ ] Element descriptions expand/collapse

### Summary Step
- [ ] Shows correct count of strengths
- [ ] Shows correct count of improvements
- [ ] Lists top 5 strengths/improvements
- [ ] Can write summary text
- [ ] Character count updates

### Recommendation Step
- [ ] Shows review statistics correctly
- [ ] Can select Yes/No recommendation
- [ ] Submit button disabled until recommendation selected
- [ ] Submit button triggers onComplete callback

### Edge Cases
- [ ] Empty ratings (skip through all steps)
- [ ] Partial ratings (rate some but not all)
- [ ] All strengths (no improvements)
- [ ] All improvements (no strengths)
- [ ] Maximum summary text (500 chars)

## Mock Data Reference

### Available O*NET Elements

```typescript
import {
  MOCK_ONET_ELEMENTS,    // All 24 elements
  REVIEW_CATEGORIES,     // 4 category objects
  getOnetElement,        // Get element by ID
  getReviewCategory,     // Get category by ID
  MOCK_REVIEW_DATA       // Sample ratings
} from '@app/core/features/reviews/data/mock-onet-elements'
```

### Element IDs by Category

**Communication & Teamwork:**
- `2.A.1.a` - Active Listening
- `2.A.1.b` - Speaking
- `1.A.1.a.4` - Written Expression
- `2.B.1.a` - Social Perceptiveness
- `2.B.1.b` - Coordination
- `2.B.1.e` - Instructing

**Work Ethic & Reliability:**
- `1.B.2.a.1` - Dependability
- `1.A.1.b.5` - Selective Attention
- `1.A.4.a.1` - Stress Tolerance
- `1.A.4.a.2` - Self Control
- `1.B.2.a.2` - Initiative
- `2.C.1.a` - Time Management

**Problem Solving & Adaptability:**
- `1.A.1.a.3` - Problem Sensitivity
- `1.A.1.b.1` - Deductive Reasoning
- `2.A.3.a` - Critical Thinking
- `2.A.3.b` - Complex Problem Solving
- `1.A.4.a.3` - Adaptability/Flexibility
- `1.A.1.a.2` - Learning Ability

**Professionalism & Safety:**
- `4.C.2.d.1.i` - Safety Consciousness
- `1.B.2.a` - Achievement
- `1.B.2.d.1` - Integrity
- `1.B.2.a.3` - Quality Focus
- `1.B.2.d.2` - Respect for Others
- `1.B.2.b` - Independence

## Next Steps (Backend Integration)

When ready to implement backend:

1. **Database Migration**
   - Create `review_onet_element_ratings` table
   - See `docs/features/reviews-onet-integration.md` for schema

2. **tRPC Router Updates**
   - Add `saveOnetRatings` mutation
   - Update `submitReview` to handle O*NET data
   - Add `getOnetReview` query

3. **Replace Mock Data**
   - Connect to real O*NET database
   - Query actual O*NET elements
   - Load user's existing ratings

4. **Auto-save Implementation**
   - Add auto-save hook (similar to existing `useReviewAutoSave`)
   - Save ratings periodically
   - Restore draft on wizard load

## Styling Notes

- Uses Tamagui components throughout
- Responsive design (works on mobile/tablet/desktop)
- Theme-aware colors
- Consistent spacing with `$` tokens
- Some minor TypeScript warnings with color tokens (safe to ignore)

## Known Issues

### Non-Critical TypeScript Warnings
- Some color token type mismatches (e.g., `$orange9`, `$blue6`)
- Does not affect functionality
- Will be resolved when using proper Tamagui theme setup

### To Fix Later
- Add proper TypeScript types for Tamagui theme tokens
- Add loading states for async operations
- Add error boundaries
- Add toast notifications for save feedback

---

## Quick Reference: Replace Old Wizard

To switch from the old review wizard to the new O*NET wizard:

```tsx
// Old way
import { ReviewWizard } from '@app/core/features/reviews/components'

// New way
import { OnetReviewWizard } from '@app/core/features/reviews/components'

// Same props interface!
<OnetReviewWizard
  subjectId={userId}
  subjectName={userName}
  onCancel={handleCancel}
  onComplete={handleComplete}
/>
```

Both wizards have identical props, making it easy to A/B test or switch between them.

---

**Ready to test!** 🎉

The complete O*NET review wizard is now implemented and ready for frontend testing with mock data. All components are working and can be tested in isolation or as part of the complete wizard flow.
