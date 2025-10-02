// scripts/seed-csi.ts
import * as fs from "node:fs";
import * as path from "node:path";
import * as XLSX from "xlsx";
import { Client } from "pg";
import { v5 as uuidv5 } from "uuid";

type Row = {
  AA: string;
  BB: string;
  CC: string;
  DD: string;
  title: string;
  code_key: string;
  parent_key: string | null;
  id: string;
  parent_id: string | null;
};

// Namespace for deterministic UUIDs (CSI 2020)
const NS_SKILLS = uuidv5("scaffald:skills:csi2020", uuidv5.URL);
const NS_INDUSTRY = uuidv5("scaffald:industry", uuidv5.URL);
const INDUSTRY_ID = uuidv5("construction", NS_INDUSTRY); // deterministic
const INDUSTRY_SLUG = "construction";

function isTwoDigits(s: string) {
  return /^\d{2}$/.test(s);
}

function parseLineToParts(
  line: string,
): { AA: string; BB: string; CC: string; DD: string; title: string } | null {
  const s = line.trim();
  let m = s.match(/^(\d{2})\s+(\d{2})\s+(\d{2})(?:[.\s](\d{2}))?\s+(.*\S)\s*$/);
  if (m) {
    const [, AA, BB, CC, DDmaybe, title] = m;
    return { AA, BB, CC, DD: DDmaybe ?? "00", title: title.trim() };
  }
  m = s.match(/^(\d{2})\s+(.*\S)\s*$/);
  if (m) {
    const [, AA, title] = m;
    return { AA, BB: "00", CC: "00", DD: "00", title: title.trim() };
  }
  return null;
}

function normalizeFromColumns(
  code: string,
  title: string,
): { AA: string; BB: string; CC: string; DD: string; title: string } | null {
  const digits = (code.match(/\d+/g) ?? []).join("");
  if (digits.length < 2) return null;
  let pairs: string[] = [];
  for (let i = 0; i < Math.min(8, digits.length); i += 2) {
    pairs.push(digits.slice(i, i + 2).padStart(2, "0"));
  }
  while (pairs.length < 4) pairs.push("00");
  pairs = pairs.slice(0, 4);
  const [AA, BB, CC, DD] = pairs;
  return { AA, BB, CC, DD, title: (title || "").trim() };
}

function parentKey(
  AA: string,
  BB: string,
  CC: string,
  DD: string,
): string | null {
  if (BB === "00" && CC === "00" && DD === "00") return null;
  if (CC === "00" && DD === "00") return `${AA}-00-00-00`;
  if (DD === "00") return `${AA}-${BB}-00-00`;
  return `${AA}-${BB}-${CC}-00`;
}

function codeKey(AA: string, BB: string, CC: string, DD: string) {
  return `${AA}-${BB}-${CC}-${DD}`;
}

function toUUID(key: string) {
  return uuidv5(key, NS_SKILLS);
}

