# Worker Profile Feature

## Overview

This feature enables users to view detailed worker profiles, both in a quick preview modal and a comprehensive full-page view. It leverages existing database schema for profiles, skills, certifications, experience, and education.

## User Flow

1. **Discovery** → User browses workers on `/dashboard/discover/workers`
2. **Preview** → User clicks worker card → Preview modal opens
3. **Full Profile** → User clicks "View Full Profile" → Navigate to `/dashboard/users/[id]`

## Database Schema

### Primary Tables Used

- **users** - Public profile data (name, avatar, bio, headline)
- **user_private** - Private contact/availability data (email, phone, location)
- **user_skills** - Skills with proficiency scores (0-100)
- **user_certifications** - Professional certifications
- **user_experience** - Work history
- **user_education** - Educational background
- **v_profile_search** - Materialized view with computed scores

### Available Data Fields

#### Profile Header
- `display_name` / `first_name` + `last_name`
- `avatar_url`
- `headline` (e.g., "Masonry, Concrete • 20 yoe")
- `industry_name`
- `years_of_experience`
- Elevate score (from v_profile_search)

#### Contact & Availability
- `email`
- `phone`
- `location` / `employment_city` + `employment_state`
- `open_to_work` boolean
- `availability` array
- `hourly_rate_cents`
- `open_to_travel` / `travel_mileage`

#### Skills
- `skill_name` (from skills join)
- `proficiency` (0-100 score)
- `last_verified_at`
- Hierarchical skill display (CSI codes)

#### Certifications
- `name`
- `issuing_organization`
- `issue_date` / `expiration_date`
- `credential_id` / `credential_url`
- `description`
- `verification_status`

#### Experience
- `job_title`
- `company_name`
- `start_date` / `end_date` / `is_current`
- `description`
- `location`
- `employment_type`
- `skills_used` array

#### Education
- `degree_type`
- `institution_name`
- `field_of_study`
- `start_date` / `end_date`
- `gpa`
- `description`

## Components Architecture

### Preview Modal
**File**: `packages/core/features/discover/components/WorkerPreviewModal.tsx`

**Props**:
```typescript
interface WorkerPreviewModalProps {
  userId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

**Sections**:
- Header (avatar, name, title, score)
- Contact info (location, availability)
- Top 5 skills
- Top 3 certifications
- Brief bio (truncated)
- CTA button "View Full Profile"

### Full Profile Page

**Route**: `apps/expo/app/dashboard/users/[id]/index.tsx`

**Feature Folder**: `packages/core/features/user-profile/`

**Components**:
1. `user-profile-screen.tsx` - Main orchestrator
2. `user-profile-header.tsx` - Hero section with avatar, name, contact
3. `user-profile-about.tsx` - Bio and preferences
4. `user-profile-skills.tsx` - Skills list with proficiency bars
5. `user-profile-certifications.tsx` - Certification cards
6. `user-profile-experience.tsx` - Work history timeline
7. `user-profile-education.tsx` - Education cards
8. `user-profile-reviews.tsx` - Reviews section (stubbed)

## tRPC API Endpoints

**Router**: `packages/supabase/functions/trpc/routers/user-profile.router.ts`

### Queries

```typescript
// Get comprehensive profile data
getUserProfile: publicProcedure
  .input(z.object({ userId: z.string() }))
  .query(async ({ ctx, input }) => {
    // Fetch user, user_private, computed scores
  })

// Get user skills with proficiency
getUserSkills: publicProcedure
  .input(z.object({ userId: z.string() }))
  .query(async ({ ctx, input }) => {
    // Join user_skills with skills table
  })

// Get certifications
getUserCertifications: publicProcedure
  .input(z.object({ userId: z.string() }))
  .query(async ({ ctx, input }) => {
    // Fetch user_certifications
  })

// Get work experience
getUserExperience: publicProcedure
  .input(z.object({ userId: z.string() }))
  .query(async ({ ctx, input }) => {
    // Fetch user_experience ordered by date
  })

