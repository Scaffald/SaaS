// scripts/seed-universities.ts
// Seeds universities from JSON file into the universities catalog table
import * as fs from "node:fs";
import * as path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { v5 as uuidv5 } from "uuid";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "http://127.0.0.1:54321";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseServiceKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required");
  console.error("💡 Get it from: pnpm supa status");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// =========================================================
// Types
// =========================================================

interface UniversityRecord {
  name: string;
  domains: string[];
  web_pages: string[];
  country: string;
  alpha_two_code: string;
  "state-province": string | null;
}

interface ProcessedUniversity {
  id: string;
  name: string;
  slug: string;
  country: string;
  alpha_two_code: string;
  domains: string[];
  web_pages: string[];
  state_province: string | null;
  metadata: Record<string, unknown>;
}

// =========================================================
// Constants
// =========================================================

const NS_UNIVERSITIES = uuidv5("scaffald:universities", uuidv5.URL);

// =========================================================
// UUID Generation
// =========================================================

function toUUID(slug: string): string {
  return uuidv5(slug, NS_UNIVERSITIES);
}

// =========================================================
// Slug Generation
// =========================================================

/**
 * Generate URL-friendly slug from university name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 200); // Limit length
}

// =========================================================
// Data Processing
// =========================================================

/**
 * Process JSON records and convert to university records
 */
function processUniversities(
  records: UniversityRecord[],
): ProcessedUniversity[] {
  const processed: ProcessedUniversity[] = [];
  const seenSlugs = new Set<string>();
  let duplicateCount = 0;

  for (const record of records) {
    // Generate slug
    let slug = generateSlug(record.name);

    // Handle duplicate slugs by appending country code
    if (seenSlugs.has(slug)) {
      slug = `${slug}-${record.alpha_two_code.toLowerCase()}`;
      duplicateCount++;

      // If still duplicate, append a number
      let counter = 1;
      const baseSlug = slug;
      while (seenSlugs.has(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    seenSlugs.add(slug);

    processed.push({
      id: toUUID(slug),
      name: record.name.trim(),
      slug,
      country: record.country,
      alpha_two_code: record.alpha_two_code,
      domains: record.domains || [],
      web_pages: record.web_pages || [],
      state_province: record["state-province"],
      metadata: {},
    });
  }

  if (duplicateCount > 0) {
    console.log(`Handled ${duplicateCount} duplicate slugs`);
  }

  return processed;
}

// =========================================================
// Database Operations
// =========================================================

async function upsertUniversities(
  universities: ProcessedUniversity[],
): Promise<void> {
  const batchSize = 500;

  for (let i = 0; i < universities.length; i += batchSize) {
    const batch = universities.slice(i, i + batchSize);

    // Prepare records for Supabase upsert
    const batchData = batch.map((uni) => ({
      id: uni.id,
      name: uni.name,
      slug: uni.slug,
      country: uni.country,
      alpha_two_code: uni.alpha_two_code,
      domains: uni.domains,
      web_pages: uni.web_pages,
      state_province: uni.state_province,
      metadata: uni.metadata,
    }));

    const { error } = await supabase
      .schema("data")
      .from("universities")
      .upsert(batchData, {
        onConflict: "slug",
      });

    if (error) {
      throw new Error(`Failed to upsert batch: ${error.message}`);
    }

    console.log(
      `Batch ${i / batchSize + 1}/${
        Math.ceil(universities.length / batchSize)
      }: ${batch.length} records processed`,
    );
  }

  console.log(`\nTotal: ${universities.length} universities processed`);
}

// =========================================================
// Statistics
// =========================================================

function displayStatistics(universities: ProcessedUniversity[]): void {
  const byCountry = new Map<string, number>();

  for (const uni of universities) {
    byCountry.set(uni.country, (byCountry.get(uni.country) || 0) + 1);
  }

  console.log("\n📊 Statistics:");
  console.log(`Total universities: ${universities.length}`);
  console.log(`Countries represented: ${byCountry.size}`);

  // Top 10 countries
  const topCountries = Array.from(byCountry.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log("\nTop 10 countries:");
  for (const [country, count] of topCountries) {
    console.log(`  ${country}: ${count}`);
  }
}

// =========================================================
// Main
// =========================================================

async function main(): Promise<void> {
  // Auto-detect JSON file in scripts directory
  const scriptDir = path.dirname(new URL(import.meta.url).pathname);
  const jsonFileName = "seed-universities.json";
  const filePath = path.join(scriptDir, jsonFileName);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ JSON file not found: ${filePath}`);
    console.error(`💡 Expected file: ${jsonFileName} in scripts directory`);
    console.error(
      "\nThe file should contain an array of university records with format:",
    );
    console.error(
      JSON.stringify(
        {
          name: "University Name",
          domains: ["example.edu"],
          web_pages: ["https://example.edu"],
          country: "United States",
          alpha_two_code: "US",
          "state-province": "California",
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }

  console.log(`📖 Reading universities from: ${jsonFileName}`);

  // Read and parse JSON
  let rawRecords: UniversityRecord[];
  try {
    const jsonContent = fs.readFileSync(filePath, "utf-8");
    rawRecords = JSON.parse(jsonContent);
  } catch (err) {
    console.error("❌ Failed to parse JSON file:", err);
    process.exit(1);
  }

  if (!Array.isArray(rawRecords)) {
    console.error("❌ JSON file must contain an array of university records");
    process.exit(1);
  }

  console.log(`Parsed ${rawRecords.length} records from JSON`);

  // Process universities
  const universities = processUniversities(rawRecords);
  console.log(`Processed ${universities.length} university records`);

  // Display statistics
  displayStatistics(universities);

  try {
    console.log("\n💾 Upserting universities...");
    await upsertUniversities(universities);

    console.log("\n✓ Successfully seeded universities catalog!");
  } catch (err) {
    console.error("\n❌ Error seeding database:", err);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
