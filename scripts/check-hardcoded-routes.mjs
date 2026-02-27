#!/usr/bin/env node

import { execSync } from 'node:child_process'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])
const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  '.turbo',
  '.expo',
  'ios',
  'android',
  'dist',
  'build',
  'reports',
  'storybook-static',
])
// apps/forsured-web is a Next.js app with its own routing conventions (not ROUTES constants)
const IGNORE_PATHS = [path.join(ROOT, 'apps/forsured-web')]
const ALLOWLIST = new Set([
  path.join(ROOT, 'packages/core/constants/routes.ts'),
  path.join(ROOT, 'packages/scf-core/constants/routes.ts'),
])

const PATTERNS = [
  {
    regex: /router\.(?:push|replace)\(\s*['"`]\/[^'"`)]*/g,
    reason: 'router navigation should use ROUTES constants',
  },
  {
    regex: /pathname\s*:\s*['"`]\/[^'"`},]*/g,
    reason: 'pathname values must come from ROUTES constants',
  },
  {
    regex: /\bhref\s*=\s*['"`]\/[^'"`]*['"`]/g,
    reason: 'href props must use ROUTES constants',
  },
]

const violations = []

// Check if we're in a git context and should only check staged files
function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    })
    return new Set(
      output
        .split('\n')
        .filter(Boolean)
        .map((file) => path.join(ROOT, file))
    )
  } catch {
    return null // Not in git context or no staged files
  }
}

const stagedFiles = getStagedFiles()

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })

  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) {
      continue
    }

    const fullPath = path.join(directory, entry.name)

    if (IGNORE_PATHS.some((p) => fullPath.startsWith(p))) {
      continue
    }

    if (entry.isDirectory()) {
      await walk(fullPath)
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name)
      if (!EXTENSIONS.has(ext)) {
        continue
      }

      if (ALLOWLIST.has(fullPath)) {
        continue
      }

      await checkFile(fullPath)
    }
  }
}

async function checkFile(filePath) {
  // If we're checking staged files only, skip files not in the staged set
  if (stagedFiles !== null && !stagedFiles.has(filePath)) {
    return
  }

  const content = await readFile(filePath, 'utf8')

  for (const { regex, reason } of PATTERNS) {
    const matches = [...content.matchAll(regex)]
    for (const match of matches) {
      const line = content.slice(0, match.index).split('\n').length
      const snippet = match[0].trim().slice(0, 120)
      violations.push({ filePath, line, snippet, reason })
    }
  }
}

;(async () => {
  await walk(ROOT)

  if (violations.length > 0) {
    console.error('\n❌ Hardcoded route paths detected:')
    for (const violation of violations) {
      console.error(
        `  - ${path.relative(ROOT, violation.filePath)}:${violation.line}\n    ${violation.reason}: ${violation.snippet}`
      )
    }
    console.error('\nPlease replace string literals with ROUTES constants.')
    process.exit(1)
  } else {
    console.log('✅ No hardcoded route strings found.')
  }
})().catch((error) => {
  console.error('Failed to run route check:', error)
  process.exit(1)
})
