import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkNews() {
  console.log("🔍 Checking News Database...\n");

  // Check news feeds
  const { data: feeds, error: feedsError } = await supabase
    .schema("core")
    .from("news_feeds")
    .select("*");

  if (feedsError) {
    console.error("❌ Error fetching feeds:", feedsError);
    return;
  }

  console.log(`📰 News Feeds: ${feeds?.length || 0} total`);
  const activeFeeds = feeds?.filter((f) => f.is_active) || [];
  console.log(`   Active: ${activeFeeds.length}`);
  console.log(`   Inactive: ${(feeds?.length || 0) - activeFeeds.length}\n`);

  // Check cached articles
  const { data: articles, error: articlesError, count } = await supabase
    .schema("core")
    .from("cached_news_articles")
    .select("*", { count: "exact" })
    .order("pub_date", { ascending: false })
    .limit(10);

  if (articlesError) {
    console.error("❌ Error fetching articles:", articlesError);
    return;
  }

  console.log(`📄 Cached Articles: ${count || 0} total\n`);

  if (count === 0) {
    console.log("⚠️  No articles found in database!");
    console.log("   Run: pnpm supa:news:import (requires Edge Functions running)\n");
  } else {
    console.log("📋 Recent Articles:");
    articles?.slice(0, 5).forEach((article, i) => {
      console.log(`   ${i + 1}. ${article.title?.substring(0, 60)}...`);
      console.log(`      Source: ${article.source_name}`);
      console.log(`      Date: ${article.pub_date}`);
      console.log(`      Industry ID: ${article.industry_id}`);
      console.log("");
    });
  }

  // Check by industry (if we have articles)
  if (count && count > 0) {
    const { data: allArticles } = await supabase
      .schema("core")
      .from("cached_news_articles")
      .select("industry_id");

    if (allArticles) {
      const industryIds = [...new Set(allArticles.map((a) => a.industry_id))];
      console.log("📊 Articles by Industry:");
      for (const industryId of industryIds) {
        const { count: industryCount } = await supabase
          .schema("core")
          .from("cached_news_articles")
          .select("*", { count: "exact", head: true })
          .eq("industry_id", industryId);

        // Get industry name
        const { data: industry } = await supabase
          .schema("core")
          .from("industries")
          .select("name, slug")
          .eq("id", industryId)
          .single();

        console.log(`   ${industry?.name || industry?.slug || industryId}: ${industryCount || 0} articles`);
      }
    }
  }

  // Check construction industry specifically
  const { data: constructionIndustry } = await supabase
    .schema("core")
    .from("industries")
    .select("id")
    .eq("slug", "construction")
    .single();

  if (constructionIndustry?.id) {
    const { count: constructionCount } = await supabase
      .schema("core")
      .from("cached_news_articles")
      .select("*", { count: "exact", head: true })
      .eq("industry_id", constructionIndustry.id);

    console.log(`\n🏗️  Construction Industry (for fallback):`);
    console.log(`   Industry ID: ${constructionIndustry.id}`);
    console.log(`   Articles: ${constructionCount || 0}`);
  }
}

checkNews().catch(console.error);

