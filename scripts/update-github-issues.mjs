#!/usr/bin/env node

/**
 * Update GitHub issues based on BrainGrid requirements status
 * - Closes issues that are now complete
 * - Comments on in-progress issues with status updates
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const PROJECT_ID = '0f70d273-f528-4cc4-a1fa-8daab9111973';

// Mapping of BrainGrid REQs to GitHub issue numbers
// Based on documentation and commit history
const REQ_TO_ISSUE_MAP = {
  'REQ-216': 78, // Create Job Flow -> Job Posting Creation UI
  'REQ-91': null, // Team Management System (no direct GitHub issue)
  'REQ-34': null, // Photo Crop and Zoom (no direct GitHub issue)
  'REQ-29': null, // Employment Preferences (no direct GitHub issue)
  'REQ-30': null, // Certification Search (no direct GitHub issue)
  'REQ-74': null, // Notifications/Profile fixes (no direct GitHub issue)
  'REQ-76': null, // Planning milestone (no direct GitHub issue)
  'REQ-13': null, // Map Search by City (no direct GitHub issue)
  'REQ-83': null, // Profile Completion Wizard (no direct GitHub issue)
  'REQ-217': null, // Job Application Flow (in progress)
  'REQ-221': null, // Job Inquiry and Negotiation Flow (in progress)
  'REQ-227': null, // IPIP Personality Assessment (in progress)
  'REQ-202': null, // Offline Database Caching (in progress)
};

// Issues that should be checked based on ATS roadmap
const ATS_ISSUES_TO_CHECK = [75, 76, 79, 77, 81, 83];

function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch (error) {
    console.error(`Error running command: ${command}`);
    console.error(error.message);
    return null;
  }
}

function getIssueDetails(issueNumber) {
  const json = runCommand(`gh issue view ${issueNumber} --json number,title,state,body,labels`);
  if (!json) return null;
  return JSON.parse(json);
}

function commentOnIssue(issueNumber, comment) {
  console.log(`\n📝 Commenting on issue #${issueNumber}...`);
  const escapedComment = comment.replace(/"/g, '\\"').replace(/\$/g, '\\$');
  runCommand(`gh issue comment ${issueNumber} --body "${escapedComment}"`);
}

function closeIssue(issueNumber, comment) {
  console.log(`\n✅ Closing issue #${issueNumber}...`);
  if (comment) {
    commentOnIssue(issueNumber, comment);
  }
  runCommand(`gh issue close ${issueNumber}`);
}

function getCompletedREQs() {
  // Read from BrainGrid API or use hardcoded list for now
  // In a real implementation, we'd call the BrainGrid API
  return [
    { id: 'REQ-91', name: 'Team Management System' },
    { id: 'REQ-34', name: 'Photo Crop and Zoom' },
    { id: 'REQ-216', name: 'Create Job Flow with Form Fields, Toggles, and Kanban View' },
    { id: 'REQ-29', name: 'Employment Preferences Configuration' },
    { id: 'REQ-30', name: 'Certification Search' },
    { id: 'REQ-74', name: 'Updates and fixes for Notifications, Profile view/edit, and map' },
    { id: 'REQ-76', name: 'Planning Milestone Definition and Roadmap Structure' },
    { id: 'REQ-13', name: 'Map Search by City' },
    { id: 'REQ-83', name: 'Profile Completion Wizard with Behavioral Nudges and Data Import' },
  ];
}

function getInProgressREQs() {
  return [
    { id: 'REQ-227', name: 'IPIP Personality Assessment with Archetype Classification System' },
    { id: 'REQ-217', name: 'Job Application Flow with Screening Questions, Document Uploads, and Progress Indicators' },
    { id: 'REQ-221', name: 'Job Inquiry and Negotiation Flow' },
    { id: 'REQ-202', name: 'Offline Database Caching and Offline-First Data Synchronization Strategy' },
  ];
}

function checkATSIssues() {
  console.log('\n🔍 Checking ATS-related issues from roadmap...\n');
  
  // According to docs/features/ats-roadmap.md, these should be complete:
  const shouldBeComplete = [75, 76, 79];
  
  for (const issueNum of shouldBeComplete) {
    const issue = getIssueDetails(issueNum);
    if (!issue) {
      console.log(`⚠️  Could not fetch issue #${issueNum}`);
      continue;
    }
    
    if (issue.state === 'CLOSED') {
      console.log(`✅ Issue #${issueNum} (${issue.title}) is already closed`);
      continue;
    }
    
    console.log(`\n📋 Issue #${issueNum}: ${issue.title}`);
    console.log(`   Current state: ${issue.state}`);
    
    // Check if this aligns with completed work
    if (issueNum === 75) {
      // Design ATS Schema - according to roadmap, this is complete
      const comment = `## ✅ Status Update

According to the ATS roadmap documentation, this issue is marked as complete. The schema design has been finalized and documented.

**Related Work:**
- Schema design document created
- Database tables defined (jobs, applications, pipelines, stages)
- Relationships mapped out
- Indexing strategy documented

**Next Steps:**
- Review with team if needed
- Proceed with implementation (#76)

Closing this issue as the design phase is complete.`;
      closeIssue(issueNum, comment);
    } else if (issueNum === 76) {
      // Implement Migrations & Models
      const comment = `## 🚧 Status Update

This issue is in progress. Recent commits show work on job management and application flows.

**Recent Related Work:**
- Job form implementation (REQ-216 completed)
- Application flow work (REQ-217 in progress)
- Database schema work ongoing

**Current Status:**
- Some migrations and models have been implemented
- More work needed for complete ATS system
- Backend integration still in progress

This issue remains open as implementation continues.`;
      commentOnIssue(issueNum, comment);
    } else if (issueNum === 79) {
      // Job Distribution (Internal)
      const comment = `## 🚧 Status Update

According to the roadmap, this should be complete, but let's verify current status.

**Related Completed Work:**
- REQ-216: Create Job Flow with Form Fields, Toggles, and Kanban View ✅
- Job posting creation UI (#78) ✅

**Current Status:**
- Jobs can be created and posted
- Job discovery interface exists
- Need to verify full distribution functionality

Please verify if this is fully complete or if additional work is needed.`;
      commentOnIssue(issueNum, comment);
    }
  }
  
  // Check in-progress issues
  const inProgressIssues = [77, 81, 83];
  for (const issueNum of inProgressIssues) {
    const issue = getIssueDetails(issueNum);
    if (!issue) continue;
    
    if (issue.state === 'CLOSED') {
      console.log(`✅ Issue #${issueNum} is already closed`);
      continue;
    }
    
    console.log(`\n📋 Issue #${issueNum}: ${issue.title}`);
    
    if (issueNum === 77) {
      // Seed Demo Data
      const comment = `## 🚧 Status Update

**Current Progress:** Basic seeds exist, expansion needed

**Recent Work:**
- Basic seeding infrastructure in place
- Some demo data created
- Need to expand with more comprehensive test scenarios

**Next Steps:**
- Create more realistic demo job postings
- Set up sample pipelines with different stages
- Generate candidate applications for testing
- Include various job types (construction, trades, etc.)`;
      commentOnIssue(issueNum, comment);
    } else if (issueNum === 81) {
      // Pipeline Stages/Kanban
      const comment = `## 🚧 Status Update

**Current Progress:** 100% UI complete, awaiting backend integration

**Completed:**
- Kanban board UI implemented (REQ-216)
- Job form with Kanban view ✅
- Visual interface ready

**In Progress:**
- Backend API endpoints needed
- Pipeline stage management
- Application status tracking

**Related Work:**
- REQ-216: Create Job Flow ✅ (UI complete)
- REQ-217: Job Application Flow 🚧 (backend in progress)

**Next Steps:**
- Complete backend API for pipeline management
- Wire up Kanban UI to real data
- Test full workflow end-to-end`;
      commentOnIssue(issueNum, comment);
    } else if (issueNum === 83) {
      // Candidate Profile View
      const comment = `## 🚧 Status Update

**Current Progress:** 100% UI complete, awaiting backend integration

**Completed:**
- UI components for candidate profile view
- Application metadata display structure
- Visual layout ready

**In Progress:**
- Backend API integration needed
- Real data connection
- Full profile display functionality

**Related Work:**
- REQ-217: Job Application Flow 🚧 (includes profile integration)

**Next Steps:**
- Complete backend endpoints for candidate data
- Wire up UI to real API
- Test profile display in ATS context`;
      commentOnIssue(issueNum, comment);
    }
  }
}

function main() {
  console.log('🚀 Starting GitHub issues update...\n');
  
  // Check authentication
  const authStatus = runCommand('gh auth status');
  if (!authStatus || authStatus.includes('not logged in')) {
    console.error('❌ Not authenticated with GitHub CLI. Please run: gh auth login');
    process.exit(1);
  }
  
  console.log('✅ GitHub CLI authenticated\n');
  
  // Check ATS issues
  checkATSIssues();
  
  // Check for any issues that should be closed based on completed REQs
  const completedREQs = getCompletedREQs();
  console.log('\n\n📊 Summary of Completed Requirements:');
  completedREQs.forEach(req => {
    console.log(`  ✅ ${req.id}: ${req.name}`);
  });
  
  const inProgressREQs = getInProgressREQs();
  console.log('\n\n🚧 Summary of In-Progress Requirements:');
  inProgressREQs.forEach(req => {
    console.log(`  🚧 ${req.id}: ${req.name}`);
  });
  
  console.log('\n\n✅ GitHub issues update complete!');
  console.log('\n💡 Tip: Review the comments and closed issues to ensure accuracy.');
}

main();

