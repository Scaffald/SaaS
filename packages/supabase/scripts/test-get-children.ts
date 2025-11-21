import { Client } from 'pg'

async function main() {
  const databaseUrl =
    process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres'
  const client = new Client({ connectionString: databaseUrl })

  await client.connect()

  try {
    // Get construction industry ID
    const industryResult = await client.query(`
      SELECT id FROM industries WHERE slug = 'construction';
    `)
    const constructionId = industryResult.rows[0]?.id

    // Find concrete parent skill
    const concreteResult = await client.query(
      `
      SELECT id, name FROM skills 
      WHERE name = 'concrete' AND industry_id = $1 AND parent_id IS NULL;
    `,
      [constructionId]
    )

    const concreteSkill = concreteResult.rows[0]
    console.log('Concrete parent skill:', concreteSkill)

    // Test get_skill_children function
    console.log('\n--- Testing get_skill_children function ---')
    const childrenResult = await client.query(
      `
      SELECT * FROM get_skill_children($1) LIMIT 10;
    `,
      [concreteSkill.id]
    )

    console.log(`Found ${childrenResult.rows.length} children (showing first 10):`)
    for (const child of childrenResult.rows) {
      console.log(`  - ${child.hierarchy_path}`)
      console.log(`    ID: ${child.skill_id}, Depth: ${child.depth}, Active: ${child.active}`)
    }
  } finally {
    await client.end()
  }
}

main().catch(console.error)
