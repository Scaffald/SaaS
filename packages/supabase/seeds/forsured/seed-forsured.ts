/**
 * ForSured Test Data Seeder
 *
 * Programmatic seeder for ForSured test data.
 * Uses Supabase Admin API to create deterministic test data.
 *
 * Usage:
 *   npx tsx packages/supabase/seeds/forsured/seed-forsured.ts
 *
 * Prerequisites:
 *   - SUPABASE_URL environment variable
 *   - SUPABASE_SERVICE_ROLE_KEY environment variable
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Re-export test IDs for use in tests
export * from './test-ids'

// Environment validation
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
}

// Create service role client (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * Execute a SQL file against the database
 */
async function executeSqlFile(filename: string): Promise<void> {
  const filePath = path.join(__dirname, filename)
  const sql = fs.readFileSync(filePath, 'utf-8')

  // Remove psql meta-commands (\echo, \i) and execute the SQL
  const cleanSql = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('\\'))
    .join('\n')

  const { error } = await supabase.rpc('exec_sql', { sql: cleanSql })

  if (error) {
    throw new Error(`Failed to execute ${filename}: ${error.message}`)
  }
}

/**
 * Clear all ForSured test data
 * Uses cascade delete from the top-level tables
 */
export async function clearForsuredTestData(): Promise<void> {
  console.log('Clearing ForSured test data...')

  // Delete in reverse dependency order
  const tables = [
    'forsured.status_history',
    'forsured.comments',
    'forsured.attachments',
    'forsured.tasks',
    'forsured.compliance_scores',
    'forsured.endorsements',
    'forsured.policies',
    'forsured.documents',
    'forsured.requirements',
    'forsured.project_participants',
    'forsured.subcontractors',
    'forsured.projects',
  ]

  for (const table of tables) {
    const { error } = await supabase
      .from(table.replace('forsured.', ''))
      .delete()
      .gte('id', '50000000-0000-0000-0000-000000000000')
      .lte('id', '7fffffff-ffff-ffff-ffff-ffffffffffff')

    if (error && !error.message.includes('does not exist')) {
      console.warn(`Warning clearing ${table}: ${error.message}`)
    }
  }

  // Clear test users from auth.users
  await supabase.auth.admin.deleteUser('50000000-0000-0000-0000-000000000001')
  // Note: This will cascade to core.users via trigger

  console.log('✅ ForSured test data cleared')
}

/**
 * Seed all ForSured test data
 */
export async function seedForsuredTestData(): Promise<void> {
  console.log('============================================')
  console.log('ForSured Test Data Seeder')
  console.log('============================================')
  console.log('')

  try {
    // Step 1: Seed Users
    console.log('Step 1/9: Seeding ForSured test users...')
    await executeSqlFile('001_seed-users.sql')
    console.log('✅ Users seeded')

    // Step 2: Seed Organizations
    console.log('Step 2/9: Seeding ForSured organizations...')
    await executeSqlFile('002_seed-organizations.sql')
    console.log('✅ Organizations seeded')

    // Step 3: Seed Projects & Subcontractors
    console.log('Step 3/9: Seeding ForSured projects & subcontractors...')
    await executeSqlFile('003_seed-projects.sql')
    console.log('✅ Projects & subcontractors seeded')

    // Step 4: Seed Documents, Policies & Compliance
    console.log('Step 4/9: Seeding ForSured documents, policies & compliance...')
    await executeSqlFile('004_seed-policies.sql')
    console.log('✅ Documents, policies & compliance seeded')

    // Step 5: Seed Tasks & Comments
    console.log('Step 5/9: Seeding ForSured tasks & comments...')
    await executeSqlFile('005_seed-tasks.sql')
    console.log('✅ Tasks & comments seeded')

    // Step 6: Seed Broker-Client Relationships
    console.log('Step 6/9: Seeding ForSured broker-client relationships...')
    await executeSqlFile('006_seed-relationships.sql')
    console.log('✅ Broker-client relationships seeded')

    // Step 7: Seed Comprehensive Data for Test Users
    console.log('Step 7/9: Seeding comprehensive data for test users...')
    await executeSqlFile('008_seed-test-users-comprehensive.sql')
    console.log('✅ Test users comprehensive data seeded')

    // Step 8: Seed Notifications
    console.log('Step 8/9: Seeding notifications for all users...')
    await executeSqlFile('009_seed-notifications.sql')
    console.log('✅ Notifications seeded')

    // Step 9: Seed Broker-Client Relationship Invitations
    console.log('Step 9/9: Seeding broker-client relationship invitations...')
    await executeSqlFile('010_seed-broker-clients.sql')
    console.log('✅ Broker-client invitations seeded')

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
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  }
}

/**
 * Reset and re-seed ForSured test data
 */
export async function resetForsuredTestData(): Promise<void> {
  await clearForsuredTestData()
  await seedForsuredTestData()
}

// Run seeder if called directly
if (require.main === module) {
  seedForsuredTestData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
