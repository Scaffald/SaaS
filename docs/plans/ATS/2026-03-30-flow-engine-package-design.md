# Flow Engine Package Spec — @bernierllc/flow-*

## Overview

A generic, configurable flow engine for the `~/projects/tools/` monorepo. Items move through user-defined stages via freeform transitions. The engine tracks position, records every transition, and emits Nevar trigger events so that consuming apps can wire up arbitrary business logic without hardcoding.

This package is consumed by Scaffald to power background check workflows, recruiter pipelines, hiring flows, and any future use case where "things move through stages."

## Relationship to Nevar

- **Nevar** = general-purpose triggered rules engine. Any event can fire a trigger. Rules evaluate. Actions execute.
- **Flow Engine** = items + stages + transitions. Independent of Nevar.
- **Connection point:** The flow engine emits Nevar trigger events on stage transitions, item creation, assignment changes, and staleness. The consuming app registers these trigger definitions with Nevar at boot time. Users wire up rules to these triggers via Nevar's rule builder UI.
- **Dependency:** `flow-engine` has `@bernierllc/nevar-types` as a peer dependency for type imports only. It does not depend on the full Nevar engine.

## Core Data Model

### Flow Definition

A configured pipeline. Created by a user or organization.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (uuid) | Unique identifier |
| `name` | string | Human-readable name |
| `description` | string | What this flow is for |
| `ownerType` | string | What kind of entity owns this flow (e.g., `organization`, `user`) |
| `ownerId` | string | ID of the owning entity |
| `itemType` | string | Freeform label for what moves through it (e.g., `background_check`, `application`, `task`) |
| `stages` | StageDefinition[] | The stages in this flow |
| `allowedTransitions` | TransitionDefinition[] | Which stage-to-stage moves are valid |
| `metadata` | Record<string, unknown> | Arbitrary JSON for app-specific config |
| `createdAt` | Date | |
| `updatedAt` | Date | |

### Stage Definition

A named state within a flow.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (uuid) | Unique identifier |
| `key` | string | Slug identifier (e.g., `intake`, `qa_review`) |
| `name` | string | Human-readable name |
| `color` | string | Hex color for UI rendering |
| `position` | number | Ordering for UI display |
| `stageType` | `initial \| active \| terminal \| archived` | At least one initial, at least one terminal required |
| `entryPolicy` | PolicyConfig? | Optional constraints on entering this stage |
| `exitPolicy` | PolicyConfig? | Optional constraints on leaving this stage |

### Flow Item

A concrete thing moving through the flow.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (uuid) | Unique identifier |
| `flowDefinitionId` | string | Which flow this item belongs to |
| `currentStageKey` | string | Where it is now |
| `externalId` | string | Links to the domain object (e.g., applicant uuid, task uuid) |
| `externalType` | string | Type of the domain object (e.g., `applicant`, `background_check`) |
| `assigneeId` | string? | Who's responsible for this item right now |
| `metadata` | Record<string, unknown> | Arbitrary JSON |
| `createdAt` | Date | |
| `updatedAt` | Date | |

**Key design choice:** The flow engine is *referential* — it points to domain objects via `externalId`/`externalType` rather than storing domain data. The consuming app's existing tables remain the source of truth for domain data. The flow engine only knows "where is this thing in the pipeline."

### Transition Record

Immutable audit log of every move. Every transition is recorded, no exceptions.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (uuid) | Unique identifier |
| `flowItemId` | string | Which item moved |
| `fromStageKey` | string | Previous stage |
| `toStageKey` | string | New stage |
| `actorId` | string | Who initiated the transition |
| `actorType` | `user \| system \| rule` | What kind of actor |
| `reason` | string? | Why the transition happened (freeform or structured) |
| `metadata` | Record<string, unknown> | Arbitrary JSON (e.g., which Nevar rule triggered this) |
| `timestamp` | Date | When it happened |

## Core Operations

### Flow Definition Management

- `createFlow(config)` — create a new flow definition with stages and allowed transitions
- `updateFlow(flowId, patch)` — modify stages, transitions, metadata. Validates that no active items are orphaned by removed stages.
- `cloneFlow(flowId, overrides)` — duplicate a flow definition (useful for templates)
- `getFlow(flowId)` / `listFlows(filters)` — retrieval
- `deleteFlow(flowId)` — soft delete only if no active items exist

### Flow Item Lifecycle

- `createItem(flowId, { externalId, externalType, metadata })` — creates item at the flow's initial stage. Returns the item. Emits `flow.item.created` trigger.
- `transitionItem(itemId, toStageKey, { actorId, actorType, reason, metadata })` — the core operation. Validates the transition is allowed, creates the transition record, updates the item, emits triggers. Rejects if transition is not in `allowedTransitions` or if entry/exit policies fail.
- `assignItem(itemId, assigneeId)` — change who's responsible. Emits `flow.item.assigned`.
- `getItem(itemId)` / `listItems(filters)` — retrieval with filtering by flow, stage, assignee, external reference, date range
- `getItemHistory(itemId)` — returns all transition records for an item, ordered by timestamp
- `archiveItem(itemId)` — moves to an archived terminal stage

