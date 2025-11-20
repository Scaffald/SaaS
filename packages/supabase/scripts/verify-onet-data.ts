#!/usr/bin/env tsx
/**
 * Verify O*NET data was seeded correctly
 */

import { Pool } from 'pg'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required')
  process.exit(1)
}

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL })

  try {
    console.log('🔍 Verifying O*NET data...\n')

    const tables = [
      'content_model_reference',
      'scales_reference',
      'occupation_data',
      'abilities',
      'skills',
      'knowledge',
      'work_activities',
      'work_styles',
      'work_values',
      'interests',
      'task_statements',
      'task_ratings',
      'technology_skills',
      'tools_used',
      'alternate_titles',
      'related_occupations',
    ]

    let totalRows = 0

    for (const table of tables) {
      const result = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM onet.${table}`
      )
      const count = Number.parseInt(result.rows[0].count, 10)
      totalRows += count
      console.log(`  ✓ onet.${table.padEnd(30)} ${count.toLocaleString().padStart(10)} rows`)
    }

    console.log(`\n${'='.repeat(50)}`)
    console.log(`  Total rows: ${totalRows.toLocaleString()}`)
    console.log('='.repeat(50))

    // Sample some data
    console.log('\n📋 Sample occupations:')
    const occupations = await pool.query(
      `SELECT onetsoc_code, title FROM onet.occupation_data LIMIT 5`
    )
    for (const occ of occupations.rows) {
      console.log(`  • ${occ.onetsoc_code}: ${occ.title}`)
    }

    console.log('\n✅ O*NET data verification complete!\n')
  } catch (error) {
    console.error('❌ Verification failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
