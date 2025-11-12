/**
 * Verify enhanced job data
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "http://127.0.0.1:54321";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyJobs() {
  console.log("\n📊 Verifying Enhanced Job Data...\n");

  // Get jobs with enhanced data
  const { data: jobs, error } = await supabase
    .from("external_jobs")
    .select("*")
    .not("responsibilities", "is", null)
    .limit(5);

  if (error) {
    console.error("❌ Error fetching jobs:", error);
    return;
  }

  console.log(`Found ${jobs?.length || 0} jobs with enhanced data\n`);

  for (const job of jobs || []) {
    console.log("─".repeat(60));
    console.log(`📋 ${job.title}`);
    console.log(`   Company: ${job.company_name}`);
    console.log(`   Category: ${job.job_category || "N/A"}`);
    console.log(`   Location: ${job.job_location}`);

    if (job.compensation_min) {
      console.log(
        `   Compensation: $${job.compensation_min.toLocaleString()}${
          job.compensation_max
            ? ` - $${job.compensation_max.toLocaleString()}`
            : "+"
        }`,
      );
    }

    console.log(
      `\n   📝 Responsibilities: ${job.responsibilities?.length || 0} items`,
    );
    if (job.responsibilities && job.responsibilities.length > 0) {
      console.log(`      • ${job.responsibilities[0].substring(0, 80)}...`);
    }

    console.log(`   ✓ Requirements: ${job.requirements?.length || 0} items`);
    if (job.requirements && job.requirements.length > 0) {
      console.log(`      • ${job.requirements[0].substring(0, 80)}...`);
    }

    console.log(`   🎁 Benefits: ${job.benefits?.length || 0} items`);
    if (job.benefits && job.benefits.length > 0) {
      console.log(`      • ${job.benefits[0].substring(0, 80)}...`);
    }

    console.log("");
  }

  console.log("─".repeat(60));

  // Summary statistics
  const { count: totalJobs } = await supabase
    .from("external_jobs")
    .select("*", { count: "exact", head: true });

  const { count: jobsWithResp } = await supabase
    .from("external_jobs")
    .select("*", { count: "exact", head: true })
    .not("responsibilities", "is", null);

  const { count: jobsWithReq } = await supabase
    .from("external_jobs")
    .select("*", { count: "exact", head: true })
    .not("requirements", "is", null);

  const { count: jobsWithBen } = await supabase
    .from("external_jobs")
    .select("*", { count: "exact", head: true })
    .not("benefits", "is", null);

  console.log("\n📈 Summary Statistics:");
  console.log(`   Total Jobs: ${totalJobs}`);
  console.log(
    `   Jobs with Responsibilities: ${jobsWithResp} (${
      Math.round((jobsWithResp! / totalJobs!) * 100)
    }%)`,
  );
  console.log(
    `   Jobs with Requirements: ${jobsWithReq} (${
      Math.round((jobsWithReq! / totalJobs!) * 100)
    }%)`,
  );
  console.log(
    `   Jobs with Benefits: ${jobsWithBen} (${
      Math.round((jobsWithBen! / totalJobs!) * 100)
    }%)`,
  );
  console.log("");
}

verifyJobs()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
