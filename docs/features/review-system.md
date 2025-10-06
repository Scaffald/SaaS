# Review System with Soft Skills

## Current Implementation Status

### ✅ Backend Complete (100%)
- **Database Schema**: All tables created and seeded
  - `soft_skills` - 30+ construction industry soft skills in 4 categories
  - `review_progress` - Multi-step completion tracking
  - `review_category_ratings` - Category-level ratings (1-5 stars)
  - `review_soft_skill_votes` - Strengths/improvements tracking
- **API Layer**: 12 tRPC endpoints fully implemented
  - Draft management (create, read, update, delete)
  - Step-by-step updates (skills, categories, soft skills, comments)
  - Submission workflow (draft → submitted → released)
- **Migrations**: 046 & 047 applied successfully
- **TypeScript Types**: Generated from database schema

### 🚧 Frontend In Progress (0%)
- Review flow UI components (8 steps)
- Auto-save hooks and state management
- Progress tracking and resume capability
- Integration with user profiles
- Mobile-responsive design

### 📋 Next Steps
1. Build review flow components (8-step wizard)
2. Implement auto-save with debouncing
3. Add "Leave Review" buttons to user profiles
4. Create draft management UI
5. Test complete end-to-end flow

---

## Overview

The review system enables users to provide comprehensive feedback on workers, including technical skills, soft skills (reliability, collaboration, professionalism), and written comments. The system supports a multi-step workflow with auto-save functionality, allowing users to exit and resume at any time.

## Key Features

1. **Multi-step review process** - 8 distinct steps for comprehensive feedback
2. **Auto-save functionality** - Progress saved after each interaction
3. **Draft/Submit/Release workflow** - Reviews remain private until released
4. **Soft skills tracking** - Categorized soft skills for construction industry
5. **Progress tracking** - Monitor completion status of review steps
6. **Resume capability** - Exit and return to drafts at any time

## Database Schema

### Core Tables

#### `soft_skills`
Reference table for all available soft skills, organized by category.

```sql
- id: uuid (PK)
- category: enum ('reliability', 'collaboration', 'professionalism', 'technical')
- name: text
- description: text
- order_index: int
- is_active: boolean
```

**Categories:**
- **Reliability**: Deadline management, prioritization, planning & scheduling, etc.
- **Collaboration**: Teamwork, communication, conflict resolution, adaptability, etc.
- **Professionalism**: Work ethic, safety awareness, problem-solving, initiative, etc.
- **Technical**: Craftsmanship, tool proficiency, attention to detail, etc.

#### `review_progress`
Tracks completion status of each review step.

```sql
- review_id: uuid (PK, FK to reviews)
- steps_completed: jsonb - {"step1": true, "step2": false, ...}
- last_step_completed: text
- current_step: int
- completed_at: timestamptz
```

#### `review_category_ratings`
Stores overall ratings for each category (1-5 stars).

```sql
- id: uuid (PK)
- review_id: uuid (FK to reviews)
- category: enum ('skills', 'reliability', 'collaboration', 'professionalism', 'technical')
- rating: smallint (1-5)
```

#### `review_soft_skill_votes` (Enhanced)
Tracks which soft skills are strengths vs areas to improve.

```sql
- review_id: uuid (FK to reviews)
- skill_id: uuid (FK to soft_skills)
- rating: smallint (1-5, optional)
- is_strength: boolean - true for strength, false for improvement area
- notes: text (optional)
```

#### `review_skill_ratings` (Existing)
Technical/hard skill ratings.

```sql
- review_id: uuid (FK to reviews)
- skill_id: uuid (FK to skills)
- score: smallint (1-5)
```

### Existing Tables (from migrations 019/020)

- `reviews` - Main review record with status workflow
- `review_aspects` - General review aspects
- `review_skill_suggestions` - Custom skill recommendations

## Review Workflow

### Step-by-Step Process

#### Step 1: Technical Skills Rating
- Rate job-specific hard skills (1-5 stars)
- Auto-saves to `review_skill_ratings` table
- Status remains `'draft'`

#### Step 2: Technical Skills - Strengths & Areas to Improve
- Select from skill tags
- Multi-select interface
- Auto-saves to `review_soft_skill_votes` or `metadata`

#### Step 3: Reliability Rating
- Rate reliability soft skills (1-5 stars)
- Auto-saves to `review_category_ratings`

#### Step 4: Reliability - Strengths & Areas to Improve
- Select from reliability-related tags
- Auto-saves to `review_soft_skill_votes`

#### Step 5: Collaboration Rating
- Rate collaboration soft skills (1-5 stars)
- Auto-saves to `review_category_ratings`

#### Step 6: Collaboration - Strengths & Areas to Improve
- Select from collaboration tags
- Auto-saves to `review_soft_skill_votes`

#### Step 7: Summary (Optional)
- Written comment field
- Auto-saves to `reviews.comment`
- Update `reviews.metadata` with structured data

