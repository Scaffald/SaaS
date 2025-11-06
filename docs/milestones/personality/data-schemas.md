# Data Model Schemas

> **Status:** ✅ COMPLETE - Data schemas and API contracts defined  
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

**JSONB Structure Definitions:**

**`ipip_scores` (JSONB):** Big Five dimensions with percentile scores
```json
{
  "openness": {
    "raw_score": 42,
    "percentile": 75,
    "normalized": 0.75,
    "last_updated": "2025-11-06T12:00:00Z"
  },
  "conscientiousness": {
    "raw_score": 38,
    "percentile": 65,
    "normalized": 0.65,
    "last_updated": "2025-11-06T12:00:00Z"
  },
  "extraversion": {
    "raw_score": 35,
    "percentile": 50,
    "normalized": 0.50,
    "last_updated": "2025-11-06T12:00:00Z"
  },
  "agreeableness": {
    "raw_score": 40,
    "percentile": 70,
    "normalized": 0.70,
    "last_updated": "2025-11-06T12:00:00Z"
  },
  "neuroticism": {
    "raw_score": 25,
    "percentile": 30,
    "normalized": 0.30,
    "last_updated": "2025-11-06T12:00:00Z"
  }
}
```

**`hexaco_scores` (JSONB, optional):** HEXACO dimensions (if user completes HEXACO assessment)
```json
{
  "honesty_humility": {
    "raw_score": 45,
    "percentile": 80,
    "normalized": 0.80,
    "last_updated": "2025-11-06T12:00:00Z"
  },
  "emotionality": {
    "raw_score": 30,
    "percentile": 35,
    "normalized": 0.35,
    "last_updated": "2025-11-06T12:00:00Z"
  },
  "extraversion": {
    "raw_score": 38,
    "percentile": 55,
    "normalized": 0.55,
    "last_updated": "2025-11-06T12:00:00Z"
  },
  "agreeableness": {
    "raw_score": 42,
    "percentile": 72,
    "normalized": 0.72,
    "last_updated": "2025-11-06T12:00:00Z"
  },
  "conscientiousness": {
    "raw_score": 40,
    "percentile": 68,
    "normalized": 0.68,
    "last_updated": "2025-11-06T12:00:00Z"
  },
  "openness_to_experience": {
    "raw_score": 44,
    "percentile": 78,
    "normalized": 0.78,
    "last_updated": "2025-11-06T12:00:00Z"
  }
}
```

**`via_strengths` (JSONB):** VIA Character Strengths array
```json
{
  "top_strengths": [
    {
      "strength_id": "curiosity",
      "name": "Curiosity",
      "score": 4.5,
      "rank": 1
    },
    {
      "strength_id": "creativity",
      "name": "Creativity",
      "score": 4.3,
      "rank": 2
    }
  ],
  "all_strengths": {
    "curiosity": 4.5,
    "creativity": 4.3,
    "perseverance": 4.0,
    "honesty": 3.8
  },
  "last_updated": "2025-11-06T12:00:00Z"
}
```

**`luscher_history` (JSONB[]):** Array of weekly mood check entries
```json
[
  {
    "date": "2025-11-06T10:00:00Z",
    "color_selection": ["blue", "green", "yellow"],
    "mood_state": "calm_focused",
    "xp_earned": 5
  },
  {
    "date": "2025-10-30T10:00:00Z",
    "color_selection": ["red", "yellow", "blue"],
    "mood_state": "energetic_optimistic",
    "xp_earned": 5
  }
]
```

**Performance Indexes:**
```sql
CREATE INDEX idx_preferences_archetype_id ON core.preferences(archetype_id);
CREATE INDEX idx_preferences_scaffald_score ON core.preferences(scaffald_score);
CREATE INDEX idx_preferences_scaffald_level ON core.preferences(scaffald_level);
-- GIN index for JSONB queries on ipip_scores
CREATE INDEX idx_preferences_ipip_scores ON core.preferences USING GIN (ipip_scores);
```

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

**JSONB Structure Definitions:**

**`traits` (JSONB):** Core traits array for the archetype
```json
{
  "core_drive": "Bringing form to function — turning plans into tangible outcomes",
  "mode_of_creation": "Structured execution, precision, and physical or technical craftsmanship",
  "signature_traits": [
    "High conscientiousness",
    "Perseverance",
    "Realism",
    "Methodical approach",
    "Quality-focused"
  ],
  "real_world_examples": [
    "Concrete finisher",
    "Software engineer",
    "Carpenter",
    "Data architect"
  ]
}
```

