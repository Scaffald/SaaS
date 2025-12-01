#!/usr/bin/env node
/**
 * Script to check for unsorted object keys using Biome's assist actions.
 * This runs as a warning check and doesn't fail the build.
 */

import { execSync } from 'child_process';

try {
  // Run biome check with assist enabled on the entire codebase
  // Use || true to prevent script from failing
  const output = execSync(
    'pnpm biome check . --assist-enabled=true 2>&1 || true',
    { encoding: 'utf-8', stdio: 'pipe', maxBuffer: 10 * 1024 * 1024 }
  );

  // Filter output for useSortedKeys assist actions only
  const lines = output.split('\n');
  let foundIssues = false;
  let currentIssue = [];
  let inUseSortedKeysBlock = false;

  for (const line of lines) {
    // Check if this line starts a useSortedKeys diagnostic
    if (line.includes('assist/source/useSortedKeys')) {
      if (currentIssue.length > 0) {
        // Print previous issue if any
        console.warn(currentIssue.join('\n'));
        console.warn('');
      }
      currentIssue = [line];
      inUseSortedKeysBlock = true;
      foundIssues = true;
      continue;
    }

    if (inUseSortedKeysBlock) {
      currentIssue.push(line);
      
      // Stop collecting when we hit:
      // 1. A new diagnostic (starts with word + dashes)
      // 2. The summary line ("Some errors were emitted")
      // 3. Empty line after a complete diagnostic block
      if (
        (line.match(/^[a-z]+\s+━━+/) && !line.includes('useSortedKeys')) ||
        line.includes('Some errors were emitted') ||
        line.includes('check ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      ) {
        if (currentIssue.length > 1) {
          console.warn(currentIssue.join('\n'));
          console.warn('');
        }
        currentIssue = [];
        inUseSortedKeysBlock = false;
      }
    }
  }

  // Print any remaining issue
  if (currentIssue.length > 1) {
    console.warn(currentIssue.join('\n'));
    console.warn('');
  }

  if (foundIssues) {
    console.warn('💡 Tip: Use your IDE\'s Quick Fix action (Cmd/Ctrl+.) on each file to fix sorted key issues.');
  }
} catch (error) {
  // Silently handle errors - this is a warning check, not a blocker
  if (error.stdout) {
    // Try to parse output even if command failed
    const lines = error.stdout.split('\n');
    for (const line of lines) {
      if (line.includes('assist/source/useSortedKeys')) {
        console.warn(line);
      }
    }
  }
}

// Always exit with 0 so this doesn't fail the build
process.exit(0);