### Bulk Operations

- `listItems(flowId, { stageKey, assigneeId, ... })` — filter items by stage, assignee, date range, metadata queries
- `getStageStats(flowId)` — count of items per stage (powers kanban view)
- `getFlowMetrics(flowId, dateRange)` — average time in each stage, throughput, bottleneck detection. Powers transparency stats.

### Error Handling

Transitions that violate allowed transitions or policies throw typed errors (`FlowTransitionError`, `FlowPolicyError`). The engine never silently drops a transition.

## Nevar Trigger Events

The engine emits these as Nevar triggers automatically. Users wire rules to any of them:

| Trigger Key | Payload | When |
|---|---|---|
| `flow.item.created` | `{ flowId, itemId, stageKey, externalId, externalType, metadata }` | Item enters a flow |
| `flow.item.transitioned` | `{ flowId, itemId, fromStage, toStage, actorId, actorType, reason }` | Any stage change |
| `flow.item.entered_stage` | `{ flowId, itemId, stageKey, stageType }` | Item arrives at a specific stage |
| `flow.item.exited_stage` | `{ flowId, itemId, stageKey, stageType }` | Item leaves a specific stage |
| `flow.item.assigned` | `{ flowId, itemId, assigneeId, previousAssigneeId }` | Assignee changes |
| `flow.item.completed` | `{ flowId, itemId, stageKey }` | Item reaches a terminal stage |
| `flow.item.stale` | `{ flowId, itemId, stageKey, durationMs }` | Item has been in a stage longer than a configurable threshold |

The `stale` trigger enables time-based automation — e.g., "case sitting in QA for 48 hours" alerts, "applicant hasn't been contacted in 3 days" notifications. The engine runs a configurable heartbeat/check for staleness.

## Storage

### Storage Adapter Pattern

Same approach as Nevar:

```
FlowStorageAdapter (interface)
  |-- InMemoryFlowStorage (for testing)
  |-- SqlFlowStorage (raw SQL + PostgreSQL migrations)
  |-- PrismaFlowStorage (optional)
```

The adapter interface covers all CRUD + query operations. A conformance test suite ships with the package so any adapter can prove it works.

## Package Structure

| Package | Layer | Purpose |
|---|---|---|
| `@bernierllc/flow-types` | core | All types, interfaces, error classes. Zero runtime deps. |
| `@bernierllc/flow-engine` | core | Core engine logic — create flows, transition items, validate policies, emit Nevar triggers |
| `@bernierllc/flow-storage` | service | Storage adapter interface + in-memory adapter + conformance tests |
| `@bernierllc/flow-adapter-sql` | service | PostgreSQL adapter + migrations |
| `@bernierllc/flow-metrics` | service | Time-in-stage, throughput, bottleneck, staleness detection. Powers transparency stats. |
| `@bernierllc/flow-engine-ui` | ui | Flow builder, kanban board, item detail, transition history timeline |
| `@bernierllc/flow-suite` | suite | Umbrella re-export + E2E integration test |

### Dependency Chain

```
flow-types (Wave 1)
  |
flow-engine + flow-storage (Wave 2)
  |
flow-adapter-sql + flow-metrics (Wave 3)
  |
flow-engine-ui (Wave 4)
  |
flow-suite (Wave 5)
```

## UI Components

The `@bernierllc/flow-engine-ui` package ships these generic, reusable components:

### Flow Builder
Admin tool for creating/editing flow definitions.
- Canvas where you add stages as cards and draw transition arrows between them
- Stage editor panel (name, color, type, entry/exit policies)
- Transition editor (label, conditions description)
- Validates: at least one initial stage, at least one terminal, no orphaned stages
- Export/import flow definitions as JSON (for templates)

### Kanban Board
The primary operational view.
- Columns = stages, cards = items
- Drag a card between columns = calls `transitionItem()`
- Card shows: item name/reference, assignee avatar, time-in-stage indicator
- Stage headers show item count
- Filterable by assignee, date range, metadata
- Color coding for staleness (green -> yellow -> red based on time thresholds)

### Item Detail Panel
Slide-out or dedicated view for a single item.
- Current stage with visual indicator of position in the flow
- Transition history timeline (who moved it, when, why)
- Assignee with reassign control
- Metadata display — consuming app injects domain-specific content via render props / slots
- Action buttons for valid transitions from current stage

### Flow Metrics Dashboard
Analytics view.
- Items per stage (bar chart)
- Average time per stage (identifies bottlenecks)
- Throughput over time (items completed per day/week)
- Staleness alerts (items exceeding thresholds)

### Headless-Capable Design
Each component ships as both:
1. A logic hook (`useFlowBuilder`, `useKanban`, `useItemDetail`) — state management, validation, API calls
2. A default rendered UI — ready to use out of the box

Consuming apps can use the default UI for rapid development, or swap in custom rendering. The slot/render prop pattern lets consuming apps inject domain-specific UI into the kanban cards and item detail views. The flow engine renders the flow chrome (stage, transitions, history, assignee); the app renders the domain content (applicant name, background check status, job title, etc.).
