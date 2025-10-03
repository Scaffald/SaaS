import { Client } from "pg";

async function main() {
  const databaseUrl = process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:54322/postgres";
  const client = new Client({ connectionString: databaseUrl });

  await client.connect();

  try {
    const result = await client.query(`
      SELECT id, name, csi_code_key 
      FROM skills 
      WHERE industry_id = '212409ff-4694-46d0-9533-ffbd99b7ed58' 
      ORDER BY name 
      LIMIT 50;
    `);

    console.log("Construction industry skills:");
    console.log(`Total found: ${result.rows.length}`);
    console.log("\nSkills:");
    result.rows.forEach((row) => {
      console.log(
        `  ${row.name} (csi_code_key: ${row.csi_code_key || "null"})`,
      );
    });
  } finally {
    await client.end();
  }
}

main().catch(console.error);
