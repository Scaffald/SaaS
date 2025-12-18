# CLAUDE.md

> 🚨 **Canonical Source**: All project-specific context now lives in `AGENTINFO.md`. Read/update that file first; this profile only adds Claude-specific reminders.

**Maintaining AGENTINFO.md:**
- When project-specific processes, structure, or standards change, update `AGENTINFO.md` immediately
- Mirror every requirement from `AGENTINFO.md` (project structure, build/test commands, coding style, testing guidance, commit/PR standards, security/config, documentation)
- When responding, cite the relevant sections of `AGENTINFO.md` rather than restating them—this avoids stale guidance
- Do NOT duplicate project-specific information in this file or in `.cursor/rules/` - keep it in `AGENTINFO.md`
- If you discover new constraints, update `AGENTINFO.md` instead of duplicating details here

## Overview

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. For detailed project-specific information, see `AGENTINFO.md`.

## BrainGrid Integration (CRITICAL)

### Mandatory Task Status Updates

**⚠️ NON-NEGOTIABLE REQUIREMENT**: When working on BrainGrid requirements and tasks, you MUST update statuses immediately upon completion using the BrainGrid MCP tools. This is not optional.

### Required Workflow

1. **Starting a Task**:
   - Mark task status as `IN_PROGRESS` using `mcp__braingrid__update_project_task`
   - Update task description with current status if needed

2. **Completing a Task**:
   - **IMMEDIATELY** mark task status as `COMPLETED` using `mcp__braingrid__update_project_task`
   - Update requirement status if all tasks are complete using `mcp__braingrid__update_project_requirement`
   - Do NOT commit code without updating BrainGrid statuses first

3. **Blocking/Cancelled Tasks**:
   - Mark task as `CANCELLED` with clear reason in description
   - Create new REQ for blocking issues if needed
   - Add blocking relationships using task dependencies

### BrainGrid MCP Tools

Always provide `project_id` (auto-detected from `.braingrid/project.json`):

```bash
# Read project config
cat .braingrid/project.json

# Update task status
mcp__braingrid__update_project_task({
  project_id: "...",
  requirement_id: "REQ-XXX",
  task_id: "...",
  status: "COMPLETED"
})

# Update requirement status
mcp__braingrid__update_project_requirement({
  project_id: "...",
  requirement_id: "REQ-XXX",
  status: "COMPLETED"
})

# Create new requirement for blockers
mcp__braingrid__create_project_requirement({
  project_id: "...",
  prompt: "Detailed description of issue found..."
})
```

### Why This Matters

- **Project visibility**: Team needs real-time status updates
- **Blocking dependencies**: Other tasks may depend on completion status
- **Effort tracking**: Accurate time estimates require completion data
- **Developer handoff**: Next developer needs to know what's done
- **Sprint planning**: Project managers rely on accurate status

**REMEMBER**: Task status updates are of paramount importance. Update BrainGrid BEFORE committing code or marking work complete.

## References

- **Project-Specific Info**: See `AGENTINFO.md` for complete project context
- **Cursor Rules**: See `.cursor/rules/` directory for development rules
- **Anthropic Best Practices**: https://www.anthropic.com/engineering/claude-code-best-practices
