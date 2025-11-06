# Gamification Logic

> **Status:** TODO - Needs completion  
> **Purpose:** Define XP system, evolution stages, badges, and reward mechanics

## Overview

This document defines the gamification system that rewards users for engaging with personality assessments and tracking their growth over time.

## XP System

### XP Sources

| Action | XP Reward | Frequency Limit |
|--------|-----------|-----------------|
| Complete IPIP/HEXACO assessment | 500 XP | 1 per day |
| Complete VIA Strengths assessment | 300 XP | 1 per week |
| Daily Lüscher mood check | 10 XP | 1 per hour |
| Complete "Mirror Quest" micro-test | 50 XP | 3 per week (Adept+), 1 per week (Apprentice) |
| Maintain 7-day mood check streak | 100 XP bonus | Weekly |
| Retake assessment (growth event) | 200 XP | Every 6 months |

**Status:** TODO - Need to:
- [ ] Validate XP amounts are balanced
- [ ] Define streak calculation logic
- [ ] Document growth event triggers

### XP Thresholds

| Stage | XP Range | Unlocks |
|-------|----------|---------|
| **Apprentice** | 0-999 XP | Basic archetype profile, daily mood checks, 1 Mirror Quest/week |
| **Adept** | 1000-2999 XP | Detailed trait breakdown, VIA Strengths assessment, 3 Mirror Quests/week, evolution visualization |
| **Master** | 3000+ XP | Full psychometric dashboard, unlimited Mirror Quests, early access to team synergy features |

**Status:** TODO - Need to:
- [ ] Validate threshold ranges
- [ ] Define exact unlock mechanics
- [ ] Document stage transition animations

## Badge System

### Initial Badge Set

1. **Self-Discovery**
   - **Description:** Complete first full personality assessment
   - **Icon:** compass
   - **Rarity:** common
   - **XP Reward:** 100

2. **Mood Tracker**
   - **Description:** 7-day mood check streak
   - **Icon:** calendar
   - **Rarity:** common
   - **XP Reward:** 100

3. **Growth Seeker**
   - **Description:** Retake assessment after 6 months
   - **Icon:** chart-line
   - **Rarity:** uncommon
   - **XP Reward:** 200

4. **Mirror Master**
   - **Description:** Complete 10 Mirror Quests
   - **Icon:** mirror
   - **Rarity:** uncommon
   - **XP Reward:** 200

5. **Archetype Explorer**
   - **Description:** View all 8 archetype profiles
   - **Icon:** map
   - **Rarity:** rare
   - **XP Reward:** 300

**Status:** TODO - Need to:
- [ ] Design badge icons
- [ ] Define badge metadata structure
- [ ] Create badge display UI mockups
- [ ] Document achievement notification system

### Badge Metadata Structure

```typescript
interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  xp_reward: number;
  unlock_criteria: BadgeCriteria;
}
```

## Evolution Stages

### Apprentice (0-999 XP)

**Features:**
- Basic archetype profile unlocked
- Access to daily mood checks
- 1 Mirror Quest per week

**Visual Identity:**
- [ ] Define Apprentice stage UI elements
- [ ] Create stage indicator component

### Adept (1000-2999 XP)

**Features:**
- Detailed trait breakdown
- Access to VIA Strengths assessment
- 3 Mirror Quests per week
- Archetype evolution visualization

**Visual Identity:**
- [ ] Define Adept stage UI elements
- [ ] Design evolution visualization
- [ ] Create stage transition animation

### Master (3000+ XP)

**Features:**
- Full psychometric dashboard
- Unlimited Mirror Quests
- Early access to team synergy features (Phase 2)
- Custom archetype insights

**Visual Identity:**
- [ ] Define Master stage UI elements
- [ ] Design psychometric dashboard
- [ ] Plan Phase 2 integration points

## Mirror Quests

**Definition:** Short (3-5 question) micro-assessments that reveal specific personality insights.

### Initial Mirror Quest Concepts

1. **Decision-Making Style** (Analytical vs. Intuitive)
2. **Stress Response** (Fight, Flight, Freeze)
3. **Learning Preference** (Visual, Auditory, Kinesthetic)
4. **Communication Style** (Direct vs. Indirect)
5. **Conflict Resolution** (Collaborative vs. Competitive)
6. **Work Environment** (Structured vs. Flexible)
7. **Feedback Preference** (Immediate vs. Delayed)
8. **Team Role** (Leader vs. Supporter)
9. **Innovation Style** (Incremental vs. Disruptive)
10. **Time Management** (Planner vs. Improviser)

**Status:** TODO - Need to:
- [ ] Design 10 Mirror Quest question sets
- [ ] Create insight card format
- [ ] Design quest selection UI
- [ ] Document quest pool system

### Mirror Quest Structure

```typescript
interface MirrorQuest {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  insight_type: string;
  xp_reward: number;
  unlock_requirement?: string;
}
```

**Rewards:** 50 XP + specific insight card

**Frequency:** Weekly unlock, stored in quest pool

## Achievement Notification System

**Status:** TODO - Need to:
- [ ] Design notification UI
- [ ] Define notification triggers
- [ ] Create animation system for XP gains
- [ ] Document notification timing and frequency

## Analytics & Tracking

**Status:** TODO - Need to:
- [ ] Define gamification metrics to track
- [ ] Document analytics events
- [ ] Plan A/B testing for XP amounts
- [ ] Create engagement tracking

## Open Questions

- [ ] Should XP decay over time if inactive?
- [ ] Should there be seasonal badges or limited-time events?
- [ ] How should badge progression be displayed (collection view)?
- [ ] Should Master stage have additional sub-stages?

