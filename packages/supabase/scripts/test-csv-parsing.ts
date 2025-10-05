// Test CSV parsing logic without database connection
import { parse } from "csv-parse/sync";

// Sample CSV data from first 30 lines
const sampleCsv = `00 00 00,Procurement and Contracting Requirements
00 01 01,Project Title Page
00 01 03,Project Directory
00 01 05,Certifications Page
00 01 07,Seals Page
00 01 10,Table of Contents
00 01 15,List of Drawing Sheets
00 01 20,List of Schedules
00 10 00,Solicitation
00 11 00,Advertisements and Invitations
00 11 13,Advertisement for Bids
00 11 15,Advertisement for Prequalification of Bidders
00 11 16,Invitation to Bid
00 11 19,Request for Proposal
00 11 53,Request for Qualifications
00 20 00,Instructions for Procurement
00 21 00,Instructions
00 21 13,Instructions to Bidders
00 21 16,Instructions to Proposers
00 22 00,Supplementary Instructions
00 22 13,Supplementary Instructions to Bidders
00 22 16,Supplementary Instructions to Proposers
00 23 00,Procurement Definitions
00 24 00,Procurement Scopes
00 24 13,Scopes of Bids
00 24 13.13,Scopes of Bids (Multiple Contracts)
00 24 13.16,Scopes of Bids (Multiple-Prime Contract)
00 24 16,Scopes of Proposals
00 24 16.13,Scopes of Proposals (Multiple Contracts)
00 24 16.16,Scopes of Proposals (Multiple-Prime Contract)`;

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

function generateCodeKey(code: [string, string, string, string]): string {
  return code.join("-");
}

function generateDisplayCode(code: [string, string, string, string]): string {
  const [AA, BB, CC, DD] = code;
  return `${AA} ${BB} ${CC}.${DD}`;
}

function calculateDepth(code: [string, string, string, string]): number {
  const [_AA, BB, CC, DD] = code;
  if (DD !== "00") return 4;
  if (CC !== "00") return 3;
  if (BB !== "00") return 2;
  return 1;
}

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

// Parse CSV
const rows = parse(sampleCsv, {
  skip_empty_lines: true,
  trim: true,
  relax_column_count: true,
}) as string[][];

console.log("📊 CSV Parsing Test");
console.log("=".repeat(80));
console.log(`Total rows parsed: ${rows.length}\n`);

// Process and display results
const results = [];
for (const [codeStr, title] of rows) {
  const code = parseCSICode(codeStr);
  const codeKey = generateCodeKey(code);
  const displayCode = generateDisplayCode(code);
  const depth = calculateDepth(code);
  const parentCode = getParentCode(code);
  const parentKey = parentCode ? generateCodeKey(parentCode) : null;

  results.push({
    original: codeStr,
    display: displayCode,
    key: codeKey,
    depth,
    parentKey,
    title: title.substring(0, 40) + (title.length > 40 ? "..." : ""),
  });
}

// Group by depth
const byDepth = results.reduce(
  (acc, r) => {
    acc[r.depth] = acc[r.depth] || [];
    acc[r.depth].push(r);
    return acc;
  },
  {} as Record<number, typeof results>,
);

// Display summary
console.log("📈 Depth Distribution:");
for (let depth = 1; depth <= 4; depth++) {
  const count = byDepth[depth]?.length || 0;
  console.log(`  Depth ${depth}: ${count} records`);
}

console.log("\n🔍 Sample Records by Depth:\n");

// Show examples from each depth
for (let depth = 1; depth <= 4; depth++) {
  const records = byDepth[depth] || [];
  if (records.length === 0) continue;

  console.log(`Depth ${depth} Examples:`);
  for (const r of records.slice(0, 3)) {
    console.log(`  ${r.display} → "${r.title}"`);
    if (r.parentKey) {
      console.log(`    Parent: ${r.parentKey}`);
    }
  }
  console.log();
}

// Verify parent-child relationships
console.log("🔗 Parent-Child Relationship Verification:\n");
const allKeys = new Set(results.map((r) => r.key));
let missingParents = 0;

for (const record of results) {
  if (record.parentKey && !allKeys.has(record.parentKey)) {
    missingParents++;
    console.log(`  Missing parent for ${record.key} → ${record.parentKey}`);
  }
}

if (missingParents > 0) {
  console.log(
    `\n⚠️  ${missingParents} records have missing parents (will be synthesized)`,
  );
} else {
  console.log("✓ All parent relationships are satisfied!");
}

console.log(`\n${"=".repeat(80)}`);
console.log("✓ CSV parsing test completed successfully!");
