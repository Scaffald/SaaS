/**
 * Comprehensive seeding script for development
 * Seeds jobs from RSS feeds and verifies skills are properly loaded
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseServiceKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySkills() {
  console.log("\n📊 Verifying Skills Data...");

  const { count: skillCount, error: skillError } = await supabase
    .from("skills")
    .select("*", { count: "exact", head: true });

  if (skillError) {
    console.error("❌ Error checking skills:", skillError);
    return false;
  }

  console.log(`✅ Found ${skillCount} skills in database`);

  // Check for top-level skills
  const { data: topSkills, error: topError } = await supabase
    .from("skills")
    .select("id, name")
    .is("parent_id", null)
    .limit(5);

  if (topError) {
    console.error("❌ Error fetching top skills:", topError);
    return false;
  }

  console.log(
    `   Top-level skills: ${topSkills?.map((s) => s.name).join(", ")}`,
  );
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

async function seedJobs(limit = 10) {
  console.log("\n💼 Seeding External Jobs...");

  const { data: feeds, error: feedsError } = await supabase
    .from("external_job_feeds")
    .select("*")
    .eq("is_active", true);

  if (feedsError) {
    console.error("❌ Error fetching feeds:", feedsError);
    return 0;
  }

  console.log(`   Found ${feeds?.length || 0} active job feeds`);

  let totalImported = 0;

  for (const feed of feeds || []) {
    console.log(`\n   Processing: ${feed.name}`);

    try {
      const response = await fetch(feed.url);
      if (!response.ok) {
        console.error(`   ❌ Failed to fetch: ${response.statusText}`);
        continue;
      }

      const xml = await response.text();
      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

      console.log(`   Found ${items.length} jobs in feed`);

      let imported = 0;
      for (const item of items.slice(0, limit)) {
        // Extract job data
        const title =
          item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
          item.match(/<title>(.*?)<\/title>/)?.[1] ||
          "";
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "";
        const description =
          item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)
            ?.[1] ||
          item.match(/<description>(.*?)<\/description>/)?.[1] ||
          "";
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";

        // Parse title for company name
        const titleParts = title.split(": ");
        const company_name = titleParts.length > 1
          ? titleParts[0].trim()
          : "Unknown Company";
        const job_title = titleParts.length > 1
          ? titleParts.slice(1).join(": ").trim()
          : title;

        // Clean description
        const cleanDescription = description
          .replace(/<[^>]*>/g, "")
          .substring(0, 500);

        const { error: insertError } = await supabase
          .from("external_jobs")
          .upsert(
            {
              feed_id: feed.id,
              external_guid: link,
              title: job_title || "Untitled Position",
              company_name,
              job_location: "Remote",
              description: cleanDescription,
              posted_date: pubDate
                ? new Date(pubDate).toISOString()
                : new Date().toISOString(),
              application_url: link,
              external_url: link,
              is_active: true,
              raw_data: { title, link, description, pubDate },
            },
            {
              onConflict: "feed_id,external_guid",
            },
          );

        if (insertError) {
          console.error("   ⚠️  Insert error:", insertError.message);
        } else {
          imported++;
        }
      }

      console.log(`   ✅ Imported ${imported} jobs from ${feed.name}`);
      totalImported += imported;

      // Update last_fetched_at
      await supabase
        .from("external_job_feeds")
        .update({
          last_fetched_at: new Date().toISOString(),
          last_success_at: new Date().toISOString(),
          error_count: 0,
        })
        .eq("id", feed.id);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      console.error(`   ❌ Error processing feed: ${errorMessage}`);

      // Update error info
      await supabase
        .from("external_job_feeds")
        .update({
          error_count: (feed.error_count || 0) + 1,
          last_error: errorMessage,
        })
        .eq("id", feed.id);
    }
  }

  return totalImported;
}

async function displayStats() {
  console.log(`\n${"=".repeat(50)}`);
  console.log("📊 Database Statistics");
  console.log("=".repeat(50));

  // Jobs stats
  const { count: jobCount } = await supabase
    .from("external_jobs")
    .select("*", { count: "exact", head: true });

  const { count: activeJobCount } = await supabase
    .from("external_jobs")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  console.log(`Total Jobs: ${jobCount}`);
  console.log(`Active Jobs: ${activeJobCount}`);

  // Skills stats
  const { count: skillCount } = await supabase
    .from("skills")
    .select("*", { count: "exact", head: true });

  console.log(`Total Skills: ${skillCount}`);

  // Industries stats
  const { count: industryCount } = await supabase
    .from("industries")
    .select("*", { count: "exact", head: true });

  console.log(`Total Industries: ${industryCount}`);

  // Feeds stats
  const { count: feedCount } = await supabase
    .from("external_job_feeds")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  console.log(`Active Feeds: ${feedCount}`);
  console.log(`${"=".repeat(50)}\n`);
}

async function main() {
  console.log("🌱 Starting Database Seeding...\n");

  // Verify base data
  const skillsOk = await verifySkills();
  const industriesOk = await verifyIndustries();

  if (!skillsOk || !industriesOk) {
    console.error("\n❌ Base data verification failed. Run migrations first:");
    console.error("   pnpm supa db reset");
    process.exit(1);
  }

  // Seed jobs
  const jobsImported = await seedJobs(10);

  console.log(`\n✅ Seeding complete! Imported ${jobsImported} jobs.`);

  // Display stats
  await displayStats();

  console.log("💡 Next steps:");
  console.log("   - Start dev server: pnpm dev");
  console.log("   - Test tRPC endpoint: Navigate to /dashboard/discover/jobs");
  console.log(
    "   - Run permission tests: pnpm test:permissions\n",
  );
}

main().catch((error) => {
  console.error("\n💥 Seeding failed:", error);
  process.exit(1);
});
