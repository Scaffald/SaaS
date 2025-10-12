# O*NET Integration Roadmap

## Overview

This document maps all GitHub issues to the O*NET integration phases and tracks overall progress.

**Last Updated:** October 12, 2025  
**Target Completion:** 7 weeks from start  
**Overall Progress:** 0% (Foundation complete, features pending)

---

## Implementation Status

### Current State: Foundation Complete (10%)
- ✅ **Foundation Complete:** O*NET 30.0 Database Imported (100%)
- 📋 **Phase 1 Planned:** Enhanced Onboarding (0%)
- 📋 **Phase 2 Planned:** O*NET Router & Core Services (0%)
- 📋 **Phase 3 Planned:** Dashboard Widgets (0%)
- 📋 **Phase 4 Planned:** Career Explorer (0%)
- 📋 **Phase 5 Planned:** Enhanced Profile Skills (0%)
- 📋 **Phase 6 Planned:** Enhanced Job Matching (0%)

**Quick Stats:**
- Total Features: 6 phases
- Completed: 0
- In Progress: 0
- Planned: 6
- Blocked: 0

---

## Phase Mapping

### Foundation ✅ (Complete)

**What We Have:**
- ✅ O*NET 30.0 database fully imported (1,016+ occupations)
- ✅ 40+ tables with skills, abilities, knowledge, interests, work values
- ✅ Search functions: `onet.search_occupations()`, `onet.get_occupation()`
- ✅ Polymorphic skill system supporting O*NET taxonomy
- ✅ Infrastructure: tRPC, Tamagui, Prerequisites modal, Dashboard widgets

**GitHub Issue:** N/A (Already complete)

---

### Phase 1: Enhanced Onboarding 📋 (Week 1-2)