function loadXlsx(filePath: string): Row[] {
  const wb = XLSX.readFile(filePath);
  const rows: Row[] = [];
  const seenKeys = new Set<string>();

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      blankrows: false,
    }) as (
      | string
      | number
      | null
      | undefined
    )[][];

    for (const row of data) {
      if (!row || row.length === 0) continue;

      if (row.length === 1 && typeof row[0] === "string") {
        const parsed = parseLineToParts(row[0]);
        if (!parsed) continue;
        const { AA, BB, CC, DD, title } = parsed;
        if (
          !isTwoDigits(AA) || !isTwoDigits(BB) || !isTwoDigits(CC) ||
          !isTwoDigits(DD)
        ) continue;
        const pkey = parentKey(AA, BB, CC, DD);
        const ckey = codeKey(AA, BB, CC, DD);
        if (seenKeys.has(ckey)) continue;
        seenKeys.add(ckey);
        rows.push({
          AA,
          BB,
          CC,
          DD,
          title,
          code_key: ckey,
          parent_key: pkey,
          id: toUUID(ckey),
          parent_id: pkey ? toUUID(pkey) : null,
        });
        continue;
      }

      if (row.length >= 2 && typeof row[0] === "string") {
        const code = String(row[0] ?? "");
        const title = String(row[1] ?? "");
        const parsed = normalizeFromColumns(code, title);
        if (!parsed) continue;
        const { AA, BB, CC, DD } = parsed;
        const ttl = parsed.title;
        if (!ttl) continue;
        const pkey = parentKey(AA, BB, CC, DD);
        const ckey = codeKey(AA, BB, CC, DD);
        if (seenKeys.has(ckey)) continue;
        seenKeys.add(ckey);
        rows.push({
          AA,
          BB,
          CC,
          DD,
          title: ttl,
          code_key: ckey,
          parent_key: pkey,
          id: toUUID(ckey),
          parent_id: pkey ? toUUID(pkey) : null,
        });
      }
    }
  }

  // Ensure missing ancestors
  const existing = new Set(rows.map((r) => r.code_key));
  const add: Row[] = [];
  for (const r of rows) {
    const ancestors: (string | null)[] = [
      r.parent_key,
      r.CC !== "00" ? codeKey(r.AA, r.BB, "00", "00") : null,
      r.BB !== "00" ? codeKey(r.AA, "00", "00", "00") : null,
    ];
    for (const ak of ancestors) {
      if (!ak || existing.has(ak)) continue;
      const [AA, BB, CC, DD] = ak.split("-");
      const ttl = r.title.split(/[:\-–—(]/)[0].trim() || "Untitled";
      add.push({
        AA,
        BB,
        CC,
        DD,
        title: ttl,
        code_key: ak,
        parent_key: parentKey(AA, BB, CC, DD),
        id: toUUID(ak),
        parent_id: parentKey(AA, BB, CC, DD)
          ? toUUID(parentKey(AA, BB, CC, DD)!)
          : null,
      });
      existing.add(ak);
    }
  }
  return rows.concat(add);
}

async function upsertIndustry(client: Client) {
  await client.query(
    `
    INSERT INTO industries (id, slug, name, description, metadata, created_at, updated_at)
    VALUES ($1, $2, $3, $4, '{}'::jsonb, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;
  `,
    [
      INDUSTRY_ID,
      INDUSTRY_SLUG,
      "construction",
      "CSI MasterFormat skills live under this industry.",
    ],
  );
}

type Insertable = {
  id: string;
  name: string;
  industry_id: string;
  parent_id: string | null;
  active: boolean;
  csi: [string, string, string, string];
};

function toInsertable(r: Row): Insertable {
  return {
    id: r.id,
    name: r.title,
    industry_id: INDUSTRY_ID,
    parent_id: r.parent_id,
    active: true,
    csi: [r.AA, r.BB, r.CC, r.DD],
  };
}

async function upsertSkills(client: Client, rows: Row[]) {
  const depth = (
    r: Row,
  ) => (r.DD !== "00" ? 4 : r.CC !== "00" ? 3 : r.BB !== "00" ? 2 : 1);
  rows.sort((a, b) =>
    depth(a) - depth(b) || a.code_key.localeCompare(b.code_key)
  );

  const batchSize = 1000;
  for (let i = 0; i < rows.length; i += batchSize) {
    const slice = rows.slice(i, i + batchSize).map(toInsertable);
    const values:
      (string | boolean | null | [string, string, string, string])[] = [];
    const tuples: string[] = [];
    slice.forEach((r, idx) => {
      const o = idx * 6;
      tuples.push(
        `($${o + 1}, $${o + 2}, $${o + 3}, $${o + 4}, $${o + 5}, $${
          o + 6
        }, NOW(), NOW())`,
      );
      values.push(r.id, r.name, r.industry_id, r.parent_id, r.active, r.csi);
    });

    const sql = `
      INSERT INTO skills (id, name, industry_id, parent_id, active, csi, created_at, updated_at)
      VALUES ${tuples.join(",")}
      ON CONFLICT (code_key) DO UPDATE
        SET name = EXCLUDED.name,
            industry_id = EXCLUDED.industry_id,
            parent_id = EXCLUDED.parent_id,
            active = EXCLUDED.active,
            csi = EXCLUDED.csi,
            updated_at = NOW();
    `;
    await client.query(sql, values);
  }
}

async function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error("Usage: ts-node scripts/seed-csi.ts /path/to/COMBINED.xlsx");
    process.exit(1);
  }
  const filePath = path.resolve(fileArg);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Please set DATABASE_URL in your environment.");
    process.exit(1);
  }

  const rows = loadXlsx(filePath);

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query("BEGIN");
    await upsertIndustry(client);
    await upsertSkills(client, rows);
    await client.query("COMMIT");
    console.log(
      `Seeded ${rows.length} CSI 2020 records (including synthesized parents).`,
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
