# Data Model Schemas

> **Status:** TODO - Needs completion  
> **Purpose:** Define database structures, API contracts, and data storage patterns

## Overview

This document defines the database schema extensions, API contracts, and data storage patterns for the Personality Layer system.

## Database Schema Extensions

### Extension to `core.preferences` Table

```sql
-- New fields to add to existing core.preferences table
ALTER TABLE core.preferences ADD COLUMN archetype_id UUID REFERENCES core.archetypes(id);
ALTER TABLE core.preferences ADD COLUMN archetype_confidence FLOAT CHECK (archetype_confidence >= 0.0 AND archetype_confidence <= 1.0);
ALTER TABLE core.preferences ADD COLUMN ipip_scores JSONB;
ALTER TABLE core.preferences ADD COLUMN hexaco_scores JSONB;
ALTER TABLE core.preferences ADD COLUMN via_strengths JSONB;
ALTER TABLE core.preferences ADD COLUMN luscher_history JSONB[];
ALTER TABLE core.preferences ADD COLUMN personality_xp INTEGER DEFAULT 0;
ALTER TABLE core.preferences ADD COLUMN archetype_stage TEXT CHECK (archetype_stage IN ('apprentice', 'adept', 'master')) DEFAULT 'apprentice';
ALTER TABLE core.preferences ADD COLUMN last_full_assessment TIMESTAMP;
ALTER TABLE core.preferences ADD COLUMN last_mood_check TIMESTAMP;
```

**Status:** TODO - Need to:
- Review existing `core.preferences` schema
- Create migration script
- Define JSONB structure for scores
- Add indexes for performance

### New `core.archetypes` Table

```sql
CREATE TABLE core.archetypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  lore TEXT NOT NULL,
  traits JSONB NOT NULL,
  visual_identity JSONB,
  psychometric_profile JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_archetypes_slug ON core.archetypes(slug);
```

**Status:** TODO - Need to:
- Define JSONB structure for `traits`
- Define JSONB structure for `visual_identity`
- Define JSONB structure for `psychometric_profile`
- Create seed data for 8 archetypes

### New `core.assessment_sessions` Table

```sql
CREATE TABLE core.assessment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('ipip', 'hexaco', 'luscher', 'via', 'riasec')),
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  responses JSONB NOT NULL,
  scores JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assessment_sessions_user_id ON core.assessment_sessions(user_id);
CREATE INDEX idx_assessment_sessions_type ON core.assessment_sessions(assessment_type);
CREATE INDEX idx_assessment_sessions_completed ON core.assessment_sessions(completed_at);
```

**Status:** TODO - Need to:
- Define JSONB structure for `responses`
- Define JSONB structure for `scores`
- Consider partitioning by date for large datasets

### New `core.personality_achievements` Table

```sql
CREATE TABLE core.personality_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('badge', 'quest', 'milestone')),
  earned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_personality_achievements_user_id ON core.personality_achievements(user_id);
CREATE INDEX idx_personality_achievements_type ON core.personality_achievements(achievement_type);
```

**Status:** TODO - Need to:
- Define JSONB structure for `metadata`
- Create achievement definitions

## API Contracts

### Assessment Submission

**Endpoint:** `POST /api/personality/assessments`

```typescript
// Input
interface AssessmentSubmission {
  assessment_type: 'ipip' | 'hexaco' | 'luscher' | 'via' | 'riasec';
  responses: Record<string, number>;
}

// Output
interface AssessmentResponse {
  scores: Record<string, number>;
  archetype_id: string;
  confidence: number;
  xp_earned: number;
}
```

**Status:** TODO - Need to:
- Define exact response format
- Document error handling
- Define rate limiting rules

### Get User Personality Profile

**Endpoint:** `GET /api/personality/profile/:userId`

```typescript
// Output
interface PersonalityProfile {
  archetype: Archetype;
  confidence: number;
  stage: 'apprentice' | 'adept' | 'master';
  traits: Record<string, number>;
  achievements: Achievement[];
  last_updated: string;
}
```

**Status:** TODO - Need to:
- Define `Archetype` interface
- Define `Achievement` interface
- Document caching strategy

### Daily Mood Check

**Endpoint:** `POST /api/personality/mood-check`

```typescript
// Input
interface MoodCheckSubmission {
  color_selection: string[];
}

// Output
interface MoodCheckResponse {
  mood_state: string;
  ui_theme: string;
  xp_earned: number;
}
```

**Status:** TODO - Need to:
- Define color selection format
- Define mood state enum
- Define UI theme mapping
- Document rate limiting (1 per hour)

## Data Privacy & Ethics

**Approach:** Basic privacy compliance

**Requirements:**
- Standard privacy policy disclosure
- Anonymize raw psychometric data in analytics
- Store normalized scores only (no raw question responses)
- Provide opt-out for mood tracking
- GDPR/CCPA compliance for data deletion requests

**Status:** TODO - Need to:
- Review privacy policy
- Document data retention policies
- Create data deletion procedures

## Migration Scripts

**Status:** TODO - Need to:
- [ ] Create migration for `core.preferences` extensions
- [ ] Create migration for `core.archetypes` table
- [ ] Create migration for `core.assessment_sessions` table
- [ ] Create migration for `core.personality_achievements` table
- [ ] Create seed data for archetypes
- [ ] Create rollback migrations

## Performance Considerations

**Indexes:**
- [ ] `core.archetypes.slug` (already defined)
- [ ] `core.assessment_sessions.user_id` (already defined)
- [ ] `core.assessment_sessions.completed_at` (already defined)
- [ ] `core.preferences.archetype_id` (needs to be added)
- [ ] Consider partitioning `core.assessment_sessions` by date

**JSONB Queries:**
- [ ] Document query patterns for JSONB fields
- [ ] Create GIN indexes if needed for JSONB searches
- [ ] Optimize scoring calculations (< 100ms target)

