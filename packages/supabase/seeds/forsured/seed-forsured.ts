/**
 * ForSured Test Data Seeder
 *
 * Runs all ForSured seed SQL files via psql against the local Supabase database.
 *
 * Usage:
 *   pnpm seed:forsured                          (from packages/supabase)
 *   npx tsx seeds/forsured/seed-forsured.ts      (from packages/supabase)
 *
 * Prerequisites:
 *   - Supabase must be running (pnpm supa start)
 *   - Core migrations must be applied (happens automatically on supa start)
 */

import { execSync } from 'child_process'
import * as path from 'path'

// Re-export test IDs for use in tests
export * from './test-ids'

const SEED_DIR = __dirname
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

/**
 * Execute a SQL seed file via psql
 */
function executeSqlFile(filename: string): void {
  const filePath = path.join(SEED_DIR, filename)
  try {
    execSync(`psql "${DB_URL}" -f "${filePath}"`, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.resolve(SEED_DIR, '../..'), // packages/supabase root (for \i paths)
    })
  } catch (error: unknown) {
    const err = error as { stderr?: Buffer; stdout?: Buffer }
    const stderr = err.stderr?.toString() || ''
    const stdout = err.stdout?.toString() || ''
    // psql returns non-zero on warnings too; only fail on real errors
    if (stderr.includes('ERROR') || stdout.includes('ROLLBACK')) {
      const details = stderr || stdout
      throw new Error(`Failed to execute ${filename}:\n${details}`)
    }
  }
}

/**
 * Seed all ForSured test data
 */
export function seedForsuredTestData(): void {
  console.log('============================================')
  console.log('ForSured Test Data Seeder')
  console.log('============================================')
  console.log('')

  const steps: [string, string][] = [
    ['001_seed-users.sql', 'ForSured test users'],
    ['002_seed-organizations.sql', 'ForSured organizations'],
    ['003_seed-projects.sql', 'ForSured projects & subcontractors'],
    ['004_seed-policies.sql', 'ForSured documents, policies & compliance'],
    ['005_seed-tasks.sql', 'ForSured tasks & comments'],
    ['006_seed-relationships.sql', 'ForSured broker-client relationships'],
    ['008_seed-test-users-comprehensive.sql', 'Comprehensive data for test users'],
    ['009_seed-notifications.sql', 'Notifications for all users'],
    ['010_seed-broker-clients.sql', 'Broker-client relationship invitations'],
  ]

  for (let i = 0; i < steps.length; i++) {
    const [file, label] = steps[i]
    console.log(`Step ${i + 1}/${steps.length}: Seeding ${label}...`)
    executeSqlFile(file)
    console.log(`✅ ${label} seeded`)
  }

  console.log('')
  console.log('============================================')
  console.log('ForSured Test Data Complete!')
  console.log('============================================')
  console.log('')
  console.log('Test Users (from "/" page):')
  console.log('  - test-gc@forsured.test (Manager)')
  console.log('  - test-contractor@forsured.test (Contractor)')
  console.log('  - test-broker@forsured.test (Broker)')
  console.log('')
  console.log('Additional Test Users:')
  console.log('  - gc-fresh@forsured-test.com')
  console.log('  - gc-active@forsured-test.com')
  console.log('  - contractor-active@forsured-test.com')
  console.log('  - broker-active@forsured-test.com')
  console.log('  - admin@forsured-test.com')
  console.log('')
  console.log('Password for all: ForsuredTest123!')
  console.log('============================================')
}

// Run seeder if called directly
const isMainModule = require.main === module || process.argv[1]?.endsWith('seed-forsured.ts')
if (isMainModule) {
  try {
    seedForsuredTestData()
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}
