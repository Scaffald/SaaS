# Reviews & Soft Skills - O*NET Integration Plan

## Executive Summary

This document outlines the plan to transform the reviews system by directly leveraging O*NET's research-backed taxonomy for soft skills assessment, eliminating custom soft skills tables in favor of direct O*NET element references.

**Status**: 📋 Planning Complete - UI/UX Development Phase  
**Last Updated**: October 17, 2025

---

## Current State Analysis

### What We Capture Today

**Frontend Review Wizard** (8 Steps):
1. Technical Skills Ratings (1-5 scale)
2. Skills Tags (strengths & improvements) 
3. Reliability Rating (1-5)
4. Reliability Tags
5. Collaboration Rating (1-5)
6. Collaboration Tags
7. Summary (written feedback)
8. Recommendation (Yes/No)

### Database Storage Issues

**Problem**: All soft skills data stored in JSONB `metadata` field
- No structured schema for soft skills
- Can't aggregate across reviews
- Hard to analyze patterns
- No standardized taxonomy

**Missing Tables** (referenced in router but don't exist):
- `soft_skills` - Master taxonomy
- `review_progress` - Completion tracking
- `review_category_ratings` - Category-level ratings
- `review_soft_skill_votes` - Individual skill votes

**Limited Categories**:
- Only captures: Reliability & Collaboration
- Missing: Professionalism, Technical soft skills, Communication, Problem Solving

---

## The O*NET Opportunity

### What We Have

**O*NET 30.0 Database** - Fully imported with 1,016+ occupations:
- ✅ **Abilities** (52) - Cognitive, Physical, Psychomotor, Sensory
- ✅ **Skills** (35) - Basic, Social, Technical, Complex Problem Solving
- ✅ **Work Values** (6) - Achievement, Independence, Recognition, Relationships, Support, Working Conditions
- ✅ **Work Activities** (41) - Information Input, Interacting, Mental Processes, Work Output

### Why Use O*NET Directly?

| Benefit | Description |
|---------|-------------|
| **Science-Backed** | Based on DOL research across 1000+ occupations |
| **No Duplication** | Single source of truth - no custom soft skills table |
| **Always Current** | O*NET maintains the taxonomy |
| **Rich Metadata** | Descriptions, importance scores, level requirements built-in |
| **Occupation Linking** | Automatic via O*NET scores per occupation |
| **Future-Proof** | Easy O*NET updates without schema changes |
| **Analytics Gold** | Leverage all O*NET research for deep insights |

---

## Proposed Architecture: Direct O*NET Linkage

### Core Concept

**Eliminate custom soft skills table.** Reviews directly reference O*NET elements using polymorphic relationships.

### Database Schema

#### 1. O*NET Element Ratings Table

```sql
-- Review ratings for ANY O*NET element (abilities, skills, work values, work activities)
CREATE TABLE public.review_onet_element_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  
  -- Polymorphic reference to O*NET elements
  element_type TEXT NOT NULL CHECK (element_type IN (
    'ability',      -- Links to onet.abilities
    'skill',        -- Links to onet.skills
    'work_value',   -- Links to onet.work_values
    'work_activity' -- Links to onet.work_activities
  )),
  element_id TEXT NOT NULL, -- O*NET element_id (e.g., '2.A.1.a', '1.A.1.a.1')
  
  -- Rating data
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  is_strength BOOLEAN NOT NULL, -- True = strength, False = improvement area
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, element_type, element_id)
);

-- Indexes for performance
CREATE INDEX idx_review_onet_ratings_review 
  ON review_onet_element_ratings(review_id);
CREATE INDEX idx_review_onet_ratings_element 
  ON review_onet_element_ratings(element_type, element_id);
```

#### 2. Category View (UI Organization)

```sql
-- View to organize O*NET elements by review category (for UI display)
CREATE VIEW public.review_onet_elements_by_category AS
SELECT 
  'ability' as element_type,
  element_id,
  element_name as name,
  description,
  CASE 
    WHEN element_id LIKE '1.A.1%' THEN 'cognitive'
    WHEN element_id LIKE '1.A.2%' THEN 'psychomotor'
    WHEN element_id LIKE '1.A.3%' THEN 'physical'
    WHEN element_id LIKE '1.A.4%' THEN 'sensory'
  END as category
FROM onet.abilities
WHERE element_id IN (
  -- Curated list of relevant abilities for reviews
  '1.A.1.a.1', -- Oral Comprehension
  '1.A.1.b.1', -- Deductive Reasoning
  '1.A.1.b.5', -- Selective Attention (attention to detail)
  '1.A.4.a.1', -- Stress Tolerance
  '1.A.4.a.2'  -- Problem Sensitivity
)

UNION ALL

SELECT
  'skill' as element_type,
  element_id,
  element_name as name,
  description,
  CASE
    WHEN element_id LIKE '2.A%' THEN 'basic_skills'
    WHEN element_id LIKE '2.B%' THEN 'social_skills'
    WHEN element_id LIKE '2.C%' THEN 'complex_problem_solving'
  END as category
FROM onet.skills
WHERE element_id IN (
  -- Curated list of relevant skills
  '2.A.1.a', -- Active Listening
  '2.A.1.b', -- Speaking
  '2.B.1.a', -- Social Perceptiveness
  '2.B.1.b', -- Coordination
  '2.C.1.a'  -- Time Management
)

UNION ALL

SELECT
  'work_value' as element_type,
  element_id,
  element_name as name,
  description,
  'work_values' as category
FROM onet.work_values
WHERE element_id IN (
  '1.B.2.a', -- Achievement
  '1.B.2.d', -- Relationships
  '1.B.2.e'  -- Support
);
```

---

## Soft Skills Taxonomy (O*NET Mapped)

### Category 1: Communication & Teamwork
**O*NET Source**: Skills (Social) + Work Activities

| Element | O*NET ID | Type | Description |
|---------|----------|------|-------------|
| Active Listening | 2.A.1.a | Skill | Giving full attention, understanding points, asking questions |
| Speaking | 2.A.1.b | Skill | Talking to others to convey information effectively |
| Written Expression | 1.A.1.a.4 | Ability | Communicate information in writing |
| Social Perceptiveness | 2.B.1.a | Skill | Being aware of others' reactions and understanding why |
| Coordination | 2.B.1.b | Skill | Adjusting actions in relation to others' actions |
| Instructing | 2.B.1.e | Skill | Teaching others how to do something |

### Category 2: Work Ethic & Reliability
**O*NET Source**: Work Values + Cognitive Abilities + Skills

| Element | O*NET ID | Type | Description |
|---------|----------|------|-------------|
| Dependability | 1.B.2.a.1 | Work Value | Being reliable, responsible, dependable |
| Attention to Detail | 1.A.1.b.5 | Ability | Concentrate on a task over a period of time |
| Stress Tolerance | 1.A.4.a.1 | Ability | Accept criticism and deal calmly with high stress |
| Self-Control | 1.A.4.a.2 | Ability | Maintain composure, keep emotions in check |
| Initiative | 1.B.2.a.2 | Work Value | Willingness to take on responsibilities |
| Time Management | 2.C.1.a | Skill | Managing one's own time and the time of others |

### Category 3: Problem Solving & Adaptability
**O*NET Source**: Cognitive Abilities + Skills

| Element | O*NET ID | Type | Description |
|---------|----------|------|-------------|
| Problem Sensitivity | 1.A.1.a.3 | Ability | Tell when something is wrong or likely to go wrong |
| Deductive Reasoning | 1.A.1.b.1 | Ability | Apply general rules to specific problems |
| Critical Thinking | 2.A.3.a | Skill | Using logic to identify solutions |
| Complex Problem Solving | 2.A.3.b | Skill | Identifying problems and reviewing options |
| Flexibility/Adaptability | 1.A.4.a.3 | Ability | Adjust actions in relation to others' actions |
| Learning Ability | 1.A.1.a.2 | Ability | Understand implications of new information |

### Category 4: Professionalism & Safety
**O*NET Source**: Work Values + Work Activities

| Element | O*NET ID | Type | Description |
|---------|----------|------|-------------|
| Safety Consciousness | 4.C.2.d.1.i | Work Activity | Importance of being careful about safety |
| Achievement | 1.B.2.a | Work Value | Results-oriented, using abilities effectively |
| Integrity | 1.B.2.d.1 | Work Value | Being honest and ethical |
| Quality Focus | 1.B.2.a.3 | Work Value | Doing work that stands on its own |
| Respect for Others | 1.B.2.d.2 | Work Value | Being sensitive to others' needs |
| Independence | 1.B.2.b | Work Value | Working independently with little supervision |

---

## Review Wizard Flow (UI/UX)

### Step 1: Context (Optional)
**Choose Occupation Context** (if reviewing for a specific role)
```typescript
// Pre-populate with O*NET elements most important for this occupation
const { data } = await trpc.onet.getOccupation.query({ 
  onetCode: '47-2031.00' // Carpenters
});

// Returns abilities, skills, work values WITH importance scores
// UI highlights "Critical for this role" vs "Nice to have"
```

### Step 2: Communication & Teamwork
Rate 1-5:
- Active Listening
- Speaking  
- Social Perceptiveness
- Coordination

**UI Enhancement**: Show O*NET description on hover/expand

### Step 3: Work Ethic & Reliability
Rate 1-5:
- Dependability
- Attention to Detail
- Stress Tolerance
- Time Management

### Step 4: Problem Solving & Adaptability
Rate 1-5:
- Problem Sensitivity
- Deductive Reasoning
- Critical Thinking
- Adaptability

### Step 5: Professionalism & Safety
Rate 1-5:
- Safety Consciousness
- Achievement/Quality Focus
- Integrity
- Respect for Others

### Step 6: Strengths & Improvements
For each rated element (>= 4), mark as:
- ✅ **Strength** - This person excels here
- 🎯 **Area to Improve** - Room for growth

Add optional notes for context

### Step 7: Overall Comment
Free text feedback about working with this person

### Step 8: Recommendation
Would you recommend this person? Yes/No

---

## Query Examples

### 1. Get Aggregated User Soft Skills Profile

```sql
-- Aggregate all ratings a user has received across reviews
SELECT 
  r.element_type,
  r.element_id,
  CASE 
    WHEN r.element_type = 'ability' THEN a.element_name
    WHEN r.element_type = 'skill' THEN s.element_name
    WHEN r.element_type = 'work_value' THEN wv.element_name
  END as element_name,
  CASE
    WHEN r.element_type = 'ability' THEN a.description
    WHEN r.element_type = 'skill' THEN s.description  
    WHEN r.element_type = 'work_value' THEN wv.description
  END as description,
  AVG(r.rating) as avg_rating,
  COUNT(*) as rating_count,
  SUM(CASE WHEN r.is_strength THEN 1 ELSE 0 END) as strength_count,
  SUM(CASE WHEN NOT r.is_strength THEN 1 ELSE 0 END) as improvement_count
FROM reviews rev
JOIN review_onet_element_ratings r ON rev.id = r.review_id
LEFT JOIN onet.abilities a ON r.element_type = 'ability' AND r.element_id = a.element_id
LEFT JOIN onet.skills s ON r.element_type = 'skill' AND r.element_id = s.element_id
LEFT JOIN onet.work_values wv ON r.element_type = 'work_value' AND r.element_id = wv.element_id
WHERE rev.subject_id = $1 AND rev.subject_type = 'user'
GROUP BY r.element_type, r.element_id, element_name, description
ORDER BY avg_rating DESC;
```

### 2. Match User Soft Skills to Jobs

```sql
-- Find jobs that match user's strong O*NET elements
WITH user_strengths AS (
  SELECT 
    r.element_type,
    r.element_id,
    AVG(r.rating) as avg_rating
  FROM reviews rev
  JOIN review_onet_element_ratings r ON rev.id = r.review_id
  WHERE rev.subject_id = $1 
    AND rev.subject_type = 'user'
    AND r.is_strength = true
  GROUP BY r.element_type, r.element_id
  HAVING AVG(r.rating) >= 4.0
)
SELECT 
  j.id,
  j.title,
  j.onet_occupation_code,
  od.title as occupation_title,
  COUNT(*) as matching_elements,
  ARRAY_AGG(us.element_id) as matched_element_ids
FROM jobs j
JOIN onet.occupation_data od ON j.onet_occupation_code = od.onetsoc_code
JOIN user_strengths us ON (
  -- Match abilities (high importance in occupation)
  (us.element_type = 'ability' AND 
   EXISTS (SELECT 1 FROM onet.abilities ab 
           WHERE ab.onetsoc_code = od.onetsoc_code 
           AND ab.element_id = us.element_id
           AND ab.scale_id = 'IM'
           AND ab.data_value >= 4.0))
  OR
  -- Match skills (high importance in occupation)
  (us.element_type = 'skill' AND
   EXISTS (SELECT 1 FROM onet.skills sk
           WHERE sk.onetsoc_code = od.onetsoc_code
           AND sk.element_id = us.element_id
           AND sk.scale_id = 'IM'  
           AND sk.data_value >= 4.0))
)
GROUP BY j.id, j.title, j.onet_occupation_code, od.title
ORDER BY matching_elements DESC
LIMIT 20;
```

### 3. Soft Skills Gap Analysis

```sql
-- Compare user's soft skills to target occupation requirements
WITH user_ratings AS (
  SELECT 
    r.element_type,
    r.element_id,
    AVG(r.rating) as user_rating
  FROM reviews rev
  JOIN review_onet_element_ratings r ON rev.id = r.review_id
  WHERE rev.subject_id = $1
    AND rev.subject_type = 'user'
  GROUP BY r.element_type, r.element_id
),
occupation_requirements AS (
  SELECT 
    'ability' as element_type,
    element_id,
    element_name,
    data_value as importance
  FROM onet.abilities
  WHERE onetsoc_code = $2 -- Target occupation
    AND scale_id = 'IM'
    AND data_value >= 3.0
  
  UNION ALL
  
  SELECT
    'skill' as element_type,
    element_id,
    element_name,
    data_value as importance
  FROM onet.skills
  WHERE onetsoc_code = $2
    AND scale_id = 'IM'
    AND data_value >= 3.0
)
SELECT 
  occ.element_type,
  occ.element_id,
  occ.element_name,
  occ.importance as required_level,
  COALESCE(usr.user_rating, 0) as current_level,
  CASE 
    WHEN COALESCE(usr.user_rating, 0) >= occ.importance THEN 'meets_requirement'
    WHEN COALESCE(usr.user_rating, 0) >= occ.importance - 1 THEN 'close'
    ELSE 'needs_development'
  END as status
FROM occupation_requirements occ
LEFT JOIN user_ratings usr ON occ.element_type = usr.element_type 
  AND occ.element_id = usr.element_id
ORDER BY 
  CASE 
    WHEN status = 'needs_development' THEN 1
    WHEN status = 'close' THEN 2
    ELSE 3
  END,
  occ.importance DESC;
```

### 4. Organization-Wide Soft Skills Analysis

```sql
-- Identify organization's collective soft skill strengths/gaps
SELECT 
  r.element_type,
  r.element_id,
  CASE 
    WHEN r.element_type = 'ability' THEN a.element_name
    WHEN r.element_type = 'skill' THEN s.element_name
  END as element_name,
  AVG(r.rating) as org_avg_rating,
  COUNT(DISTINCT rev.subject_id) as users_rated,
  SUM(CASE WHEN r.is_strength THEN 1 ELSE 0 END) as total_strengths,
  SUM(CASE WHEN NOT r.is_strength THEN 1 ELSE 0 END) as total_improvements
FROM reviews rev
JOIN review_onet_element_ratings r ON rev.id = r.review_id
LEFT JOIN onet.abilities a ON r.element_type = 'ability' AND r.element_id = a.element_id
LEFT JOIN onet.skills s ON r.element_type = 'skill' AND r.element_id = s.element_id
WHERE rev.subject_type = 'user'
  AND rev.subject_id IN (
    SELECT user_id FROM team_members WHERE team_id IN (
      SELECT id FROM teams WHERE organization_id = $1
    )
  )
GROUP BY r.element_type, r.element_id, element_name
HAVING COUNT(DISTINCT rev.subject_id) >= 3 -- At least 3 users
ORDER BY org_avg_rating DESC;
```

---

## Implementation Considerations

### Curated Element List

Not all 52 abilities + 35 skills should appear in reviews. Curate a focused list:

**TypeScript Configuration** (Frontend/Router):
```typescript
// Curated O*NET elements for review UI
export const REVIEW_ONET_ELEMENTS = {
  communication_teamwork: [
    { type: 'skill', id: '2.A.1.a', category: 'basic_skills' },
    { type: 'skill', id: '2.A.1.b', category: 'basic_skills' },
    { type: 'skill', id: '2.B.1.a', category: 'social_skills' },
    { type: 'skill', id: '2.B.1.b', category: 'social_skills' },
    { type: 'skill', id: '2.B.1.e', category: 'social_skills' },
  ],
  work_ethic_reliability: [
    { type: 'ability', id: '1.A.1.b.5', category: 'cognitive' },
    { type: 'ability', id: '1.A.4.a.1', category: 'sensory' },
    { type: 'skill', id: '2.C.1.a', category: 'resource_management' },
    { type: 'work_value', id: '1.B.2.a.1', category: 'achievement' },
  ],
  problem_solving_adaptability: [
    { type: 'ability', id: '1.A.1.a.3', category: 'cognitive' },
    { type: 'ability', id: '1.A.1.b.1', category: 'cognitive' },
    { type: 'skill', id: '2.A.3.a', category: 'complex_problem_solving' },
    { type: 'skill', id: '2.A.3.b', category: 'complex_problem_solving' },
  ],
  professionalism_safety: [
    { type: 'work_value', id: '1.B.2.a', category: 'achievement' },
    { type: 'work_value', id: '1.B.2.d', category: 'relationships' },
    { type: 'work_value', id: '1.B.2.e', category: 'support' },
  ],
} as const;
```

### Occupation-Specific Reviews

**Enhanced UX**: When reviewing someone for a specific job:

1. **Pre-populate** with O*NET elements most important for that occupation
2. **Show importance scores** next to each element ("Critical", "Important", "Helpful")
3. **Highlight gaps** between user's ratings and occupation requirements
4. **Suggest focus areas** based on occupation needs

```typescript
// Get occupation-specific element importance
const { data: occupation } = await trpc.onet.getOccupation.query({
  onetCode: job.onet_occupation_code
});

// Merge with curated list, add importance context
const elementsWithContext = REVIEW_ONET_ELEMENTS.map(element => ({
  ...element,
  importance: occupation.getImportanceFor(element.type, element.id),
  required_level: occupation.getRequiredLevelFor(element.type, element.id)
}));
```

### Mock Data for UI Development

```typescript
// Mock O*NET elements for UI development
export const MOCK_ONET_ELEMENTS = {
  '2.A.1.a': {
    id: '2.A.1.a',
    type: 'skill',
    name: 'Active Listening',
    description: 'Giving full attention to what other people are saying, taking time to understand the points being made, asking questions as appropriate, and not interrupting at inappropriate times.',
    category: 'basic_skills'
  },
  '1.A.1.b.5': {
    id: '1.A.1.b.5',
    type: 'ability',
    name: 'Selective Attention',
    description: 'The ability to concentrate on a task over a period of time without being distracted.',
    category: 'cognitive'
  },
  // ... more mock elements
};

// Mock review data
export const MOCK_REVIEW_DATA = {
  ratings: [
    { elementId: '2.A.1.a', rating: 5, isStrength: true },
    { elementId: '1.A.1.b.5', rating: 4, isStrength: true },
    { elementId: '2.A.3.a', rating: 3, isStrength: false },
  ],
  summary: 'Great team player with strong communication skills.',
  recommendation: true
};
```

---

## Benefits Comparison

| Aspect | Custom Soft Skills | Direct O*NET | Winner |
|--------|-------------------|--------------|---------|
| **Maintenance Burden** | Must curate/update custom list | Zero - O*NET maintains | ✅ O*NET |
| **Scientific Validity** | DIY research required | DOL research across 1000+ occupations | ✅ O*NET |
| **Descriptions** | Write yourself | Built-in, research-backed | ✅ O*NET |
| **Occupation Linking** | Manual mapping required | Automatic via O*NET scores | ✅ O*NET |
| **Importance Scores** | Must define per occupation | O*NET provides per occupation | ✅ O*NET |
| **Future Updates** | Requires migration | Just update O*NET data | ✅ O*NET |
| **Data Duplication** | Yes - duplicate O*NET data | No - single source of truth | ✅ O*NET |
| **Analytics Depth** | Limited to custom attributes | Leverage all O*NET research | ✅ O*NET |
| **Industry Standard** | Custom approach | Industry-standard taxonomy | ✅ O*NET |

---

## Next Steps

### Phase 1: UI/UX Development (Current)
- [ ] Design review wizard UI with O*NET element structure
- [ ] Create mock O*NET element data for development
- [ ] Build category-based rating components
- [ ] Implement strengths/improvements tagging
- [ ] Test UX flow with real users
- [ ] Iterate based on feedback

### Phase 2: Backend Implementation
- [ ] Create `review_onet_element_ratings` table migration
- [ ] Update tRPC reviews router for O*NET elements
- [ ] Build aggregation queries for user profiles
- [ ] Implement job matching with O*NET elements
- [ ] Create analytics views for organization insights

### Phase 3: Advanced Features
- [ ] Occupation-specific review suggestions
- [ ] Importance scoring visualization
- [ ] Gap analysis reports
- [ ] Career path recommendations
- [ ] Team composition analysis
- [ ] Training recommendations based on gaps

---

## Related Documentation

- [O*NET Integration Overview](./onet-integration.md)
- [O*NET Roadmap](./onet-roadmap.md)
- [O*NET Summary](./onet-summary.md)
- [Features README](./README.md)

## External References

- [O*NET Content Model](https://www.onetcenter.org/content.html)
- [O*NET Database Documentation](https://www.onetcenter.org/dictionary/30.0/mysql/)
- [O*NET Online](https://www.onetonline.org/)

---

**Document Version**: 1.0  
**Created**: October 17, 2025  
**Last Updated**: October 17, 2025  
**Status**: UI/UX Development Phase
