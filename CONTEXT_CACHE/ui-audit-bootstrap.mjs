#!/usr/bin/env node
import { exec } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const cacheDir = path.join(repoRoot, 'CONTEXT_CACHE')
const dbPath = path.join(cacheDir, 'ui_audit.db')
const schemaPath = path.join(cacheDir, 'schema.sql')
const gitignorePath = path.join(repoRoot, '.gitignore')

function log(msg) {
  console.log(`[ui-audit-bootstrap] ${msg}`)
}
function fail(msg, code = 1) {
  console.error(`[ui-audit-bootstrap] ${msg}`)
  process.exit(code)
}

// Parse args (very light)
const args = new Map(
  process.argv.slice(2).flatMap((a) => {
    const [k, v] = a.includes('=') ? a.split('=') : [a, true]
    return [[k.replace(/^--/, ''), v]]
  })
)
const userLevel = args.get('user-level') || 'regular'

// 1) Ensure CONTEXT_CACHE dir exists
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true })
log(`Using cache dir: ${cacheDir}`)

// 2) Ensure schema.sql exists (it should be committed with this repo)
if (!fs.existsSync(schemaPath)) {
  fail(`Missing schema file at ${schemaPath}. Please commit CONTEXT_CACHE/schema.sql and re-run.`)
}

// 3) Verify .gitignore contains CONTEXT_CACHE/
if (!fs.existsSync(gitignorePath)) fail(`.gitignore not found at ${gitignorePath}`)
const gi = fs.readFileSync(gitignorePath, 'utf8')
if (!gi.split(/\r?\n/).some((line) => line.trim() === 'CONTEXT_CACHE/')) {
  fail(
    'CONTEXT_CACHE/ not found in .gitignore. Please add a line with "CONTEXT_CACHE/" and re-run.'
  )
}
log('.gitignore contains CONTEXT_CACHE/')

// 4) Initialize SQLite db via `sqlite3` if available
function execP(cmd) {
  return new Promise((resolve, reject) =>
    exec(cmd, (e, stdout, stderr) =>
      e ? reject(new Error(stderr || e.message)) : resolve({ stdout, stderr })
    )
  )
}

async function ensureDb() {
  try {
    await execP(`sqlite3 --version`)
  } catch {
    log('sqlite3 CLI not found. You can install it or initialize the DB manually:')
    log(`- Create empty file: touch ${dbPath}`)
    log(`- Apply schema with sqlite3 when available: sqlite3 ${dbPath} < ${schemaPath}`)
    return // best-effort
  }
  try {
    await execP(`sqlite3 ${dbPath} < ${schemaPath}`)
    log(`SQLite DB initialized at ${dbPath}`)
  } catch (e) {
    fail(`Failed to initialize SQLite DB: ${e.message}`)
  }
}

// 5) Check Vibe-Kanban availability (best-effort)
async function checkVibeKanban() {
  // We cannot reliably detect MCP CLI here; provide helpful guidance instead.
  log('If Vibe-Kanban MCP is not running, open a new terminal and run:')
  log('  npx vibe-kanban')
}

;(async () => {
  log(`Bootstrap starting for user-level: ${userLevel}`)
  await ensureDb()
  await checkVibeKanban()
  log('Bootstrap complete. You can now run discovery/audit tickets.')
})()
