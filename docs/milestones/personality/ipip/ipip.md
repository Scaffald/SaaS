# IPIP Personality Assessment Feature - Product Requirements Document (PRD)

## Overview  
The IPIP (International Personality Item Pool) personality assessment feature provides users with a scientifically validated measure of the Big Five personality traits. This feature enables users to complete a series of items, receive scored results across domains and facets, and view personalized narrative content that interprets their unique personality profile.

## Goals  
- Deliver an engaging, user-friendly IPIP personality assessment experience.  
- Accurately score user responses to produce Big Five domain and facet results.  
- Present results in both narrative and visual chart formats.  
- Integrate with existing data sources and user progression systems.  
- Encourage continued engagement through gamification elements such as XP and Scaffald Score.

## Data Model  
- **Items**: Questions from the IPIP item pool, each associated with a facet and domain.  
- **Responses**: User selections captured on a Likert scale (e.g., 1-5).  
- **Scores**: Calculated by aggregating responses per facet and domain, normalized as percentages.  
- **Narrative Text**: Pulled from `en.results.json` based on score ranges (low, neutral, high) for each domain and facet.  
- **Mappings**:  
  - Low: scores below a defined threshold mapped to "low" narrative text.  
  - Neutral: scores within a middle range mapped to "neutral" narrative text.  
  - High: scores above a defined threshold mapped to "high" narrative text.

## Technical Capabilities

### Database Schema

The IPIP assessment integrates with the existing `core.personality_assessments` table, which provides comprehensive assessment tracking:

**Table: `core.personality_assessments`**
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to `core.users(id)`
- `current_step` (TEXT) - Current step: `'luscher1' | 'cooldown' | 'ipip' | 'luscher2' | 'acute' | 'completed'`
- `completion_score` (INTEGER) - Percentage completion (0-100)
- `started_at` (TIMESTAMPTZ) - When assessment was started
- `completed_at` (TIMESTAMPTZ) - When assessment was completed
- `last_updated_at` (TIMESTAMPTZ) - Last update timestamp
- `cooldown_end_time` (TIMESTAMPTZ) - When cooldown period ends (60 seconds after luscher1 completion)
- `next_luscher_test_available_at` (TIMESTAMPTZ) - 7-day cooldown after completion
- `diary_response` (TEXT) - Optional diary entry from cooldown step
- `diary_response_sentiment` (TEXT) - Sentiment tag derived from diary response

**IPIP-Specific Fields:**
- `ipip_answers` (JSONB) - Array of answer objects: `[{id, domain, facet, score}, ...]`
  - `id` (string) - Question/item identifier
  - `domain` (enum: "A" | "E" | "N" | "C" | "O") - Big Five domain
  - `facet` (number) - Facet number within domain
  - `score` (number, 1-5) - Likert scale response
- `ipip_current_index` (INTEGER) - Current question index (0-120)
- `ipip_language` (TEXT) - Language code (default: 'en')
- `ipip_completed_at` (TIMESTAMPTZ) - When IPIP test was completed
- `ipip_scores` (JSONB) - Computed scores by domain and facet

**Database Features:**
- Row Level Security (RLS) policies ensure users can only access their own assessments
- Indexes on `user_id`, `completion_score`, `current_step`, and `completed_at` for performance
- Automatic timestamp updates via triggers
- UNIQUE constraint on `user_id` (one assessment per user, can be modified if needed)

**Migration Files:**
- `011_personality_assessment.sql` - Creates the base table and policies
- `016_update_personality_assessments_cooldown.sql` - Adds cooldown and diary fields

### API Capabilities (tRPC Router)

The `personalityAssessmentRouter` provides comprehensive API endpoints:

**Assessment Status & Progress:**
- `getAssessmentStatus` - Get or create assessment, returns full assessment state
- `getIPIPStatus` - Get IPIP completion status and progress
- `updateCurrentStep` - Advance to next step in assessment flow

**IPIP-Specific Endpoints:**
- `saveIPIPProgress` - Incremental save of IPIP answers with progress tracking
  - Input: `{answers: [{id, domain, facet, score}], current_index, language}`
  - Automatically calculates completion score (25% for luscher1 + IPIP progress)
  - Marks as complete when 120 answers are provided
  - Updates `current_step` to `'luscher2'` when IPIP is complete

**Assessment Flow Management:**
- `getLuscherTestAvailability` - Check cooldown status and next available time
- `saveLuscherTestSession` - Complete unified test session (both parts + diary + XP)
- `awardFrequencyXP` - Award XP for assessment completion (5 XP for weekly pulse)

**Results Retrieval:**
- `getResults` - Get completed assessment results with all data

### Chart Components Available

From `@app/ui/components/charts`:

