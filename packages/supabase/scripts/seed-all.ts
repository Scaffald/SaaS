/**
 * Comprehensive seeding script for development
 * Seeds CSI codes and external jobs from RSS feeds
 */

import { createClient } from "@supabase/supabase-js";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import * as path from "node:path";

const execAsync = promisify(exec);

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "http://127.0.0.1:54321";
const supabaseServiceKey = process.env.SUPABASE_SECRET || "";

if (!supabaseServiceKey) {
  console.error("❌ SUPABASE_SECRET is required");
  console.error("💡 Get it from: pnpm supa status");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedCSICodes() {
  console.log("\n🏗️  Seeding CSI MasterFormat 2020 Codes...");

  try {
    const scriptDir = path.dirname(new URL(import.meta.url).pathname);
    const csiScriptPath = path.join(scriptDir, "seed-csi.ts");

    // Run the CSI seeding script
    const { stdout, stderr } = await execAsync(
      `pnpx tsx "${csiScriptPath}"`,
      {
        env: {
          ...process.env,
          DATABASE_URL: process.env.DATABASE_URL ||
            "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
        },
      },
    );

    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);

    return true;
  } catch (error) {
    console.error("❌ Error seeding CSI codes:", error);
    return false;
  }
}

async function seedUniversities() {
  console.log("\n🎓 Seeding Universities Catalog...");

  try {
    const scriptDir = path.dirname(new URL(import.meta.url).pathname);
    const universitiesScriptPath = path.join(scriptDir, "seed-universities.ts");
    const jsonPath = path.join(scriptDir, "seed-universities.json");

    // Check if JSON file exists
    const fs = await import("node:fs");
    if (!fs.existsSync(jsonPath)) {
      console.log(
        "⏭️  Skipping universities seed (seed-universities.json not found)",
      );
      return true; // Not an error, just skip
    }

    // Run the universities seeding script
    const { stdout, stderr } = await execAsync(
      `pnpx tsx "${universitiesScriptPath}"`,
      {
        env: {
          ...process.env,
          DATABASE_URL: process.env.DATABASE_URL ||
            "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
        },
      },
    );

    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);

    return true;
  } catch (error) {
    console.error("❌ Error seeding universities:", error);
    return false;
  }
}

async function seedCertifications() {
  console.log("\n📜 Seeding Certifications Catalog...");

  try {
    const scriptDir = path.dirname(new URL(import.meta.url).pathname);
    const certsScriptPath = path.join(scriptDir, "seed-certifications.ts");

    // Run the certifications seeding script
    const { stdout, stderr } = await execAsync(
      `pnpx tsx "${certsScriptPath}"`,
      {
        env: {
          ...process.env,
          DATABASE_URL: process.env.DATABASE_URL ||
            "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
        },
      },
    );

    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);

    return true;
  } catch (error) {
    console.error("❌ Error seeding certifications:", error);
    return false;
  }
}

async function seedJobs() {
  console.log("\n💼 Seeding External Jobs with Enhanced Parsing...");

  try {
    const scriptDir = path.dirname(new URL(import.meta.url).pathname);
    const jobsScriptPath = path.join(scriptDir, "seed-jobs.ts");

    // Run the jobs seeding script
    const { stdout, stderr } = await execAsync(
      `pnpx tsx "${jobsScriptPath}"`,
      {
        env: {
          ...process.env,
          DATABASE_URL: process.env.DATABASE_URL ||
            "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
        },
      },
    );

    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);

    return true;
  } catch (error) {
    console.error("❌ Error seeding jobs:", error);
    return false;
  }
}

async function verifySkills() {
  console.log("\n📊 Verifying CSI MasterFormat Data...");

  const { count: csiCount, error: csiError } = await supabase
    .schema("data")
    .from("masterformat")
    .select("*", { count: "exact", head: true });

  if (csiError) {
    console.error("❌ Error checking CSI codes:", csiError);
    return false;
  }

  console.log(`✅ Found ${csiCount} CSI MasterFormat codes in database`);

  // Check for top-level codes (depth 1 - divisions)
  const { data: topCodes, error: topError } = await supabase
    .schema("data")
    .from("masterformat")
    .select("id, name")
    .eq("depth", 1)
    .limit(5);

  if (topError) {
    console.error("❌ Error fetching top CSI codes:", topError);
    return false;
  }

  if (topCodes && topCodes.length > 0) {
    console.log(
      `   Sample divisions: ${topCodes?.map((s) => s.name).join(", ")}`,
    );
  }
  return true;
}

async function verifyUniversities() {
  console.log("\n🎓 Verifying Universities Data...");

  const { count: universityCount, error: universityError } = await supabase
    .schema("data")
    .from("universities")
    .select("*", { count: "exact", head: true });

  if (universityError) {
    console.error("❌ Error fetching universities:", universityError);
    return false;
  }

  console.log(`✅ Found ${universityCount} universities in database`);

  // Check for some universities
  const { data: universities, error: uniError } = await supabase
    .schema("data")
    .from("universities")
    .select("id, name, country")
    .limit(5);

  if (uniError) {
    console.error("❌ Error fetching universities:", uniError);
    return false;
  }

  if (universities && universities.length > 0) {
    console.log(
      `   Sample universities: ${
        universities?.map((u) => `${u.name} (${u.country})`).join(", ")
      }`,
    );
  }
  return true;
}

