# Documentation Added for AI Agents

## Summary

Comprehensive documentation has been added to ensure AI agents (Cursor, Cline, Claude, etc.) are always aware of the unique hybrid maintenance setup for `@unicornlove/ui`.

## Documentation Files Created/Updated

### 1. ✅ Cursor Rule File (Always Applied)
**File**: `.cursor/rules/ui-package-hybrid.mdc`
- Auto-applied when working on UI package files
- Contains complete workflow and critical information
- Lists all DOs and DON'Ts for AI agents

### 2. ✅ Architecture Decision Record
**File**: `.cursor/rules/memory/architecture-decisions.md`
- Added Decision #11: Hybrid UI Package Maintenance
- Documents rationale, implementation, workflow, and trade-offs
- Permanent record of the architectural choice

### 3. ✅ Project Overview Update
**File**: `.cursor/rules/memory/project-overview.md`
- Updated `packages/ui` section with hybrid maintenance details
- Quick reference for package structure

### 4. ✅ Project Guardrails Update
**File**: `.cursor/rules/project-guardrails.mdc`
- Added "UI Package Hybrid Maintenance" section
- Always-applied rules that mention the setup
- Prevents deletion suggestions

### 5. ✅ Cursor Rules README
**File**: `.cursor/rules/README.md`
- Added rule #7: `ui-package-hybrid.mdc`
- Listed in specialized rules section

### 6. ✅ Package.json Description
**File**: `packages/ui/package.json`
- Updated description field with hybrid setup note
- Visible when agents read package.json

### 7. ✅ UI Package README
**File**: `packages/ui/README.md`
- Added prominent warning section at top
- Links to detailed documentation

### 8. ✅ AI Agents README
**File**: `packages/ui/AI_AGENTS_README.md`
- Quick reference for AI agents
- Highlights critical facts and workflow

## Key Information Covered

### Dual Repository Structure
- Monorepo location: `packages/ui/` (development source)
- Standalone repo: For publishing
- Consumption: npm package `@unicornlove/ui@^1.0.1`

### Workflow
- Edit in monorepo → Sync → Build → Publish → Consume via npm
- Sync script: `./packages/ui/scripts/sync-to-standalone.sh`
- Development modes: npm (default), link, workspace

### Critical Rules
- ❌ Never delete `packages/ui/` folder
- ❌ Never assume it's a workspace package
- ✅ Always check if changes need publishing
- ✅ Use sync workflow for publishing

## How AI Agents Discover This

1. **Cursor Rules**: Auto-applied when working on UI files
2. **Architecture Decisions**: Permanent record in memory bank
3. **Project Overview**: High-level context in memory
4. **Package.json**: Visible in package metadata
5. **README Files**: Prominent warnings and links
6. **Project Guardrails**: Always-applied rules

## Verification

All documentation is cross-referenced:
- Cursor rules link to architecture decisions
- Architecture decisions reference cursor rules
- README files link to detailed guides
- All files mention key workflow points

## Result

AI agents will now:
- ✅ Understand the hybrid setup before making changes
- ✅ Know where to edit files (monorepo)
- ✅ Understand sync and publishing workflow
- ✅ Never suggest deleting the source of truth
- ✅ Reference correct documentation automatically

**The hybrid maintenance setup is now fully documented and discoverable by all AI agents!**

