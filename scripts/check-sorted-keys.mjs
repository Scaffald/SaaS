#!/usr/bin/env node
/**
 * Script to check for unsorted object keys using Biome's assist actions.
 * Only checks staged files (when in git context) for fast pre-commit runs.
 * This runs as a warning check and doesn't fail the build.
 */

import { execSync } from 'child_process'
import path from 'path'

const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    })
    return output
      .split('\n')
      .filter(Boolean)
      .filter((f) => EXTENSIONS.has(path.extname(f)))
  } catch {
    return null
  }
}

const stagedFiles = getStagedFiles()

// If in git context but no relevant staged files, skip entirely
if (stagedFiles !== null && stagedFiles.length === 0) {
  process.exit(0)
}

// Build the biome command — check only staged files, or fall back to full repo
const target = stagedFiles !== null ? stagedFiles.join(' ') : '.'

try {
  const output = execSync(`pnpm biome check ${target} --assist-enabled=true 2>&1 || true`, {
    encoding: 'utf-8',
    stdio: 'pipe',
    maxBuffer: 10 * 1024 * 1024,
  })

  const lines = output.split('\n')
  let foundIssues = false
  let currentIssue = []
  let inUseSortedKeysBlock = false

  for (const line of lines) {
    if (line.includes('assist/source/useSortedKeys')) {
      if (currentIssue.length > 0) {
        console.warn(currentIssue.join('\n'))
        console.warn('')
      }
      currentIssue = [line]
      inUseSortedKeysBlock = true
      foundIssues = true
      continue
    }

    if (inUseSortedKeysBlock) {
      currentIssue.push(line)

      if (
        (line.match(/^[a-z]+\s+━━+/) && !line.includes('useSortedKeys')) ||
        line.includes('Some errors were emitted') ||
        line.includes(
          'check ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        )
      ) {
        if (currentIssue.length > 1) {
          console.warn(currentIssue.join('\n'))
          console.warn('')
        }
        currentIssue = []
        inUseSortedKeysBlock = false
      }
    }
  }

  if (currentIssue.length > 1) {
    console.warn(currentIssue.join('\n'))
    console.warn('')
  }

  if (foundIssues) {
    console.warn(
      "💡 Tip: Use your IDE's Quick Fix action (Cmd/Ctrl+.) on each file to fix sorted key issues."
    )
  }
} catch (error) {
  if (error.stdout) {
    const lines = error.stdout.split('\n')
    for (const line of lines) {
      if (line.includes('assist/source/useSortedKeys')) {
        console.warn(line)
      }
    }
  }
}

// Always exit with 0 so this doesn't fail the build
process.exit(0)