async function verifyCertifications() {
  console.log("\n📜 Verifying Certifications Data...");

  const { count: certCount, error: certError } = await supabase
    .schema("data")
    .from("certifications")
    .select("*", { count: "exact", head: true });

  if (certError) {
    console.error("❌ Error fetching certifications:", certError);
    return false;
  }

  console.log(`✅ Found ${certCount} certifications in database`);

  // Check for some certifications
  const { data: certs, error: certsError } = await supabase
    .schema("data")
    .from("certifications")
    .select("slug, title, depth")
    .eq("depth", 2)
    .limit(5);

  if (certsError) {
    console.error("❌ Error fetching certifications:", certsError);
    return false;
  }

  if (certs && certs.length > 0) {
    console.log(
      `   Sample certifications: ${certs?.map((c) => c.title).join(", ")}`,
    );
  }
  return true;
}

async function verifyIndustries() {
  console.log("\n🏭 Verifying Industries Data...");

  const { count: industryCount, error: industryError } = await supabase
    .from("industries")
    .select("*", { count: "exact", head: true });

  if (industryError) {
    console.error("❌ Error checking industries:", industryError);
    return false;
  }

  console.log(`✅ Found ${industryCount} industries in database`);

  // Check for some industries
  const { data: industries, error: indError } = await supabase
    .from("industries")
    .select("id, name")
    .limit(5);

  if (indError) {
    console.error("❌ Error fetching industries:", indError);
    return false;
  }

  console.log(
    `   Sample industries: ${industries?.map((i) => i.name).join(", ")}`,
  );
  return true;
}

async function displayStats() {
  console.log(`\n${"=".repeat(50)}`);
  console.log("📊 Database Statistics");
  console.log("=".repeat(50));

  // Jobs stats
  const { count: jobCount, error: jobError } = await supabase
    .from("external_jobs")
    .select("*", { count: "exact", head: true });

  if (!jobError) {
    const { count: activeJobCount } = await supabase
      .from("external_jobs")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    console.log(`Total Jobs: ${jobCount || 0}`);
    console.log(`Active Jobs: ${activeJobCount || 0}`);
  }

  // CSI MasterFormat stats (in data schema)
  const { count: csiCount, error: csiError } = await supabase
    .schema("data")
    .from("masterformat")
    .select("*", { count: "exact", head: true });

  if (!csiError) {
    console.log(`CSI MasterFormat Codes: ${csiCount || 0}`);
  }

  // Skills stats
  const { count: skillCount, error: skillError } = await supabase
    .from("skills")
    .select("*", { count: "exact", head: true });

  if (!skillError) {
    console.log(`Total Skills: ${skillCount || 0}`);
  }

  // Industries stats
  const { count: industryCount } = await supabase
    .from("industries")
    .select("*", { count: "exact", head: true });

  console.log(`Total Industries: ${industryCount || 0}`);

  // Universities stats
  const { count: universityCount } = await supabase
    .schema("data")
    .from("universities")
    .select("*", { count: "exact", head: true });

  console.log(`Total Universities: ${universityCount || 0}`);

  // Feeds stats (optional table)
  const { count: feedCount, error: feedError } = await supabase
    .from("external_job_feeds")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  if (!feedError) {
    console.log(`Active Feeds: ${feedCount || 0}`);
  }

  console.log(`${"=".repeat(50)}\n`);
}

async function main() {
  console.log("🌱 Starting Database Seeding...\n");

  // Check industries first
  const industriesOk = await verifyIndustries();
  if (!industriesOk) {
    console.error("\n❌ Industries verification failed. Run migrations first:");
    console.error("   pnpm supa:reset");
    process.exit(1);
  }

  // Seed CSI codes first (this will create the construction industry and skills)
  console.log(`\n${"=".repeat(50)}`);
  console.log("📋 Step 1: Seeding CSI MasterFormat 2020 Codes");
  console.log("=".repeat(50));
  const csiSeeded = await seedCSICodes();

  if (!csiSeeded) {
    console.error("\n❌ CSI seeding failed. Check errors above.");
    process.exit(1);
  }

  // Verify CSI codes were seeded
  const csiOk = await verifySkills();
  if (!csiOk) {
    console.error("\n❌ CSI MasterFormat verification failed after seeding.");
    process.exit(1);
  }

  // Seed universities
  console.log(`\n${"=".repeat(50)}`);
  console.log("📋 Step 2: Seeding Universities Catalog");
  console.log("=".repeat(50));
  const universitiesSeeded = await seedUniversities();

  if (!universitiesSeeded) {
    console.error("\n❌ Universities seeding failed. Check errors above.");
    process.exit(1);
  }

  // Verify universities if they were seeded
  await verifyUniversities();

  // Seed certifications
  console.log(`\n${"=".repeat(50)}`);
  console.log("📋 Step 3: Seeding Certifications Catalog");
  console.log("=".repeat(50));
  const certificationsSeeded = await seedCertifications();

  if (!certificationsSeeded) {
    console.error("\n❌ Certifications seeding failed. Check errors above.");
    process.exit(1);
  }

  // Verify certifications
  await verifyCertifications();

  // Seed jobs
  console.log(`\n${"=".repeat(50)}`);
  console.log("📋 Step 4: Seeding External Jobs from RSS Feeds");
  console.log("=".repeat(50));
  const jobsSeeded = await seedJobs();

  if (!jobsSeeded) {
    console.error("\n❌ Jobs seeding failed. Check errors above.");
    process.exit(1);
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`   - CSI codes seeded ✓`);
  console.log(`   - Universities seeded ✓`);
  console.log(`   - External jobs seeded ✓`);

  // Display stats
  await displayStats();

  console.log("💡 Next steps:");
  console.log("   - Start dev server: pnpm dev");
  console.log("   - Test tRPC endpoint: Navigate to /dashboard/discover/jobs");
  console.log("   - Run permission tests: pnpm test:permissions\n");
}

main().catch((error) => {
  console.error("\n💥 Seeding failed:", error);
  process.exit(1);
});
