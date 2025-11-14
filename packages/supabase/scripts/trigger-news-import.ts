/**
 * Script to manually trigger news import
 * Calls the core.import_news_articles() database function
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "http://127.0.0.1:54321";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseServiceKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required");
  console.error("💡 Get it from: pnpm supa status");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function triggerNewsImport() {
  console.log("🔄 Triggering News Import...\n");

  try {
    // Call the Edge Function directly via HTTP
    const functionUrl = `${supabaseUrl}/functions/v1/news-import`;
    
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${supabaseServiceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch {
      // If not JSON, it's probably an error message
      console.error("❌ Edge Function not available:", text);
      console.error("\n💡 Make sure Supabase functions are running:");
      console.error("   pnpm supa:functions");
      console.error("\n   Or use the tRPC endpoint via the app instead.");
      process.exit(1);
    }

    if (!response.ok) {
      console.error("❌ Error triggering news import:", data);
      process.exit(1);
    }

    if (data?.success) {
      console.log("✅ News import completed successfully\n");
      if (data.results) {
        console.log("📊 Import Results:");
        console.log(`   Processed: ${data.results.processed || 0} articles`);
        console.log(`   Imported: ${data.results.imported || 0} articles`);
        console.log(`   Skipped: ${data.results.skipped || 0} articles`);
        console.log(`   Errors: ${data.results.errors || 0}`);
        console.log(`   Feeds processed: ${data.results.feeds_processed || 0}`);
        console.log(`   Feeds failed: ${data.results.feeds_failed || 0}`);
      }
      
      // Check article count
      const { count } = await supabase
        .schema("core")
        .from("cached_news_articles")
        .select("*", { count: "exact", head: true });
      
      console.log(`\n📰 Total cached articles: ${count || 0}`);
    } else {
      console.error("❌ News import failed:", data?.error || "Unknown error");
      if (data) {
        console.error("   Response:", JSON.stringify(data, null, 2));
      }
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error triggering news import:", error);
    process.exit(1);
  }
}

triggerNewsImport().catch((error) => {
  console.error("\n💥 Failed to trigger news import:", error);
  process.exit(1);
});

