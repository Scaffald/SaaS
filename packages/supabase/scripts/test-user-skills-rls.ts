import { Client } from "pg";

async function main() {
  const databaseUrl = process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:54322/postgres";
  const client = new Client({ connectionString: databaseUrl });

  await client.connect();

  try {
    // Test user ID from the curl request
    const testUserId = "d7595351-5684-429e-bf9d-9b26c4fba57c";
    const testSkillId = "5441059b-ccf4-5148-87bc-79d513537d70";

    console.log("Testing RLS policies for user_skills table");
    console.log("User ID:", testUserId);
    console.log("Skill ID:", testSkillId);

    // Check if RLS is enabled
    const rlsCheck = await client.query(`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      WHERE relname = 'user_skills' AND relnamespace = 'public'::regnamespace;
    `);
    console.log("\nRLS Status:", rlsCheck.rows[0]);

    // List all policies
    const policiesCheck = await client.query(`
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'user_skills';
    `);
    console.log("\nPolicies:");
    for (const policy of policiesCheck.rows) {
      console.log(`  - ${policy.policyname} (${policy.cmd}):`);
      console.log(`    Roles: ${policy.roles}`);
      console.log(`    USING: ${policy.qual}`);
      console.log(`    WITH CHECK: ${policy.with_check}`);
    }

    // Try to insert as the service role (should work regardless of RLS)
    console.log("\n--- Testing INSERT as service role ---");
    const insertResult = await client.query(
      `
      INSERT INTO user_skills (user_id, skill_id, proficiency, source)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, skill_id) DO UPDATE SET proficiency = EXCLUDED.proficiency
      RETURNING *;
    `,
      [testUserId, testSkillId, 4, "self"],
    );
    console.log("Insert successful:", insertResult.rows[0]);

    // Check if the skill was inserted
    const selectResult = await client.query(
      `SELECT * FROM user_skills WHERE user_id = $1 AND skill_id = $2;`,
      [testUserId, testSkillId],
    );
    console.log("\nVerify skill exists:", selectResult.rows[0]);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
