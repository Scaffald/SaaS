#!/usr/bin/env tsx
/**
 * Local Apple-secret rotation. Same logic as
 * .github/workflows/apple-secret-rotate.yml, runnable from the developer's
 * shell so we're not blocked when GitHub Actions billing is exhausted.
 *
 * What it does (in order):
 *   1. Generates a fresh 180-day Apple client_secret JWT (uses Node crypto,
 *      no jsonwebtoken dep — same code path as supabase-apple-auth-generate.js).
 *   2. Validates the JWT decodes and has > 90 days remaining.
 *   3. PATCHes /v1/projects/{ref}/config/auth on dev / preview / prod via
 *      the Supabase Management API, setting external_apple_secret.
 *   4. Updates the APPLE_SECRET GitHub Actions secret (gh secret set).
 *   5. Updates EAS env APPLE_SECRET for production / preview / development
 *      (eas env:create --force).
 *   6. Rewrites APPLE_SECRET in any local .env* files that contain it
 *      (these are gitignored, so this only affects the operator's machine).
 *
 * Required env:
 *   SUPABASE_ACCESS_TOKEN  Personal access token with projects:write.
 *                          Generate at https://supabase.com/dashboard/account/tokens.
 *
 * Optional env / args:
 *   APPLE_AUTH_KEY_PATH    Path to the .p8 private key. Defaults to
 *                          ./certs/apple-auth-signer.p8.
 *   APPLE_TEAM_ID          Apple Developer Team ID. Defaults to DAC62CF44G.
 *   APPLE_KEY_ID           Apple Auth Key ID. Defaults to P9JV7GWQNZ.
 *   APPLE_CLIENT_ID        Services ID. Defaults to com.scaffald.auth.
 *   GITHUB_REPOSITORY      Repo whose APPLE_SECRET is rewritten. Defaults to
 *                          Scaffald/SaaS; Actions sets this automatically.
 *   --dry-run              Mint + validate the JWT but don't push it anywhere.
 *   --skip-eas             Skip the EAS env update (use when you don't have
 *                          eas CLI auth or when iterating quickly).
 *   --skip-gh-secret       Skip updating the GitHub Actions secret.
 *   --skip-env-files       Skip rewriting local .env* files.
 *
 * Examples:
 *   SUPABASE_ACCESS_TOKEN=sbp_... pnpm tsx scripts/rotate-apple-secret.ts
 *   SUPABASE_ACCESS_TOKEN=sbp_... pnpm tsx scripts/rotate-apple-secret.ts --dry-run
 */