**`visual_identity` (JSONB, optional):** Visual identity elements
```json
{
  "color": "Slate gray — the foundation",
  "symbol": "Compass, blueprint, or geometric foundation shape",
  "narrative_theme": "Steadfast, reliable, foundational — the bedrock upon which others build",
  "environment": "Workshop, construction site, server room, or any space where precision meets purpose",
  "icon_concept": "Geometric foundation or compass",
  "color_palette": {
    "primary": "#475569",
    "secondary": "#64748b",
    "accent": "#94a3b8"
  }
}
```

**`psychometric_profile` (JSONB):** Psychometric mappings for archetype assignment
```json
{
  "big_five": {
    "openness": {
      "range": [30, 50],
      "preferred": "medium_low"
    },
    "conscientiousness": {
      "range": [90, 100],
      "preferred": "high"
    },
    "extraversion": {
      "range": [20, 40],
      "preferred": "low_medium"
    },
    "agreeableness": {
      "range": [40, 60],
      "preferred": "medium"
    },
    "neuroticism": {
      "range": [10, 30],
      "preferred": "low"
    }
  },
  "riasec": {
    "primary": "Realistic",
    "secondary": "Conventional",
    "tertiary": "Investigative",
    "weights": {
      "realistic": 0.5,
      "conventional": 0.3,
      "investigative": 0.2
    }
  },
  "via_strengths": [
    "Perseverance",
    "Self-regulation",
    "Prudence",
    "Honesty"
  ]
}
```

**Note:** Seed data for 10 archetypes will be created during implementation phase (see roadmap.md Phase 1.1).

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

**JSONB Structure Definitions:**

**`responses` (JSONB):** Assessment responses array
```json
{
  "module_id": 1,
  "responses": [
    {
      "question_id": "ipip_001",
      "question_text": "I am the life of the party",
      "answer": 3,
      "answered_at": "2025-11-06T12:00:00Z"
    },
    {
      "question_id": "ipip_002",
      "question_text": "I feel comfortable around people",
      "answer": 4,
      "answered_at": "2025-11-06T12:01:00Z"
    }
  ],
  "total_questions": 10,
  "completed_questions": 10,
  "started_at": "2025-11-06T12:00:00Z",
  "completed_at": "2025-11-06T12:05:00Z"
}
```

**`scores` (JSONB):** Calculated dimension scores and raw values
```json
{
  "module_id": 1,
  "dimensions": {
    "extraversion": {
      "raw_score": 35,
      "normalized_score": 0.58,
      "percentile": 58,
      "questions_count": 10
    },
    "openness": {
      "raw_score": 28,
      "normalized_score": 0.47,
      "percentile": 47,
      "questions_count": 10
    }
  },
  "overall_module_score": 0.525,
  "calculated_at": "2025-11-06T12:05:00Z"
}
```

**Partitioning Consideration:**
For large datasets, consider partitioning `core.assessment_sessions` by date:
```sql
-- Example partitioning strategy (implementation detail)
-- Partition by completed_at year-month for older data
-- Keep recent 12 months in main table for performance
```

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

**JSONB Structure Definitions:**

**`metadata` (JSONB):** Achievement metadata based on type

**For `badge` type:**
```json
{
  "badge_id": "self-discovery",
  "badge_name": "Self-Discovery",
  "badge_description": "Completed your first personality assessment",
  "icon": "compass",
  "rarity": "common",
  "xp_reward": 100,
  "unlocked_at": "2025-11-06T12:00:00Z"
}
```

**For `quest` type:**
```json
{
  "quest_id": "mirror-quest-decision-making",
  "quest_name": "Decision-Making Style",
  "quest_type": "mirror_quest",
  "questions_count": 5,
  "completed_at": "2025-11-06T12:00:00Z",
  "insight_card": {
    "title": "Your Decision-Making Style",
    "insight": "You tend to analyze thoroughly before making decisions",
    "category": "analytical"
  },
  "xp_earned": 50
}
```