// Get education
getUserEducation: publicProcedure
  .input(z.object({ userId: z.string() }))
  .query(async ({ ctx, input }) => {
    // Fetch user_education ordered by date
  })

// Get reviews summary (STUBBED)
getUserReviewsSummary: publicProcedure
  .input(z.object({ userId: z.string() }))
  .query(async ({ ctx, input }) => {
    // Return mock data for now
    return {
      averageRating: 4.8,
      totalReviews: 12,
      ratings: {
        environment: 4.8,
        management: 4.8,
        communication: 4.8,
        compensation: 4.8,
      },
      strengths: ['Safe working conditions', 'Clear timelines', 'Fair pay'],
      improvements: ['Late payments'],
      recommendCount: 3,
      notRecommendCount: 1,
      reviews: [] // Empty for now
    }
  })
```

## Implementation Phases

### Phase 1: Documentation & API ✅
- [x] Create this feature document
- [x] Create tRPC router for user profiles
- [x] Add router to main _app.ts

### Phase 2: Preview Modal ✅
- [x] Create WorkerPreviewModal component
- [x] Integrate modal into discover-workers-screen.tsx
- [x] Add loading and error states
- [x] Test modal interaction

### Phase 3: Full Profile Components ✅
- [x] Create user-profile feature folder
- [x] Build individual profile section components
  - [x] user-profile-header.tsx - Avatar, name, score, stats
  - [x] user-profile-about.tsx - Bio section
  - [x] user-profile-skills.tsx - Skills with proficiency bars
  - [x] user-profile-certifications.tsx - Certification cards
  - [x] user-profile-experience.tsx - Work history timeline
  - [x] user-profile-education.tsx - Education history
  - [x] user-profile-reviews.tsx - Reviews section (STUBBED)
- [x] Create main profile screen orchestrator
- [x] Add proper TypeScript types

### Phase 4: Dynamic Route ✅
- [x] Create `/dashboard/users/[id]` route
- [x] Wire up profile screen
- [x] Add navigation from modal
- [x] Ready for deep linking

### Phase 5: Reviews Stub ✅
- [x] Create review summary UI
- [x] Display mock review data
- [x] Add "Coming Soon" indicators
- [x] Prepare data structure for real reviews

### Phase 6: Polish (In Progress)
- [x] Add loading states with spinner
- [x] Basic error handling (profile not found)
- [ ] Enhanced error boundary handling
- [ ] Mobile responsiveness testing
- [ ] Accessibility (a11y) improvements
- [ ] Loading skeletons for smoother UX

## Future Enhancements

### Real Reviews System
- Connect to actual `reviews` table
- Implement review submission flow
- Add review moderation
- Calculate real-time rating averages

### Background Checks
- Display verification status
- Link to verification service
- Show verification date
- Add "Request Background Check" CTA

### Projects & Teams
- Show project portfolio
- List team collaborations
- Add project photos/media
- Track project completion stats

### Enhanced Contact
- "Send Message" button
- "Request to Connect" flow
- Video introduction
- Scheduling integration

## Data Privacy Considerations

- **Public Data**: Name, avatar, headline, skills, certifications, experience, education
- **Private Data** (require authentication/permission):
  - Email address
  - Phone number
  - Exact location (show city/state only)
  - Hourly rate (show range or "Contact for rate")

## UI/UX Notes

- Use consistent card-based design matching existing patterns
- Elevate score prominently displayed as key metric
- Skills shown with visual proficiency bars
- Timeline view for experience/education
- Mobile-first responsive design
- Smooth transitions between modal and full page

## Testing Checklist

- [ ] Preview modal opens/closes correctly
- [ ] All data sections populate correctly
- [ ] Navigation to full profile works
- [ ] Back navigation returns to workers list
- [ ] Loading states show appropriately
- [ ] Error states handled gracefully
- [ ] Works on mobile and web
- [ ] Deep links work correctly
