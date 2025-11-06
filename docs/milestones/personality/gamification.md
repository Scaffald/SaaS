# Gamification Logic

> **Status:** ✅ Enriched with Scaffald Score & Leveling System v1  
> **Purpose:** Define XP system, Scaffald Score, leveling, badges, and reward mechanics

## Overview

This document defines the gamification system that rewards users for engaging with personality assessments and tracking their growth over time. The system uses a unified **Scaffald Score** (0-1000) that drives user behavior through transparent, ethical engagement mechanics.

## Scaffald Score & Leveling

### Definitions

- **Scaffald Score (0-1000):** Unified engagement + insight score calculated from multiple normalized components
- **Level (1+):** Milestones derived from Scaffald Score thresholds
- **Levels are non-hierarchical:** All archetypes and levels are equally valuable

### Base Weights (Tunable via Config)

The Scaffald Score is calculated from five normalized components with configurable weights:

```python
Depth_weight        = 0.45  # Coverage and recency of core assessments
Frequency_weight    = 0.25  # Rolling 8-week cadence for micro-assessments
Consistency_weight  = 0.15  # Streak adherence + trait-stability signal
Completeness_weight = 0.10  # Profile fields, verification, career linkages
Other_weight        = 0.05  # Reserved for future motivators

# Must sum to 1.0
```

### Scaffald Score Formula

```python
ScaffaldScoreRaw = (
    Depth_norm        * Depth_weight
  + Frequency_norm    * Frequency_weight
  + Consistency_norm * Consistency_weight
  + Completeness_norm * Completeness_weight
  + Other_norm        * Other_weight
)

ScaffaldScore = round(ScaffaldScoreRaw * 10)  # maps 0-100 → 0-1000
```

### Component Normalization

All components are normalized to 0-100 before weighting:

#### Depth_norm (0-100)

Measures coverage/recency of trait-informative assessments.

```python
DepthPoints = (
    min(IPIP_modules_completed, 10)            * 6   # max 60
  + min(VIA_missions_completed, 3)             * 8   # max 24
  + HEXACO_completed_full                        * 25  # 0/1, max 25
  + ONet_alignment_events_capped_20              * 1   # max 20
)

# Recency boost if major assessment completed in last 90 days:
if (last_major_assessment_days <= 90):
    DepthPoints += 10

Depth_norm = min(100, DepthPoints)
```

#### Frequency_norm (0-100)

8-week rolling window of regularity.

```python
weeks = last_8_weeks

luscher_weeks_completed = count(weeks with ≥1 Lüscher)
ipip_weeks_active       = count(weeks with ≥1 IPIP module)

FrequencyPoints = (
    luscher_weeks_completed       * 8     # max 8 → 64
  + min(ipip_weeks_active, 6)     * 6     # max 6 → 36
)

Frequency_norm = min(100, FrequencyPoints)
```

#### Consistency_norm (0-100)

Streaks + trait stability.

```python
# Streaks (max 40 points)
luscher_streak_4w   → +10
luscher_streak_8w   → +10
ipip_streak_4w      → +10
ipip_streak_8w      → +10

# Trait stability (lower variance across re-tests is "stable")
# Example: inverse of normalized standard deviation across domains
TraitStability = 20 - clamp(norm_sd_traits, 0, 20)

ConsistencyPoints = (
    streak_points_sum (max 40)
  + TraitStability (max 20)
  + Recalibration_bonus_recent_6m (max 20)
  + Platform_retention_bonus_if_6_of_8_weeks_active (max 20)
)

Consistency_norm = min(100, ConsistencyPoints)
```

#### Completeness_norm (0-100)

Profile completeness with weighted fields.

```python
CompletenessPoints = (
    Email_verified                         * 10
  + Avatar_set                             * 5
  + Bio_160_chars                          * 5
  + Location_set                           * 5
  + Skills_listed_>=5                      * 10
  + Work_history_>=2_entries               * 10
  + Career_goal_set                        * 10
  + ONet_alignment_connected               * 10
  + Archetype_card_seen                    * 5
  + Content_preferences_set                 * 10
  + Privacy_controls_reviewed              * 10
)

Completeness_norm = min(100, CompletenessPoints)
```

