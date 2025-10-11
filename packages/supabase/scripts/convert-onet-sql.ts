#!/usr/bin/env tsx
/**
 * Convert O*NET MySQL dumps to PostgreSQL format
 * Processes all .sql files in packages/supabase/onet/
 * and generates PostgreSQL-compatible SQL with onet. schema prefix
 */

import fs from "node:fs";
import path from "node:path";

const ONET_DIR = path.join(process.cwd(), "packages/supabase/onet");
const OUTPUT_FILE = path.join(
  process.cwd(),
  "packages/supabase/migrations/084_import_onet_full_data.sql",
);

interface ConversionStats {
  filesProcessed: number;
  tablesCreated: number;
  rowsInserted: number;
  warnings: string[];
}

const stats: ConversionStats = {
  filesProcessed: 0,
  tablesCreated: 0,
  rowsInserted: 0,
  warnings: [],
};

/**
 * Convert MySQL CREATE TABLE to PostgreSQL
 */
function convertCreateTable(sql: string): string {
  let converted = sql;

  // Replace CHARACTER VARYING with VARCHAR or TEXT
  converted = converted.replace(
    /CHARACTER VARYING\((\d+)\)/gi,
    (_match, length) => {
      const len = Number.parseInt(length);
      return len > 255 ? "TEXT" : `VARCHAR(${length})`;
    },
  );

  // Replace CHARACTER(n) with CHAR(n) or VARCHAR(n)
  converted = converted.replace(/CHARACTER\((\d+)\)/gi, "CHAR($1)");

  // Add onet schema prefix to table name
  converted = converted.replace(
    /CREATE TABLE\s+(?:IF NOT EXISTS\s+)?([a-z_]+)\s*\(/gi,
    "CREATE TABLE IF NOT EXISTS onet.$1 (",
  );

  // Convert MySQL-specific data types
  converted = converted.replace(/\bINTEGER\b/gi, "INT");
  converted = converted.replace(/\bDECIMAL\b/gi, "DECIMAL");

  // Add onet schema prefix to foreign key references
  converted = converted.replace(
    /REFERENCES\s+([a-z_]+)\s*\(/gi,
    "REFERENCES onet.$1 (",
  );

  return converted;
}

/**
 * Convert MySQL INSERT statements to PostgreSQL
 */
function convertInsert(sql: string): string {
  let converted = sql;

  // Add onet schema prefix to INSERT INTO
  converted = converted.replace(
    /INSERT INTO\s+([a-z_]+)\s*\(/gi,
    "INSERT INTO onet.$1 (",
  );

  // Handle escaped single quotes (MySQL uses '' or \', PostgreSQL uses '')
  // Already handles '' correctly, so just remove backslash escapes
  converted = converted.replace(/\\'/g, "''");

  return converted;
}

/**
 * Convert MySQL transaction commands to PostgreSQL
 */
function convertTransactions(sql: string): string {
  let converted = sql;

  // Replace MySQL transaction markers
  converted = converted.replace(
    /\/\*!\s*START TRANSACTION\s*\*\/;?/gi,
    "-- BEGIN (handled at file level)",
  );
  converted = converted.replace(
    /\/\*!\s*COMMIT\s*\*\/;?/gi,
    "-- COMMIT (handled at file level)",
  );

  return converted;
}

/**
 * Extract table name from CREATE TABLE statement
 */
function extractTableName(sql: string): string | null {
  const match = sql.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?([a-z_]+)/i);
  return match ? match[1] : null;
}

/**
 * Process a single SQL file
 */
function processFile(filename: string): string {
  const filepath = path.join(ONET_DIR, filename);

  console.log(`Processing ${filename}...`);

  if (!fs.existsSync(filepath)) {
    stats.warnings.push(`File not found: ${filename}`);
    return "";
  }

  let content = fs.readFileSync(filepath, "utf-8");

  // Track statistics
  const createMatches = content.match(/CREATE TABLE/gi);
  const insertMatches = content.match(/INSERT INTO/gi);

  if (createMatches) stats.tablesCreated += createMatches.length;
  if (insertMatches) stats.rowsInserted += insertMatches.length;

  // Convert transactions
  content = convertTransactions(content);

  // Convert CREATE TABLE statements
  content = convertCreateTable(content);

  // Convert INSERT statements
  content = convertInsert(content);

  // Extract table name for section header
  const tableName = extractTableName(content);
  const sectionHeader = tableName
    ? `\n-- =========================================================\n-- ${tableName.toUpperCase()}\n-- =========================================================\n`
    : "";

  stats.filesProcessed++;

  return sectionHeader + content;
}

/**
 * Get all SQL files in dependency order
 */
function getFilesInOrder(): string[] {
  // Order matters! Reference tables first, then tables with FKs
  const orderedFiles = [
    // Reference/lookup tables first
    "01_content_model_reference.sql",
    "02_scales_reference.sql",
    "03_occupation_data.sql", // Core table
    "04_iwa_reference.sql",
    "05_job_zones.sql",

    // Abilities
    "06_abilities.sql",
    "07_ability_scores.sql",

    // Skills
    "08_skills.sql",
    "09_skill_scores.sql",

    // Knowledge
    "10_knowledge.sql",
    "11_knowledge_scores.sql",

    // Work Activities
    "12_work_activities.sql",
    "13_work_activity_scores.sql",
    "14_dwa_reference.sql",

    // Work Context
    "15_work_context.sql",
    "16_work_context_scores.sql",
    "17_work_context_categories.sql",

    // Work Styles
    "18_work_styles.sql",
    "19_work_style_scores.sql",

    // Work Values
    "20_work_values.sql",
    "21_work_value_scores.sql",

    // Interests
    "22_interests.sql",
    "23_interest_scores.sql",

    // Education & Training
    "24_education_training_experience.sql",
    "25_education_training_categories.sql",
    "26_job_zone_reference.sql",

    // Tasks
    "27_task_statements.sql",
    "28_task_categories.sql",
    "29_task_ratings.sql",
    "30_tasks_to_dwas.sql",

    // Tools & Technology
    "31_tools_used.sql",
    "32_technology_skills.sql",

    // Titles & Descriptions
    "33_alternate_titles.sql",
    "34_sample_of_reported_titles.sql",

    // Additional reference data
    "35_unspsc_reference.sql",
    "36_occupation_level_metadata.sql",
    "37_iwa_to_work_activity.sql",
    "38_career_changers_matrix.sql",
    "39_related_occupations.sql",
    "40_updated_links.sql",
  ];

  // Get actual files in directory
  const actualFiles = fs.readdirSync(ONET_DIR).filter((f) => f.endsWith(".sql"))
    .sort();

  // Use ordered list where possible, append any unexpected files
  const result: string[] = [];
  const processed = new Set<string>();

  // First, add files in our defined order
  for (const file of orderedFiles) {
    if (actualFiles.includes(file)) {
      result.push(file);
      processed.add(file);
    }
  }

  // Then add any remaining files we didn't explicitly order
  for (const file of actualFiles) {
    if (!processed.has(file)) {
      result.push(file);
      console.log(`Warning: Unexpected file (adding to end): ${file}`);
    }
  }

  return result;
}

/**
 * Main conversion function
 */
function main() {
  console.log("🔄 Starting O*NET SQL conversion...\n");

  if (!fs.existsSync(ONET_DIR)) {
    console.error(`❌ Error: O*NET directory not found at ${ONET_DIR}`);
    process.exit(1);
  }

  const files = getFilesInOrder();

  if (files.length === 0) {
    console.error("❌ Error: No SQL files found in O*NET directory");
    process.exit(1);
  }

  console.log(`Found ${files.length} SQL files to process\n`);

  // Generate output
  const header = `-- =========================================================
-- 084_import_onet_full_data.sql - Complete O*NET 30.0 Data
-- =========================================================
-- Auto-generated from O*NET Database MySQL dumps
-- Generated: ${new Date().toISOString()}
-- Source files: ${files.length}
-- =========================================================

BEGIN;

-- Disable triggers during bulk import for performance
SET session_replication_role = replica;

`;

  const footer = `
-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Analyze tables for query optimization
ANALYZE onet.occupation_data;
ANALYZE onet.abilities;
ANALYZE onet.skills;
ANALYZE onet.knowledge;
ANALYZE onet.work_activities;

COMMIT;

-- =========================================================
-- Import complete
-- =========================================================
`;

  let output = header;

  // Process each file
  for (const file of files) {
    try {
      const converted = processFile(file);
      output += `${converted}\n`;
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
      stats.warnings.push(`Failed to process ${file}: ${error}`);
    }
  }

  output += footer;

  // Write output
  fs.writeFileSync(OUTPUT_FILE, output, "utf-8");

  // Print statistics
  console.log("\n✅ Conversion complete!\n");
  console.log("📊 Statistics:");
  console.log(`   Files processed: ${stats.filesProcessed}`);
  console.log(`   Tables created: ${stats.tablesCreated}`);
  console.log(`   Insert statements: ${stats.rowsInserted}`);
  console.log(`   Output file: ${OUTPUT_FILE}`);
  console.log(
    `   File size: ${
      (fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2)
    } MB`,
  );

  if (stats.warnings.length > 0) {
    console.log("\n⚠️  Warnings:");
    for (const warning of stats.warnings) {
      console.log(`   - ${warning}`);
    }
  }

  console.log("\n🎉 Ready to import! Run:");
  console.log("   pnpm supa db reset\n");
}

// Run conversion
main();