**RadarChart** - Primary visualization for Big Five domain scores
- Location: `packages/ui/src/components/charts/RadarChart.tsx`
- Props: `data`, `datasets`, `height`, `width`, `radius`, `maxValue`, `noOfSections`, `isAnimated`, `animationDuration`, `onPress`
- Features:
  - Animated rendering (default: 800ms)
  - Customizable radius, colors, and styling
  - Support for single dataset or multiple datasets
  - Interactive press handlers
  - Built on `react-native-gifted-charts`
- Usage example:
  ```tsx
  import { RadarChart } from '@app/ui'
  
  const data = [
    { value: 80, label: 'Openness' },
    { value: 60, label: 'Conscientiousness' },
    { value: 90, label: 'Extraversion' },
    { value: 70, label: 'Agreeableness' },
    { value: 75, label: 'Neuroticism' }
  ]
  
  <RadarChart data={data} height={250} maxValue={100} />
  ```

**Additional Chart Components:**
- `BarChart` - For facet-level score comparisons
- `LineChart` - For timeline/trend visualization
- `PieChart` - For score distribution visualization
- `StackedBarChart` - For multi-dimensional comparisons
- `SkillsChart` - Specialized chart for skills visualization
- `PopulationPyramid` - For demographic comparisons

All charts are:
- Cross-platform (React Native + Web compatible)
- Themed with Tamagui design system
- Animated by default
- Fully typed with TypeScript

### Assessment Infrastructure

**AssessmentWizard Component** - Reusable wizard container
- Location: `packages/core/features/assessments/components/AssessmentWizard.tsx`
- Features:
  - Step-by-step navigation with Previous/Next buttons
  - Progress indicator with completion percentage
  - Loading and error states
  - Title and description display
  - Flexible step content rendering
- Props: `steps`, `currentStep`, `completionScore`, `isLoading`, `error`, `showPrevious`, `showNext`, `onPrevious`, `onNext`, `children`

**AssessmentProgress Component** - Progress indicator
- Location: `packages/core/features/assessments/components/AssessmentProgress.tsx`
- Features:
  - Visual progress bar with percentage
  - Step indicators with checkmarks for completed steps
  - Current step highlighting
  - Responsive layout
- Props: `steps`, `currentStep`, `completedSteps`, `completionScore`

**Assessment Step Structure:**
```typescript
interface AssessmentStep {
  id: string
  label: string
  order: number
}
```

**Example Implementation Pattern:**
- See `LuscherTestWizard.tsx` for reference implementation
- Uses `AssessmentWizard` as container
- Manages step state with React hooks
- Integrates with tRPC mutations for persistence
- Handles loading, error, and success states

### Progress Bar Components

**Tamagui Progress Component:**
- Native Tamagui `Progress` component available
- Features: animated, themed, customizable colors
- Usage: `<Progress value={percentage} max={100} />`

**Custom Progress Components:**
- `ChecklistProgress` - For checklist completion tracking
- `ReviewProgress` - Step-based progress with dots
- `ProgressIndicator` - Visual step tracker with connectors

### UI Components Available

**Tamagui Components:**
- `Button` - Primary, secondary, outlined variants
- `Text` - Typography with theme support
- `YStack`, `XStack` - Layout containers
- `ScrollView` - Scrollable content
- `Spinner` - Loading indicators
- `Progress` - Progress bars
- `Tabs` - Tab navigation for results views
- `Circle` - Circular indicators
- `Separator` - Visual dividers

**Dashboard Components:**
- `DashboardWidget` - Consistent widget container
- Reusable across all assessment widgets

**Form Components:**
- React Hook Form integration available
- Zod schema validation
- Form state management patterns established

### Gamification System

**XP System:**
- `frequency_xp` field in `core.users` table
- Awarded via `awardFrequencyXP` mutation or direct database update
- Current implementation: +5 XP for weekly pulse completion
- Can be extended for IPIP completion rewards

**Scaffald Score:**
- Integration point available in user profile system
- Can be updated based on assessment completion

### Integration Examples

**Existing Assessment Implementation:**
- `LuscherTestWizard` - Full example of assessment wizard implementation
- `CareerAssessmentWidget` - Example of assessment widget integration
- Both use `AssessmentWizard` component
- Both integrate with tRPC routers
- Both handle progress tracking and persistence

**Patterns to Follow:**
1. Use `AssessmentWizard` for container structure
2. Use `AssessmentProgress` for progress indication
3. Integrate with `personalityAssessmentRouter` for API calls
4. Store answers in `ipip_answers` JSONB field
5. Calculate scores server-side or client-side
6. Use `RadarChart` for Big Five domain visualization
7. Use `BarChart` or progress bars for facet scores
8. Award XP via `awardFrequencyXP` mutation

