import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const runIdFlagIndex = process.argv.indexOf('--run-id')
const runId =
  (runIdFlagIndex !== -1 && process.argv[runIdFlagIndex + 1]) ||
  process.env.RUN_ID ||
  randomBytes(4).toString('hex')

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.warn('Skipping run account creation; missing Supabase service credentials')
  process.exit(0)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const makePassword = () => `Run-${runId}-${randomBytes(5).toString('hex')}!`

const accounts = [
  { email: `ci-${runId}-admin@example.test`, role: 'admin' as const },
  { email: `ci-${runId}-member@example.test`, role: 'member' as const },
]

async function createAccounts() {
  const created = [] as { email: string; password: string; role: string }[]

  for (const account of accounts) {
    const password = makePassword()
    const { error } = await supabase.auth.admin.createUser({
      email: account.email,
      password,
      user_metadata: { role: account.role, runId },
      email_confirm: true,
    })

    if (error) {
      throw new Error(`Failed to create ${account.email}: ${error.message}`)
    }

    created.push({ email: account.email, password, role: account.role })
  }

  const artifactsDir = join(process.cwd(), 'artifacts')
  mkdirSync(artifactsDir, { recursive: true })
  const outputPath = join(artifactsDir, `run-accounts-${runId}.json`)
  writeFileSync(outputPath, JSON.stringify({ runId, accounts: created }, null, 2))

  console.log(`Generated run accounts for ${runId} at ${outputPath}`)
}

createAccounts().catch((error) => {
  console.error(error)
  process.exit(1)
})
