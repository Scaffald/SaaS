import { Client } from 'pg'

const DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres'

async function testSearch() {
  const client = new Client({ connectionString: DATABASE_URL })

  try {
    console.log('🔌 Connecting to database...')
    await client.connect()
    console.log('✓ Connected\n')

    // Test 1: Search for "Ferris"
    console.log('🔍 Test 1: Searching for "ferris" (no country filter)...')
    const result1 = await client.query(
      'SELECT id, name, country, state_province FROM data.search_universities($1, NULL, 5)',
      ['ferris']
    )
    console.log(`Found ${result1.rows.length} results:`)
    for (const row of result1.rows) {
      console.log(
        `  - ${row.name} (${row.state_province ? `${row.state_province}, ` : ''}${row.country})`
      )
    }

    // Test 1b: Search for "Ferris" with United States filter (like the app does)
    console.log('\n🔍 Test 1b: Searching for "ferris" with country="United States"...')
    const result1b = await client.query(
      'SELECT id, name, country, state_province FROM data.search_universities($1, $2, 5)',
      ['ferris', 'United States']
    )
    console.log(`Found ${result1b.rows.length} results:`)
    for (const row of result1b.rows) {
      console.log(
        `  - ${row.name} (${row.state_province ? `${row.state_province}, ` : ''}${row.country})`
      )
    }

    // Test 2: Search for "Michigan"
    console.log('\n🔍 Test 2: Searching for "michigan"...')
    const result2 = await client.query(
      'SELECT id, name, country, state_province FROM data.search_universities($1, NULL, 5)',
      ['michigan']
    )
    console.log(`Found ${result2.rows.length} results:`)
    for (const row of result2.rows) {
      console.log(
        `  - ${row.name} (${row.state_province ? row.state_province + ', ' : ''}${row.country})`
      )
    }

    // Test 3: Search for "University" (should return many)
    console.log('\n🔍 Test 3: Searching for "university" (limit 5)...')
    const result3 = await client.query(
      'SELECT id, name, country FROM data.search_universities($1, NULL, 5)',
      ['university']
    )
    console.log(`Found ${result3.rows.length} results:`)
    for (const row of result3.rows) {
      console.log(`  - ${row.name} (${row.country})`)
    }

    // Test 4: Total count
    console.log('\n📊 Total universities in database:')
    const countResult = await client.query('SELECT COUNT(*) FROM data.universities')
    console.log(`  Total: ${countResult.rows[0].count}`)

    console.log('\n✅ All tests completed successfully!')
  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

testSearch()
