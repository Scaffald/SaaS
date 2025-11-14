/**
 * Script to check if a user's industry matches the news articles
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "http://127.0.0.1:54321";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseServiceKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserIndustry() {
  console.log("🔍 Checking User Industry...\n");

  try {
    const constructionIndustryId = "af7f4c62-912c-4c91-af41-7aec535b6011";

    // Get a sample user (or you can modify this to check a specific user ID)
    const { data: users } = await supabase
      .schema("core")
      .from("users")
      .select("id, display_name, industry_id, industries(id, name, slug)")
      .limit(5);

    if (!users || users.length === 0) {
      console.error("❌ No users found in database");
      process.exit(1);
    }

    console.log(`Found ${users.length} users. Checking industry assignments...\n`);

    let usersWithConstruction = 0;
    let usersWithoutIndustry = 0;

    for (const user of users) {
      const hasIndustry = !!user.industry_id;
      const matchesConstruction = user.industry_id === constructionIndustryId;

      if (matchesConstruction) {
        usersWithConstruction++;
        console.log(`✅ ${user.display_name || user.id}`);
        console.log(`   Industry: ${user.industries?.name || "N/A"} (${user.industries?.slug || "N/A"})`);
        console.log(`   Will see news: YES\n`);
      } else if (!hasIndustry) {
        usersWithoutIndustry++;
        console.log(`⚠️  ${user.display_name || user.id}`);
        console.log(`   Industry: NOT SET`);
        console.log(`   Will see news: NO (fallback to construction should work)\n`);
      } else {
        console.log(`❌ ${user.display_name || user.id}`);
        console.log(`   Industry ID: ${user.industry_id}`);
        console.log(`   Industry: ${user.industries?.name || "N/A"}`);
        console.log(`   Will see news: NO (different industry)\n`);
      }
    }

    console.log("=== Summary ===");
    console.log(`Users with Construction industry: ${usersWithConstruction}`);
    console.log(`Users without industry set: ${usersWithoutIndustry}`);
    console.log(`Users with other industries: ${users.length - usersWithConstruction - usersWithoutIndustry}`);

    // Check article count
    const { count: articleCount } = await supabase
      .schema("core")
      .from("cached_news_articles")
      .select("*", { count: "exact", head: true })
      .eq("industry_id", constructionIndustryId);

    console.log(`\n📰 Articles available for Construction industry: ${articleCount || 0}`);

    if (articleCount && articleCount > 0 && usersWithConstruction > 0) {
      console.log("\n✅ Setup looks good! Users with Construction industry should see news.");
    } else if (articleCount && articleCount > 0) {
      console.log("\n⚠️  Articles exist, but no users have Construction industry set.");
      console.log("   The widget should fallback to Construction industry, so users should still see news.");
    } else {
      console.log("\n❌ No articles found. Run: pnpm supa:news:import (after starting Edge Functions)");
    }

  } catch (error) {
    console.error("❌ Error checking user industry:", error);
    process.exit(1);
  }
}

checkUserIndustry().catch((error) => {
  console.error("\n💥 Failed to check user industry:", error);
  process.exit(1);
});

