/**
 * Seed certifications catalog from YAML
 * Creates hierarchical certification structure
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import * as path from "node:path";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "http://127.0.0.1:54321";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseServiceKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required");
  console.error("💡 Get it from: pnpm supa status");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CertificationNode {
  title: string;
  description?: string;
  [key: string]: unknown;
}

interface CertificationInsert {
  slug: string;
  title: string;
  description: string | null;
  parent_id: string | null;
  depth: number;
  hierarchy_path: string;
  sort_order: number;
  is_active: boolean;
}

async function seedCertifications() {
  console.log("\n📜 Seeding Certifications Catalog...");

  try {
    // Read and parse YAML file
    const scriptDir = path.dirname(new URL(import.meta.url).pathname);
    const yamlPath = path.join(scriptDir, "seed-certifications.yaml");
    const yamlContent = readFileSync(yamlPath, "utf8");
    const certData = parse(yamlContent);

    console.log("✅ Loaded certification YAML");

    // Clear existing certifications
    const { error: deleteError } = await supabase
      .schema("data")
      .from("certifications")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

    if (deleteError) {
      console.error(
        "⚠️  Warning: Could not clear existing certifications:",
        deleteError.message,
      );
    } else {
      console.log("🗑️  Cleared existing certifications");
    }

    const certificationsToInsert: CertificationInsert[] = [];
    const parentIdMap = new Map<string, string>(); // slug -> uuid

    let sortOrder = 0;

    // Process YAML structure hierarchically
    for (
      const [topSlug, topNode] of Object.entries(certData) as [
        string,
        CertificationNode,
      ][]
    ) {
      sortOrder++;

      // Level 0: Top-level categories (e.g., "osha", "first_aid")
      const topCert: CertificationInsert = {
        slug: topSlug,
        title: topNode.title,
        description: topNode.description || null,
        parent_id: null,
        depth: 0,
        hierarchy_path: topSlug,
        sort_order: sortOrder,
        is_active: true,
      };
      certificationsToInsert.push(topCert);

      // Process children (level 1 and 2)
      let childSortOrder = 0;
      for (const [childKey, childValue] of Object.entries(topNode)) {
        // Skip metadata fields
        if (childKey === "title" || childKey === "description") continue;

        childSortOrder++;
        const childNode = childValue as CertificationNode;

        // Level 1: Sub-categories (e.g., "construction", "cpr_aed")
        const level1Cert: CertificationInsert = {
          slug: `${topSlug}.${childKey}`,
          title: childNode.title,
          description: childNode.description || null,
          parent_id: topSlug, // Will be replaced with UUID later
          depth: 1,
          hierarchy_path: `${topSlug}.${childKey}`,
          sort_order: childSortOrder,
          is_active: true,
        };
        certificationsToInsert.push(level1Cert);

        // Process grandchildren (actual certifications - level 2)
        let grandchildSortOrder = 0;
        for (
          const [grandchildKey, grandchildValue] of Object.entries(childNode)
        ) {
          // Skip metadata fields
          if (grandchildKey === "title" || grandchildKey === "description") {
            continue;
          }

          grandchildSortOrder++;
          const grandchildNode = grandchildValue as CertificationNode;

          // Level 2: Actual certifications (e.g., "osha-10-construction")
          const level2Cert: CertificationInsert = {
            slug: `${topSlug}.${childKey}.${grandchildKey}`,
            title: grandchildNode.title,
            description: grandchildNode.description || null,
            parent_id: `${topSlug}.${childKey}`, // Will be replaced with UUID later
            depth: 2,
            hierarchy_path: `${topSlug}.${childKey}.${grandchildKey}`,
            sort_order: grandchildSortOrder,
            is_active: true,
          };
          certificationsToInsert.push(level2Cert);
        }
      }
    }

    console.log(`📊 Parsed ${certificationsToInsert.length} certifications`);
    console.log(
      `   - Level 0 (top): ${
        certificationsToInsert.filter((c) => c.depth === 0).length
      }`,
    );
    console.log(
      `   - Level 1 (categories): ${
        certificationsToInsert.filter((c) => c.depth === 1).length
      }`,
    );
    console.log(
      `   - Level 2 (certifications): ${
        certificationsToInsert.filter((c) => c.depth === 2).length
      }`,
    );

    // Insert certifications in order (depth 0, then 1, then 2)
    // This ensures parent IDs exist before children are inserted
    for (let depth = 0; depth <= 2; depth++) {
      const certsAtDepth = certificationsToInsert.filter((c) =>
        c.depth === depth
      );

      if (certsAtDepth.length === 0) continue;

      console.log(
        `\n📝 Inserting ${certsAtDepth.length} certifications at depth ${depth}...`,
      );

      for (const cert of certsAtDepth) {
        // Resolve parent_id slug to actual UUID
        let parentUuid: string | null = null;
        if (cert.parent_id) {
          parentUuid = parentIdMap.get(cert.parent_id) || null;
          if (!parentUuid) {
            console.error(
              `❌ Could not find parent UUID for ${cert.parent_id}`,
            );
            continue;
          }
        }

        // Insert certification
        const { data, error } = await supabase
          .schema("data")
          .from("certifications")
          .insert({
            ...cert,
            parent_id: parentUuid,
          })
          .select("id, slug")
          .single();

        if (error) {
          console.error(`❌ Error inserting ${cert.slug}:`, error.message);
          continue;
        }

        // Store mapping for children to reference
        if (data) {
          parentIdMap.set(cert.slug, data.id);
        }
      }
    }

    console.log("\n✅ Certifications catalog seeded successfully!");

    // Verify count
    const { count, error: countError } = await supabase
      .schema("data")
      .from("certifications")
      .select("*", { count: "exact", head: true });

    if (!countError) {
      console.log(`📊 Total certifications in database: ${count}`);
    }

    // Show sample
    const { data: samples } = await supabase
      .schema("data")
      .from("certifications")
      .select("slug, title, depth")
      .eq("depth", 2)
      .limit(5);

    if (samples && samples.length > 0) {
      console.log("\n📋 Sample certifications:");
      for (const sample of samples) {
        console.log(`   - ${sample.title} (${sample.slug})`);
      }
    }
  } catch (error) {
    console.error("❌ Error seeding certifications:", error);
    throw error;
  }
}

async function main() {
  await seedCertifications();
}

main().catch((error) => {
  console.error("\n💥 Seeding failed:", error);
  process.exit(1);
});
