// generate-apple-secret.js
//
// Produces an Apple OAuth client_secret JWT (ES256) for Supabase Auth.
// Uses Node's built-in crypto module — no jsonwebtoken dependency — so the
// same script runs in CI without installing anything.

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const base64UrlEncode = (input) => {
  const buf = typeof input === 'string' ? Buffer.from(input) : input
  return buf
    .toString('base64')
    .replace(/=+$/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

// JOSE ES256 signatures must be the raw `r || s` concatenation (64 bytes).
// Node's sign() returns DER-encoded ECDSA — convert before emitting.
const derToJose = (der) => {
  let offset = 2
  if (der[1] & 0x80) offset += der[1] & 0x7f
  const readInt = () => {
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

const signJwtEs256 = (claims, privateKeyPem, kid) => {
  const header = base64UrlEncode(JSON.stringify({ alg: 'ES256', kid, typ: 'JWT' }))
  const payload = base64UrlEncode(JSON.stringify(claims))
  const signingInput = `${header}.${payload}`
  const signer = crypto.createSign('SHA256')
  signer.update(signingInput)
  signer.end()
  const der = signer.sign({ key: privateKeyPem, format: 'pem' })
  const sig = base64UrlEncode(derToJose(der))
  return `${signingInput}.${sig}`
}

const DEFAULTS = {
  teamId: 'DAC62CF44G',
  keyId: 'P9JV7GWQNZ',
  clientId: 'com.scaffald.auth',
  privateKeyPath: './certs/apple-auth-signer.p8',
  audience: 'https://appleid.apple.com',
  expiryDays: 180, // Apple recommends max 6 months (180 days)
}

const HELP_MESSAGE = `
Usage: pnpm node scripts/supabase-apple-auth-generate.js [options]

Options:
  --team <teamId>           Apple Developer Team ID (default: ${DEFAULTS.teamId})
  --key <keyId>             Apple Auth Key ID (default: ${DEFAULTS.keyId})
  --client <clientId>       Services ID / Client ID (default: ${DEFAULTS.clientId})
  --key-path <path>         Path to .p8 private key (default: ${DEFAULTS.privateKeyPath})
  --key-inline <pem>        Inline PEM (overrides --key-path; for CI use)
  --audience <audience>     Audience claim (default: ${DEFAULTS.audience})
  --expires-in-days <days>  Token validity in days (default: ${DEFAULTS.expiryDays})
  --expires-in-seconds <s>  Token validity in seconds (overrides --expires-in-days)
  --token-only              Print only the JWT to stdout (for piping in scripts)
  --config                  Print Supabase configuration identifiers and exit
  --help                    Show this help message

Examples:
  pnpm node scripts/supabase-apple-auth-generate.js
  pnpm node scripts/supabase-apple-auth-generate.js --key-path ./certs/AuthKey_P9JV7GWQNZ.p8
  pnpm node scripts/supabase-apple-auth-generate.js --expires-in-days 90
  NEW=$(pnpm node scripts/supabase-apple-auth-generate.js --token-only)
`.trim()

const SUPABASE_CONFIG_IDENTIFIERS = ['DAC62CF44G.com.scaffald.app', 'DAC62CF44G.com.scaffald.auth']

const parseArgs = (argv) => {
  const args = {
    teamId: DEFAULTS.teamId,
    keyId: DEFAULTS.keyId,
    clientId: DEFAULTS.clientId,
    privateKeyPath: DEFAULTS.privateKeyPath,
    privateKeyInline: null,
    audience: DEFAULTS.audience,
    expiresInSeconds: DEFAULTS.expiryDays * 24 * 60 * 60,
    showHelp: false,
    showConfig: false,
    tokenOnly: false,
  }

  const entries = [...argv]
  while (entries.length) {
    const flag = entries.shift()

    switch (flag) {
      case '--team':
        args.teamId = entries.shift()
        break
      case '--key':
        args.keyId = entries.shift()
        break
      case '--client':
        args.clientId = entries.shift()
        break
      case '--key-path':
        args.privateKeyPath = entries.shift()
        break
      case '--key-inline':
        args.privateKeyInline = entries.shift()
        break
      case '--token-only':
        args.tokenOnly = true
        break
      case '--audience':
        args.audience = entries.shift()
        break
      case '--expires-in-days': {
        const days = Number(entries.shift())
        if (Number.isNaN(days) || days <= 0) {
          throw new Error('`--expires-in-days` must be a positive number')
        }
        args.expiresInSeconds = days * 24 * 60 * 60
        break
      }
      case '--expires-in-seconds': {
        const seconds = Number(entries.shift())
        if (Number.isNaN(seconds) || seconds <= 0) {
          throw new Error('`--expires-in-seconds` must be a positive number')
        }
        args.expiresInSeconds = seconds
        break
      }
      case '--config':
        args.showConfig = true
        break
      case '--help':
      case '-h':
      case '-?':
        args.showHelp = true
        break
      default:
        throw new Error(`Unknown flag: ${flag}`)
    }
  }

  return args
}

const main = () => {
  try {
    const args = parseArgs(process.argv.slice(2))

    if (args.showHelp) {
      console.log(HELP_MESSAGE)
      return
    }

    if (args.showConfig) {
      console.log('Supabase Apple OAuth configuration identifiers:')
      for (const identifier of SUPABASE_CONFIG_IDENTIFIERS) {
        console.log(`  - ${identifier}`)
      }
      return
    }

    let privateKey
    let keySource
    if (args.privateKeyInline) {
      privateKey = args.privateKeyInline.replace(/\\n/g, '\n')
      keySource = '<inline>'
    } else {
      const resolvedKeyPath = path.resolve(process.cwd(), args.privateKeyPath)
      if (!fs.existsSync(resolvedKeyPath)) {
        throw new Error(
          `Private key not found at ${resolvedKeyPath}. Pass --key-path to point to your AuthKey .p8 file, or --key-inline for CI use.`
        )
      }
      privateKey = fs.readFileSync(resolvedKeyPath, 'utf8')
      keySource = resolvedKeyPath
    }

    const issuedAt = Math.floor(Date.now() / 1000)
    const expiresAt = issuedAt + args.expiresInSeconds

    const token = signJwtEs256(
      {
        iss: args.teamId,
        iat: issuedAt,
        exp: expiresAt,
        aud: args.audience,
        sub: args.clientId,
      },
      privateKey,
      args.keyId
    )

    if (args.tokenOnly) {
      process.stdout.write(token)
      return
    }

    console.log('✅ Apple Sign In JWT generated successfully\n')
    console.log(`Team ID:        ${args.teamId}`)
    console.log(`Key ID:         ${args.keyId}`)
    console.log(`Client ID:      ${args.clientId}`)
    console.log(`Audience:       ${args.audience}`)
    console.log(`Issued At:      ${new Date(issuedAt * 1000).toISOString()}`)
    console.log(`Expires At:     ${new Date(expiresAt * 1000).toISOString()}`)
    console.log(`Private Key:    ${keySource}`)
    console.log('\nToken:\n')
    console.log(token)
  } catch (error) {
    console.error(`\n❌ Failed to generate JWT: ${error.message}\n`)
    console.error(HELP_MESSAGE)
    process.exitCode = 1
  }
}

main()
