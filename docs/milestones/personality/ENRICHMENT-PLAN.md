# Documentation Enrichment Plan for REQ-76

> **Created:** 2025-01-XX  
> **Status:** Planning  
> **Purpose:** Guide the enrichment of Personality Layer milestone documentation

## Overview

This document outlines the plan to enrich the REQ-76 documentation that has been pulled from BrainGrid. The current documentation provides the structure and requirements, but needs to be filled out with detailed content, examples, and implementation specifics.

## Current State

✅ **Completed:**
- Documentation structure created (5 files + README)
- Requirements extracted from REQ-76
- Template structures in place
- TODO markers for incomplete sections

❌ **Needs Enrichment:**
- Archetype definitions (8 archetypes with lore)
- Assessment framework details (question sets, scoring algorithms)
- Database schema specifics (JSONB structures, indexes)
- Gamification details (badge designs, quest content)
- Roadmap timeline estimates and resource allocation

## Enrichment Priorities

### Priority 1: Core Definitions (Week 1) ✅ COMPLETE

**Archetypes (`archetypes.md`)**
- [x] Define 10 archetype names (The Builder, The Designer, The Maker, The Connector, The Analyst, The Visionary, The Guardian, The Navigator, The Storyteller, The Synthesizer)
- [x] Write 200-300 word lore for each archetype
- [x] Document 3-5 core traits per archetype
- [x] Map archetypes to psychometric dimensions (Big Five, RIASEC, VIA)
- [x] Define visual identity elements (color palettes, symbols, environments)

**Why Priority 1:** Archetypes are the foundation of the entire system. All other documentation depends on clear archetype definitions.

**Status:** ✅ **COMPLETE** - All 10 archetypes defined with lore, traits, psychometric mappings, and visual identity. Ready to proceed to Priority 2.

### Priority 2: Assessment Framework (Week 1-2) ✅ ENRICHED

**Assessment Framework (`assessment-framework.md`)**
- [x] Select IPIP vs HEXACO (support both, IPIP primary, modular structure)
- [x] Identify structure: ~10 modules of ~10 items each (~100 questions total)
- [x] Document modular approach and scoring structure
- [x] Define Lüscher color palette and weekly cadence
- [x] Document engagement model (Depth, Frequency, Consistency, Completeness)
- [x] Define cooldown mechanisms and frequency caps

**Why Priority 2:** Assessment framework is needed for backend implementation. Scoring algorithms must be deterministic and well-documented.

**Status:** ✅ **ENRICHED** - Modular assessment structure defined. Implementation spec integrated. Ready for Priority 2 completion (trait matrix and archetype assignment algorithm).

### Priority 3: Data Schemas (Week 2) ✅ ENRICHED

**Data Schemas (`data-schemas.md`)**
- [x] Review existing `core.preferences` schema
- [x] Define Scaffald Score schema (score, level, components, weights)
- [x] Define JSONB structure for `scaffald_score_components` and `scaffald_score_weights`
- [x] Extend `assessment_sessions` with module_id, mission_id, xp_earned, cooldown_until
- [x] Add indexes for frequency calculations (8-week rolling window)
- [x] Update API contracts with Scaffald Score response fields
- [x] Define assessment tracking fields (ipip_modules_completed, via_missions_completed, etc.)
- [ ] Create actual migration scripts (not just outlines)
- [ ] Create seed data for 10 archetypes
- [ ] Complete JSONB structure definitions for all fields

**Why Priority 3:** Backend team needs exact schemas to begin implementation. Migration scripts must be production-ready.

**Status:** ✅ **ENRICHED** - Schema extensions for Scaffald Score system complete. API contracts updated. Ready for migration script creation.

### Priority 4: Gamification Details (Week 2-3) ✅ ENRICHED

**Gamification (`gamification.md`)**
- [x] Define Scaffald Score system (0-1000 score, 12+ levels)
- [x] Document component normalization formulas (Depth, Frequency, Consistency, Completeness, Other)
- [x] Define base weights (tunable via config)
- [x] Document XP economy with all actions and rewards
- [x] Define level thresholds (1-12+)
- [x] Document streak calculation logic
- [x] Define badge metadata structure (7 initial badges)
- [x] Document ethical considerations and transparency
- [ ] Design badge icons (or provide icon references)
- [ ] Create Mirror Quest question sets (if still needed)
- [ ] Design insight card format