#### Step 8: Recommendation
- Binary choice: Recommend / Do Not Recommend
- Saves to `reviews.reaction` (1 or -1)
- Updates status to `'submitted'`

### Status Flow

```
draft → submitted → released
```

- **draft**: Review in progress, only visible to author
- **submitted**: Review completed, triggers skill aggregation, awaiting release
- **released**: Review is public and visible to all users

## API Usage

### tRPC Router: `reviews`

#### Get Soft Skills

```typescript
// Get all soft skills
const softSkills = await trpc.reviews.getSoftSkills.query();

// Get soft skills by category
const reliabilitySkills = await trpc.reviews.getSoftSkills.query({
  category: 'reliability'
});

// Get soft skills grouped by category
const grouped = await trpc.reviews.getSoftSkillsByCategory.query();
```

#### Create Review Draft

```typescript
const review = await trpc.reviews.createDraft.mutate({
  subjectId: 'user-uuid',
  subjectType: 'user',
  context: 'Worked together on Project X'
});

// Returns review with initialized progress tracking
```

#### Update Review Steps

```typescript
// Update skill ratings
await trpc.reviews.updateSkillRatings.mutate({
  reviewId: review.id,
  ratings: [
    { skillId: 'skill-uuid-1', score: 5 },
    { skillId: 'skill-uuid-2', score: 4 }
  ]
});

// Update category rating
await trpc.reviews.updateCategoryRating.mutate({
  reviewId: review.id,
  category: 'reliability',
  rating: 4
});

// Update soft skill votes (strengths/improvements)
await trpc.reviews.updateSoftSkillVotes.mutate({
  reviewId: review.id,
  votes: [
    {
      skillId: 'soft-skill-uuid-1',
      isStrength: true,
      rating: 5,
      notes: 'Excellent time management'
    },
    {
      skillId: 'soft-skill-uuid-2',
      isStrength: false,
      rating: 2,
      notes: 'Could improve on multitasking'
    }
  ]
});

// Update comment
await trpc.reviews.updateComment.mutate({
  reviewId: review.id,
  comment: 'Great to work with!',
  isPublic: true
});

// Update step progress
await trpc.reviews.updateStep.mutate({
  reviewId: review.id,
  step: 'step1_skills_rating',
  data: {}
});
```

#### Submit Review

```typescript
await trpc.reviews.submitReview.mutate({
  reviewId: review.id,
  recommendation: 1 // 1 = recommend, -1 = do not recommend
});

// Status changes to 'submitted'
// Triggers skill proficiency calculations
// Marks progress as completed
```

#### Retrieve Reviews

```typescript
// Get reviews for a specific user
const userReviews = await trpc.reviews.getBySubject.query({
  subjectId: 'user-uuid',
  subjectType: 'user',
  status: 'released' // optional, defaults to 'released'
});

// Get user's own drafts and submitted reviews
const myReviews = await trpc.reviews.getMyReviews.query();

// Get specific draft to resume editing
const draft = await trpc.reviews.getDraft.query({
  reviewId: 'review-uuid'
});
```

#### Delete Draft

```typescript
await trpc.reviews.deleteDraft.mutate({
  reviewId: 'review-uuid'
});
```

## Frontend Implementation Guide

### State Management

```typescript
interface ReviewDraftState {
  reviewId: string;
  currentStep: number;
  skillRatings: Record<string, number>;
  categoryRatings: {
    skills?: number;
    reliability?: number;
    collaboration?: number;
    professionalism?: number;
  };
  softSkillVotes: {
    skillId: string;
    rating?: number;
    isStrength: boolean;
    notes?: string;
  }[];
  comment: string;
  recommendation: number | null;
}
```

### Auto-Save Implementation

```typescript
import { useDebouncedCallback } from 'use-debounce';

const useReviewAutoSave = (reviewId: string) => {
  const autoSave = useDebouncedCallback(
    async (updateFn: () => Promise<void>) => {
      try {
        await updateFn();
        console.log('Auto-saved successfully');
      } catch (error) {
        console.error('Auto-save failed:', error);
        // Show error toast to user
      }
    },
    500 // 500ms debounce
  );

  return autoSave;
};

// Usage in component
const autoSave = useReviewAutoSave(reviewId);

// On skill rating change
const handleSkillRatingChange = (skillId: string, rating: number) => {
  setState({ ...state, skillRatings: { ...state.skillRatings, [skillId]: rating } });
  
  autoSave(async () => {
    await trpc.reviews.updateSkillRatings.mutate({
      reviewId: state.reviewId,
      ratings: Object.entries(state.skillRatings).map(([skillId, score]) => ({
        skillId,
        score
      }))
    });
  });
};
```

### Component Structure