#### Other_norm (0-100)

Future motivators - defaults to 0 unless features enabled (e.g., community mentoring, project completions).

### Level Thresholds

```python
Level 1   :   0-  99 Scaffald Score
Level 2   : 100- 159 Scaffald Score
Level 3   : 160- 219 Scaffald Score
Level 4   : 220- 279 Scaffald Score
Level 5   : 280- 339 Scaffald Score
Level 6   : 340- 409 Scaffald Score
Level 7   : 410- 489 Scaffald Score
Level 8   : 490- 579 Scaffald Score
Level 9   : 580- 679 Scaffald Score
Level 10  : 680- 789 Scaffald Score
Level 11  : 790- 899 Scaffald Score
Level 12+ : 900+ Scaffald Score
```

**Note:** Levels are non-hierarchical. All levels are equally valuable - they represent engagement depth, not superiority.

## Milestones & Unlocks

Each level range corresponds to a distinct psychological and behavioral milestone in the Scaffald ecosystem. These unlocks reward engagement, deepen reflection, and personalize the user's experience.

### Level 1-3: Foundation Phase

**Unlocks:**
- Initial archetype reveal (Builder, Maker, Designer, etc.)
- Basic personality insights and introductory feedback
- Starter reflection prompts and first dashboard widget activation
- Encourages completion of early profile elements (bio, avatar, skills)

**Experience:**
- Users discover their archetype through micro-assessment or first IPIP module
- Basic dashboard shows archetype badge and progress toward Level 4
- Focus on profile completion and initial engagement

### Level 4-6: Customization Phase

**Unlocks:**
- Archetype customization (color themes, icons, visual motif)
- Secondary traits overlay — showing top two complementary archetypes
- Personal growth tips and micro-learning nudges tied to trait data
- Access to early content recommendations in feed or learning modules

**Experience:**
- Users can personalize their archetype representation
- See how their primary archetype relates to others
- Receive personalized tips based on their trait profile
- Begin seeing content recommendations aligned with archetype

### Level 7-9: Depth & Integration Phase

**Unlocks:**
- Strengths and Mood overlays (VIA + Lüscher integration)
- Historical trend graphs for personality and emotional data
- Consistency bonuses for streaks and retests
- Reflective journal prompts linked to current archetype evolution
- Begins team or peer comparison features (for org or group users)

**Experience:**
- Deeper insights into strengths and emotional patterns
- Visualize personality evolution over time
- Enhanced streak rewards and recalibration bonuses
- Personalized reflection prompts
- Early access to team/group features

### Level 10-12: Mastery Phase

**Unlocks:**
- Personalized career and learning recommendations derived from O*NET + archetype mapping
- "Growth Map" view — visualizes user journey and next possible evolutions
- Team synergy maps — compare and balance archetypes within teams
- Premium visual themes or cosmetic upgrades for archetype avatars
- Access to seasonal quests or specialized development tracks

**Experience:**
- Advanced career and learning path recommendations
- Visual journey mapping with future evolution possibilities
- Team collaboration insights
- Enhanced visual customization
- Exclusive quest content

### Level 13+: Integration & Legacy Phase

**Unlocks:**
- Integrated Profile Badge — a shareable, verified representation of the user's Scaffald identity
- Access to advanced analytics (behavioral trends, personality trajectory, etc.)
- Mentorship or leadership pathways — users can guide others or contribute to community data models
- "Legacy Tier" recognition for long-term consistency and engagement
- Eligible for new motivators (e.g., mentoring, team leadership, portfolio integration)

**Experience:**
- Verified profile badge for sharing
- Advanced analytics dashboard
- Leadership and mentorship opportunities
- Long-term engagement recognition
- Access to future motivator features

### Archetype Tiers by Level

Archetype visual representation evolves with level ranges:

