#!/usr/bin/env tsx
/**
 * Decode APPLE_SECRET (Apple OAuth client_secret JWT) and check its `exp`
 * claim. Fails (exit 1) if the secret is expired or expires within the
 * configured warning window. Logs a friendly message either way.
 *
 * Apple recommends max 180-day client secret lifetime; we want to know
 * *before* the secret expires (SC-60 root cause was a silent expiry that
 * broke prod Apple sign-in for 9+ days before anyone noticed).
 *
 * Usage:
 *   pnpm tsx scripts/check-apple-secret-expiry.ts
 *   pnpm tsx scripts/check-apple-secret-expiry.ts --warn-days 21
 *   pnpm tsx scripts/check-apple-secret-expiry.ts --secret "$APPLE_SECRET"
 *
 * Env:
 *   APPLE_SECRET  Apple OAuth client_secret JWT (required if --secret omitted)
 *
 * Rotation: `pnpm node scripts/supabase-apple-auth-generate.js` produces a
 * fresh 180-day JWT. Update the rotation in:
 *   1. Supabase dashboard → Auth → Providers → Apple (per env)
 *   2. EAS Secrets (per build profile)
 *   3. `.env.production`, `.env.preview`, `.env.dev`, `.env.dev-local`
 */

type DecodedJwt = {
  iat?: number
  exp?: number
  sub?: string
  aud?: string
  iss?: string
}

const DEFAULT_WARN_DAYS = 14

function parseArgs(argv: string[]): { warnDays: number; secret: string | undefined } {
  let warnDays = DEFAULT_WARN_DAYS
  let secret: string | undefined

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--warn-days') {
      const value = argv[++i]
      const parsed = Number.parseInt(value ?? '', 10)
      if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error(`Invalid --warn-days value: ${value}`)
      }
      warnDays = parsed
    } else if (arg === '--secret') {
      secret = argv[++i]
    } else if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: pnpm tsx scripts/check-apple-secret-expiry.ts [--warn-days N] [--secret JWT]'
      )
      process.exit(0)
    }
  }

  return { warnDays, secret: secret ?? process.env.APPLE_SECRET }
}

function decodeJwtPayload(jwt: string): DecodedJwt {
  const parts = jwt.split('.')
  if (parts.length !== 3) {
    throw new Error('APPLE_SECRET does not look like a JWT (expected 3 base64 segments)')
  }
  const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
  const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4)
  const decoded = Buffer.from(padded, 'base64').toString('utf8')
  return JSON.parse(decoded) as DecodedJwt
}

function main() {
  const { warnDays, secret } = parseArgs(process.argv.slice(2))

  if (!secret) {
    console.error('error: APPLE_SECRET is not set (pass --secret or export APPLE_SECRET)')
    process.exit(2)
  }

  let payload: DecodedJwt
  try {
    payload = decodeJwtPayload(secret.replace(/^["']|["']$/g, ''))
  } catch (err) {
    console.error(`error: failed to decode APPLE_SECRET: ${(err as Error).message}`)
    process.exit(2)
  }

  if (typeof payload.exp !== 'number') {
    console.error('error: APPLE_SECRET payload has no `exp` claim')
    process.exit(2)
  }

  const nowSec = Math.floor(Date.now() / 1000)
  const expSec = payload.exp
  const remainingSec = expSec - nowSec
  const remainingDays = Math.floor(remainingSec / 86400)
  const expIso = new Date(expSec * 1000).toISOString()

  console.log(`Apple client_secret`)
  console.log(`  sub:  ${payload.sub ?? '<unset>'}`)
  console.log(`  iss:  ${payload.iss ?? '<unset>'}`)
  console.log(`  exp:  ${expIso} (${remainingDays} days remaining)`)

  if (remainingSec <= 0) {
    console.error(`error: APPLE_SECRET expired ${-remainingDays} day(s) ago`)
    console.error('  Rotate with: pnpm node scripts/supabase-apple-auth-generate.js')
    process.exit(1)
  }

  if (remainingDays < warnDays) {
    console.error(
      `error: APPLE_SECRET expires in ${remainingDays} day(s), threshold is ${warnDays}`
    )
    console.error('  Rotate now: pnpm node scripts/supabase-apple-auth-generate.js')
    process.exit(1)
  }

  console.log('ok')
  process.exit(0)
}

main()
