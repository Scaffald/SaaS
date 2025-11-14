/**
 * Script to verify news setup and check if user will see articles
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

async function verifyNewsSetup() {
  console.log("🔍 Verifying News Setup...\n");

  try {
    // Get construction industry ID
    const { data: constructionIndustry } = await supabase
      .schema("core")
      .from("industries")
      .select("id, name, slug")
      .eq("slug", "construction")
      .single();

    if (!constructionIndustry) {
      console.error("❌ Construction industry not found");
      process.exit(1);
    }

    console.log(`✓ Construction Industry: ${constructionIndustry.name} (${constructionIndustry.id})\n`);

    // Check article count
    const { count: articleCount } = await supabase
      .schema("core")
      .from("cached_news_articles")
      .select("*", { count: "exact", head: true })
      .eq("industry_id", constructionIndustry.id);

    console.log(`📰 Articles in database: ${articleCount || 0}`);

    if (articleCount && articleCount > 0) {
      // Get sample articles
      const { data: articles } = await supabase
        .schema("core")
        .from("cached_news_articles")
        .select("id, title, pub_date, industry_id")
        .eq("industry_id", constructionIndustry.id)
        .order("pub_date", { ascending: false })
        .limit(3);

      console.log("\n📋 Sample articles:");
      articles?.forEach((article, i) => {
        console.log(`   ${i + 1}. ${article.title}`);
        console.log(`      Published: ${new Date(article.pub_date).toLocaleString()}`);
      });
    }

    // Check feeds
    const { count: feedCount } = await supabase
      .schema("core")
      .from("news_feeds")
      .select("*", { count: "exact", head: true })
      .eq("industry_id", constructionIndustry.id)
      .eq("is_active", true);

    console.log(`\n📡 Active feeds: ${feedCount || 0}`);

    // Test the API endpoint
    console.log("\n🧪 Testing API endpoint...");
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";
    
    if (anonKey) {
      const input = encodeURIComponent(
        JSON.stringify({
          "0": {
            industryId: constructionIndustry.id,
            limit: 5,
          },
        })
      );

      const response = await fetch(
        `${supabaseUrl}/functions/v1/trpc/news.getByIndustry?batch=1&input=${input}`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data[0]?.result?.data) {
        const articles = data[0].result.data;
        console.log(`✅ API test successful! Returned ${articles.length} articles`);
        if (articles.length > 0) {
          console.log(`   Sample: "${articles[0].title}"`);
        }
      } else {
        console.error("❌ API test failed:", data);
      }
    } else {
      console.log("⚠️  Skipping API test (EXPO_PUBLIC_SUPABASE_ANON_KEY not set)");
    }

    console.log("\n✅ Setup verification complete!");
    console.log(`\n💡 Your user should see news if:`);
    console.log(`   1. Their industry_id matches: ${constructionIndustry.id}`);
    console.log(`   2. Articles exist (currently: ${articleCount || 0})`);
    console.log(`   3. The widget is loading correctly`);

  } catch (error) {
    console.error("❌ Error verifying setup:", error);
    process.exit(1);
  }
}

verifyNewsSetup().catch((error) => {
  console.error("\n💥 Failed to verify setup:", error);
  process.exit(1);
});