**For `milestone` type:**
```json
{
  "milestone_type": "level_up",
  "level_reached": 5,
  "scaffald_score_at_milestone": 450,
  "reached_at": "2025-11-06T12:00:00Z",
  "previous_level": 4,
  "time_to_level": "P14D" // ISO 8601 duration
}
```

**Achievement Definitions:**
See `gamification.md` for complete badge definitions and quest specifications.

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

**Exact Response Format:**

```typescript
// Success Response (200 OK)
{
  "scores": {
    "openness": 0.75,
    "conscientiousness": 0.65,
    "extraversion": 0.50,
    "agreeableness": 0.70,
    "neuroticism": 0.30
  },
  "archetype_id": "550e8400-e29b-41d4-a716-446655440000", // Only if enough data
  "confidence": 0.85, // 0.0-1.0, only if archetype assigned
  "xp_earned": 10,
  "scaffald_score": 245, // Updated score
  "level": 3, // Updated level
  "score_components": {
    "depth": 45,
    "frequency": 30,
    "consistency": 25,
    "completeness": 60,
    "other": 5
  },
  "next_recommended_module": 2 // For IPIP modular flow
}
```

**Error Handling:**

```typescript
// Error Response (400 Bad Request)
{
  "error": {
    "code": "INVALID_ASSESSMENT_TYPE",
    "message": "Invalid assessment type. Must be one of: ipip, hexaco, luscher, via, riasec",
    "details": {
      "received": "invalid_type",
      "valid_types": ["ipip", "hexaco", "luscher", "via", "riasec"]
    }
  }
}

// Error Response (400 Bad Request - Invalid responses)
{
  "error": {
    "code": "INVALID_RESPONSES",
    "message": "Response format is invalid. Expected Record<string, number>",
    "details": {
      "field": "responses",
      "expected_format": "Record<string, number>"
    }
  }
}

// Error Response (429 Too Many Requests)
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many assessment submissions. Please wait before submitting again.",
    "details": {
      "retry_after": 3600, // seconds
      "cooldown_until": "2025-11-06T13:00:00Z"
    }
  }
}

// Error Response (500 Internal Server Error)
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An error occurred while processing the assessment",
    "request_id": "req_123456789"
  }
}
```

**Rate Limiting Rules:**
- IPIP/HEXACO modules: Maximum 2 modules per week for Frequency XP calculation (soft limit, not hard block)
- VIA/RIASEC missions: Maximum 1 full cycle (3 missions) per 3-6 month period
- Lüscher mood check: Maximum 1 per 7 days (enforced)
- Overall assessment submissions: Maximum 10 submissions per hour per user (hard limit)
- Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

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

**TypeScript Interface Definitions:**

```typescript
interface Archetype {
  id: string; // UUID
  name: string; // e.g., "The Builder"
  slug: string; // e.g., "builder"
  lore: string; // 200-300 word narrative
  traits: {
    core_drive: string;
    mode_of_creation: string;
    signature_traits: string[];
    real_world_examples: string[];
  };
  visual_identity?: {
    color: string;
    symbol: string;
    narrative_theme: string;
    environment: string;
    icon_concept?: string;
    color_palette?: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
  psychometric_profile: {
    big_five: {
      openness: { range: [number, number]; preferred: string };
      conscientiousness: { range: [number, number]; preferred: string };
      extraversion: { range: [number, number]; preferred: string };
      agreeableness: { range: [number, number]; preferred: string };
      neuroticism: { range: [number, number]; preferred: string };
    };
    riasec: {
      primary: string;
      secondary: string;
      tertiary: string;
      weights: Record<string, number>;
    };
    via_strengths: string[];
  };
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

interface Achievement {
  id: string; // UUID
  user_id: string; // UUID
  achievement_type: 'badge' | 'quest' | 'milestone';
  earned_at: string; // ISO 8601 timestamp
  metadata: {
    // Badge metadata
    badge_id?: string;
    badge_name?: string;
    badge_description?: string;
    icon?: string;
    rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    xp_reward?: number;
    // Quest metadata
    quest_id?: string;
    quest_name?: string;
    quest_type?: string;
    questions_count?: number;
    insight_card?: {
      title: string;
      insight: string;
      category: string;
    };
    xp_earned?: number;
    // Milestone metadata
    milestone_type?: string;
    level_reached?: number;
    scaffald_score_at_milestone?: number;
    previous_level?: number;
    time_to_level?: string; // ISO 8601 duration
  };
  created_at: string; // ISO 8601 timestamp
}
```

