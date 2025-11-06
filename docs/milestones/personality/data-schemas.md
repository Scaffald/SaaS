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
-- Scaffald Score & Leveling System
ALTER TABLE core.preferences ADD COLUMN scaffald_score INTEGER DEFAULT 0 CHECK (scaffald_score >= 0 AND scaffald_score <= 1000);
ALTER TABLE core.preferences ADD COLUMN scaffald_level INTEGER DEFAULT 1 CHECK (scaffald_level >= 1);
ALTER TABLE core.preferences ADD COLUMN scaffald_score_components JSONB DEFAULT '{"depth": 0, "frequency": 0, "consistency": 0, "completeness": 0, "other": 0}'::jsonb;
ALTER TABLE core.preferences ADD COLUMN scaffald_score_last_calculated TIMESTAMP;
ALTER TABLE core.preferences ADD COLUMN scaffald_score_weights JSONB DEFAULT '{"depth": 0.45, "frequency": 0.25, "consistency": 0.15, "completeness": 0.10, "other": 0.05}'::jsonb;

-- Legacy XP tracking (for backward compatibility)
ALTER TABLE core.preferences ADD COLUMN personality_xp INTEGER DEFAULT 0;

-- Assessment tracking
ALTER TABLE core.preferences ADD COLUMN last_full_assessment TIMESTAMP;
ALTER TABLE core.preferences ADD COLUMN last_mood_check TIMESTAMP;
ALTER TABLE core.preferences ADD COLUMN ipip_modules_completed INTEGER DEFAULT 0;
ALTER TABLE core.preferences ADD COLUMN via_missions_completed INTEGER DEFAULT 0;
ALTER TABLE core.preferences ADD COLUMN hexaco_completed BOOLEAN DEFAULT FALSE;
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
- Create seed data for 10 archetypes

### New `core.assessment_sessions` Table

```sql
CREATE TABLE core.assessment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('ipip', 'hexaco', 'luscher', 'via', 'riasec')),
  module_id INTEGER,  -- For modular assessments (IPIP: 1-10, VIA: 1-3)
  mission_id INTEGER, -- For multi-mission assessments (VIA/RIASEC)
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  responses JSONB NOT NULL,
  scores JSONB,
  xp_earned INTEGER DEFAULT 0,
  cooldown_until TIMESTAMP,  -- Optional cooldown enforcement
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assessment_sessions_user_id ON core.assessment_sessions(user_id);
CREATE INDEX idx_assessment_sessions_type ON core.assessment_sessions(assessment_type);
CREATE INDEX idx_assessment_sessions_completed ON core.assessment_sessions(completed_at);
CREATE INDEX idx_assessment_sessions_user_type_completed ON core.assessment_sessions(user_id, assessment_type, completed_at) WHERE completed_at IS NOT NULL;
-- Index for frequency calculations (8-week rolling window)
CREATE INDEX idx_assessment_sessions_frequency ON core.assessment_sessions(user_id, completed_at) WHERE completed_at >= NOW() - INTERVAL '8 weeks';
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
  module_id?: number;  // For modular assessments (IPIP: 1-10, VIA: 1-3)
  mission_id?: number; // For multi-mission assessments
  responses: Record<string, number>;
}

// Output
interface AssessmentResponse {
  scores: Record<string, number>;
  archetype_id?: string;  // Only if enough data for assignment
  confidence?: number;    // Only if archetype assigned
  xp_earned: number;
  scaffald_score?: number;  // Updated Scaffald Score
  level?: number;           // Updated Level
  score_components?: {
    depth: number;
    frequency: number;
    consistency: number;
    completeness: number;
    other: number;
  };
  next_recommended_module?: number;  // For IPIP modular flow
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
  level: number;  // Scaffald Level (1-12+)
  scaffald_score: number;  // 0-1000
  score_components: {
    depth: number;  // 0-100
    frequency: number;  // 0-100
    consistency: number;  // 0-100
    completeness: number;  // 0-100
    other: number;  // 0-100
  };
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

## Complete Data Model (Storage)

### Core Tables

#### `users` (existing)
- `id` UUID PRIMARY KEY
- `created_at` TIMESTAMP
- (other existing fields)

#### `profiles` (extend existing or create)
```sql
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar TEXT,
  bio TEXT,
  location TEXT,
  goals JSONB,
  preferences JSONB,
  privacy_reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `skills` (extend existing or create)
