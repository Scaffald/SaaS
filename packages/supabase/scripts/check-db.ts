// Quick script to check database state
import { Client } from "pg";

async function main() {
  const databaseUrl = process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
  const client = new Client({ connectionString: databaseUrl });

  await client.connect();

  try {
    console.log("Checking industries...");
    const industries = await client.query(
      "SELECT id, slug, name FROM industries",
    );
    console.log("Industries found:", industries.rows);

    console.log("\nChecking skills with CSI codes...");
    const csiSkills = await client.query(
      "SELECT id, name, industry_id, csi_code_key FROM skills WHERE csi_code IS NOT NULL LIMIT 5",
    );
    console.log("CSI Skills found:", csiSkills.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

main();
