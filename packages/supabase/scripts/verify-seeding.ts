// Verify CSI seeding results
import { Client } from "pg";

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Error: DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    // Check total counts by depth
    console.log("📊 CSI Skills Summary\n");
    const countResult = await client.query(`
      SELECT csi_depth, COUNT(*) as count
      FROM skills
      WHERE csi_code IS NOT NULL
      GROUP BY csi_depth
      ORDER BY csi_depth;
    `);

    console.log("Records by depth:");
    for (const row of countResult.rows) {
      console.log(`  Depth ${row.csi_depth}: ${row.count} records`);
    }

    // Check sample of synthesized vs real parents
    console.log("\n🔍 Sample Parent Records (checking synthesized vs real):\n");
    const sampleResult = await client.query(`
      SELECT name, csi_code_key, csi_display, csi_depth
      FROM skills
      WHERE csi_code_key IN ('00-01-00-00', '00-00-00-00', '00-24-00-00', '00-24-13-00')
      ORDER BY csi_code_key;
    `);

    for (const row of sampleResult.rows) {
      const isSynthetic = row.name.includes("(Parent Category)");
      const status = isSynthetic ? "❌ SYNTHETIC" : "✅ REAL";
      console.log(`${status} - ${row.csi_display}: "${row.name}"`);
    }

    // Check a sample hierarchy
    console.log("\n🌲 Sample Hierarchy (Division 00):\n");
    const hierarchyResult = await client.query(`
      SELECT name, csi_display, csi_depth
      FROM skills
      WHERE csi_code[1] = '00'
      ORDER BY csi_code_key
      LIMIT 15;
    `);

    for (const row of hierarchyResult.rows) {
      const indent = "  ".repeat(row.csi_depth - 1);
      console.log(`${indent}${row.csi_display} → "${row.name}"`);
    }

    console.log("\n✅ Verification complete!");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
