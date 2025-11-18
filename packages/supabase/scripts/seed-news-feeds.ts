import { createClient } from "@supabase/supabase-js";
import { CONSTRUCTION_FEEDS } from "../../core/features/news/config/news-feeds";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "http://127.0.0.1:54321";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedNewsFeeds() {
  console.log("Starting news feed seeding...\n");

  // Look up Construction industry ID
  const { data: industry, error: industryError } = await supabase
    .schema("core")
    .from("industries")
    .select("id")
    .eq("slug", "construction")
    .single();

  if (industryError || !industry) {
    console.error("Error finding Construction industry:", industryError);
    return;
  }

  const industryId = industry.id;
  console.log(`Found Construction industry ID: ${industryId}\n`);

  // Collect all feeds from the configuration
  const allFeeds = [
    ...CONSTRUCTION_FEEDS.national.map((feed) => ({
      ...feed,
      type: "national" as const,
    })),
    ...CONSTRUCTION_FEEDS.regional.map((feed) => ({
      ...feed,
      type: "regional" as const,
    })),
    ...CONSTRUCTION_FEEDS.topical.map((feed) => ({
      ...feed,
      type: "topical" as const,
    })),
  ];

  console.log(`Found ${allFeeds.length} feeds to seed\n`);

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const feed of allFeeds) {
    try {
      const feedData = {
        name: feed.name,
        url: feed.url,
        feed_type: "rss" as const,
        category: feed.category || null,
        region: feed.region || null,
        industry_id: industryId,
        is_active: true,
      };

      const { data, error } = await supabase
        .schema("core")
        .from("news_feeds")
        .upsert(feedData, {
          onConflict: "url",
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (error) {
        console.error(`Error upserting feed ${feed.name}:`, error);
        errors++;
      } else {
        // Check if it was an insert or update
        const { data: existing } = await supabase
          .schema("core")
          .from("news_feeds")
          .select("created_at")
          .eq("id", data.id)
          .single();

        if (existing && new Date(existing.created_at).getTime() > Date.now() - 1000) {
          inserted++;
          console.log(`✓ Inserted: ${feed.name} (${feed.type})`);
        } else {
          updated++;
          console.log(`↻ Updated: ${feed.name} (${feed.type})`);
        }
      }
    } catch (error) {
      console.error(`Error processing feed ${feed.name}:`, error);
      errors++;
    }
  }

  console.log(`\n=== Seeding Summary ===`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Updated: ${updated}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total: ${allFeeds.length}`);

  // Verify the count
  const { count } = await supabase
    .schema("core")
    .from("news_feeds")
    .select("*", { count: "exact", head: true })
    .eq("industry_id", industryId);

  console.log(`\n✓ Total news feeds in database for Construction: ${count}`);
}

seedNewsFeeds().catch(console.error);