**Caching Strategy:**
- Profile endpoint should cache archetype data (archetypes rarely change)
- User personality profile: Cache for 5 minutes, invalidate on assessment completion
- Use Redis or in-memory cache for archetype lookups
- Cache invalidation triggers:
  - New assessment completion
  - Archetype assignment/update
  - Score recalculation
  - Achievement earned

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

**Color Selection Format:**

```typescript
// Input: Array of 2-3 color strings in order of preference
{
  "color_selection": ["blue", "green", "yellow"] // First choice, second choice, third choice
}

// Valid color values (Lüscher 8-color palette):
type LüscherColor = 
  | "blue"      // Depth of feeling, tranquility
  | "green"     // Elasticity of will, persistence
  | "red"       // Force of will, action, desire
  | "yellow"    // Spontaneity, aspiration, exhilaration
  | "gray"      // Neutrality, boundary
  | "violet"    // Transformation, integration
  | "brown"     // Physical comfort, security
  | "black"     // Total rejection, nothingness
```

**Mood State Enum:**

```typescript
type MoodState = 
  | "calm_focused"           // Blue + Green dominant
  | "energetic_optimistic"   // Red + Yellow dominant
  | "balanced_content"       // Mixed neutral colors
  | "restless_agitated"       // Red + Black, high contrast
  | "reflective_contemplative" // Blue + Gray
  | "creative_inspired"      // Yellow + Violet
  | "grounded_secure"       // Brown + Green
  | "overwhelmed_stressed"  // Black + Red
  | "neutral_balanced";      // Balanced selection
```

**UI Theme Mapping:**

```typescript
interface UITheme {
  primary_color: string;      // Hex color from first choice
  secondary_color: string;    // Hex color from second choice
  accent_color: string;       // Hex color from third choice (if provided)
  mood_state: MoodState;
  theme_name: string;        // e.g., "calm_focused_theme"
  opacity_level: number;      // 0.0-1.0 for theme intensity
  animation_speed: "slow" | "normal" | "fast"; // Based on color intensity
}

// Color to Hex Mapping:
const LÜSCHER_COLOR_MAP: Record<LüscherColor, string> = {
  blue: "#1e40af",
  green: "#059669",
  red: "#dc2626",
  yellow: "#eab308",
  gray: "#6b7280",
  violet: "#7c3aed",
  brown: "#92400e",
  black: "#000000"
};

// Example Response:
{
  "mood_state": "calm_focused",
  "ui_theme": {
    "primary_color": "#1e40af",    // Blue
    "secondary_color": "#059669",  // Green
    "accent_color": "#eab308",      // Yellow
    "mood_state": "calm_focused",
    "theme_name": "calm_focused_theme",
    "opacity_level": 0.7,
    "animation_speed": "normal"
  },
  "xp_earned": 5
}
```

**Rate Limiting:**
- Maximum 1 mood check per 7 days (weekly cadence)
- Rate limit response includes `retry_after` in seconds until next available check
- Headers: `X-RateLimit-Limit: 1`, `X-RateLimit-Remaining: 0`, `X-RateLimit-Reset: <timestamp>`
- Error response when rate limit exceeded:
```json
{
  "error": {
    "code": "MOOD_CHECK_COOLDOWN",
    "message": "Mood check available once per week. Please wait before checking again.",
    "details": {
      "last_check": "2025-11-06T10:00:00Z",
      "next_available": "2025-11-13T10:00:00Z",
      "retry_after": 604800 // seconds until next check
    }
  }
}
```

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

## Trait Matrix Algorithm

The trait matrix algorithm converts raw assessment scores into archetype assignments with confidence scores. This algorithm determines which of the 10 Scaffald Archetypes best matches a user's personality profile.

### Overview

The algorithm uses a weighted distance calculation across multiple psychometric dimensions:
1. **Big Five (IPIP/HEXACO)** - 60% weight (stable traits)
2. **RIASEC** - 25% weight (vocational interests)
3. **VIA Strengths** - 10% weight (motivational depth)
4. **Lüscher** - 5% weight (mood modifier, presentation only)

### Algorithm Steps

