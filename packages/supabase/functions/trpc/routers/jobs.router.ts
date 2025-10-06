import { TRPCError } from "@trpc/server";
import { t } from "../middleware.ts";

/**
 * Jobs router - handles job-related operations
 */
export const jobsRouter = t.router({
  /**
   * Get external jobs
   * Returns list of active external jobs with industry information
   */
  getExternalJobs: t.procedure.query(async ({ ctx }) => {
    const { supabase } = ctx;

    const { data, error } = await supabase
      .from("external_jobs")
      .select(`
        id,
        title,
        company_name,
        company_logo,
        job_location,
        job_type,
        job_category,
        description,
        compensation_min,
        compensation_max,
        compensation_currency,
        posted_date,
        application_url,
        external_url,
        featured,
        external_job_industries(
          industry:industries(
            id,
            name
          ),
          confidence_score
        )
      `)
      .eq("is_active", true)
      .order("posted_date", { ascending: false })
      .limit(50);

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch jobs: ${error.message}`,
      });
    }

    // Transform data to match UI expectations
    const jobs = (data || []).map((job) => ({
      id: job.id,
      title: job.title,
      company_name: job.company_name,
      company_logo: job.company_logo,
      job_location: job.job_location,
      job_type: job.job_type,
      job_category: job.job_category,
      description: job.description,
      compensation_min: job.compensation_min,
      compensation_max: job.compensation_max,
      compensation_currency: job.compensation_currency,
      posted_date: job.posted_date,
      application_url: job.application_url,
      external_url: job.external_url,
      featured: job.featured,
      industries: Array.isArray(job.external_job_industries)
        ? job.external_job_industries.map((eji: {
          industry?: { name?: string } | null;
          confidence_score?: number | null;
        }) => ({
          industry_name: eji.industry?.name || "",
          confidence_score: eji.confidence_score || 0,
        }))
        : [],
    }));

    return { jobs };
  }),
});
