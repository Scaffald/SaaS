/**
 * Debug RSS feed to see raw content
 */

async function debugFeed() {
  const feedUrl = "https://weworkremotely.com/remote-jobs.rss";
  
  console.log("\n🔍 Fetching RSS feed...\n");
  
  const response = await fetch(feedUrl);
  const xml = await response.text();
  const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
  
  console.log(`Found ${items.length} items\n`);
  
  // Get first item
  const item = items[0];
  
  const title =
    item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
    item.match(/<title>(.*?)<\/title>/)?.[1] ||
    "";
  
  const description =
    item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
    item.match(/<description>(.*?)<\/description>/)?.[1] ||
    "";
  
  console.log("─".repeat(80));
  console.log("TITLE:");
  console.log(title);
  console.log("\n" + "─".repeat(80));
  console.log("RAW DESCRIPTION:");
  console.log(description.substring(0, 1000));
  console.log("\n" + "─".repeat(80));
  console.log("CLEANED DESCRIPTION:");
  const cleaned = description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  console.log(cleaned.substring(0, 1000));
  console.log("\n" + "─".repeat(80));
}

debugFeed().catch(console.error);
