import { Client } from "pg";

async function main() {
  const databaseUrl = process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:54322/postgres";
  const client = new Client({ connectionString: databaseUrl });

  await client.connect();

  try {
    console.log("Deleting existing construction skills without CSI codes...");

    const result = await client.query(`
      DELETE FROM skills 
      WHERE industry_id = '212409ff-4694-46d0-9533-ffbd99b7ed58' 
      AND csi_code_key IS NULL
      RETURNING id, name;
    `);

    console.log(`Deleted ${result.rows.length} skills:`);
    for (const row of result.rows) {
      console.log(`  - ${row.name}`);
    }

    console.log("\n✓ Successfully deleted old construction skills");
  } finally {
    await client.end();
  }
}

main().catch(console.error);
