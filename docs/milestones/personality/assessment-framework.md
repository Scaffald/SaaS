# Assessment Framework

> **Status:** ✅ Enriched with Implementation Spec v1  
> **Purpose:** Define how multiple assessment types integrate to form the complete personality profile

## Goals & Principles

- **Behavior-shaping, not fluff:** Encourage consistent, bite-sized assessments and periodic reflection.
- **Cross-domain relevance:** Archetypes work for skilled trades and knowledge work alike.
- **Scientific backbone, engaging shell:** IPIP/HEXACO/VIA map to proprietary Scaffald Archetypes; Lüscher drives reflective habit.
- **Modular & future-proof:** Algorithm accepts new motivators without migrations.
- **Transparent & ethical:** Clear what is measured, how it's used, and user control over visibility.

## Overview

This document defines the multi-layer assessment framework that combines O*NET, IPIP/HEXACO, Lüscher Color Test, and VIA/RIASEC assessments into a comprehensive personality profile. The framework is designed to be modular, allowing users to complete assessments in bite-sized modules that build toward a complete profile.

## Core Concepts

### Archetypes (10)

Each of the 10 Scaffald Archetypes (Builder, Designer, Maker, Connector, Analyst, Visionary, Guardian, Navigator, Storyteller, Synthesizer) is a profile synthesized from open traits (IPIP/HEXACO/VIA) and updated over time.

### Assessment Types

The system uses four assessment layers:

1. **IPIP / HEXACO** — deep trait calibration (split into ~10 modules of ~10 items each)
2. **Lüscher Color** — lightweight weekly mood reflection
3. **VIA / RIASEC** (optional) — strengths/interests enrichment (3 missions)
4. **O*NET alignment** — passive skill/career data grounding

## Assessment Layers

### Layer 1: O*NET Integration (Passive)

**Measures:** Occupational interests, work context, skills  
**Role:** Anchors personality to real-world career domains  
**Frequency:** Passive (based on user job data/skill tags)  
**Data Source:** Existing O*NET database integration  
**Trigger:** User updates career goals or adds new skills

**Status:** ✅ Already integrated - acts as passive grounding layer

**XP Contribution:**
- Add verified skill or experience item: +2 XP
- Career profile completion: +10 XP (see completeness scoring)
- O*NET alignment events (capped at 20): +1 point each in Depth calculation

### Layer 2: IPIP/HEXACO (Foundational)

**Measures:** Core personality traits (Big Five or HEXACO)  
**Role:** Foundational assessment for archetype alignment  
**Frequency:** Onboarding + optional retesting every 6-12 months  
**Structure:** Split into ~10 modules of ~10 items each  
**Scoring:** 1-5 Likert scale per dimension

**Modular Approach:**
- Users complete modules incrementally (recommended ≤2 modules/week)
- Each module (~10 questions) provides immediate feedback
- Full set completion unlocks complete trait profile
- 6-month re-calibration bonus encourages periodic reflection

**XP Economy:**
- Complete module (≈10 Q): +10 XP
- Complete full set (all modules): +50 XP
- 6-month re-calibration (full set): +25 XP bonus
- Cooldown: recommend ≤2 modules/week (award only the first 2 for Frequency XP)

**Status:** ✅ Structure defined - Implementation ready

### Layer 3: Lüscher Color Test (Dynamic Modifier)

**Measures:** Emotional state, current mood  
**Role:** Real-time mood tracking and reflective habit formation  
**Frequency:** Weekly micro-assessment ("color pick" interaction)  
**Implementation:** Gamified, lightweight (< 1 minute)  
**Impact:** Modifies content recommendations, not core archetype

**Color Palette:** 8 colors (as implemented in existing codebase)
- Blue: Depth of feeling, tranquility
- Green: Elasticity of will, persistence
- Red: Force of will, action, desire
- Yellow: Spontaneity, aspiration, exhilaration
- Plus 4 additional colors from Lüscher palette

**XP Economy:**
- Weekly mood session: +5 XP
- 4-week streak bonus: +10 XP
- 8-week streak bonus: +10 XP (additional)
- Missed week: streak pauses (no penalty, no bonus)

**Status:** ✅ Structure defined - Implementation ready

### Layer 4: VIA Strengths/RIASEC (Enhancement Layer)

