// generate-apple-secret.js
import fs from 'fs'
import jwt from 'jsonwebtoken'
import path from 'path'

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
  --audience <audience>     Audience claim (default: ${DEFAULTS.audience})
  --expires-in-days <days>  Token validity in days (default: ${DEFAULTS.expiryDays})
  --expires-in-seconds <s>  Token validity in seconds (overrides --expires-in-days)
  --config                  Print Supabase configuration identifiers and exit
  --help                    Show this help message

Examples:
  pnpm node scripts/supabase-apple-auth-generate.js
  pnpm node scripts/supabase-apple-auth-generate.js --key-path ./certs/AuthKey_P9JV7GWQNZ.p8
  pnpm node scripts/supabase-apple-auth-generate.js --expires-in-days 90
`.trim()

const SUPABASE_CONFIG_IDENTIFIERS = ['DAC62CF44G.com.scaffald.app', 'DAC62CF44G.com.scaffald.auth']

const parseArgs = (argv) => {
  const args = {
    teamId: DEFAULTS.teamId,
    keyId: DEFAULTS.keyId,
    clientId: DEFAULTS.clientId,
    privateKeyPath: DEFAULTS.privateKeyPath,
    audience: DEFAULTS.audience,
    expiresInSeconds: DEFAULTS.expiryDays * 24 * 60 * 60,
    showHelp: false,
    showConfig: false,
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

    const resolvedKeyPath = path.resolve(process.cwd(), args.privateKeyPath)

    if (!fs.existsSync(resolvedKeyPath)) {
      throw new Error(
        `Private key not found at ${resolvedKeyPath}. Pass --key-path to point to your AuthKey .p8 file.`
      )
    }

    const privateKey = fs.readFileSync(resolvedKeyPath, 'utf8')
    const issuedAt = Math.floor(Date.now() / 1000)
    const expiresAt = issuedAt + args.expiresInSeconds

    const token = jwt.sign(
      {
        iss: args.teamId,
        iat: issuedAt,
        exp: expiresAt,
        aud: args.audience,
        sub: args.clientId,
      },
      privateKey,
      {
        algorithm: 'ES256',
        keyid: args.keyId,
      }
    )

    console.log('✅ Apple Sign In JWT generated successfully\n')
    console.log(`Team ID:        ${args.teamId}`)
    console.log(`Key ID:         ${args.keyId}`)
    console.log(`Client ID:      ${args.clientId}`)
    console.log(`Audience:       ${args.audience}`)
    console.log(`Issued At:      ${new Date(issuedAt * 1000).toISOString()}`)
    console.log(`Expires At:     ${new Date(expiresAt * 1000).toISOString()}`)
    console.log(`Private Key:    ${resolvedKeyPath}`)
    console.log('\nToken:\n')
    console.log(token)
  } catch (error) {
    console.error(`\n❌ Failed to generate JWT: ${error.message}\n`)
    console.error(HELP_MESSAGE)
    process.exitCode = 1
  }
}

main()