## User Flow  
1. **Introduction**: Brief explanation of the IPIP assessment and estimated completion time.  
2. **Assessment**: Users answer a series of items with progress indicated via a progress bar.  
3. **Submission**: Responses are submitted and scored immediately.  
4. **Results Page**: Users view their results in two tabs: Narrative and Chart.  
5. **Gamification**: XP and Scaffald Score updates based on completion and results shared.

## Results Page  

### Narrative View  
- Displays personalized narrative content for each Big Five domain and its facets.  
- Narrative text is selected based on the user’s score mapped to low, neutral, or high categories from `en.results.json`.  
- Each domain section includes:  
  - Domain name and brief description.  
  - Facet-level narratives with detailed interpretations.  
- Option to expand/collapse facet details for readability.

### Chart View  
- Features a radar chart visualizing the Big Five domain scores as percentages.  
- Includes an interactive list of facets with their individual scores displayed as progress bars.  
- Hover or tap on facets reveals additional narrative insights.  
- Clear labeling and color coding for low, neutral, and high score ranges.

## Integration Points  

### Data Storage
- **Database**: Store IPIP answers and scores in `core.personality_assessments` table
  - Use `ipip_answers` JSONB field for storing answer array
  - Use `ipip_scores` JSONB field for computed domain/facet scores
  - Track progress via `ipip_current_index` and `completion_score`
  - See **Database Schema** section above for full field details

### API Integration
- **tRPC Router**: Use `personalityAssessmentRouter` for all API operations
  - `saveIPIPProgress` - Save answers incrementally during assessment
  - `getIPIPStatus` - Check completion status and progress
  - `getAssessmentStatus` - Get full assessment state
  - `getResults` - Retrieve completed assessment results
  - See **API Capabilities** section above for complete endpoint list

### Data Sources
- **Narrative Content**: Utilize `en.results.json` for narrative text content
  - Map scores to low/neutral/high categories
  - Pull domain and facet-level narratives based on score ranges

### User Profile Integration
- Store assessment completion status in `personality_assessments` table
- Link to user via `user_id` foreign key
- Track completion timestamps for analytics

### Gamification System
- **XP Awards**: Use `awardFrequencyXP` mutation to award XP upon completion
  - Current pattern: +5 XP for assessment completion
  - Can be extended for IPIP-specific rewards
- **Scaffald Score**: Integration point available in user profile system
  - Update based on assessment completion milestones

### UI Component Reuse
- **Charts**: Use `RadarChart` from `@app/ui` for Big Five domain visualization
  - Use `BarChart` for facet-level score comparisons
  - Use `Progress` component for progress bars
- **Wizard Infrastructure**: Use `AssessmentWizard` component for consistent assessment flow
  - Use `AssessmentProgress` for step indicators
  - Follow patterns established in `LuscherTestWizard` implementation
- **Layout Components**: Use Tamagui components (`YStack`, `XStack`, `Button`, `Text`, etc.)
- See **Chart Components** and **UI Components Available** sections above for complete details

## Implementation Plan

### Step 1 — Schema Modernization *(in progress)*
- Convert `core.personality_assessments` into a fully polymorphic catalog.
- Replace test-specific columns with:
  - `assessment_type` / `assessment_subtype` enums.
  - `raw_data` JSONB for answers, metadata, and derived values.
- Drop the `UNIQUE (user_id)` constraint to store multiple historical runs.
- Retain lifecycle timestamps (`started_at`, `updated_at`, `completed_at`) and status fields to distinguish active vs. completed sessions.
- Add supporting indexes (`user_id, completed_at DESC`, `user_id, completion_status`) to keep resume/fetch queries fast.
- Consider migrating existing records by moving legacy IPIP/Luscher columns into `raw_data`.

### Step 2 — Scoring Logic *(planned)*
- Perform scoring on the client; optionally mirror logic in the tRPC handler as a safeguard.
- Persist only raw answers (and minimal metadata) in `raw_data`; compute aggregates on demand during read.
- Action item: locate or recreate the IPIP item bank with domain, facet, and reverse-key information so the client can calculate raw sums accurately.
- Keep normalization/percentile logic out of scope for now—raw sums are sufficient and future-proof.

### Step 3 — Narrative Mapping *(queued)*
- Audit `en.results.json` (or successor) to confirm domain and facet narratives for low/neutral/high buckets.
- Decide on threshold strategy (fixed cutoffs vs. configurable per facet/domain) when we resume.
- Plan for future localization by structuring narrative resources for multiple locales.

## Success Metrics  
- Completion rate of IPIP assessment.  
- User engagement with results page (time spent, interactions with narrative and chart views).  
- Increase in user XP and Scaffald Score post-assessment.  
- Positive user feedback on clarity and usefulness of narrative content.  
- Reduction in drop-off rates during assessment progression.