```sql
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  verified_bool BOOLEAN DEFAULT FALSE,
  source TEXT,  -- 'user', 'onet', 'verified'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_skills_user_id ON skills(user_id);
CREATE INDEX idx_skills_verified ON skills(user_id, verified_bool) WHERE verified_bool = TRUE;
```

#### `assessments` (extends `assessment_sessions`)
Already defined above with additional fields:
- `module_id`, `mission_id`, `xp_earned`, `cooldown_until`

#### New: `streaks`
```sql
CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('luscher', 'ipip', 'via')),
  current_len INTEGER DEFAULT 0,
  longest_len INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, type)
);

CREATE INDEX idx_streaks_user_id ON streaks(user_id);
CREATE INDEX idx_streaks_type ON streaks(type);
```

#### New: `xp_ledger`
```sql
CREATE TABLE xp_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,  -- 'IPIP_MODULE', 'LUSCHER_WEEKLY', 'VIA_MISSION', etc.
  amount INTEGER NOT NULL,
  meta_json JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_xp_ledger_user_id ON xp_ledger(user_id);
CREATE INDEX idx_xp_ledger_created ON xp_ledger(user_id, created_at DESC);
CREATE INDEX idx_xp_ledger_source ON xp_ledger(source);
```

#### New: `score_snapshots`
```sql
CREATE TABLE score_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 1000),
  breakdown_json JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_score_snapshots_user_id ON score_snapshots(user_id);
CREATE INDEX idx_score_snapshots_created ON score_snapshots(user_id, created_at DESC);
```

#### `archetypes` (already defined above)

#### New: `feature_flags`
```sql
CREATE TABLE feature_flags (
  key TEXT PRIMARY KEY,
  value_json JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### New: `motivators_state`
```sql
CREATE TABLE motivators_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,  -- 'mentorship', 'portfolio', etc.
  value NUMERIC NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, key)
);

