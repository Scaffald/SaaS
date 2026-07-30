#!/usr/bin/env node
/**
 * Starts the Expo web dev server, clearing Metro's cache when the backend
 * this build points at has changed since the last run.
 *
 * `pnpm web`, `pnpm web:local` and `pnpm web:remote` load different env files
 * but share one Metro cache, and Metro bakes EXPO_PUBLIC_* values into the
 * bundle at transform time. Switching between them therefore serves a bundle
 * built against the *previous* backend until someone happens to run
 * `expo start -c`. That is the trigger for #376: auth reads the new value at
 * runtime while the SDK keeps the stale baked one, so the two talk to
 * different Supabase projects and an onboarded user gets bounced to
 * /onboarding by a prerequisites check aimed at the wrong database.
 *
 * Fingerprinting only the variables that select a backend is deliberate.
 * Clearing on every env change would clear constantly (feature flags, keys)
 * and retrain everyone to ignore it; clearing on nothing is where we started.
 */

import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const STAMP = join(ROOT, 'apps/scaffald/.expo/.backend-fingerprint')

/** Only vars that decide *which backend* — see the header. */
const BACKEND_VARS = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SCAFFALD_API_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
]

/**
 * `web:local` and `web:remote` run under dotenv-cli, so their values are
 * already in process.env by the time this runs. Bare `pnpm web` leaves .env to
 * Expo, which loads it later — so fall back to reading the file ourselves.
 * Without the fallback the fingerprint would be empty for the exact command
 * most likely to inherit a stale cache.
 */
function resolveBackendEnv() {
  const resolved = {}
  const fromFile = parseEnvFile(join(ROOT, '.env'))
  for (const key of BACKEND_VARS) {
    resolved[key] = process.env[key] ?? fromFile[key] ?? ''
  }
  return resolved
}

function parseEnvFile(path) {
  if (!existsSync(path)) return {}
  const out = {}
  for (const rawLine of readFileSync(path, 'utf8').split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    if (!BACKEND_VARS.includes(key)) continue
    // Strip surrounding quotes; leave the value otherwise untouched.
    out[key] = line
      .slice(eq + 1)
      .trim()
      .replace(/^(['"])(.*)\1$/, '$2')
  }
  return out
}

const env = resolveBackendEnv()
const fingerprint = createHash('sha256')
  .update(BACKEND_VARS.map((k) => `${k}=${env[k]}`).join('\n'))
  .digest('hex')
  .slice(0, 16)

const previous = existsSync(STAMP) ? readFileSync(STAMP, 'utf8').trim() : ''
const changed = previous !== '' && previous !== fingerprint

if (changed) {
  const target = env.EXPO_PUBLIC_SCAFFALD_API_URL || env.EXPO_PUBLIC_SUPABASE_URL || '(unset)'
  console.log(`\n⟳  Backend changed since the last run — clearing Metro's cache.`)
  console.log(`   now targeting: ${target}`)
  console.log(`   (skipping this would serve a bundle built against the old backend — #376)\n`)
} else if (previous === '') {
  console.log(`\n⟳  No previous run recorded — clearing Metro's cache once to start clean.\n`)
}

mkdirSync(dirname(STAMP), { recursive: true })
writeFileSync(STAMP, fingerprint)

// Clear on a change, and on a first run — an unfingerprinted cache is exactly
// the pre-#376 state and cannot be trusted.
const args = ['start', '--web', ...(changed || previous === '' ? ['-c'] : [])]

const child = spawn('npx', ['expo', ...args], {
  cwd: join(ROOT, 'apps/scaffald'),
  stdio: 'inherit',
  env: process.env,
})

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  else process.exit(code ?? 0)
})
