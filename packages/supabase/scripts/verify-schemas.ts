// Quick verification script for CSI and O*NET schemas
import { Client } from "pg";

async function main() {
  const databaseUrl = process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:54322/postgres";
  const client = new Client({ connectionString: databaseUrl });

  await client.connect();

  try {
    console.log("📊 Database Schema Verification\n");
    console.log("=".repeat(50));

    // Check CSI MasterFormat
    const csiResult = await client.query(
      "SELECT count(*) FROM csi.masterformat",
    );
    console.log(`✅ CSI MasterFormat: ${csiResult.rows[0].count} records`);

    // Check O*NET
    const onetResult = await client.query(
      "SELECT count(*) FROM onet.occupation_data",
    );
    console.log(`✅ O*NET Occupations: ${onetResult.rows[0].count} records`);

    // Check Universities
    const uniResult = await client.query(
      "SELECT count(*) FROM public.universities",
    );
    console.log(`✅ Universities: ${uniResult.rows[0].count} records`);

    // Check new polymorphic tables
    const userSkillsResult = await client.query(
      "SELECT count(*) FROM public.user_skills",
    );
    console.log(
      `✅ User Skills Table: ${
        userSkillsResult.rows[0].count
      } records (empty - new table)`,
    );

    const jobSkillsResult = await client.query(
      "SELECT count(*) FROM public.job_skills",
    );
    console.log(
      `✅ Job Skills Table: ${
        jobSkillsResult.rows[0].count
      } records (empty - new table)`,
    );

    const orgSkillsResult = await client.query(
      "SELECT count(*) FROM public.organization_skills",
    );
    console.log(
      `✅ Org Skills Table: ${
        orgSkillsResult.rows[0].count
      } records (empty - new table)`,
    );

    console.log("\n" + "=".repeat(50));

    // Test CSI search function
    console.log("\n🔍 Testing CSI Search Function:");
    const searchResult = await client.query(
      `SELECT * FROM csi.search_masterformat('concrete') LIMIT 5`,
    );
    console.log(`Found ${searchResult.rows.length} results for 'concrete':`);
    for (const row of searchResult.rows) {
      console.log(`  - ${row.code_display}: ${row.name}`);
    }

    // Test unified view
    console.log("\n🔍 Testing Unified Skills View:");
    const viewResult = await client.query(`
      SELECT taxonomy, count(*) 
      FROM public.v_all_skills 
      GROUP BY taxonomy 
      ORDER BY taxonomy
    `);
    console.log("Skills by taxonomy:");
    for (const row of viewResult.rows) {
      console.log(`  - ${row.taxonomy}: ${row.count} skills`);
    }

    // Test cross-taxonomy search
    console.log("\n🔍 Testing Cross-Taxonomy Search:");
    const crossSearchResult = await client.query(`
      SELECT * FROM public.search_all_skills('engineer', NULL) LIMIT 5
    `);
    console.log(
      `Found ${crossSearchResult.rows.length} results for 'engineer':`,
    );
    for (const row of crossSearchResult.rows) {
      console.log(`  - [${row.taxonomy}] ${row.display_code}: ${row.name}`);
    }

    console.log("\n✅ All verifications passed!");
  } catch (err) {
    console.error("❌ Verification failed:", err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