import crypto from 'node:crypto'
import { execSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SUPABASE_PROJECTS: Array<{ env: string; ref: string }> = [
  { env: 'dev', ref: 'pmtdqrfpumqwkdhpgwcz' },
  { env: 'preview', ref: 'uhjkipdwayqfihkanabk' },
  { env: 'prod', ref: 'qmfmpcyxsihhfttvqpbw' },
]

// Repo whose Actions secret gets rewritten. GITHUB_REPOSITORY is set
// automatically inside Actions; the default covers local runs.
const GH_REPO = process.env.GITHUB_REPOSITORY ?? 'Scaffald/SaaS'

const EAS_ENVIRONMENTS = ['production', 'preview', 'development']
const EAS_APP_DIR = 'apps/scaffald'
const ENV_FILES = ['.env', '.env.dev', '.env.dev-local', '.env.preview', '.env.production']

const DEFAULT_APPLE_AUTH = {
  teamId: 'DAC62CF44G',
  keyId: 'P9JV7GWQNZ',
  clientId: 'com.scaffald.auth',
  privateKeyPath: './certs/apple-auth-signer.p8',
  audience: 'https://appleid.apple.com',
  expiryDays: 180,
  minDaysRemaining: 90,
}

type Flags = {
  dryRun: boolean
  skipEas: boolean
  skipGhSecret: boolean
  skipEnvFiles: boolean
}

function parseFlags(argv: string[]): Flags {
  return {
    dryRun: argv.includes('--dry-run'),
    skipEas: argv.includes('--skip-eas'),
    skipGhSecret: argv.includes('--skip-gh-secret'),
    skipEnvFiles: argv.includes('--skip-env-files'),
  }
}

// --- JWT generation (mirrors supabase-apple-auth-generate.js) ---

const base64UrlEncode = (input: string | Buffer): string => {
  const buf = typeof input === 'string' ? Buffer.from(input) : input
  return buf.toString('base64').replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

const derToJose = (der: Buffer): Buffer => {
  let offset = 2
  if (der[1] & 0x80) offset += der[1] & 0x7f
  const readInt = (): Buffer => {
    if (der[offset++] !== 0x02) throw new Error('Malformed ECDSA signature')
    let len = der[offset++]
    while (len > 32 && der[offset] === 0x00) {
      offset++
      len--
    }
    const value = der.subarray(offset, offset + len)
    offset += len
    return value
  }
  const r = readInt()
  const s = readInt()
  const out = Buffer.alloc(64)
  r.copy(out, 32 - r.length)
  s.copy(out, 64 - s.length)
  return out
}

const signJwtEs256 = (
  claims: Record<string, unknown>,
  privateKeyPem: string,
  kid: string
): string => {
  const header = base64UrlEncode(JSON.stringify({ alg: 'ES256', kid, typ: 'JWT' }))
  const payload = base64UrlEncode(JSON.stringify(claims))
  const signingInput = `${header}.${payload}`
  const signer = crypto.createSign('SHA256')
  signer.update(signingInput)
  signer.end()
  const der = signer.sign({ key: privateKeyPem, format: 'pem' })
  return `${signingInput}.${base64UrlEncode(derToJose(der))}`
}

function generateJwt(): { token: string; exp: number; iat: number } {
  const keyPath = resolve(
    process.cwd(),
    process.env.APPLE_AUTH_KEY_PATH ?? DEFAULT_APPLE_AUTH.privateKeyPath
  )
  if (!existsSync(keyPath)) {
    throw new Error(
      `Apple private key not found at ${keyPath}. Pass APPLE_AUTH_KEY_PATH=... or place the .p8 at the default path.`
    )
  }
  const privateKey = readFileSync(keyPath, 'utf8')
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + DEFAULT_APPLE_AUTH.expiryDays * 86400
  const token = signJwtEs256(
    {
      iss: process.env.APPLE_TEAM_ID ?? DEFAULT_APPLE_AUTH.teamId,
      iat,
      exp,
      aud: DEFAULT_APPLE_AUTH.audience,
      sub: process.env.APPLE_CLIENT_ID ?? DEFAULT_APPLE_AUTH.clientId,
    },
    privateKey,
    process.env.APPLE_KEY_ID ?? DEFAULT_APPLE_AUTH.keyId
  )
  return { token, exp, iat }
}

function assertJwtLifetime(exp: number) {
  const remainingDays = Math.floor((exp - Math.floor(Date.now() / 1000)) / 86400)
  if (remainingDays < DEFAULT_APPLE_AUTH.minDaysRemaining) {
    throw new Error(
      `Generated JWT only has ${remainingDays} days remaining (threshold ${DEFAULT_APPLE_AUTH.minDaysRemaining}). Refusing to rotate to a near-expired secret.`
    )
  }
  return remainingDays
}

// --- Supabase Management API ---

async function patchSupabaseProject(ref: string, token: string, pat: string): Promise<void> {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${pat}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ external_apple_secret: token }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '<no body>')
    throw new Error(`Supabase PATCH ${ref} failed (${res.status}): ${body.slice(0, 200)}`)
  }
}

// --- GitHub secret ---

