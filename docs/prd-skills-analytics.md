# PRD: Skills Analytics & Progression System

**Status:** Draft
**Date:** 2026-03-12
**Author:** Claude (collaborative)

---

## 1. Vision

Transform Scaffald's existing skills and reviews infrastructure into a **visual, evidence-driven skill progression system** — giving workers, employers, and reviewers clear insight into skill growth over time. Inspired by evidence-based tracking (skillsmap), but adapted to Scaffald's multi-taxonomy skills model (CSI, O*NET, soft skills) and peer-review ecosystem.

**Core thesis:** Skills aren't static. Workers grow. Reviewers validate. The platform should surface that trajectory — not just a snapshot.

---

## 2. Problem Statement

### What exists today
- Multi-taxonomy skill tracking (CSI, O*NET, soft skills) with proficiency levels 0-5
- Peer reviews with category ratings and soft skill votes
- Soft skills history API (`getSoftSkillsHistory()`) and comparison endpoint (`getSoftSkillsComparison()`)
- Custom SVG chart library (`@scaffald/ui`) with bar, line, donut, circle, stacked bar charts
- Profile widgets for skills display — but **text/card-based only, no actual visualizations**

### What's missing
1. **No visual skill profile** — No radar/spider chart showing skill shape at a glance
2. **No temporal view** — History API exists but no UI renders progression over time
3. **No delta tracking** — Reviews capture ratings but changes between reviews aren't surfaced
4. **No skills dashboard** — Dashboard widgets exist for jobs/career but skills analytics is absent
5. **No evidence layer** — Skills are self-assessed ratings, no mechanism for concrete evidence/proof
6. **No gap analysis** — Job skills requirements exist but aren't compared against worker profiles visually

---

## 3. Goals & Non-Goals