CREATE INDEX idx_motivators_state_user_id ON motivators_state(user_id);
CREATE INDEX idx_motivators_state_key ON motivators_state(key);
```

### Example Payloads

#### XP Ledger Entry
```json
{
  "user_id": "u_123",
  "source": "LUSCHER_WEEKLY",
  "amount": 5,
  "meta_json": {
    "week_index": 2025_45
  },
  "created_at": "2025-11-05T14:00:00Z"
}
```

#### Score Snapshot
```json
{
  "user_id": "u_123",
  "score": 512,
  "breakdown_json": {
    "depth": 62,
    "frequency": 55,
    "consistency": 44,
    "completeness": 70,
    "other": 10,
    "weights": {
      "depth": 0.45,
      "frequency": 0.25,
      "consistency": 0.15,
      "completeness": 0.10,
      "other": 0.05
    }
  },
  "created_at": "2025-11-05T14:01:00Z"
}
```

## Services & API Contracts

### Scoring Service

**Endpoint:** `POST /v1/score/recompute`

**Request:**
```typescript
{
  userId: string;
  cause: 'ASSESSMENT_COMPLETED' | 'PROFILE_UPDATED' | 'STREAK_MILESTONE' | 'MANUAL';
}
```

**Response:**
```typescript
{
  score: number;        // 0-1000
  level: number;
  nextLevelAt: number;  // score threshold for next level
  breakdown: {
    depth: number;        // 0-100
    frequency: number;   // 0-100
    consistency: number; // 0-100
    completeness: number; // 0-100
    other: number;       // 0-100
  }
}
```

### XP Service

**Endpoint:** `POST /v1/xp/grant`

**Request:**
```typescript
{
  userId: string;
  source: 'IPIP_MODULE' | 'LUSCHER_WEEKLY' | 'VIA_MISSION' | 'PROFILE_COMPLETE' | 'SEASONAL_QUEST';
  amount: number;
  meta?: Record<string, any>;
}
```

**Response:**
```typescript
{
  xp_earned: number;
  total_xp: number;
  scaffald_score?: number;  // Updated score if recalculation triggered
  level?: number;           // Updated level if changed
}
```

### CTA Service (Decisioning)

**Endpoint:** `GET /v1/cta/next?userId=u_123`

**Response:**
```typescript
{
  title: string;
  subtitle?: string;
  actionId: 'IPIP_MODULE' | 'LUSCHER_WEEKLY' | 'VIA_MISSION' | 'PROFILE_COMPLETE' | 'SEASONAL_QUEST';
  cooldownEndsAt?: string;  // ISO timestamp
  priority: number;  // Higher priority = more valuable action
}
```

**Logic:**
- Choose highest value action user is eligible for
- Respect cooldowns
- Consider current score components (prioritize low components)
- Return contextual messaging

## Algorithm Pseudocode

```python
def compute_scaffald_score(u):
    """Compute Scaffald Score from user data"""
    
    # Normalize components (0-100)
    depth = compute_depth_norm(u)         # 0–100
    freq  = compute_frequency_norm(u)     # 0–100
    cons  = compute_consistency_norm(u)   # 0–100
    comp  = compute_completeness_norm(u)  # 0–100
    other = compute_other_norm(u)         # 0–100
    
    # Get configurable weights (sum to 1.0)
    w = get_weights()  # {depth, frequency, consistency, completeness, other}
    
    # Calculate weighted raw score (0-100)
    raw = (
        depth * w.depth +
        freq  * w.frequency +
        cons  * w.consistency +
        comp  * w.completeness +
        other * w.other
    )
    
    # Convert to 0-1000 scale
    score = round(raw * 10)
    
    # Map to level
    level = map_score_to_level(score)
    
    return {
        'score': score,
        'level': level,
        'breakdown': {
            'depth': depth,
            'frequency': freq,
            'consistency': cons,
            'completeness': comp,
            'other': other
        }
    }
```

## Cooldowns & Streaks

### Cooldown Rules

- **Lüscher:** Available once per 7 days; streaks at 4 and 8 weeks
- **IPIP modules:** Cap Frequency contribution to 2 completed modules/week to encourage spacing
- **VIA/RIASEC:** Cool down full cycle for 3–6 months
- **Recalibration:** Major reassessment (IPIP/HEXACO) bonus once every 6 months

### Streak Mechanics

- **No punitive decay:** Paused streaks don't reduce levels; they simply pause bonuses
- **Streak tracking:** Separate streak records for each assessment type
- **Milestone bonuses:** 4-week and 8-week milestones award bonuses
- **Streak pauses:** Missed week pauses streak (no penalty, no bonus)

## Data Privacy & Ethics

**Approach:** Transparent, ethical, user-controlled

**Requirements:**
- **User control:** Toggle visibility of archetype and trait details; export raw results
- **Data minimization:** Store raw responses separately from PII; encrypt at rest
- **Explainability:** Show how score was computed (breakdown and recent XP events)
- **No punitive decay:** Paused streaks don't reduce levels; they simply pause bonuses
- **Standard privacy policy disclosure**
- **Anonymize raw psychometric data in analytics**
- **Provide opt-out for mood tracking**
- **GDPR/CCPA compliance for data deletion requests**

**Transparency Features:**
- Score breakdown visible to user
- Recent XP events log
- Component contribution explanation
- Weight configuration visibility
- Export functionality for personal data

**Status:** ✅ Requirements documented - Implementation ready

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