- **Apprentice (Level 1-3):** Basic archetype badge, standard colors
- **Adept (Level 4-6):** Customizable colors/icons, secondary traits visible
- **Master (Level 7-10):** Enhanced visuals, historical trends, integration features
- **Legend (Level 11-12+):** Premium themes, legacy recognition, leadership features

**Note:** Avatar upgrades at each tier; optional cosmetic unlocks (non-paywalled).

## XP Economy

XP is awarded for actions that contribute to Depth, Frequency, Consistency, and Completeness components. XP values are tunable via configuration.

### IPIP/HEXACO Assessment

| Action | XP Reward | Frequency Limit |
|--------|-----------|----------------|
| Complete module (≈10 Q) | +10 XP | ≤2 modules/week for Frequency XP |
| Complete full set (all modules) | +50 XP | Per full assessment |
| 6-month re-calibration (full set) | +25 XP bonus | Every 6 months |

**Cooldown:** Recommend ≤2 modules/week (award only the first 2 for Frequency XP)

### Lüscher Weekly Mood Check

| Action | XP Reward | Frequency Limit |
|--------|-----------|----------------|
| Weekly mood session | +5 XP | 1 per week |
| 4-week streak bonus | +10 XP | Per 4-week milestone |
| 8-week streak bonus | +10 XP | Per 8-week milestone |

**Streak Behavior:** Missed week pauses streak (no penalty, no bonus)

### VIA/RIASEC (Optional)

| Action | XP Reward | Frequency Limit |
|--------|-----------|----------------|
| Per mission (1 of 3) | +15 XP | Per mission completion |
| All 3 missions (cycle complete) | +25 XP | Per full cycle |

**Cooldown:** 3-6 months between cycles

### O*NET / Profile / Work Data

| Action | XP Reward | Frequency Limit |
|--------|-----------|----------------|
| Add verified skill or experience item | +2 XP | Per verified item |
| Career profile completion | +10 XP | One-time (see completeness scoring) |

### Engagement (Platform)

| Action | XP Reward | Frequency Limit |
|--------|-----------|----------------|
| Session with meaningful interaction (>2 mins, ≥1 action) | +1 XP/day | Capped at +5/week |

**Note:** Platform engagement XP contributes to Consistency component (retention bonus)

### Seasonal / Event Quests

| Action | XP Reward | Frequency Limit |
|--------|-----------|----------------|
| Completion of all required tasks | +25-50 XP | Per event completion |

**Note:** Event quests may contribute to multiple components depending on quest structure

## XP to Component Mapping

XP earned from actions contributes to the normalized components:

- **Depth XP:** IPIP modules, VIA missions, HEXACO completion, O*NET events
- **Frequency XP:** Lüscher weekly checks, IPIP module cadence (capped at 2/week)
- **Consistency XP:** Streaks, trait stability, recalibration, platform retention
- **Completeness XP:** Profile fields, verification, career linkages

XP is not directly added to Scaffald Score - it's used to calculate the normalized components which are then weighted.

## Evolution Stages (Legacy - Replaced by Levels)

**Note:** The original "Apprentice/Adept/Master" stages are replaced by the Level system (1-12+). Levels are based on Scaffald Score, not XP accumulation.

### Level-Based Unlocks

**Level 1-3 (0-219 Score):**
- Basic archetype profile unlocked
- Access to Lüscher weekly mood checks
- 1 IPIP module/week recommended

**Level 4-6 (220-409 Score):**
- Detailed trait breakdown
- Access to VIA Strengths missions
- 2 IPIP modules/week recommended
- Archetype evolution visualization

**Level 7-9 (410-679 Score):**
- Full psychometric dashboard
- Advanced archetype insights
- Priority support for assessments

**Level 10+ (680+ Score):**
- Early access to team synergy features (Phase 2)
- Custom archetype insights
- Community mentor opportunities (future)

## Badge System

### Badge Metadata Structure

```typescript
interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  xp_reward?: number;  // Optional - badges may not always award XP
  unlock_criteria: BadgeCriteria;
  component_contribution?: 'depth' | 'frequency' | 'consistency' | 'completeness';
}
```