```
ReviewFlow/
├── ReviewStep1Skills.tsx       // Technical skills rating
├── ReviewStep2SkillsTags.tsx   // Skills strengths/improvements
├── ReviewStep3Reliability.tsx   // Reliability rating
├── ReviewStep4ReliabilityTags.tsx // Reliability strengths/improvements
├── ReviewStep5Collaboration.tsx // Collaboration rating
├── ReviewStep6CollaborationTags.tsx // Collaboration strengths/improvements
├── ReviewStep7Summary.tsx      // Written comment
├── ReviewStep8Recommendation.tsx // Final recommendation
├── ReviewProgress.tsx          // Progress indicator
└── useReviewDraft.ts          // Custom hook for draft management
```

### Custom Hook Example

```typescript
const useReviewDraft = (subjectId: string) => {
  const [draft, setDraft] = useState<ReviewDraftState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load existing draft or create new one
    const loadDraft = async () => {
      const myReviews = await trpc.reviews.getMyReviews.query();
      const existingDraft = myReviews.find(
        r => r.subject_id === subjectId && r.status === 'draft'
      );

      if (existingDraft) {
        // Load existing draft
        setDraft(mapReviewToDraftState(existingDraft));
      } else {
        // Create new draft
        const newReview = await trpc.reviews.createDraft.mutate({
          subjectId,
          subjectType: 'user'
        });
        setDraft(initializeDraftState(newReview));
      }
      setLoading(false);
    };

    loadDraft();
  }, [subjectId]);

  return { draft, setDraft, loading };
};
```

## UI/UX Best Practices

1. **Progress Indicator**: Show 8-step progress bar at top of screen
2. **Auto-Save Feedback**: Display subtle "Saved" indicator after each save
3. **Exit Confirmation**: Allow users to exit at any time without warning (auto-saved)
4. **Resume Drafts**: Show "Continue Review" option for incomplete drafts
5. **Required vs Optional**: Mark comment as optional, all other steps required
6. **Mobile-Friendly**: Single column layout for mobile, two column for desktop
7. **Keyboard Navigation**: Support tab navigation and enter to continue
8. **Error Handling**: Show clear error messages if auto-save fails

## Security Considerations

1. **RLS Policies**: 
   - Drafts only visible to author
   - Submitted reviews only visible after release
   - Public can view released reviews

2. **Validation**:
   - Verify user owns review before updates
   - Validate all ratings are 1-5
   - Sanitize text input

3. **Rate Limiting**:
   - Consider rate limiting review submissions per user
   - Prevent spam/abuse

## Testing

### Database Testing

```bash
# Run migrations
pnpm supa migration up

# Test soft skills seed
pnpm supa migration up
```

### API Testing

```bash
# Test creating draft
curl -X POST http://localhost:54321/functions/v1/trpc/reviews.createDraft \
  -H "Content-Type: application/json" \
  -d '{"subjectId": "user-uuid", "subjectType": "user"}'

# Test getting soft skills
curl http://localhost:54321/functions/v1/trpc/reviews.getSoftSkills
```

## Performance Considerations

1. **Auto-Save Debouncing**: Use 500ms debounce to prevent excessive API calls
2. **Batch Updates**: Consider batching multiple updates in single API call
3. **Optimistic Updates**: Update UI immediately, sync to server in background
4. **Caching**: Cache soft skills list (rarely changes)
5. **Pagination**: If displaying many reviews, implement pagination

## Future Enhancements

1. **Review Templates**: Pre-filled templates for common scenarios
2. **Bulk Reviews**: Review multiple workers at once
3. **Review Analytics**: Dashboard showing review trends
4. **Review Reminders**: Prompt users to complete pending reviews
5. **Review Verification**: Verify reviewer worked with reviewee
6. **Anonymous Reviews**: Option for anonymous feedback
7. **Review Responses**: Allow reviewees to respond to reviews

## Troubleshooting

### Common Issues

**Issue**: Auto-save not working
- Check network connection
- Verify review ID is valid
- Check browser console for errors
- Ensure debounce is properly configured

**Issue**: Progress not updating
- Verify `updateStep` is called after each step
- Check database for `review_progress` entry
- Ensure RLS policies allow updates

**Issue**: Review not appearing after submission
- Check review status (should be 'submitted')
- Verify release workflow (may need to wait for release)
- Check if paired review is completed (if using reciprocal reviews)

## Related Documentation

- [Migration 019: Reviews Workflow](../../packages/supabase/migrations/019_update_reviews_workflow.sql)
- [Migration 020: Review Automation](../../packages/supabase/migrations/020_review_submission_automation.sql)
- [Migration 046: Soft Skills System](../../packages/supabase/migrations/046_create_soft_skills_system.sql)
- [Migration 047: Soft Skills Seed](../../packages/supabase/migrations/047_seed_soft_skills.sql)
- [Reviews tRPC Router](../../packages/supabase/functions/trpc/routers/reviews.router.ts)
