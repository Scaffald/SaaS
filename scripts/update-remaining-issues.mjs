#!/usr/bin/env node

/**
 * Update remaining GitHub issues with status updates
 * Focuses on issues related to in-progress BrainGrid requirements
 */

import { execSync } from 'child_process'

function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe' }).trim()
  } catch (error) {
    return null
  }
}

function getIssueDetails(issueNumber) {
  const json = runCommand(`gh issue view ${issueNumber} --json number,title,state,body,labels`)
  if (!json) return null
  return JSON.parse(json)
}

function commentOnIssue(issueNumber, comment) {
  console.log(`\n📝 Commenting on issue #${issueNumber}...`)
  const escapedComment = comment.replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/\n/g, '\\n')
  runCommand(`gh issue comment ${issueNumber} --body "${escapedComment}"`)
}

function main() {
  console.log('🚀 Updating remaining GitHub issues...\n')

  // Issue #110: ATS: Verify hiring/negotiation/messaging flows match v1.0 functionality
  // Related to REQ-217 (in progress) and REQ-221 (in progress)
  const issue110 = getIssueDetails(110)
  if (issue110 && issue110.state === 'OPEN') {
    const comment = `## 🚧 Status Update - November 18, 2025

**Related In-Progress Work:**
- **REQ-217**: Job Application Flow with Screening Questions, Document Uploads, and Progress Indicators 🚧
- **REQ-221**: Job Inquiry and Negotiation Flow 🚧

**Current Progress:**
- Job application flow UI components are being implemented
- QuickApplyModal structure created with screening question support
- Backend API support for quick application submission documented
- Negotiation/inquiry flow work is in progress

**Recent Commits:**
- \`feat(REQ-217): Document backend API support for quick application submission\`
- \`feat(REQ-217): Implement QuickApplyModal submission logic and success state\`
- \`feat(REQ-217): Implement screening question form fields in QuickApplyModal\`
- \`feat(REQ-217): Create QuickApplyModal component structure\`

**Next Steps:**
- Complete backend API endpoints for messaging
- Wire up MessagesTab to real API
- Build negotiation/inquiry UI components
- Test full workflow end-to-end
- Compare to v1.0 functionality once complete

**Tracking:**
- See REQ-217 and REQ-221 in BrainGrid for detailed progress`

    commentOnIssue(110, comment)
  }

  // Issue #109: Organization Types - might relate to completed work
  const issue109 = getIssueDetails(109)
  if (issue109 && issue109.state === 'OPEN') {
    const comment = `## 📋 Status Update - November 18, 2025

**Current Status:** Open - Needs implementation

**Related Completed Work:**
- REQ-216: Create Job Flow ✅ (includes organization form)
- Organization management infrastructure in place

**Next Steps:**
- Expand industries table with comprehensive list
- Update seed scripts
- Test organization creation with new industry options
- Verify industry filters work correctly

**Priority:** Medium - Blocks use cases for non-construction organizations`

    commentOnIssue(109, comment)
  }

  // Issue #107: Search UX - might relate to REQ-13 (completed)
  const issue107 = getIssueDetails(107)
  if (issue107 && issue107.state === 'OPEN') {
    const comment = `## 📋 Status Update - November 18, 2025

**Current Status:** Open - Needs investigation and fix

**Related Completed Work:**
- REQ-13: Map Search by City ✅ (geocoding and viewport optimization completed)
- Map search functionality has been improved

**Current Issue:**
- Search interface discoverability needs improvement
- Direct typing without auto-select causes "stuck" behavior
- Need to investigate root cause and implement fix

**Next Steps:**
- Investigate why direct typing causes stuck state
- Improve search visibility/prominence
- Add clear/reset functionality
- Test across all discovery screens`

    commentOnIssue(107, comment)
  }

  console.log('\n✅ Remaining issues update complete!')
}

main()