### Initial Badge Set

1. **Self-Discovery**
   - **Description:** Complete first full personality assessment
   - **Icon:** compass
   - **Rarity:** common
   - **XP Reward:** 100 (depth)
   - **Unlock:** Complete all IPIP modules or HEXACO full assessment

2. **Mood Tracker**
   - **Description:** 4-week Lüscher mood check streak
   - **Icon:** calendar
   - **Rarity:** common
   - **XP Reward:** 100 (frequency)
   - **Unlock:** Complete 4 consecutive weekly mood checks

3. **Growth Seeker**
   - **Description:** Retake assessment after 6 months
   - **Icon:** chart-line
   - **Rarity:** uncommon
   - **XP Reward:** 200 (consistency)
   - **Unlock:** Complete re-calibration after 6+ months

4. **Module Master**
   - **Description:** Complete all IPIP modules
   - **Icon:** check-circle
   - **Rarity:** uncommon
   - **XP Reward:** 200 (depth)
   - **Unlock:** Complete all ~10 IPIP modules

5. **Archetype Explorer**
   - **Description:** View all 10 archetype profiles
   - **Icon:** map
   - **Rarity:** rare
   - **XP Reward:** 300 (completeness)
   - **Unlock:** View all archetype detail pages

6. **Steady Navigator**
   - **Description:** 8-week consistency streak
   - **Icon:** anchor
   - **Rarity:** rare
   - **XP Reward:** 300 (consistency)
   - **Unlock:** Maintain 8-week streak in assessments

7. **Profile Complete**
   - **Description:** Achieve 100% profile completeness
   - **Icon:** star
   - **Rarity:** epic
   - **XP Reward:** 500 (completeness)
   - **Unlock:** Complete all profile fields (100 completeness points)

## Analytics & Tracking

### Metrics to Track

- Scaffald Score distribution across user base
- Component breakdown averages (Depth, Frequency, Consistency, Completeness)
- Level progression rates
- XP award patterns
- Badge unlock rates
- Assessment completion rates by type
- Streak maintenance patterns

### A/B Testing Opportunities

- XP amounts (tunable weights)
- Level threshold ranges
- Badge unlock criteria
- Frequency caps and cooldowns
- Component weight adjustments

## Implementation Notes

### Score Calculation Frequency

- **Real-time:** Scaffald Score recalculated after each assessment completion
- **Daily:** Consistency and Frequency components recalculated daily
- **Weekly:** Frequency rolling window updated weekly

### Caching Strategy

- Cache Scaffald Score with TTL of 1 hour
- Invalidate cache on:
  - Assessment completion
  - Profile update
  - Streak milestone reached
  - Level threshold crossed

### Performance Considerations

- Pre-calculate normalized components
- Use materialized views for frequency/consistency calculations
- Index on `assessment_sessions.completed_at` for rolling window queries
- Batch process streak calculations (daily cron job)

## Ethical Considerations

### Transparency

- Users can view their Scaffald Score breakdown
- Component weights are visible in settings
- Clear explanation of how score is calculated
- XP sources are documented and visible

### User Control

- Users can opt-out of gamification features
- Privacy controls for score visibility
- Ability to reset or recalibrate assessments
- Clear data usage policies

### Behavior Shaping

- Encourage positive engagement without manipulation
- Reward consistency, not just completion
- Prevent gaming through cooldowns and caps
- Focus on meaningful interactions over quantity

## Dashboard Widget: Personality Progress

### Purpose

Drive the core loop: complete micro-assessment → gain XP → visualize growth.

### Placement

Dashboard top card (visible above the fold), responsive.

### Anatomy

- **Header:** "Your Scaffald Growth"
- **Score Ring:** Circular progress showing current Scaffald Score and Level
- **Archetype Badge:** Current archetype avatar + evolution state
- **Action CTA (primary):** Contextual call-to-action (e.g., "Take this week's 2-min Color Check" or "Finish 10 IPIP items")
- **Secondary Actions:** "View Insights," "History," "Customize Archetype"
- **Progress Bars:** Mini bars for Depth, Frequency, Consistency, Completeness
- **Streak Chip:** e.g., "3-week streak — +10 XP next week!"
- **Next Unlock:** e.g., "10 XP to Level 7: Unlock Strength Overlays"