**Measures:** Personal strengths, values, vocational interests  
**Role:** Adds depth to motivation and purpose  
**Frequency:** Optional mid-term assessments (3-6 months)  
**Structure:** 3 missions (optional completion)

**XP Economy:**
- Per mission (1 of 3): +15 XP
- All 3 missions (cycle complete): +25 XP
- Cooldown: 3-6 months between cycles

**Status:** ✅ Structure defined - Implementation ready

## Composite Scoring Model

**Approach:** Rule-based scoring (deterministic, transparent)

**Historical Weighting (for Archetype Assignment):**
- IPIP/HEXACO: 60% (stable traits dominate)
- RIASEC: 25% (vocational alignment)
- VIA Strengths: 10% (motivational depth)
- Lüscher: 5% (mood modifier, presentation only)

**Note:** This weighting is for archetype assignment. The **Scaffald Score** (engagement metric) uses different weighting (see gamification.md).

**Normalization:** Z-score normalization across all dimensions  
**Archetype Assignment:** Closest match algorithm with confidence score  
**Trait Matrix:** Mapping of raw scores → archetype profiles (see archetypes.md for psychometric mappings)

## Integration Flow

```
User Onboarding
    ↓
Micro-Assessment (3-5 questions) - Optional quick start
    ↓
Modular IPIP/HEXACO (Module 1 of ~10)
    ↓
Archetype Assignment (tentative, based on partial data)
    ↓
Continue Modules (recommended ≤2/week)
    ↓
Weekly Lüscher Mood Checks (habit formation)
    ↓
Optional: VIA/RIASEC Missions (3 missions)
    ↓
Full Assessment Complete
    ↓
Archetype Confirmation + Confidence Score
    ↓
Periodic Re-calibration (6-12 months)
```

## Engagement Model

The system uses four engagement dimensions to drive behavior:

1. **Depth XP:** Completing modules/missions increases trait reliability
2. **Frequency XP:** Regular micro-assessments (e.g., Lüscher weekly)
3. **Consistency XP:** Streaks + longitudinal stability/improvement
4. **Profile Completeness:** Incentivizes filling out core profile sections

These contribute to the **Scaffald Score** (see gamification.md for detailed formulas).

## Data Requirements

### Assessment Session Tracking

Each assessment session should track:
- `assessment_type`: 'ipip', 'hexaco', 'luscher', 'via', 'riasec'
- `module_id`: For modular assessments (IPIP/HEXACO)
- `mission_id`: For multi-mission assessments (VIA/RIASEC)
- `responses`: JSONB array of question responses
- `scores`: JSONB object with calculated scores
- `completed_at`: Timestamp of completion
- `cooldown_until`: Optional timestamp for cooldown enforcement

### Trait Stability Tracking

For consistency scoring, track:
- Multiple assessments over time
- Standard deviation of trait scores across retests
- Recency of major assessments (last 90 days, 6 months)

## Questions Resolved

- ✅ **IPIP vs HEXACO:** Support both, with IPIP as primary (modular structure)
- ✅ **Question set:** ~10 modules of ~10 items each (~100 questions total, split into digestible chunks)
- ✅ **Scoring algorithm:** Modular completion tracking with depth/frequency/consistency components
- ✅ **Lüscher implementation:** 8-color palette, weekly cadence, streak bonuses
- ✅ **Trait matrix:** See archetypes.md for psychometric mappings

## Implementation Notes

### Module Structure

IPIP/HEXACO modules should:
- Cover all Big Five dimensions across modules
- Allow completion in any order (with recommendations)
- Provide immediate feedback after each module
- Track progress toward full assessment completion
- Support partial completion and resume

### Frequency Tracking

- 8-week rolling window for frequency calculations
- Track both Lüscher and IPIP module completion per week
- Cap IPIP module frequency at 2/week for Frequency XP (to prevent gaming)

### Cooldown Mechanisms

- IPIP/HEXACO: ≤2 modules/week for Frequency XP (soft recommendation)
- VIA/RIASEC: 3-6 months between full cycles
- Lüscher: 1 per week (natural cadence)

## Future Enhancements

- Adaptive questioning (adjust difficulty/complexity based on user level)
- AI-driven personalization (suggest modules based on incomplete profile)
- Team synergy assessments (Phase 2)
- Advanced content recommendation integration