**Why Priority 4:** Gamification adds engagement but needs careful design. Badge and quest content requires creative work.

**Status:** ✅ **ENRICHED** - Scaffald Score & Leveling System fully documented. XP economy defined. Badge structure complete. Ready for UI/UX design work.

### Priority 5: Roadmap Refinement (Week 3)

**Roadmap (`roadmap.md`)**
- [ ] Add timeline estimates for each milestone
- [ ] Document resource allocation (roles needed)
- [ ] Define beta testing scope and criteria
- [ ] Document integration points with existing features
- [ ] Add performance benchmarks
- [ ] Create risk mitigation strategies
- [ ] Define success metrics with specific targets

**Why Priority 5:** Roadmap needs actionable timelines and resource planning for project management.

**Estimated Effort:** 1-2 days for planning and refinement

## Enrichment Approach

### Research & Reference

**Archetype Research:**
- Review existing personality frameworks (Big Five, HEXACO, MBTI archetypes)
- Study successful archetype systems (e.g., D&D classes, personality tests)
- Research emotional resonance in narrative design
- Review color psychology for Lüscher test

**Psychometric Research:**
- Review IPIP question banks
- Study Big Five and HEXACO scoring methods
- Research Z-score normalization in personality assessments
- Review archetype matching algorithms

**Technical Research:**
- Review existing Supabase schema patterns in codebase
- Study JSONB query patterns for performance
- Review API design patterns in existing codebase
- Check existing gamification implementations (if any)

### Collaboration Points

**Archetype Design:**
- Brainstorming session with design/product team
- Review with psychology background (if available)
- User testing of archetype names and lore

**Assessment Framework:**
- Review with backend team for feasibility
- Validate scoring algorithms with data science (if available)
- Test question sets for clarity

**Gamification:**
- Review badge designs with design team
- Validate XP amounts with product team
- Test Mirror Quest concepts with users

### Documentation Standards

**Format:**
- Use consistent markdown formatting
- Include code examples where applicable
- Add diagrams/mockups where helpful
- Link to related documents

**Completeness:**
- Each section should have no TODO markers when complete
- All examples should be realistic and complete
- All formulas should be fully specified
- All data structures should have type definitions

**Clarity:**
- Write for multiple audiences (engineering, design, product)
- Include context and rationale, not just specifications
- Use clear, non-ambiguous language
- Add "why" explanations, not just "what"

## Success Criteria

The documentation is sufficiently enriched when:

1. **Archetypes:** All 8 archetypes have complete lore, traits, and mappings
2. **Assessment:** All algorithms, formulas, and question sets are specified
3. **Schemas:** All JSONB structures are defined with examples, migrations are ready
4. **Gamification:** All badges, quests, and mechanics are fully designed
5. **Roadmap:** All milestones have timelines, resources, and success criteria

**Gate Criteria:**
- Engineering team can begin implementation without asking questions
- Design team can create mockups without ambiguity
- Product team can communicate vision clearly to stakeholders

## Next Steps

1. **Review Plan:** Get stakeholder approval on enrichment priorities
2. **Schedule Work:** Allocate time for each enrichment phase
3. **Begin Priority 1:** Start with archetype definitions
4. **Iterate:** Review and refine as we go
5. **Final Review:** Complete documentation review before Phase 1 implementation

## Open Questions

- [ ] Should we involve external psychology consultant for archetype design?
- [ ] Do we have access to IPIP question bank or need to create our own?
- [ ] Should we prototype scoring algorithms before documenting?
- [ ] Do we need user research before finalizing archetypes?
- [ ] Should gamification be designed in collaboration with users?

## Tracking

- **Week 1:** Priorities 1-2 (Archetypes + Assessment Framework)
- **Week 2:** Priorities 3-4 (Data Schemas + Gamification)
- **Week 3:** Priority 5 (Roadmap Refinement) + Final Review

**Status Updates:** Update this document weekly with progress on each priority.

