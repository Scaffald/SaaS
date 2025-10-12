# O*NET Career Intelligence Integration

## Overview

This document outlines the comprehensive integration of the **O*NET (Occupational Information Network) 30.0 Database** into the SCF-Neue platform to provide intelligent career guidance, skill recommendations, and enhanced job matching capabilities.

**Business Value:**
- Guide workers to discover new career paths based on scientific interest profiling
- Auto-populate user profiles with relevant skills, abilities, and knowledge
- Improve job matching quality through multi-dimensional compatibility scoring
- Reduce skill gaps with targeted development recommendations
- Differentiate platform with science-backed career guidance

**Current Status:** 📋 Planning Phase
**Target Completion:** 7 weeks
**Overall Progress:** 0% (Foundation exists, features pending)

---

## Table of Contents

1. [Current State](#current-state)
2. [Implementation Phases](#implementation-phases)
3. [Technical Architecture](#technical-architecture)
4. [Database Schema](#database-schema)
5. [API Design](#api-design)
6. [UI Components](#ui-components)
7. [Success Metrics](#success-metrics)
8. [Timeline](#timeline)

---

## Current State

### ✅ What We Have

**Database:**
- ✅ Full O*NET 30.0 database imported (1,016+ occupations)
- ✅ 40+ tables with comprehensive occupational data:
  - `onet.occupation_data` - Primary occupation information
  - `onet.skills` / `onet.skill_scores` - Skill requirements
  - `onet.abilities` / `onet.ability_scores` - Ability requirements
  - `onet.knowledge` / `onet.knowledge_scores` - Knowledge domains
  - `onet.interests` / `onet.interest_scores` - RIASEC interest profiles
  - `onet.work_values` / `onet.work_value_scores` - Work satisfaction factors
  - `onet.work_activities` / `onet.work_context` - Work environment data
  - `onet.technology_skills` / `onet.tools_used` - Technology requirements
  - `onet.task_statements` - Specific work tasks
  - `onet.job_zones` - Education/training levels
  - `onet.related_occupations` - Career path relationships
- ✅ Search functions: `onet.search_occupations()`, `onet.get_occupation()`
- ✅ Polymorphic skill system supporting O*NET taxonomy
- ✅ `user_skills` table with O*NET occupation links

**Infrastructure:**
- ✅ tRPC router architecture ready for O*NET endpoints
- ✅ Prerequisites modal system for onboarding
- ✅ Dashboard widget framework
- ✅ Profile management system
- ✅ Tamagui UI component library

### ❌ What We're Missing

**User Experience:**
- ❌ RIASEC interest assessment for career discovery
- ❌ Career recommendations based on user interests
- ❌ Skills auto-suggestion from occupations
- ❌ Career path exploration interface
- ❌ Skill gap analysis and development roadmaps
- ❌ Work values and work context matching

**Data Integration:**
- ❌ User RIASEC profiles stored in database
- ❌ User abilities and knowledge tracking
- ❌ Occupation-based skill recommendations
- ❌ Career similarity algorithms
- ❌ Multi-dimensional job matching

**Platform Features:**
- ❌ Dashboard widgets showing career insights
- ❌ Career explorer with search and browse
- ❌ Occupation detail pages
- ❌ Smart job posting with O*NET suggestions

---

## Implementation Phases

### Phase 1: Enhanced Onboarding (Week 1-2)
**Goal:** Capture career interests during initial user setup

**Status:** 📋 Planned

**Deliverables:**
- [ ] Database migration: Add RIASEC scores and occupation fields to `user_preferences`
- [ ] Update prerequisites schema with career assessment fields
- [ ] Create `RiasecQuickAssessment` component (6 simple questions)
- [ ] Create `OccupationSearch` component for occupation selection
- [ ] Enhance `PrerequisitesModal` with optional career assessment step
- [ ] Update `prerequisites.router.ts` to save career data
- [ ] Add interest-based onboarding flow

**Key Features:**
- Optional career interest quiz during onboarding
- 6-question RIASEC assessment (1-5 scale ratings)
- Occupation search and selection
- Store user's current/target occupations
- Non-intrusive, encourages but doesn't force participation

**Database Changes:**
```sql
ALTER TABLE user_preferences ADD COLUMN:
- riasec_scores JSONB
- current_occupation_code TEXT (FK to onet.occupation_data)
- target_occupation_codes TEXT[]
- career_assessment_completed_at TIMESTAMPTZ
```

**Files to Create/Modify:**
- `packages/supabase/migrations/018_add_career_assessment_to_preferences.sql`
- `packages/core/features/prerequisites/config/prerequisites-schema.ts`
- `packages/core/features/prerequisites/prerequisites-modal.tsx`
- `packages/core/features/prerequisites/components/RiasecQuickAssessment.tsx`
- `packages/core/features/prerequisites/components/OccupationSearch.tsx`
- `packages/supabase/functions/trpc/routers/prerequisites.router.ts`

---

### Phase 2: O*NET Router & Core Services (Week 2-3)
**Goal:** Build API layer for O*NET data access and recommendations

**Status:** 📋 Planned

**Deliverables:**
- [ ] Create `onet.router.ts` with 10+ endpoints
- [ ] Implement `searchOccupations` endpoint
- [ ] Implement `getOccupation` endpoint (full details)
- [ ] Implement `getSuggestedSkills` endpoint
- [ ] Implement `findCareerMatches` endpoint (RIASEC-based)
- [ ] Implement `getRelatedOccupations` endpoint
- [ ] Implement `getUserCareerProfile` endpoint
- [ ] Create SQL function `match_occupations_by_riasec()`
- [ ] Create SQL function `suggest_career_paths()`
- [ ] Add unit tests for all endpoints

**Key Endpoints:**

```typescript
onet.searchOccupations({ query, limit }) // Search by keyword
onet.getOccupation({ onetCode }) // Full occupation details
onet.getSuggestedSkills({ onetCode, limit }) // Top skills for occupation
onet.findCareerMatches({ riasecScores, limit }) // RIASEC-based matching
onet.getRelatedOccupations({ onetCode, limit }) // Career paths
onet.getUserCareerProfile() // User's profile + recommendations
```

**Database Functions:**
- `match_occupations_by_riasec(p_riasec_scores JSONB, p_limit INT)` - Cosine similarity matching
- `suggest_career_paths(p_user_id UUID, p_limit INT)` - Skill-based career transitions
- `calculate_skill_gap(p_user_id UUID, p_target_occupation TEXT)` - Gap analysis

**Files to Create:**
- `packages/supabase/functions/trpc/routers/onet.router.ts`
- `packages/supabase/migrations/019_create_onet_matching_functions.sql`
- `packages/supabase/functions/trpc/routers/_app.ts` (register router)

---

### Phase 3: Dashboard Widgets (Week 3-4)
**Goal:** Surface O*NET recommendations prominently in dashboard

**Status:** 📋 Planned

**Deliverables:**
- [ ] Create `CareerRecommendationsWidget` component
- [ ] Create `SkillsGapWidget` component
- [ ] Create `CareerPathWidget` component
- [ ] Create `TechnologySkillsWidget` component
- [ ] Integrate widgets into `DashboardIndexLeft`
- [ ] Add widget state management and loading states
- [ ] Implement widget navigation to detail screens
- [ ] Add empty states and CTAs for incomplete profiles

**Widgets:**

**1. Career Recommendations Widget**
- Shows top 5 career matches based on RIASEC scores
- Match percentage display
- Horizontal scrolling cards
- CTA to take assessment if not completed
- Links to career detail pages

**2. Skills Gap Widget**
- Shows missing skills for current/target occupation
- Quick "Add to Profile" actions
- Progress indicator (X of Y skills)
- Links to skills profile section

**3. Career Path Widget**
- Shows adjacent careers based on transferable skills
- "You might also like..." style recommendations
- Emphasizes skill overlap

**4. Technology Skills Widget**
- Hot technologies for user's occupation
- Checklist to mark known technologies
- Auto-adds to profile

**Files to Create:**
- `packages/core/features/dashboard/widgets/CareerRecommendationsWidget.tsx`
- `packages/core/features/dashboard/widgets/SkillsGapWidget.tsx`
- `packages/core/features/dashboard/widgets/CareerPathWidget.tsx`
- `packages/core/features/dashboard/widgets/TechnologySkillsWidget.tsx`
- `packages/core/features/dashboard/dashboard-index-left.tsx` (update)

---

### Phase 4: Career Explorer (Week 4-5)
**Goal:** Full career discovery and exploration interface

**Status:** 📋 Planned

**Deliverables:**
- [ ] Create career explorer route and screen
- [ ] Create occupation detail route and screen
- [ ] Create career assessment route (full version)
- [ ] Implement occupation search with filters
- [ ] Create `CareerCard` component
- [ ] Create `OccupationDetailView` component
- [ ] Create `RiasecProfileCard` component
- [ ] Add career comparison features
- [ ] Implement "Save to Goals" functionality
- [ ] Add navigation and breadcrumbs

**Routes to Add:**
```typescript
/dashboard/career-explorer        // Browse and search careers
/dashboard/careers/:onetCode      // Occupation detail page
/dashboard/profile/career-assessment  // Full RIASEC assessment
```

**Key Features:**
- Search occupations by keyword
- Browse recommended careers
- View detailed occupation information:
  - Description and tasks
  - Required skills, abilities, knowledge
  - Education and training requirements
  - Work activities and context
  - Technology skills
  - Salary information (if available)
  - Related occupations
- Compare occupations side-by-side
- Save occupations to career goals
- Full RIASEC assessment (30+ questions)

**Files to Create:**
- `apps/expo/app/dashboard/career-explorer/index.tsx`
- `apps/expo/app/dashboard/careers/[onetCode].tsx`
- `apps/expo/app/dashboard/profile/career-assessment/index.tsx`
- `packages/core/features/career/career-explorer-screen.tsx`
- `packages/core/features/career/career-detail-screen.tsx`
- `packages/core/features/career/career-assessment-screen.tsx`
- `packages/core/features/career/components/CareerCard.tsx`
- `packages/core/features/career/components/OccupationDetailView.tsx`
- `packages/core/features/career/components/RiasecProfileCard.tsx`
- `packages/core/constants/routes.ts` (add routes)

---

### Phase 5: Enhanced Profile Skills (Week 5-6)
**Goal:** Auto-suggest skills from O*NET when users add experience

**Status:** 📋 Planned

**Deliverables:**
- [ ] Add occupation-based skill suggestions to profile skills page
- [ ] Create `SkillSuggestionsModal` component
- [ ] Implement batch skill addition
- [ ] Add "Quick Add from Experience" section
- [ ] Create skill proficiency mapper (O*NET → 1-5 scale)
- [ ] Add abilities tracking system
- [ ] Add knowledge domains tracking
- [ ] Implement skill verification workflow
- [ ] Add endorsed skills feature

**Key Features:**
- When user adds occupation, suggest top 10 skills
- Show skill importance scores from O*NET
- Batch checkbox selection for skills
- Auto-set proficiency based on importance
- Track abilities (e.g., Problem Solving, Manual Dexterity)
- Track knowledge domains (e.g., Mathematics, Building & Construction)
- Skill endorsements from other users

**New Database Tables:**
```sql
CREATE TABLE user_abilities (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  ability_id VARCHAR(20) REFERENCES onet.abilities(element_id),
  proficiency_level SMALLINT,
  created_at TIMESTAMPTZ
);

CREATE TABLE user_knowledge (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  knowledge_id VARCHAR(20) REFERENCES onet.knowledge(element_id),
  proficiency_level SMALLINT,
  created_at TIMESTAMPTZ
);
```

**Files to Create/Modify:**
- `packages/supabase/migrations/020_add_user_abilities_knowledge.sql`
- `packages/core/features/profile/profile-skills-left.tsx` (enhance)
- `packages/core/features/profile/components/SkillSuggestionsModal.tsx`
- `packages/core/features/profile/components/AbilitiesSection.tsx`
- `packages/core/features/profile/components/KnowledgeSection.tsx`
- `packages/supabase/functions/trpc/routers/profile.router.ts` (enhance)

---

### Phase 6: Enhanced Job Matching (Week 6-7)
**Goal:** Improve job recommendations using O*NET multi-dimensional matching

**Status:** 📋 Planned

**Deliverables:**
- [ ] Update application scoring function with O*NET dimensions
- [ ] Add RIASEC match to scoring algorithm
- [ ] Add work values match to scoring
- [ ] Add abilities match to scoring
- [ ] Create job recommendation algorithm
- [ ] Add "Jobs You Might Like" widget
- [ ] Create job-to-occupation mapping UI
- [ ] Enhance job posting with O*NET suggestions
- [ ] Add smart job builder for employers

**Enhanced Scoring:**
```
Current: Skills (25) + Experience (25) + Certifications (15) + Education (10) = 75 points
New:     Skills (20) + Experience (20) + Certifications (10) + Education (10) +
         Abilities (15) + RIASEC (15) + Work Values (10) = 100 points
```

**Key Features:**
- Multi-dimensional job matching algorithm
- RIASEC compatibility scoring for jobs
- Work environment preferences matching
- Abilities-based job filtering
- "Recommended Jobs" personalized feed
- Smart job posting with O*NET auto-fill
- Occupation selection for job postings

**Files to Modify:**
- `packages/supabase/migrations/077_create_application_scoring_function.sql`
- `packages/supabase/migrations/021_enhance_job_matching.sql`
- `packages/core/features/discover/discover-jobs-screen.tsx`
- `packages/core/features/dashboard/widgets/RecommendedJobsWidget.tsx`
- `packages/core/features/office/components/job-form-sections/` (enhance)

---

## Technical Architecture

### Data Flow

```
┌─────────────────────┐
│   O*NET Database    │  (Read-only, 1000+ occupations)
│   (onet schema)     │
└──────────┬──────────┘
           │
           ├─────────────────────────────┐
           │                             │
           ▼                             ▼
┌─────────────────────┐       ┌──────────────────────┐
│  Matching Functions │       │   tRPC O*NET Router  │
│  (PostgreSQL)       │       │   (API Layer)        │
└──────────┬──────────┘       └──────────┬───────────┘
           │                             │
           │                             │
           ▼                             ▼
┌─────────────────────┐       ┌──────────────────────┐
│  User Preferences   │       │   React Components   │
│  (RIASEC, Career)   │◄──────│   (UI Layer)         │
└─────────────────────┘       └──────────────────────┘
```

### Component Hierarchy

```
PrerequisitesModal
├── RiasecQuickAssessment
└── OccupationSearch

Dashboard
├── CareerRecommendationsWidget
├── SkillsGapWidget
├── CareerPathWidget
└── RecommendedJobsWidget

CareerExplorerScreen
├── OccupationSearch
├── CareerCard (list)
└── FilterBar

CareerDetailScreen
├── OccupationDetailView
│   ├── SkillsList
│   ├── AbilitiesList
│   ├── KnowledgeList
│   ├── TechnologySkillsList
│   └── RelatedOccupations
└── RiasecProfileCard

ProfileSkillsScreen (enhanced)
├── OccupationSearch
├── SkillSuggestionsModal
├── AbilitiesSection
└── KnowledgeSection
```

---

## Database Schema

### New Tables

```sql
-- User career preferences and RIASEC scores
ALTER TABLE public.user_preferences ADD COLUMN:
- riasec_scores JSONB DEFAULT NULL
- current_occupation_code TEXT REFERENCES onet.occupation_data(onetsoc_code)
- target_occupation_codes TEXT[]
- career_assessment_completed_at TIMESTAMPTZ

-- User abilities (cognitive, physical, sensory)
CREATE TABLE public.user_abilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ability_id VARCHAR(20) NOT NULL REFERENCES onet.abilities(element_id),
  proficiency_level SMALLINT CHECK (proficiency_level BETWEEN 1 AND 5),
  years_experience NUMERIC(4,1),
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User knowledge domains
CREATE TABLE public.user_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  knowledge_id VARCHAR(20) NOT NULL REFERENCES onet.knowledge(element_id),
  proficiency_level SMALLINT CHECK (proficiency_level BETWEEN 1 AND 5),
  years_experience NUMERIC(4,1),
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User career goals (saved occupations)
CREATE TABLE public.user_career_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  occupation_code TEXT NOT NULL REFERENCES onet.occupation_data(onetsoc_code),
  priority INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job-to-occupation mapping
ALTER TABLE public.jobs ADD COLUMN:
- onet_occupation_code TEXT REFERENCES onet.occupation_data(onetsoc_code)
```

### Key Functions

```sql
-- Match occupations by RIASEC profile (cosine similarity)
match_occupations_by_riasec(p_riasec_scores JSONB, p_limit INT)

-- Suggest career transitions based on skill overlap
suggest_career_paths(p_user_id UUID, p_limit INT)

-- Calculate skill gap for target occupation
calculate_skill_gap(p_user_id UUID, p_target_occupation TEXT)

-- Match jobs to user based on multi-dimensional compatibility
match_jobs_by_onet_profile(p_user_id UUID, p_limit INT)

-- Get occupation similarity score
get_occupation_similarity(p_occupation_1 TEXT, p_occupation_2 TEXT)
```

---

## API Design

### O*NET Router Endpoints

```typescript
// Search and Discovery
onet.searchOccupations({ query: string, limit?: number })
  → { occupations: Occupation[], query: string }

onet.getOccupation({ onetCode: string })
  → { occupation, skills, abilities, interests, jobZone, techSkills }

onet.getRelatedOccupations({ onetCode: string, limit?: number })
  → { related: Occupation[] }

// Recommendations
onet.findCareerMatches({ riasecScores: RiasecScores, limit?: number })
  → { matches: CareerMatch[] }

onet.getSuggestedSkills({ onetCode: string, limit?: number })
  → { skills: SuggestedSkill[] }

onet.getUserCareerProfile()
  → { hasProfile, currentOccupation, riasecScores, recommendations }

// Career Planning
onet.getCareerPath({ fromOccupation: string, toOccupation: string })
  → { path: Occupation[], skillsNeeded: Skill[] }

onet.getSkillGap({ userId: string, targetOccupation: string })
  → { hasSkills: Skill[], needsSkills: Skill[], matchPercentage: number }

// Goals and Tracking
onet.saveCareerGoal({ occupationCode: string, notes?: string })
  → { success: boolean, goalId: string }

onet.getUserCareerGoals()
  → { goals: CareerGoal[] }
```

### Type Definitions

```typescript
interface RiasecScores {
  realistic: number;      // 1-5
  investigative: number;  // 1-5
  artistic: number;       // 1-5
  social: number;         // 1-5
  enterprising: number;   // 1-5
  conventional: number;   // 1-5
}

interface CareerMatch {
  onetsoc_code: string;
  title: string;
  description: string;
  match_score: number;    // 0-100
  similarity_breakdown: RiasecScores;
}

interface SuggestedSkill {
  element_id: string;
  name: string;
  description: string;
  importance: number;     // O*NET importance score
  suggested_proficiency: number; // 1-5
}
```

---

## UI Components

### Component Library

**Career Components:**
- `CareerCard` - Occupation card with match score
- `OccupationDetailView` - Full occupation details
- `RiasecProfileCard` - User's RIASEC visualization
- `RiasecQuickAssessment` - 6-question onboarding version
- `RiasecFullAssessment` - 30+ question full version
- `OccupationSearch` - Autocomplete search
- `SkillSuggestionsModal` - Batch skill addition
- `CareerComparisonView` - Side-by-side occupation comparison
- `CareerPathVisualization` - Career transition visualization

**Dashboard Widgets:**
- `CareerRecommendationsWidget` - Top career matches
- `SkillsGapWidget` - Missing skills indicator
- `CareerPathWidget` - Adjacent career suggestions
- `TechnologySkillsWidget` - Hot tech checklist
- `RecommendedJobsWidget` - Personalized job feed

**Profile Components:**
- `AbilitiesSection` - User abilities list
- `KnowledgeSection` - User knowledge domains
- `CareerGoalsSection` - Saved career goals

### Design Patterns

**Loading States:**
- Skeleton loaders for all widgets
- Graceful degradation when O*NET data unavailable
- Empty states with clear CTAs

**Error Handling:**
- Fallback to basic search if advanced matching fails
- User-friendly error messages
- Retry mechanisms for network failures

**Responsive Design:**
- Mobile-first approach
- Horizontal scrolling for card lists
- Collapsible sections for detailed data
- Bottom sheets on mobile for modals

---

## Success Metrics

### Engagement Metrics

**Onboarding:**
- RIASEC assessment completion rate (target: 60%)
- Time to complete prerequisites (target: <5 min)
- Occupation selection rate (target: 80%)

**Career Discovery:**
- Career explorer page visits (track weekly)
- Occupations viewed per user (target: 5+)
- Career goals saved per user (target: 2+)
- Career assessment retake rate (track)

**Profile Enhancement:**
- Skills added via O*NET suggestions (target: 40% of all skills)
- Profile completion rate increase (target: +30%)
- Abilities/knowledge sections added (target: 50% of users)

**Job Matching:**
- Job application match score improvement (target: +25%)
- Jobs viewed per user (track change)
- Application to view ratio (target: improvement)
- Job recommendation click-through rate (target: 15%)

### Quality Metrics

**Data Quality:**
- RIASEC score validity (check for patterns)
- User-reported occupation accuracy (survey)
- Skill suggestion relevance (user feedback)

**Performance:**
- Career search response time (<500ms)
- Occupation detail load time (<1s)
- Recommendation generation time (<2s)

### Business Metrics

**User Retention:**
- 7-day retention rate (track change)
- 30-day retention rate (track change)
- Feature return rate (career explorer revisits)

**Platform Differentiation:**
- User satisfaction with career guidance (survey)
- Net Promoter Score (NPS) (target: 50+)
- Feature awareness (% of users who know about career tools)

---

## Timeline

### Week-by-Week Plan

**Week 1-2: Enhanced Onboarding**
- Database migration for career fields
- RIASEC assessment component
- Occupation search component
- Prerequisites modal enhancement
- **Milestone:** Users can complete career assessment during onboarding

**Week 2-3: O*NET Router**
- Create onet.router.ts with all endpoints
- Implement matching algorithms (SQL functions)
- Add unit tests
- **Milestone:** API layer complete and tested

**Week 3-4: Dashboard Widgets**
- Career recommendations widget
- Skills gap widget
- Career path widget
- Dashboard integration
- **Milestone:** Career insights visible on dashboard

**Week 4-5: Career Explorer**
- Career explorer screen
- Occupation detail screen
- Full career assessment
- Navigation and routing
- **Milestone:** Full career discovery experience

**Week 5-6: Enhanced Profile Skills**
- Skills auto-suggestion from occupations
- Abilities and knowledge tracking
- Batch skill addition
- Profile enhancements
- **Milestone:** Profile building streamlined with O*NET data

**Week 6-7: Enhanced Job Matching**
- Multi-dimensional scoring
- Job recommendations algorithm
- Recommended jobs widget
- Smart job posting
- **Milestone:** Improved job matching quality

**Week 7: Polish & Testing**
- Bug fixes and refinements
- Performance optimization
- User testing
- Documentation updates
- **Milestone:** Production-ready release

---

## Testing Strategy

### Unit Tests
- [ ] All tRPC endpoints with mock data
- [ ] Matching algorithms (RIASEC similarity, skill gap)
- [ ] Component rendering and interactions
- [ ] Form validation and error handling

### Integration Tests
- [ ] End-to-end career assessment flow
- [ ] Occupation search and selection
- [ ] Skill suggestion and addition
- [ ] Career goal saving and retrieval
- [ ] Job matching with O*NET data

### E2E Tests
- [ ] Complete onboarding with career assessment
- [ ] Career explorer navigation
- [ ] Profile enhancement with O*NET suggestions
- [ ] Job discovery with recommendations
- [ ] Cross-platform testing (web, iOS, Android)

### Performance Tests
- [ ] Search response times (<500ms)
- [ ] Recommendation generation (<2s)
- [ ] Large dataset queries (1000+ occupations)
- [ ] Concurrent user load testing

---

## Security Considerations

### Data Access
- ✅ O*NET data is public domain (no licensing issues)
- ✅ User career preferences are private (RLS policies)
- ✅ RIASEC scores stored securely in user_preferences
- ✅ Read-only access to onet schema for all users

### Privacy
- User's RIASEC scores and career preferences are private
- Career goals visible only to user
- Skills/abilities can be public or private (user choice)
- No sharing of assessment results without consent

### Rate Limiting
- Search endpoints: 100 requests/minute per user
- Recommendation endpoints: 20 requests/minute per user
- Assessment completion: 1 per day (prevent gaming)

---

## Migration Strategy

### Database Migrations

**Migration 018: Career Assessment Fields**
```sql
ALTER TABLE user_preferences ADD COLUMN:
- riasec_scores JSONB
- current_occupation_code TEXT
- target_occupation_codes TEXT[]
- career_assessment_completed_at TIMESTAMPTZ
```

**Migration 019: Matching Functions**
- Create `match_occupations_by_riasec()`
- Create `suggest_career_paths()`
- Create `calculate_skill_gap()`

**Migration 020: Abilities & Knowledge**
- Create `user_abilities` table
- Create `user_knowledge` table
- Create `user_career_goals` table

**Migration 021: Enhanced Job Matching**
- Update `calculate_application_score_enhanced()`
- Add `match_jobs_by_onet_profile()`
- Add O*NET fields to jobs table

### Rollout Plan

**Phase 1: Soft Launch (Week 1-3)**
- Enable for internal testing
- 10% of new users see enhanced onboarding
- Collect feedback and metrics

**Phase 2: Beta (Week 4-5)**
- 50% of users see career features
- Email campaign to existing users
- Iterate based on feedback

**Phase 3: Full Launch (Week 6-7)**
- 100% rollout
- Marketing push
- Monitor metrics closely

**Rollback Plan:**
- Feature flags for all O*NET features
- Can disable individual widgets/screens
- Career assessment is optional (no breaking changes)
- O*NET data read-only (safe to disable features)

---

## Future Enhancements

### Phase 7+ (Future)

**Advanced Career Coaching:**
- AI-powered career advice
- Personalized learning paths
- Skill development tracking
- Career milestones and achievements

**Social Features:**
- Career mentorship matching
- Peer career insights
- Success story sharing
- Career discussion forums

**Employer Intelligence:**
- Company culture matching (work values)
- Employer RIASEC profiles
- Team compatibility analysis
- Hiring trend insights

**External Integrations:**
- LinkedIn profile import
- Resume parsing for skills
- Learning platform integrations (Coursera, Udemy)
- Salary data integration

**Analytics & Insights:**
- Career trajectory visualization
- Skill demand forecasting
- Industry trend analysis
- Competitive skill analysis

---

## Resources

### Documentation
- [O*NET Website](https://www.onetcenter.org/)
- [O*NET Online](https://www.onetonline.org/)
- [O*NET Database Documentation](https://www.onetcenter.org/dictionary/30.0/mysql/)
- [O*NET Content Model](https://www.onetcenter.org/content.html)
- [RIASEC Theory](https://en.wikipedia.org/wiki/Holland_Codes)

### Internal Documentation
- [O*NET README](../../packages/supabase/onet/README.md)
- [Skills Multi-Taxonomy System](./README.md#multi-taxonomy-skills-system)
- [Profile System](../profile/)
- [Prerequisites Modal](../../packages/core/features/prerequisites/)

### Related Issues
- [#101 - Phase 1: Enhanced Onboarding](https://github.com/Unicorn/SCF-Neue/issues/101)
- [#102 - Phase 2: O*NET Router](https://github.com/Unicorn/SCF-Neue/issues/102)
- [#103 - Phase 3: Dashboard Widgets](https://github.com/Unicorn/SCF-Neue/issues/103)
- [#104 - Phase 4: Career Explorer](https://github.com/Unicorn/SCF-Neue/issues/104)
- [#105 - Phase 5: Enhanced Profile Skills](https://github.com/Unicorn/SCF-Neue/issues/105)
- [#106 - Phase 6: Enhanced Job Matching](https://github.com/Unicorn/SCF-Neue/issues/106)

---

## Questions & Decisions

### Open Questions
- [ ] Should RIASEC assessment be required or optional?
  - **Decision:** Optional but strongly encouraged
- [ ] How many questions for full RIASEC assessment?
  - **Decision:** 6 for quick, 30 for full
- [ ] Should we show salary data?
  - **Decision:** TBD - depends on data availability
- [ ] Allow users to retake assessment?
  - **Decision:** Yes, once per month

### Design Decisions
- [x] Use cosine similarity for RIASEC matching
- [x] Store RIASEC scores as JSONB (flexible, queryable)
- [x] Make career assessment part of prerequisites (optional step)
- [x] Build widgets before full explorer (MVP first)
- [x] Use O*NET codes as primary keys (stable identifiers)

---

**Last Updated:** October 12, 2025  
**Document Owner:** Development Team  
**Status:** 📋 Planning Complete, Ready for Implementation