**Status:** 📋 Planned  
**Progress:** 0/8 tasks complete (0%)  
**GitHub Issue:** [#101 - O*NET Phase 1: Enhanced Onboarding with Career Assessment](https://github.com/Unicorn/SCF-Neue/issues/101)

#### Deliverables

**Database & Schema:**
- [ ] Create migration 018: Add career assessment fields to `user_preferences`
  - `riasec_scores` JSONB field
  - `current_occupation_code` TEXT field
  - `target_occupation_codes` TEXT[] array
  - `career_assessment_completed_at` TIMESTAMPTZ field
- [ ] Update prerequisites input schema with career fields

**Components:**
- [ ] Create `RiasecQuickAssessment.tsx` component (6 questions)
  - Realistic, Investigative, Artistic, Social, Enterprising, Conventional
  - Slider inputs (1-5 scale)
  - Visual feedback on selection
- [ ] Create `OccupationSearch.tsx` component
  - Autocomplete search using O*NET data
  - Debounced search (300ms)
  - Display occupation title and code
- [ ] Update `Prerequisites.tsx`
  - Add optional career assessment step after industry selection
  - "Help me discover my career path" checkbox
  - Conditional rendering of RIASEC questions
  - Occupation search alternative

**Backend:**
- [ ] Update `prerequisites.router.ts`
  - Extend input schema with RIASEC scores
  - Save career data to `user_preferences`
  - Set `career_assessment_completed_at` timestamp
- [ ] Add validation for RIASEC scores (1-5 range)

**Testing:**
- [ ] Unit tests for RIASEC component
- [ ] Integration test for prerequisites flow with career assessment
- [ ] E2E test for complete onboarding with career data

**Files to Create/Modify:**
```
packages/supabase/migrations/018_add_career_assessment_to_preferences.sql
packages/core/features/prerequisites/config/prerequisites-schema.ts
packages/core/features/prerequisites/prerequisites-modal.tsx
packages/core/features/prerequisites/components/RiasecQuickAssessment.tsx
packages/core/features/prerequisites/components/OccupationSearch.tsx
packages/supabase/functions/trpc/routers/prerequisites.router.ts
```

**Success Criteria:**
- [ ] Users can complete optional career assessment during onboarding
- [ ] RIASEC scores stored correctly in database
- [ ] Occupation selection works with autocomplete
- [ ] No breaking changes to existing prerequisites flow
- [ ] 60%+ of users opt-in to career assessment

---

### Phase 2: O*NET Router & Core Services 📋 (Week 2-3)

**Status:** 📋 Planned  
**Progress:** 0/11 tasks complete (0%)  
**GitHub Issue:** [#102 - O*NET Phase 2: API Router & Matching Algorithms](https://github.com/Unicorn/SCF-Neue/issues/102)

#### Deliverables

**tRPC Router:**
- [ ] Create `onet.router.ts` with base structure
- [ ] Implement `searchOccupations` endpoint
  - Query O*NET occupation search function
  - Return top 20 matches by default
  - Support limit parameter
- [ ] Implement `getOccupation` endpoint
  - Fetch occupation details
  - Join with skills, abilities, interests
  - Include technology skills and job zone
- [ ] Implement `getSuggestedSkills` endpoint
  - Get top skills for occupation
  - Filter by importance (>3.5)
  - Map to proficiency levels
- [ ] Implement `findCareerMatches` endpoint
  - Use RIASEC matching algorithm
  - Return match scores and breakdowns
- [ ] Implement `getRelatedOccupations` endpoint
  - Query O*NET related occupations table
  - Return with basic details
- [ ] Implement `getUserCareerProfile` endpoint
  - Fetch user's RIASEC scores
  - Get current/target occupations
  - Generate recommendations

**Database Functions:**
- [ ] Create `match_occupations_by_riasec()` function
  - Cosine similarity algorithm
  - Compare user scores to occupation interest profiles
  - Return top matches with scores
- [ ] Create `suggest_career_paths()` function
  - Find occupations with skill overlap
  - Calculate transferable skills
  - Prioritize 40-70% overlap (good transfer candidates)
- [ ] Register onet router in `_app.ts`

**Testing:**
- [ ] Unit tests for all endpoints
- [ ] Test RIASEC matching algorithm accuracy
- [ ] Performance tests (search <500ms, match <2s)

**Files to Create:**
```
packages/supabase/functions/trpc/routers/onet.router.ts
packages/supabase/migrations/019_create_onet_matching_functions.sql
packages/supabase/functions/trpc/routers/_app.ts (update)
```

**Success Criteria:**
- [ ] All 7 endpoints functional and tested
- [ ] RIASEC matching returns relevant results
- [ ] API response times meet targets (<2s)
- [ ] Type-safe TypeScript interfaces
- [ ] Comprehensive error handling

---

### Phase 3: Dashboard Widgets 📋 (Week 3-4)

**Status:** 📋 Planned  
**Progress:** 0/9 tasks complete (0%)  
**GitHub Issue:** [#103 - O*NET Phase 3: Dashboard Career Widgets](https://github.com/Unicorn/SCF-Neue/issues/103)

#### Deliverables

**Widget Components:**
- [ ] Create `CareerRecommendationsWidget.tsx`
  - Display top 5 career matches
  - Show match percentage
  - Horizontal scrolling cards
  - Empty state with CTA to take assessment
  - Link to career detail pages
- [ ] Create `SkillsGapWidget.tsx`
  - Show missing skills for target occupation
  - Display progress (X of Y skills)
  - Quick "Add" buttons for skills
  - Link to skills profile page
- [ ] Create `CareerPathWidget.tsx`
  - Show adjacent careers (transferable skills)
  - "You might also like..." style
  - Emphasize skill overlap percentage
- [ ] Create `TechnologySkillsWidget.tsx`
  - Hot technologies for user's occupation
  - Checklist to mark known technologies
  - Quick add to profile

**Integration:**
- [ ] Update `DashboardIndexLeft.tsx`
  - Add career widgets after ProfileCompletionWidget
  - Conditional rendering based on user's career profile
  - Loading and error states
- [ ] Add widget state management
- [ ] Implement navigation handlers

**Styling:**
- [ ] Match existing dashboard widget design
- [ ] Responsive layouts (mobile, tablet, desktop)
- [ ] Smooth animations and transitions

**Testing:**
- [ ] Unit tests for all widgets
- [ ] Test empty states and CTAs
- [ ] Test navigation flows
- [ ] Visual regression tests

**Files to Create/Modify:**
```
packages/core/features/dashboard/widgets/CareerRecommendationsWidget.tsx
packages/core/features/dashboard/widgets/SkillsGapWidget.tsx
packages/core/features/dashboard/widgets/CareerPathWidget.tsx
packages/core/features/dashboard/widgets/TechnologySkillsWidget.tsx
packages/core/features/dashboard/dashboard-index-left.tsx (update)
```

**Success Criteria:**
- [ ] Widgets visible on dashboard for users with career profiles
- [ ] Empty states guide users to complete assessment
- [ ] Click-through rates measured
- [ ] All widgets performant (no lag)
- [ ] Consistent design with existing widgets

---

### Phase 4: Career Explorer 📋 (Week 4-5)

**Status:** 📋 Planned  
**Progress:** 0/13 tasks complete (0%)  
**GitHub Issue:** [#104 - O*NET Phase 4: Career Explorer Interface](https://github.com/Unicorn/SCF-Neue/issues/104)

#### Deliverables

**Routes & Screens:**
- [ ] Add routes to `routes.ts`
  - `/dashboard/career-explorer`
  - `/dashboard/careers/:onetCode`
  - `/dashboard/profile/career-assessment`
- [ ] Create `career-explorer/index.tsx` route file
- [ ] Create `careers/[onetCode].tsx` route file
- [ ] Create `profile/career-assessment/index.tsx` route file
- [ ] Create `CareerExplorerScreen.tsx` component
  - Search bar with occupation autocomplete
  - Recommended careers section
  - Browse all careers section
  - Filter and sort options
- [ ] Create `CareerDetailScreen.tsx` component
  - Occupation overview (title, description, tasks)
  - Skills, abilities, knowledge lists
  - Technology skills section
  - Education requirements (job zone)
  - Related occupations
  - "Save to Goals" and "Add Skills" CTAs
- [ ] Create `CareerAssessmentScreen.tsx` component
  - Full 30+ question RIASEC assessment
  - Progress indicator
  - Save and continue later option
  - Results visualization

**Shared Components:**
- [ ] Create `CareerCard.tsx` component
  - Compact occupation display
  - Match score badge (if applicable)
  - Click to navigate to detail
- [ ] Create `OccupationDetailView.tsx` component
  - Tabbed interface for different data sections
  - Expandable/collapsible sections
- [ ] Create `RiasecProfileCard.tsx` component
  - Radar chart or bar chart visualization
  - Explanation of RIASEC dimensions

**Navigation:**
- [ ] Update drawer navigation to include career explorer
- [ ] Add breadcrumbs for navigation
- [ ] Implement back/forward navigation

**Testing:**
- [ ] E2E tests for career explorer navigation
- [ ] Test occupation search and detail views
- [ ] Test career assessment flow
- [ ] Cross-platform testing (web, mobile)

**Files to Create:**
```
apps/expo/app/dashboard/career-explorer/index.tsx
apps/expo/app/dashboard/careers/[onetCode].tsx
apps/expo/app/dashboard/profile/career-assessment/index.tsx
packages/core/features/career/career-explorer-screen.tsx
packages/core/features/career/career-detail-screen.tsx
packages/core/features/career/career-assessment-screen.tsx
packages/core/features/career/components/CareerCard.tsx
packages/core/features/career/components/OccupationDetailView.tsx
packages/core/features/career/components/RiasecProfileCard.tsx
packages/core/constants/routes.ts (update)
```

**Success Criteria:**
- [ ] Users can search and browse 1000+ occupations
- [ ] Occupation detail pages load <1s
- [ ] Career assessment saves progress
- [ ] Clear navigation between screens
- [ ] 5+ occupations viewed per user on average

---

### Phase 5: Enhanced Profile Skills 📋 (Week 5-6)

**Status:** 📋 Planned  
**Progress:** 0/11 tasks complete (0%)  
**GitHub Issue:** [#105 - O*NET Phase 5: Smart Skills Auto-Population](https://github.com/Unicorn/SCF-Neue/issues/105)

#### Deliverables

**Database:**
- [ ] Create migration 020: Add abilities and knowledge tables
  - `user_abilities` table
  - `user_knowledge` table
  - Indexes and RLS policies
- [ ] Update profile router with abilities/knowledge endpoints

**Components:**
- [ ] Create `SkillSuggestionsModal.tsx` component
  - Display suggested skills from occupation
  - Checkbox selection for batch add
  - Show importance scores from O*NET
  - Auto-set proficiency based on importance
- [ ] Update `ProfileSkillsLeft.tsx`
  - Add "Quick Add from Experience" section
  - Occupation search for skill suggestions
  - Trigger suggestions modal
- [ ] Create `AbilitiesSection.tsx` component
  - List user's abilities with proficiency
  - Add new abilities from O*NET
- [ ] Create `KnowledgeSection.tsx` component
  - List user's knowledge domains
  - Add new knowledge from O*NET

**Backend:**
- [ ] Add `addSkillsFromOccupation` mutation
  - Batch add skills from suggestion
  - Set proficiency automatically
  - Return updated skills list
- [ ] Add `getUserAbilities` query
- [ ] Add `addAbility` mutation
- [ ] Add `getUserKnowledge` query
- [ ] Add `addKnowledge` mutation

**Testing:**
- [ ] Test batch skill addition
- [ ] Test proficiency mapping
- [ ] Test abilities/knowledge CRUD
- [ ] E2E test for complete skill addition flow

**Files to Create/Modify:**
```
packages/supabase/migrations/020_add_user_abilities_knowledge.sql
packages/core/features/profile/profile-skills-left.tsx (update)
packages/core/features/profile/components/SkillSuggestionsModal.tsx
packages/core/features/profile/components/AbilitiesSection.tsx
packages/core/features/profile/components/KnowledgeSection.tsx
packages/supabase/functions/trpc/routers/profile.router.ts (update)
```

**Success Criteria:**
- [ ] Users can add 10+ skills in one action
- [ ] 40%+ of skills added via O*NET suggestions
- [ ] Abilities and knowledge tracked separately
- [ ] Profile completion rate increases 30%
- [ ] Smooth, fast batch operations

---

### Phase 6: Enhanced Job Matching 📋 (Week 6-7)

**Status:** 📋 Planned  
**Progress:** 0/10 tasks complete (0%)  
**GitHub Issue:** [#106 - O*NET Phase 6: Multi-Dimensional Job Matching](https://github.com/Unicorn/SCF-Neue/issues/106)

#### Deliverables

**Scoring Algorithm:**
- [ ] Create migration 021: Enhanced job matching
- [ ] Update `calculate_application_score()` function
  - Add RIASEC match (15 points)
  - Add work values match (10 points)
  - Add abilities match (15 points)
  - Rebalance existing scores
  - Total: 100 points
- [ ] Create `match_jobs_by_onet_profile()` function
  - Multi-dimensional compatibility scoring
  - Consider skills, abilities, RIASEC, work values
  - Return ranked job list

**Job Recommendations:**
- [ ] Create `RecommendedJobsWidget.tsx`
  - Display top 5 recommended jobs
  - Show compatibility score
  - Explain match reasons
  - Link to job details
- [ ] Add `getRecommendedJobs` endpoint
  - Use enhanced matching algorithm
  - Filter by user preferences
  - Return personalized feed

**Smart Job Posting:**
- [ ] Add occupation selector to job form
- [ ] Auto-fill job details from O*NET
  - Description template
  - Required skills
  - Required abilities
  - Typical tasks
  - Education requirements
- [ ] Create `OccupationSelectorField.tsx` component

**Integration:**
- [ ] Update job detail view with compatibility score
- [ ] Update discover jobs with better sorting
- [ ] Add O*NET match badge to job cards

**Testing:**
- [ ] Test enhanced scoring algorithm
- [ ] Verify recommendations relevance
- [ ] Test job posting auto-fill
- [ ] A/B test match score impact

**Files to Create/Modify:**
```
packages/supabase/migrations/021_enhance_job_matching.sql
packages/core/features/dashboard/widgets/RecommendedJobsWidget.tsx
packages/core/features/discover/discover-jobs-screen.tsx (update)
packages/core/features/office/components/job-form-sections/OccupationSelector.tsx
packages/supabase/functions/trpc/routers/jobs.router.ts (update)
```

**Success Criteria:**
- [ ] Application match scores increase 25%
- [ ] Job recommendations have 15%+ CTR
- [ ] Job posting time reduced 30% with auto-fill
- [ ] Application-to-interview rate improves
- [ ] User satisfaction with job matches increases

---

## Timeline & Dependencies

### Visual Timeline

```
Week 1-2: Phase 1 (Onboarding)
├─ Database migration
├─ RIASEC component
├─ Occupation search
└─ Prerequisites update

Week 2-3: Phase 2 (Router) [depends on Phase 1]
├─ tRPC router
├─ Matching algorithms
└─ Tests

Week 3-4: Phase 3 (Widgets) [depends on Phase 2]
├─ Career recommendations
├─ Skills gap
├─ Career paths
└─ Dashboard integration

Week 4-5: Phase 4 (Explorer) [depends on Phase 2]
├─ Career explorer screen
├─ Occupation details
├─ Full assessment
└─ Navigation

Week 5-6: Phase 5 (Skills) [depends on Phase 2]
├─ Abilities/knowledge
├─ Skills auto-suggest
└─ Batch addition

Week 6-7: Phase 6 (Matching) [depends on Phase 2, 5]
├─ Enhanced scoring
├─ Job recommendations
└─ Smart posting

Week 7: Polish & Testing [depends on all phases]
├─ Bug fixes
├─ Performance
├─ User testing
└─ Documentation
```

### Dependencies

**Critical Path:**
1. Phase 1 (Onboarding) → Phase 2 (Router) → All other phases
2. Phase 2 must complete before Phases 3, 4, 5 can start
3. Phase 6 needs Phase 2 and Phase 5 data

**Parallel Work:**
- Phases 3, 4, 5 can be developed in parallel after Phase 2
- Phase 6 can start while Phase 5 is in progress

---

## Risk Management

### Technical Risks

**Risk: O*NET data quality issues**
- Impact: High
- Probability: Low
- Mitigation: Validate O*NET import, add data quality checks
- Contingency: Fall back to simpler matching algorithms

**Risk: Performance issues with large datasets**
- Impact: Medium
- Probability: Medium
- Mitigation: Add indexes, optimize SQL queries, implement caching
- Contingency: Limit result sets, add pagination

**Risk: RIASEC matching not accurate**
- Impact: High
- Probability: Medium
- Mitigation: Use proven cosine similarity algorithm, tune thresholds
- Contingency: Add manual occupation selection as primary method

**Risk: Complexity overwhelms users**
- Impact: High
- Probability: Medium
- Mitigation: Keep UI simple, make features optional, progressive disclosure
- Contingency: Simplify assessment, reduce options

### Schedule Risks

**Risk: Underestimated complexity of matching algorithms**
- Impact: Medium
- Probability: Medium
- Mitigation: Start with simple algorithms, iterate
- Contingency: Reduce scope of Phase 6

**Risk: UI/UX requires more iteration than planned**
- Impact: Low
- Probability: High
- Mitigation: Design mockups early, user testing throughout
- Contingency: Launch with minimal UI, enhance later

### Mitigation Strategies

1. **MVP-first approach:** Each phase delivers standalone value
2. **Feature flags:** Can disable problematic features without rollback
3. **Gradual rollout:** Test with small percentage of users first
4. **User feedback loops:** Weekly user testing sessions
5. **Performance monitoring:** Track metrics from day one

---

## Rollout Strategy

### Soft Launch (Week 1-3)
- Internal team testing only
- Fix critical bugs
- Gather initial feedback

### Beta Launch (Week 4-5)
- 10% of new users
- Email invite to 100 existing users
- Monitor engagement metrics
- Iterate on feedback

### Public Launch (Week 6-7)
- 50% of users (A/B test)
- Marketing campaign
- Blog post announcement
- Monitor metrics closely

### Full Rollout (Week 8+)
- 100% of users
- Feature promotion in-app
- Success story sharing
- Continuous improvement

---

## Success Criteria

### Must Have (Launch Blockers)
- [ ] RIASEC assessment works end-to-end
- [ ] Career recommendations show relevant results
- [ ] Skills auto-suggestion functional
- [ ] No performance degradation
- [ ] No data privacy issues

### Should Have (Post-Launch)
- [ ] Full career explorer with search
- [ ] Abilities and knowledge tracking
- [ ] Enhanced job matching live
- [ ] 60%+ assessment completion rate

### Nice to Have (Future)
- [ ] Career path visualization
- [ ] Salary data integration
- [ ] Learning path recommendations
- [ ] Mentorship matching

---

## Monitoring & Metrics

### Key Performance Indicators

**Engagement:**
- RIASEC assessment completion rate
- Career explorer page views
- Occupations viewed per user
- Skills added via O*NET suggestions

**Quality:**
- Career recommendation relevance (user feedback)
- Job match score improvement
- Application success rate

**Business:**
- User retention (7-day, 30-day)
- Profile completion rate
- Job application rate
- User satisfaction (NPS)

### Dashboards

**Development Dashboard:**
- Build status
- Test coverage
- Performance metrics
- Error rates

**Product Dashboard:**
- Feature adoption rates
- User flows and funnels
- A/B test results
- User feedback themes

---

## GitHub Issue Labels

Use these labels for O*NET issues:

- `feature: onet` - All O*NET related issues
- `phase-1: onboarding` - Phase 1 tasks
- `phase-2: router` - Phase 2 tasks
- `phase-3: widgets` - Phase 3 tasks
- `phase-4: explorer` - Phase 4 tasks
- `phase-5: skills` - Phase 5 tasks
- `phase-6: matching` - Phase 6 tasks
- `priority: high` - Critical path items
- `priority: medium` - Important but not blocking
- `priority: low` - Nice to have
- `type: database` - Database migrations
- `type: backend` - tRPC/API work
- `type: frontend` - UI components
- `type: testing` - Test coverage
- `blocked` - Waiting on dependencies

---

## Communication Plan

### Weekly Updates
- Every Monday: Team standup with O*NET progress
- Every Friday: Demo of completed features
- Weekly metrics review

### Stakeholder Updates
- Bi-weekly: Executive summary email
- Monthly: Product review meeting
- Launch: Comprehensive report

### User Communication
- Beta launch: Email announcement
- Public launch: Blog post, in-app messaging
- Ongoing: Feature tips and best practices

---

**Last Updated:** October 12, 2025  
**Document Owner:** Development Team  
**Next Review:** Weekly during implementation

