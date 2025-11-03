# Route Task Review Summary

## Review Completed ✅

I've reviewed and improved the route task definitions in vibe-kanban to ensure they properly guide agents through the Playwright MCP exploration workflow.

## Key Changes Made

### 1. Created Comprehensive Review Document
- **File**: `docs/testing/route-task-review.md`
- Contains detailed templates and instructions for:
  - AUDIT-ROUTE ticket structure
  - TEST ticket creation with full instructions
  - BUG ticket handling and blocking relationships
  - Playwright MCP command logging

### 2. Updated Main Plan Document
- **File**: `docs/testing/generalized-ui-testing-plan.md`
- Enhanced `playwright-audit-route` template with:
  - Explicit Playwright MCP usage requirement
  - Specific user credentials (zach@unicorn.love, ewongagent@gmail.com)
  - Command logging requirement
  - Comprehensive TEST ticket creation instructions
  - Bug handling with blocking relationships

## Improvements Summary

### ✅ Playwright MCP Usage
- Explicit instructions to use Playwright MCP tools (not standard Playwright API)
- All commands must be logged for test script creation

### ✅ User Credentials
- **Super Admin**: `zach@unicorn.love`
- **Admin**: `ewongagent@gmail.com`
- **Regular User**: Use existing test user from fixtures

### ✅ Comprehensive Investigation
- Detailed checklist covering:
  - All UI elements
  - All interactive features
  - All form interactions
  - All states (empty, loading, error, success)
  - Edge cases and error handling
  - Sub-routes and navigation

### ✅ Playwright Command Logging
- Requirement to document every Playwright MCP command used
- Log format template provided
- Commands referenced in TEST ticket for test implementation

### ✅ TEST Ticket Creation
- Comprehensive template with:
  - File location instructions (`tests/{userLevel}/{normalizedRoutePath}.spec.ts`)
  - How to run tests
  - Verification checklist
  - Branch information (merge into `bernier-playwright`)
  - Reference to Playwright command log

### ✅ Bug Handling
- Clear process for creating BUG tickets
- Proper blocking relationships:
  - BUG tickets block TEST tickets
  - TEST tickets updated to indicate blocking
  - Instructions for updating TEST tickets after bug resolution

## Next Steps

1. **Review Existing Route Tasks**: Check existing AUDIT-ROUTE tickets in vibe-kanban and update them to match the new template structure

2. **Use New Templates**: When creating new route tasks, use the templates from `docs/testing/route-task-review.md`

3. **Agent Instructions**: Ensure agents working on route tasks:
   - Use Playwright MCP tools (not standard Playwright)
   - Authenticate as specified users
   - Log all commands used
   - Create TEST tickets with full instructions
   - Handle bugs with proper blocking relationships

## Files Modified

1. ✅ `docs/testing/route-task-review.md` - NEW comprehensive review document
2. ✅ `docs/testing/generalized-ui-testing-plan.md` - Updated with improvements

## References

- Main plan: `docs/testing/generalized-ui-testing-plan.md`
- Route task review: `docs/testing/route-task-review.md`
- Audit guidance: `tests/AUDIT-TASKS-GUIDANCE.md`
- Vibe-Kanban rules: `.cursor/rules/vibe-kanban.mdc`

