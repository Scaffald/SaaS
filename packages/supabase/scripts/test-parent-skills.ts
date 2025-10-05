import { Client } from "pg";

async function main() {
  const databaseUrl = process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:54322/postgres";
  const client = new Client({ connectionString: databaseUrl });

  await client.connect();

  try {
    // Get construction industry ID
    const industryResult = await client.query(`
      SELECT id, name, slug FROM industries WHERE slug = 'construction';
    `);
    console.log("Construction Industry:", industryResult.rows[0]);
    const constructionId = industryResult.rows[0]?.id;

    // Count total skills
    const countResult = await client.query(
      `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as parents,
        COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as children
      FROM skills 
      WHERE industry_id = $1;
    `,
      [constructionId],
    );
    console.log("\nSkill counts:", countResult.rows[0]);

    // Get some sample parent skills
    const parentsResult = await client.query(
      `
      SELECT id, name, parent_id, active 
      FROM skills 
      WHERE industry_id = $1 AND parent_id IS NULL
      LIMIT 10;
    `,
      [constructionId],
    );
    console.log("\nSample parent skills:", parentsResult.rows);

    // Test the search function
    console.log("\n--- Testing search_parent_skills function ---");
    const searchResult = await client.query(
      `
      SELECT * FROM search_parent_skills('concrete', $1, 10);
    `,
      [constructionId],
    );
    console.log("Search results for 'concrete':", searchResult.rows);

    // Try broader search
    const broadResult = await client.query(
      `
      SELECT * FROM search_parent_skills('con', $1, 10);
    `,
      [constructionId],
    );
    console.log("\nSearch results for 'con':", broadResult.rows);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