```python
def assign_archetype(user_scores, archetypes):
    """
    Assign archetype to user based on assessment scores.
    
    Args:
        user_scores: {
            'ipip': {
                'openness': 0.75,
                'conscientiousness': 0.65,
                'extraversion': 0.50,
                'agreeableness': 0.70,
                'neuroticism': 0.30
            },
            'riasec': {
                'realistic': 0.5,
                'investigative': 0.3,
                'artistic': 0.2,
                'social': 0.1,
                'enterprising': 0.2,
                'conventional': 0.3
            },
            'via_strengths': ['curiosity', 'creativity', 'perseverance'],
            'luscher': {
                'primary': 'blue',
                'secondary': 'green',
                'mood_state': 'calm_focused'
            }
        }
        archetypes: List of archetype objects with psychometric_profile
    
    Returns:
        {
            'archetype_id': 'uuid',
            'archetype_name': 'Builder',
            'confidence': 0.85,
            'match_details': {
                'big_five_distance': 0.12,
                'riasec_distance': 0.08,
                'via_distance': 0.15,
                'total_distance': 0.35
            }
        }
    """
    
    # Step 1: Normalize user scores to percentile ranges (0-100)
    normalized_scores = normalize_user_scores(user_scores)
    
    # Step 2: Calculate distance for each archetype
    archetype_distances = []
    
    for archetype in archetypes:
        # Calculate Big Five distance (60% weight)
        big_five_distance = calculate_big_five_distance(
            normalized_scores['ipip'],
            archetype.psychometric_profile['big_five']
        )
        
        # Calculate RIASEC distance (25% weight)
        riasec_distance = calculate_riasec_distance(
            normalized_scores['riasec'],
            archetype.psychometric_profile['riasec']
        )
        
        # Calculate VIA distance (10% weight)
        via_distance = calculate_via_distance(
            normalized_scores['via_strengths'],
            archetype.psychometric_profile['via_strengths']
        )
        
        # Lüscher modifier (5% weight, presentation only)
        luscher_modifier = calculate_luscher_modifier(
            normalized_scores['luscher'],
            archetype.visual_identity
        )
        
        # Weighted total distance
        total_distance = (
            big_five_distance * 0.60 +
            riasec_distance * 0.25 +
            via_distance * 0.10 +
            luscher_modifier * 0.05
        )
        
        archetype_distances.append({
            'archetype_id': archetype.id,
            'archetype_name': archetype.name,
            'total_distance': total_distance,
            'components': {
                'big_five_distance': big_five_distance,
                'riasec_distance': riasec_distance,
                'via_distance': via_distance,
                'luscher_modifier': luscher_modifier
            }
        })
    
    # Step 3: Find closest match (lowest distance)
    closest_match = min(archetype_distances, key=lambda x: x['total_distance'])
    
    # Step 4: Calculate confidence score
    # Confidence = 1 - (normalized_distance / max_possible_distance)
    # Higher confidence = lower distance = better match
    max_distance = 1.0  # Maximum possible distance (all dimensions maximally different)
    confidence = max(0.0, min(1.0, 1.0 - (closest_match['total_distance'] / max_distance)))
    
    # Step 5: Apply minimum data requirements
    # Require at least IPIP/HEXACO data for archetype assignment
    if not normalized_scores.get('ipip'):
        return None  # Cannot assign without foundational assessment
    
    # Confidence threshold: minimum 0.50 for assignment
    if confidence < 0.50:
        return {
            'archetype_id': closest_match['archetype_id'],
            'archetype_name': closest_match['archetype_name'],
            'confidence': confidence,
            'match_details': closest_match['components'],
            'status': 'tentative',  # Low confidence, needs more data
            'recommendation': 'Complete more assessment modules to improve confidence'
        }
    
    return {
        'archetype_id': closest_match['archetype_id'],
        'archetype_name': closest_match['archetype_name'],
        'confidence': confidence,
        'match_details': closest_match['components'],
        'status': 'confirmed'
    }


def calculate_big_five_distance(user_scores, archetype_profile):
    """
    Calculate distance between user Big Five scores and archetype profile.
    
    Uses Euclidean distance normalized by dimension count.
    """
    distances = []
    
    for dimension in ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism']:
        user_value = user_scores[dimension]  # 0-100 percentile
        archetype_range = archetype_profile[dimension]['range']  # [min, max]
        archetype_center = (archetype_range[0] + archetype_range[1]) / 2
        
        # Distance from archetype center
        distance = abs(user_value - archetype_center) / 100.0  # Normalize to 0-1
        distances.append(distance)
    
    # Average distance across all dimensions
    return sum(distances) / len(distances)


def calculate_riasec_distance(user_scores, archetype_profile):
    """
    Calculate distance between user RIASEC scores and archetype profile.
    
    Uses weighted cosine similarity.
    """
    riasec_types = ['realistic', 'investigative', 'artistic', 'social', 'enterprising', 'conventional']
    
    # Get archetype weights
    archetype_weights = archetype_profile['weights']
    
    # Calculate weighted distance
    total_distance = 0.0
    total_weight = 0.0
    
    for riasec_type in riasec_types:
        user_value = user_scores.get(riasec_type, 0.0)  # 0-1 normalized
        archetype_weight = archetype_weights.get(riasec_type, 0.0)  # 0-1 weight
        
        # Distance = |user_value - archetype_weight|
        distance = abs(user_value - archetype_weight) * archetype_weight  # Weight by archetype preference
        total_distance += distance
        total_weight += archetype_weight
    
    # Normalize by total weight
    return total_distance / total_weight if total_weight > 0 else 1.0


def calculate_via_distance(user_strengths, archetype_strengths):
    """
    Calculate distance based on overlap of top VIA strengths.
    
    Uses Jaccard similarity (intersection over union).
    """
    user_set = set(user_strengths[:5])  # Top 5 strengths
    archetype_set = set(archetype_strengths)
    
    intersection = len(user_set & archetype_set)
    union = len(user_set | archetype_set)
    
    # Distance = 1 - similarity
    similarity = intersection / union if union > 0 else 0.0
    return 1.0 - similarity


def calculate_luscher_modifier(user_luscher, archetype_visual):
    """
    Calculate mood/visual modifier (presentation only, minimal impact).
    
    Returns small modifier based on color alignment.
    """
    # Minimal impact - primarily for UI theme adjustment
    # Returns small value (0.0-0.1) based on color alignment
    if not user_luscher or not archetype_visual:
        return 0.05  # Neutral modifier
    
    # Simple color matching (can be enhanced)
    primary_color = user_luscher.get('primary', '')
    archetype_color = archetype_visual.get('color', '').lower()
    
    if primary_color in archetype_color:
        return 0.0  # Good alignment
    else:
        return 0.1  # Slight mismatch
```