### UX Behavior

- **Adaptive CTA Logic:** Choose the highest value action the user is eligible for (cooldown aware)
- **Micro-feedback:** Confetti pulse + +XP toast on completion
- **Cooldown Indicator:** Shows when the next Lüscher is available (e.g., "Available in 3 days")
- **Accessibility:** Keyboard operable, high-contrast, minimal motion fallback

### Component Contract (TypeScript)

```typescript
type Motivator = {
  key: string;
  label: string;
  weight: number;       // contributes to Other_norm when enabled
  value: number;        // 0–100 normalized
};

type ScoreBreakdown = {
  score: number;        // 0–1000
  level: number;
  nextLevelAt: number;  // score threshold
  depth: number;        // 0–100
  frequency: number;    // 0–100
  consistency: number;  // 0–100
  completeness: number; // 0–100
  other: number;        // 0–100
  motivators?: Motivator[];
};

type CTA = {
  title: string;
  subtitle?: string;
  actionId: 'IPIP_MODULE' | 'LUSCHER_WEEKLY' | 'VIA_MISSION' | 'PROFILE_COMPLETE' | 'SEASONAL_QUEST';
  cooldownEndsAt?: string; // ISO timestamp
};

type PersonalityWidgetProps = {
  breakdown: ScoreBreakdown;
  archetype: {
    key: string;
    label: string;
    tier: 'Apprentice' | 'Adept' | 'Master' | 'Legend';
    iconUrl: string;
  };
  streaks: {
    luscherWeeks: number;
    ipipWeeks: number;
  };
  cta: CTA;
  onAction(actionId: CTA['actionId']): void;
};
```

## Future-Proofing: Motivator Extension

### Concept

Add new motivators (e.g., Mentorship, Project Completion, Team Synergy), each normalized to 0–100 and added to Other_norm.

### Config Schema (YAML)

```yaml
motivators:
  mentorship:
    enabled: true
    weight: 0.03  # reallocate from Other_weight
    normalization:
      # normalize 0–10 mentorship sessions / quarter → 0–100
      max_units: 10
  portfolio_projects:
    enabled: true
    weight: 0.02
    normalization:
      max_units: 5
```

Backend merges motivator weights into Other_weight bucket. UI displays motivators in the breakdown if enabled.

### Implementation

- Motivators are stored in `motivators_state` table
- Each motivator has its own normalization function
- Weights are configurable and can be adjusted without migrations
- UI dynamically shows enabled motivators in score breakdown

## Configuration (YAML)

```yaml
weights:
  depth: 0.45
  frequency: 0.25
  consistency: 0.15
  completeness: 0.10
  other: 0.05

xp:
  ipip_module: 10
  ipip_full_bonus: 50
  ipip_recalibration_bonus: 25
  luscher_weekly: 5
  luscher_streak_4w: 10
  via_mission: 15
  via_cycle_bonus: 25
  onet_verified_skill: 2
  career_profile_complete: 10
  platform_session_day: 1
  platform_session_week_cap: 5
  seasonal_event_min: 25
  seasonal_event_max: 50

cooldowns:
  luscher_days: 7
  ipip_modules_frequency_cap_per_week: 2
  via_cycle_months_min: 3

level_thresholds: [0, 100, 160, 220, 280, 340, 410, 490, 580, 680, 790, 900]

motivators:
  mentorship:
    enabled: false
    weight: 0.00
  portfolio:
    enabled: false
    weight: 0.00
```

## Future Enhancements

- Team/group Scaffald Scores (Phase 2)
- Comparative analytics (anonymized, opt-in)
- Personalized recommendations based on score components
- Social features (leaderboards, opt-in only)
- Mentorship matching based on archetype + level
