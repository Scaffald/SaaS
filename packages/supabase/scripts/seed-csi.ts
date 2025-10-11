// scripts/seed-csi.ts
// Seeds CSI MasterFormat 2020 codes from CSV into the skills table
import * as fs from "node:fs";
import * as path from "node:path";
import { parse } from "csv-parse/sync";
import { Client } from "pg";
import { v5 as uuidv5 } from "uuid";

// =========================================================
// Types
// =========================================================

interface CSIRecord {
  id: string;
  name: string;
  parent_id: string | null;
  active: boolean;
  csi_code: [string, string, string, string];
  csi_code_key: string;
  csi_display: string;
  csi_depth: number;
}

// =========================================================
// Constants
// =========================================================

const NS_SKILLS = uuidv5("scaffald:skills:csi2018", uuidv5.URL);

// =========================================================
// UUID Generation
// =========================================================

function toUUID(codeKey: string): string {
  return uuidv5(codeKey, NS_SKILLS);
}

// =========================================================
// Code Parsing
// =========================================================

/**
 * Parse a CSI code string into its 4 components
 * Examples:
 *   "03" -> ["03", "00", "00", "00"]
 *   "03 11" -> ["03", "11", "00", "00"]
 *   "03 11 13" -> ["03", "11", "13", "00"]
 *   "03 11 13.16" -> ["03", "11", "13", "16"]
 */
function parseCSICode(code: string): [string, string, string, string] {
  const normalized = code.replace(/\./g, " ").trim();
  const parts = normalized.split(/\s+/);

  const result: [string, string, string, string] = ["00", "00", "00", "00"];

  for (let i = 0; i < Math.min(4, parts.length); i++) {
    const part = parts[i].padStart(2, "0");
    if (/^\d{2}$/.test(part)) {
      result[i] = part;
    }
  }

  return result;
}

/**
 * Generate the code key from 4-part array
 * ["03", "11", "13", "16"] -> "03-11-13-16"
 */
function generateCodeKey(code: [string, string, string, string]): string {
  return code.join("-");
}

/**
 * Generate the display format
 * ["03", "11", "13", "16"] -> "03 11 13.16"
 */
function generateDisplayCode(code: [string, string, string, string]): string {
  const [AA, BB, CC, DD] = code;
  return `${AA} ${BB} ${CC}.${DD}`;
}

/**
 * Calculate depth of CSI code
 * ["03", "00", "00", "00"] -> 1
 * ["03", "11", "00", "00"] -> 2
 * ["03", "11", "13", "00"] -> 3
 * ["03", "11", "13", "16"] -> 4
 */
function calculateDepth(code: [string, string, string, string]): number {
  const [_AA, BB, CC, DD] = code;
  if (DD !== "00") return 4;
  if (CC !== "00") return 3;
  if (BB !== "00") return 2;
  return 1;
}

/**
 * Get parent code for a given code
 * ["03", "11", "13", "16"] -> ["03", "11", "13", "00"]
 * ["03", "11", "13", "00"] -> ["03", "11", "00", "00"]
 * ["03", "11", "00", "00"] -> ["03", "00", "00", "00"]
 * ["03", "00", "00", "00"] -> null
 */
function getParentCode(
  code: [string, string, string, string],
): [string, string, string, string] | null {
  const [AA, BB, CC, DD] = code;

  if (DD !== "00") {
    return [AA, BB, CC, "00"];
  }
  if (CC !== "00") {
    return [AA, BB, "00", "00"];
  }
  if (BB !== "00") {
    return [AA, "00", "00", "00"];
  }

  return null;
}

// =========================================================
// CSV Processing
// =========================================================

/**
 * Process CSV rows and convert to CSI records
 */
function processCsvRows(rows: string[][]): CSIRecord[] {
  const records: CSIRecord[] = [];
  let skippedCount = 0;

  for (const [codeStr, title] of rows) {
    // Skip rows with missing data
    if (!codeStr || !title) {
      skippedCount++;
      continue;
    }

    // Basic validation: CSI codes should match expected pattern
    if (!codeStr.match(/^\d{2}(\s\d{2}){0,2}(\.\d{2})?$/)) {
      console.warn(`Skipping malformed code: "${codeStr}"`);
      skippedCount++;
      continue;
    }

    const code = parseCSICode(codeStr);
    const codeKey = generateCodeKey(code);
    const displayCode = generateDisplayCode(code);
    const depth = calculateDepth(code);

    // Calculate parent based on code structure
    const parentCode = getParentCode(code);
    const parentId = parentCode ? toUUID(generateCodeKey(parentCode)) : null;

    const record: CSIRecord = {
      id: toUUID(codeKey),
      name: title.trim(),
      parent_id: parentId,
      active: true,
      csi_code: code,
      csi_code_key: codeKey,
      csi_display: displayCode,
      csi_depth: depth,
    };

    records.push(record);
  }

  if (skippedCount > 0) {
    console.log(`Skipped ${skippedCount} malformed rows`);
  }

  return records;
}

/**
 * Ensure all parent records exist by synthesizing missing ones
 */