### Example Calculation

**User Scores:**
- IPIP: Openness=75, Conscientiousness=90, Extraversion=30, Agreeableness=60, Neuroticism=20
- RIASEC: Realistic=0.5, Conventional=0.3, Investigative=0.2
- VIA: Top strengths = ["Perseverance", "Self-regulation", "Prudence", "Honesty"]

**Archetype: Builder**
- Big Five Profile: Conscientiousness high (90-100), Openness medium-low (30-50), etc.
- RIASEC: Primary=Realistic (0.5), Secondary=Conventional (0.3)
- VIA: ["Perseverance", "Self-regulation", "Prudence", "Honesty"]

**Calculation:**
1. Big Five distance: User's Conscientiousness (90) matches Builder's range (90-100) → low distance
2. RIASEC distance: User's Realistic (0.5) matches Builder's primary (0.5) → low distance
3. VIA distance: 3/4 strengths match → high similarity, low distance
4. Total weighted distance: 0.12 * 0.60 + 0.08 * 0.25 + 0.15 * 0.10 + 0.05 * 0.05 = 0.10
5. Confidence: 1.0 - (0.10 / 1.0) = 0.90 (90% confidence)

**Result:** Builder archetype with 90% confidence

### Implementation Notes

- **Minimum Data Requirements:** At least IPIP/HEXACO assessment must be completed
- **Confidence Thresholds:**
  - ≥0.85: High confidence (confirmed assignment)
  - 0.50-0.84: Medium confidence (tentative, recommend more assessments)
  - <0.50: Low confidence (insufficient data)
- **Reassignment Triggers:**
  - New assessment completion (IPIP, VIA, RIASEC)
  - Significant score changes (>20% shift in key dimensions)
  - 6-month recalibration assessment
- **Edge Cases:**
  - Multiple archetypes with similar distance: Choose highest confidence, or allow user to view top 2-3 matches
  - Insufficient data: Return tentative assignment with recommendation to complete more assessments

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

