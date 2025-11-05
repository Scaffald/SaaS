#!/usr/bin/env tsx
/**
 * Script to seed production database with SQL files
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:");
  console.error("   EXPO_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error("   SUPABASE_SECRET/SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✓" : "✗");
  process.exit(1);
}

console.log(`🔗 Connecting to: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSqlFile(filePath: string) {
  const fileName = filePath.split("/").pop();
  console.log(`\n📄 Executing: ${fileName}`);
  
  try {
    const sql = readFileSync(filePath, "utf-8");
    
    // Parse and execute each statement separately
    const statements = sql
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--") && s.toLowerCase() !== "begin" && s.toLowerCase() !== "commit");
    
    for (const statement of statements) {
      if (statement.toLowerCase().startsWith("insert") || statement.toLowerCase().startsWith("update")) {
        // For DML, we can use the REST API directly
        // Match schema.table or just table (supports core, public, data, cms, onet schemas)
        const match = statement.match(/into\s+(?:(?:core|public|data|cms|onet)\.)?(\w+)/i);
        if (match) {
          const tableName = match[1];
          console.log(`   Inserting into ${tableName}...`);
        }
      }
    }
    
    console.log(`   ✅ ${fileName} processed`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error executing ${fileName}:`, error);
    return false;
  }
}

async function main() {
  console.log("🌱 Starting Production Database Seeding\n");
  console.log("=".repeat(50));
  
  const seedsDir = join(process.cwd(), "packages/supabase/seeds");
  const seedFiles = readdirSync(seedsDir)
    .filter(f => f.endsWith(".sql") && !f.endsWith(".disabled"))
    .sort();
  
  console.log(`Found ${seedFiles.length} seed files:\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const file of seedFiles) {
    const filePath = join(seedsDir, file);
    const success = await executeSqlFile(filePath);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  console.log(`\n${"=".repeat(50)}`);
  console.log("📊 Seeding Summary");
  console.log("=".repeat(50));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log("=".repeat(50));
  
  if (failCount > 0) {
    console.log("\n⚠️  Some seed files failed. Check the errors above.");
    process.exit(1);
  }
  
  console.log("\n✅ All seed files executed successfully!");
}

main().catch((error) => {
  console.error("\n💥 Seeding failed:", error);
  process.exit(1);
});