function ensureParentRecords(records: CSIRecord[]): CSIRecord[] {
  const existing = new Set(records.map((r) => r.csi_code_key));
  const synthetic: CSIRecord[] = [];

  for (const record of records) {
    let currentCode = record.csi_code;

    // Walk up the parent chain
    while (true) {
      const parentCode = getParentCode(currentCode);
      if (!parentCode) break;

      const parentKey = generateCodeKey(parentCode);
      if (existing.has(parentKey)) break;

      // Create synthetic parent record
      const displayCode = generateDisplayCode(parentCode);
      const depth = calculateDepth(parentCode);
      const grandparentCode = getParentCode(parentCode);

      synthetic.push({
        id: toUUID(parentKey),
        name: `${displayCode} (Parent Category)`,
        parent_id: grandparentCode
          ? toUUID(generateCodeKey(grandparentCode))
          : null,
        active: true,
        csi_code: parentCode,
        csi_code_key: parentKey,
        csi_display: displayCode,
        csi_depth: depth,
      });

      existing.add(parentKey);
      currentCode = parentCode;
    }
  }

  return [...synthetic, ...records];
}

// =========================================================
// Database Operations
// =========================================================

async function upsertSkills(
  client: Client,
  records: CSIRecord[],
): Promise<void> {
  // Sort by depth to ensure parents are inserted before children
  records.sort((a, b) => {
    if (a.csi_depth !== b.csi_depth) {
      return a.csi_depth - b.csi_depth;
    }
    return a.csi_code_key.localeCompare(b.csi_code_key);
  });

  const batchSize = 500;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const values: unknown[] = [];
    const placeholders: string[] = [];

    batch.forEach((record, idx) => {
      const offset = idx * 8;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}::text[], $${offset + 3}, $${
          offset + 4
        }, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${
          offset + 8
        }, NOW(), NOW())`,
      );
      values.push(
        record.id,
        record.csi_code,
        record.csi_code_key,
        record.csi_display,
        record.name,
        record.csi_depth,
        record.parent_id,
        record.active,
      );
    });

    const sql = `
      INSERT INTO csi.masterformat (
        id,
        code,
        code_key,
        code_display,
        name,
        depth,
        parent_id,
        active,
        created_at, 
        updated_at
      )
      VALUES ${placeholders.join(",")}
      ON CONFLICT (code_key) 
      DO UPDATE SET
        name = EXCLUDED.name,
        code_display = EXCLUDED.code_display,
        depth = EXCLUDED.depth,
        parent_id = EXCLUDED.parent_id,
        active = EXCLUDED.active,
        updated_at = NOW();
    `;

    await client.query(sql, values);
    console.log(
      `Processed batch ${i / batchSize + 1}: ${batch.length} records`,
    );
  }
}

// =========================================================
// Main
// =========================================================

async function main(): Promise<void> {
  // Auto-detect CSV file in scripts directory
  const scriptDir = path.dirname(new URL(import.meta.url).pathname);
  const csvFileName = "seed-csi-2020.csv";
  const filePath = path.join(scriptDir, csvFileName);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ CSV file not found: ${filePath}`);
    console.error(`💡 Expected file: ${csvFileName} in scripts directory`);
    process.exit(1);
  }

  console.log(`📖 Reading CSI taxonomy from: ${csvFileName}`);

  // Read and parse CSV
  const csvContent = fs.readFileSync(filePath, "utf-8");
  const rows = parse(csvContent, {
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true, // Handle any formatting inconsistencies
  }) as string[][];

  console.log(`Parsed ${rows.length} rows from CSV`);

  // Process CSV rows
  const records = processCsvRows(rows);
  console.log(`Generated ${records.length} records from CSV`);

  // Ensure parent records
  const allRecords = ensureParentRecords(records);
  console.log(
    `Total records (including synthetic parents): ${allRecords.length}`,
  );

  // Connect to database
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Error: DATABASE_URL environment variable is not set");
    console.error("Set it to your Supabase local connection string:");
    console.error(
      "  export DATABASE_URL='postgresql://postgres:postgres@localhost:54322/postgres'",
    );
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    console.log("Starting database transaction...");
    await client.query("BEGIN");

    console.log("Upserting CSI MasterFormat codes...");
    await upsertSkills(client, allRecords);

    await client.query("COMMIT");
    console.log("✓ Successfully seeded CSI MasterFormat 2020 taxonomy!");
    console.log(`  Total records: ${allRecords.length}`);
    console.log(
      `  Depth 1 (Divisions): ${
        allRecords.filter((r) => r.csi_depth === 1).length
      }`,
    );
    console.log(
      `  Depth 2 (Level 2): ${
        allRecords.filter((r) => r.csi_depth === 2).length
      }`,
    );
    console.log(
      `  Depth 3 (Level 3): ${
        allRecords.filter((r) => r.csi_depth === 3).length
      }`,
    );
    console.log(
      `  Depth 4 (Level 4): ${
        allRecords.filter((r) => r.csi_depth === 4).length
      }`,
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error seeding database:", err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