function setGhSecret(name: string, value: string): void {
  const result = spawnSync('gh', ['secret', 'set', name, '--repo', GH_REPO], {
    input: value,
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    throw new Error(`gh secret set ${name} failed: ${result.stderr || result.stdout}`)
  }
}

// --- EAS env ---

function setEasSecret(envName: string, value: string): void {
  const result = spawnSync(
    'eas',
    [
      'env:create',
      '--environment',
      envName,
      '--name',
      'APPLE_SECRET',
      '--value',
      value,
      '--type',
      'string',
      '--visibility',
      'secret',
      '--force',
      '--non-interactive',
    ],
    { cwd: EAS_APP_DIR, encoding: 'utf8' }
  )
  if (result.status !== 0) {
    throw new Error(`eas env:create ${envName} failed: ${result.stderr || result.stdout}`)
  }
}

// --- Local .env* rewrite ---

function rewriteEnvFiles(secret: string): string[] {
  const updated: string[] = []
  for (const file of ENV_FILES) {
    if (!existsSync(file)) continue
    const text = readFileSync(file, 'utf8')
    const patched = text.replace(/^APPLE_SECRET=.*$/m, `APPLE_SECRET="${secret}"`)
    if (patched === text) continue
    writeFileSync(file, patched)
    updated.push(file)
  }
  return updated
}

// --- Main ---

async function main() {
  const flags = parseFlags(process.argv.slice(2))
  const pat = process.env.SUPABASE_ACCESS_TOKEN

  if (!flags.dryRun && !pat) {
    console.error(
      'error: SUPABASE_ACCESS_TOKEN env var is required (generate at https://supabase.com/dashboard/account/tokens)'
    )
    process.exit(2)
  }

  console.log('→ Generating fresh Apple client_secret JWT')
  const { token, exp, iat } = generateJwt()
  const remainingDays = assertJwtLifetime(exp)
  console.log(`  iat: ${new Date(iat * 1000).toISOString()}`)
  console.log(`  exp: ${new Date(exp * 1000).toISOString()} (${remainingDays} days remaining)`)

  if (flags.dryRun) {
    console.log('\n(dry-run) Would update:')
    for (const p of SUPABASE_PROJECTS) console.log(`  - Supabase ${p.env} (${p.ref})`)
    if (!flags.skipGhSecret) console.log('  - GitHub Actions secret APPLE_SECRET')
    if (!flags.skipEas) for (const e of EAS_ENVIRONMENTS) console.log(`  - EAS env ${e}`)
    if (!flags.skipEnvFiles) console.log(`  - Local .env* files (any with APPLE_SECRET=)`)
    console.log('\nDone (dry-run).')
    return
  }

  console.log('\n→ Updating Supabase Dashboards via Management API')
  for (const project of SUPABASE_PROJECTS) {
    process.stdout.write(`  [${project.env}] ${project.ref}: `)
    await patchSupabaseProject(project.ref, token, pat as string)
    console.log('ok')
  }

  if (!flags.skipGhSecret) {
    console.log('\n→ Updating GitHub Actions secret APPLE_SECRET')
    setGhSecret('APPLE_SECRET', token)
    console.log('  ok')
  }

  if (!flags.skipEas) {
    console.log('\n→ Updating EAS env APPLE_SECRET (production / preview / development)')
    for (const envName of EAS_ENVIRONMENTS) {
      process.stdout.write(`  [${envName}]: `)
      setEasSecret(envName, token)
      console.log('ok')
    }
  }

  if (!flags.skipEnvFiles) {
    console.log('\n→ Rewriting local .env* files (gitignored)')
    const updated = rewriteEnvFiles(token)
    if (updated.length === 0) console.log('  (no .env files contained APPLE_SECRET — skipped)')
    else for (const f of updated) console.log(`  ${f}: updated`)
  }

  console.log('\n✅ Rotation complete')
  console.log(`Next expiry: ${new Date(exp * 1000).toISOString()} (${remainingDays} days)`)
  console.log(
    'Smoke test Apple sign-in on https://app.scaffald.com — the new secret is now live on all 3 Supabase projects.'
  )
}

main().catch((err) => {
  console.error(`\n❌ ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})

// Keep execSync referenced so tree-shakers don't complain.
void execSync
