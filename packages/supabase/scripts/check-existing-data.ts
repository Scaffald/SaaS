/**
 * Check what data exists in external_jobs
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "http://127.0.0.1:54321";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkData() {
  console.log("\n📊 Checking Existing Job Data...\n");

  const { data: jobs, error } = await supabase
    .from("external_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("❌ Error fetching jobs:", error);
    return;
  }

  console.log(`Found ${jobs?.length || 0} jobs\n`);

  for (const job of jobs || []) {
    console.log("═".repeat(80));
    console.log(`📋 ${job.title}`);
    console.log(`   Company: ${job.company_name || "N/A"}`);
    console.log(`   Location: ${job.job_location || "N/A"}`);
    console.log(`   Category: ${job.job_category || "N/A"}`);
    console.log(`   Type: ${job.job_type || "N/A"}`);
    console.log(
      `   Compensation: ${
        job.compensation_min ? `$${job.compensation_min}` : "N/A"
      }`,
    );
    console.log(`   Website: ${job.company_website || "N/A"}`);

    console.log("\n📝 Description:");
    console.log(
      job.description ? job.description.substring(0, 300) + "..." : "N/A",
    );

    console.log("\n📋 Arrays:");
    console.log(`   Responsibilities: ${job.responsibilities?.length || 0}`);
    console.log(`   Requirements: ${job.requirements?.length || 0}`);
    console.log(`   Benefits: ${job.benefits?.length || 0}`);

    console.log("\n🔍 Raw Data Sample:");
    if (job.raw_data) {
      console.log(
        `   Title: ${job.raw_data.title?.substring(0, 100) || "N/A"}`,
      );
      console.log(
        `   Description: ${
          job.raw_data.description?.substring(0, 200) || "N/A"
        }...`,
      );
    }

    console.log("");
  }

  console.log("═".repeat(80));
}

checkData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
