# Assessment Framework

> **Status:** TODO - Needs completion  
> **Purpose:** Define how multiple assessment types integrate to form the complete personality profile

## Overview

This document defines the multi-layer assessment framework that combines O*NET, IPIP/HEXACO, Lüscher Color Test, and VIA/RIASEC assessments into a comprehensive personality profile.

## Assessment Layers

### Layer 1: O*NET Integration (Passive)

**Measures:** Occupational interests, work context, skills  
**Role:** Anchors personality to real-world career domains  
**Frequency:** Passive (based on user job data/skill tags)  
**Data Source:** Existing O*NET database integration  
**Trigger:** User updates career goals or adds new skills

**Status:** ✅ Already integrated - needs documentation

### Layer 2: IPIP/HEXACO (Foundational)

**Measures:** Core personality traits (Big Five or HEXACO)  
**Role:** Foundational assessment for archetype alignment  
**Frequency:** Onboarding + optional retesting every 6-12 months  
**Question Count:** 50-60 items (can be split into 2-3 "missions")  
**Scoring:** 1-5 Likert scale per dimension

**Status:** TODO - Need to:
- Select IPIP vs HEXACO (or document both options)
- Identify 50-60 question set
- Define scoring algorithms
- Document trait matrix

### Layer 3: Lüscher Color Test (Dynamic Modifier)

**Measures:** Emotional state, current mood  
**Role:** Real-time mood tracking and UI theme adjustment  
**Frequency:** Daily/weekly micro-assessment ("color pick" interaction)  
**Implementation:** Gamified, lightweight (< 1 minute)  
**Impact:** Modifies content recommendations, not core archetype

**Status:** TODO - Need to:
- Define Lüscher color palette (8 colors)
- Design color selection UI
- Document mood state mapping
- Define UI theme adjustments

### Layer 4: VIA Strengths/RIASEC (Enhancement Layer)

**Measures:** Personal strengths, values, vocational interests  
**Role:** Adds depth to motivation and purpose  
**Frequency:** Optional mid-term assessments (every few months)  
**Integration:** Tied to "growth quests" or advanced archetype stages

**Status:** TODO - Need to:
- Document VIA Strengths integration
- Define RIASEC enhancement (beyond current basic assessment)
- Create growth quest structure

## Composite Scoring Model

**Approach:** Rule-based scoring (deterministic, transparent)

**Weighting:**
- IPIP/HEXACO: 60% (stable traits dominate)
- RIASEC: 25% (vocational alignment)
- VIA Strengths: 10% (motivational depth)
- Lüscher: 5% (mood modifier, presentation only)

**Normalization:** Z-score normalization across all dimensions  
**Archetype Assignment:** Closest match algorithm with confidence score  
**Trait Matrix:** Document mapping of raw scores → archetype profiles

### Status: TODO

- [ ] Define Z-score normalization formula
- [ ] Create trait matrix (raw scores → archetype profiles)
- [ ] Document closest match algorithm
- [ ] Define confidence score calculation
- [ ] Test scoring model with sample data

## Integration Flow

```
User Onboarding
    ↓
Micro-Assessment (3-5 questions)
    ↓
Archetype Assignment (tentative)
    ↓
Full Assessment (50-60 questions, split into missions)
    ↓
Archetype Confirmation + Confidence Score
    ↓
Daily Mood Checks (Lüscher)
    ↓
Optional: VIA Strengths (growth quests)
    ↓
Periodic Retesting (6-12 months)
```

## Questions to Resolve

- [ ] IPIP vs HEXACO: Which to use, or support both?
- [ ] Question set selection: Which 50-60 questions from IPIP?
- [ ] Scoring algorithm: Exact formula for composite scoring
- [ ] Trait matrix: Complete mapping of all dimension combinations
- [ ] Lüscher implementation: Exact color palette and mood mappings