### Goals
- Surface skill progression visually (radar charts, trend lines, delta indicators)
- Connect reviews to skill trajectory (review → skill change → visual update)
- Add an evidence/proof layer to skills (inspired by skillsmap's checkbox evidence model)
- Create a Skills Analytics dashboard page
- Build reusable chart components (Radar, SparkLine, DeltaBadge) in `@scaffald/ui`
- Ensure all visualizations work on Expo web and native mobile via `react-native-svg`

### Non-Goals
- Replacing the existing review wizard flow
- Changing the core skill taxonomy system (CSI/O*NET/soft_skills)
- Building a standalone skills app (this integrates into existing Scaffald)
- Gamification (badges, leaderboards, XP)
- AI-powered skill recommendations (future phase)

---

## 4. User Stories

### Worker (Job Seeker / Contractor)
- **US-1:** As a worker, I want to see a radar chart of my soft skills so I can understand my skill shape at a glance
- **US-2:** As a worker, I want to see how my skills have changed over time so I can track my growth
- **US-3:** As a worker, I want to see how my self-assessment compares to peer reviews so I can identify blind spots
- **US-4:** As a worker, I want to attach evidence to my skills so my profile is more credible
- **US-5:** As a worker, I want to see which skills I need to improve for jobs I'm interested in (gap analysis)

### Employer / Reviewer
- **US-6:** As a reviewer, I want to see the impact of my reviews on a worker's skill trajectory
- **US-7:** As an employer, I want to see a candidate's skill progression, not just current levels
- **US-8:** As an employer, I want to compare a candidate's skills against job requirements visually

### Platform
- **US-9:** The platform should automatically snapshot skill states when reviews are submitted
- **US-10:** The platform should calculate and store skill deltas between snapshots

---

## 5. Feature Specification

### 5.1 New Chart Components (`@scaffald/ui`)

#### RadarChart
SVG-based spider/radar chart. Works on Expo web + native.

```typescript
interface RadarChartProps {
  axes: Array<{ label: string; value: number; maxValue?: number }>
  /** Optional second dataset for overlay comparison */
  comparison?: Array<{ label: string; value: number }>
  size?: 'sm' | 'md' | 'lg'          // 160 | 240 | 320
  colorScheme?: ChartColorScheme
  showLabels?: boolean
  showValues?: boolean
  interactive?: boolean               // tap axis for detail (native)
}
```

Visual: Concentric polygon grid (5 rings for 0-5 scale). Filled area for primary dataset. Dashed outline for comparison overlay. Axis labels outside the polygon.

#### SparkLine
Compact inline trend line for embedding in cards/lists.

```typescript
interface SparkLineProps {
  data: number[]                       // sequential values
  trend?: 'up' | 'down' | 'stable'    // optional override
  width?: number
  height?: number
  color?: string
}
```

#### DeltaBadge
Shows change between two values with directional indicator.

```typescript
interface DeltaBadgeProps {
  current: number
  previous: number
  format?: 'absolute' | 'percentage' | 'rating'
  size?: 'sm' | 'md'
}
```

Renders: `+0.8 ▲` (green) or `-1.2 ▼` (red) or `0.0 —` (muted)

#### ProgressRing
Circular progress indicator with label, for skill completion.

```typescript
interface ProgressRingProps {
  value: number                        // 0-100
  label?: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
}
```

### 5.2 Skill Snapshots (Data Layer)

#### New Database Table: `core.skill_snapshots`

```sql
CREATE TABLE core.skill_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES core.users(id),
  trigger_type    TEXT NOT NULL CHECK (trigger_type IN (
    'review_received', 'self_assessment', 'manual', 'periodic'
  )),
  trigger_id      UUID,                -- review_id or assessment_id
  snapshot_data   JSONB NOT NULL,      -- full skill state at this point
  summary         JSONB,               -- pre-computed aggregates
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_skill_snapshots_user_date
  ON core.skill_snapshots(user_id, created_at DESC);
```

**`snapshot_data` schema:**
```json
{
  "soft_skills": {
    "categories": {
      "reliability": { "average": 3.8, "skills": [...] },
      "collaboration": { "average": 4.1, "skills": [...] },
      "professionalism": { "average": 3.5, "skills": [...] },
      "technical": { "average": 4.0, "skills": [...] }
    },
    "overall_average": 3.85
  },
  "hard_skills": {
    "csi": [...],
    "onet": [...]
  },
  "evidence_count": 12,
  "review_count": 5,
  "peer_average": 3.9,
  "self_average": 3.7,
  "alignment_score": 0.85
}
```

**`summary` schema (pre-computed deltas from previous snapshot):**
```json
{
  "delta_overall": +0.3,
  "delta_categories": {
    "reliability": +0.5,
    "collaboration": -0.1,
    "professionalism": +0.4,
    "technical": +0.2
  },
  "improved_count": 8,
  "declined_count": 2,
  "stable_count": 15,
  "new_count": 1
}
```

#### Snapshot Triggers
1. **review_received** — Auto-snapshot when a peer review is submitted for the user
2. **self_assessment** — Auto-snapshot when user updates their soft skills self-assessment
3. **manual** — User-triggered "save snapshot" action
4. **periodic** — Monthly cron job for active users (future)

### 5.3 Skill Evidence (Data Layer)

#### New Database Table: `core.skill_evidence`

```sql
CREATE TABLE core.skill_evidence (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES core.users(id),
  soft_skill_id   UUID REFERENCES core.soft_skills(id),
  skill_taxonomy  TEXT,                -- for hard skills: csi | onet
  skill_ref_id    UUID,                -- csi_skill_id or onet_occupation_id
  evidence_type   TEXT NOT NULL CHECK (evidence_type IN (
    'certification', 'project', 'review_excerpt', 'work_log', 'custom'
  )),
  title           TEXT NOT NULL,
  description     TEXT,
  url             TEXT,                -- link to cert, project, etc.
  verified        BOOLEAN DEFAULT false,
  verified_by     UUID REFERENCES core.users(id),
  verified_at     TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_skill_evidence_user ON core.skill_evidence(user_id);
CREATE INDEX idx_skill_evidence_soft_skill
  ON core.skill_evidence(soft_skill_id) WHERE soft_skill_id IS NOT NULL;
```

Evidence types:
- **certification** — Link to a certification or credential
- **project** — Reference to a completed project or work sample
- **review_excerpt** — Auto-extracted from a peer review that mentions this skill
- **work_log** — Link to a work log entry demonstrating the skill
- **custom** — User-provided freeform evidence

### 5.4 Skills Analytics Dashboard Page

New route: `/dashboard/skills-analytics`

#### Layout (Two-Column)

**Left Column:**

1. **Skill Shape Card** — RadarChart showing soft skill categories (4 axes: reliability, collaboration, professionalism, technical). Toggle between self-assessment and peer-review overlay.

2. **Progression Timeline** — LinearChart showing overall skill average over time (using snapshot data). X-axis = dates, Y-axis = 0-5 rating. Separate lines per category available via filter.

3. **Skills Breakdown** — Expandable list of all soft skills grouped by category. Each skill shows:
   - Current rating (self + peer)
   - SparkLine of last 6 snapshots
   - DeltaBadge from last snapshot
   - Evidence count badge
   - Tap to expand → evidence list + review excerpts

**Right Column:**

4. **Summary Stats** — Grid of stat cards:
   - Overall average (large ProgressRing)
   - Per-category averages (4 smaller ProgressRings)
   - Total evidence items
   - Total reviews received
   - Alignment score (self vs peer)

5. **Recent Changes** — Feed of recent skill movements:
   - "Reliability improved +0.5 after review from [Reviewer]"
   - "New evidence added: AWS Certification"
   - "Collaboration declined -0.2 (self-assessment update)"

6. **Gap Analysis Card** — If user has saved/bookmarked jobs, show gap comparison:
   - Required skills vs current skills
   - Visual: BarChart with required level (outline) vs current level (filled)
   - Top 3 gaps highlighted

### 5.5 Profile Skills Widget Enhancement

Update existing `SoftSkillsRadarWidget` to render an actual RadarChart:

- Replace current card grid with RadarChart (md size)
- Below chart: list of categories with SparkLine trends
- "View Full Analytics" link → `/dashboard/skills-analytics`
- Self vs peer toggle on the chart

### 5.6 Review Impact Integration

After a review is submitted:
1. Auto-create a skill snapshot for the reviewed user
2. Calculate deltas from previous snapshot
3. Show the reviewer a "Your Review Impact" summary:
   - Which skills changed
   - How the worker's profile shifted
   - (Read-only, shown after review submission)

### 5.7 SDK & API Extensions

#### New Scaffald SDK Resource: `skillSnapshots`

```typescript
// packages/scaffald-sdk/src/resources/skill-snapshots.ts

interface SkillSnapshot {
  id: string
  userId: string
  triggerType: 'review_received' | 'self_assessment' | 'manual' | 'periodic'
  triggerId?: string
  snapshotData: SnapshotData
  summary?: SnapshotSummary
  createdAt: string
}

interface SkillSnapshotsResource {
  list(params: { userId: string; limit?: number }): Promise<SkillSnapshot[]>
  get(id: string): Promise<SkillSnapshot>
  create(params: CreateSnapshotParams): Promise<SkillSnapshot>
  compare(params: { snapshotA: string; snapshotB: string }): Promise<SnapshotDiff>
  latest(userId: string): Promise<SkillSnapshot | null>
  timeline(params: {
    userId: string
    startDate?: string
    endDate?: string
    granularity?: 'daily' | 'weekly' | 'monthly'
  }): Promise<TimelineDataPoint[]>
}
```

#### New Scaffald SDK Resource: `skillEvidence`

```typescript
// packages/scaffald-sdk/src/resources/skill-evidence.ts

interface SkillEvidence {
  id: string
  userId: string
  softSkillId?: string
  skillTaxonomy?: string
  skillRefId?: string
  evidenceType: 'certification' | 'project' | 'review_excerpt' | 'work_log' | 'custom'
  title: string
  description?: string
  url?: string
  verified: boolean
  verifiedBy?: string
  verifiedAt?: string
  createdAt: string
}

interface SkillEvidenceResource {
  list(params: { userId: string; skillId?: string }): Promise<SkillEvidence[]>
  create(params: CreateEvidenceParams): Promise<SkillEvidence>
  update(id: string, params: Partial<SkillEvidence>): Promise<SkillEvidence>
  delete(id: string): Promise<void>
  verify(id: string): Promise<SkillEvidence>
}
```

#### New React Query Hooks

```typescript
// packages/scf-core/utils/skill-snapshots-sdk-hooks.ts
useSkillSnapshots(userId, options?)
useLatestSnapshot(userId)
useSnapshotTimeline(userId, params)
useSnapshotComparison(snapshotAId, snapshotBId)
useCreateSnapshotMutation()

// packages/scf-core/utils/skill-evidence-sdk-hooks.ts
useSkillEvidence(userId, skillId?)
useCreateEvidenceMutation()
useDeleteEvidenceMutation()
useVerifyEvidenceMutation()
```

---

## 6. Technical Architecture

### Rendering Strategy
All visualizations use **`react-native-svg`** (already installed, v15.15.3). This ensures:
- Native mobile rendering via platform SVG
- Web rendering via SVG DOM
- No Canvas dependency (problematic on React Native)
- Consistent across Expo web and native

### Chart Components Location
New components go in `@scaffald/ui` alongside existing chart library:
```
packages/scaffald-ui/src/components/Chart/
├── RadarChart/
│   ├── RadarChart.tsx
│   ├── RadarChart.types.ts
│   └── index.ts
├── SparkLine/
│   ├── SparkLine.tsx
│   └── index.ts
├── DeltaBadge/
│   ├── DeltaBadge.tsx
│   └── index.ts
└── ProgressRing/
    ├── ProgressRing.tsx
    └── index.ts
```

### No New Dependencies Required
- SVG rendering: `react-native-svg` (already installed)
- Data fetching: `@tanstack/react-query` (already installed)
- State management: React hooks (existing pattern)
- Math utilities: vanilla JS (no D3 needed for these charts)

### Database Migrations
Two new migrations:
1. `XXX_skill_snapshots.sql` — Table + indexes + RLS policies
2. `XXX_skill_evidence.sql` — Table + indexes + RLS policies

### Edge Functions
One new Supabase edge function:
- `create-skill-snapshot` — Called via database trigger when a review is submitted, or directly via SDK

---

## 7. Implementation Plan

### Phase 1: Chart Components (Week 1-2)
**Goal:** Build reusable visualization primitives in `@scaffald/ui`

| Task | Effort | Details |
|------|--------|---------|
| RadarChart component | 3d | SVG polygon grid, filled area, comparison overlay, labels |
| SparkLine component | 1d | Inline SVG polyline with trend coloring |
| DeltaBadge component | 0.5d | Directional change indicator |
| ProgressRing component | 1d | Circular SVG arc with label |
| Chart exports + types | 0.5d | Export from `@scaffald/ui/chart`, add to barrel |
| Storybook/test stories | 1d | Visual regression + interaction testing |

**Deliverable:** New chart components available in `@scaffald/ui`, verified on web + mobile.

### Phase 2: Data Layer (Week 2-3)
**Goal:** Snapshot and evidence tables + API

| Task | Effort | Details |
|------|--------|---------|
| `skill_snapshots` migration | 1d | Table, indexes, RLS policies |
| `skill_evidence` migration | 1d | Table, indexes, RLS policies |
| Snapshot auto-creation trigger | 1d | DB trigger or edge function on review insert |
| Delta computation function | 1d | SQL or edge function to compute summary from prev snapshot |
| SDK: `skillSnapshots` resource | 1.5d | CRUD + timeline + compare endpoints |
| SDK: `skillEvidence` resource | 1d | CRUD + verify endpoint |
| React Query hooks | 1d | All hooks for both resources |

**Deliverable:** Fully functional data pipeline — reviews trigger snapshots with computed deltas.

### Phase 3: Skills Analytics Dashboard (Week 3-5)
**Goal:** New dashboard page with full visualizations

| Task | Effort | Details |
|------|--------|---------|
| Route + layout scaffolding | 0.5d | `/dashboard/skills-analytics`, two-column layout |
| Skill Shape Card (RadarChart) | 2d | Self vs peer toggle, category axes |
| Progression Timeline (LinearChart) | 2d | Snapshot timeline, category filter |
| Skills Breakdown list | 2d | Expandable categories, SparkLine + DeltaBadge per skill |
| Summary Stats grid | 1d | ProgressRings, stat cards |
| Recent Changes feed | 1.5d | Activity feed from snapshot diffs |
| Gap Analysis card | 2d | Job requirements vs current skills BarChart |
| Dashboard navigation entry | 0.5d | Add to sidebar/dashboard index |

**Deliverable:** Fully functional Skills Analytics dashboard page.

### Phase 4: Profile & Review Integration (Week 5-6)
**Goal:** Connect visualizations to existing profile + review flows

| Task | Effort | Details |
|------|--------|---------|
| Update SoftSkillsRadarWidget | 1.5d | Replace card grid with RadarChart + SparkLines |
| Evidence management UI | 2d | Add/edit/delete evidence on skill detail |
| Review impact summary | 2d | Post-review submission impact view |
| Evidence auto-extraction | 1.5d | Extract review excerpts as evidence |
| Profile skills page updates | 1d | Add evidence counts, trend indicators |

**Deliverable:** Skills visualizations integrated into profile and review flows.

### Phase 5: Polish & QA (Week 6-7)
| Task | Effort | Details |
|------|--------|---------|
| Responsive testing (mobile/tablet/desktop) | 1d | All new components |
| Dark/light theme verification | 0.5d | Color tokens |
| Empty state designs | 1d | No snapshots yet, no evidence, no reviews |
| Loading/skeleton states | 0.5d | Chart loading placeholders |
| Accessibility audit | 1d | Screen reader labels for charts |
| Performance testing | 0.5d | Large snapshot datasets |

---

## 8. Success Metrics

| Metric | Target | How Measured |
|--------|--------|-------------|
| Skills dashboard page views | >30% of active users visit within 30d | Analytics |
| Evidence items added per user | >3 average within 60d | DB query |
| Snapshot count per user | >2 within 90d (organic via reviews) | DB query |
| Self-assessment updates after viewing analytics | +20% increase | Before/after comparison |
| Time on skills analytics page | >45s average session | Analytics |

---

## 9. Open Questions

1. **Snapshot frequency:** Should periodic snapshots be weekly or monthly?
2. **Evidence verification:** Who can verify evidence — only employers, or also peers?
3. **Privacy:** Should skill progression be visible to employers by default, or opt-in?
4. **Historical backfill:** Should we create snapshots from existing review history on migration?
5. **Export:** Should users be able to export their skill progression data (PDF, JSON)?

---

## 10. Future Considerations (Out of Scope)

- AI-powered skill recommendations based on career goals
- Team-level skill analytics for employers
- Skill endorsements from connections (LinkedIn-style)
- Learning resource recommendations based on gaps
- Skill badges / achievements
- Integration with external credential platforms (Credly, etc.)
