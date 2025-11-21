import { useQuery } from "@tanstack/react-query";
import { supabase } from "@app/core/utils/supabase/client";
import type { ViewportBounds } from "@app/ui";

// Type for job data on map
export interface JobMapPin {
  id: string;
  title: string;
  organization_name?: string;
  organization_id?: string;
  employment_type?: string;
  remote_option?: string;
  location?: string;
  coordinates: [number, number]; // [longitude, latitude]
  pay_range_min_cents?: number;
  pay_range_max_cents?: number;
  pay_range_type?: string;
  status: string;
  position_level?: string;
}

// Type for the query response
interface JobWithCoords {
  id: string;
  title: string;
  organization_id: string;
  employment_type: string | null;
  remote_option: string | null;
  location: string | null;
  address: { longitude?: number | null; latitude?: number | null } | null;
  pay_range_min_cents: number | null;
  pay_range_max_cents: number | null;
  pay_range_type: string | null;
  status: string;
  position_level: string | null;
  organizations: { name?: string | null } | null;
}

interface UseJobsOptions {
  bounds?: ViewportBounds | null;
  limit?: number;
  enabled?: boolean;
}

export const buildJobsQuery = (options: UseJobsOptions = {}) => {
  const { bounds = null, limit = 500 } = options;

  return async (): Promise<JobMapPin[]> => {
    const maxLimit = Math.min(limit ?? 500, 500);
    const query = supabase
      .schema("public")
      .from("jobs")
      .select(
        "id, title, organization_id, employment_type, remote_option, location, address, pay_range_min_cents, pay_range_max_cents, pay_range_type, status, position_level, organizations(name)",
      )
      .eq("status", "open")
      .limit(maxLimit);

    const { data: jobs, error: jobsError } =
      typeof (query as { returns?: unknown }).returns === "function"
        ? // Supabase client supports .returns for type inference; mocked clients in tests provide it for data
          await (query as { returns: <T>() => Promise<{ data: T | null; error: { message: string } | null }> }).returns<
            JobWithCoords[]
          >()
        : await (query as Promise<{ data: JobWithCoords[] | null; error: { message: string } | null }>);

    if (jobsError) {
      console.error("Error fetching jobs:", jobsError);
      throw new Error(`Failed to fetch jobs: ${jobsError.message}`);
    }

    // Type guard: ensure jobs is an array
    if (!Array.isArray(jobs)) {
      console.log("No jobs found in database");
      return [];
    }

    if (jobs.length === 0) {
      console.log("No jobs found in database");
      return [];
    }

    console.log(`Found ${jobs.length} jobs from database`);

    // Transform to JobMapPin format and filter by viewport bounds if provided
    const filtered = jobs
      .map((job: JobWithCoords): JobMapPin | null => {
        const longitude = job.address?.longitude ?? null;
        const latitude = job.address?.latitude ?? null;

        // Skip jobs without valid coordinates
        if (longitude === null || latitude === null || typeof longitude !== "number" || typeof latitude !== "number") {
          return null;
        }

        // Filter by viewport bounds if provided
        if (bounds) {
          if (
            longitude < bounds.west ||
            longitude > bounds.east ||
            latitude < bounds.south ||
            latitude > bounds.north
          ) {
            return null;
          }
        }

        return {
          id: job.id,
          title: job.title || "Untitled Job",
          organization_name: job.organizations?.name || undefined,
          organization_id: job.organization_id,
          employment_type: job.employment_type || undefined,
          remote_option: job.remote_option || undefined,
          location: job.location || undefined,
          coordinates: [longitude, latitude],
          pay_range_min_cents: job.pay_range_min_cents || undefined,
          pay_range_max_cents: job.pay_range_max_cents || undefined,
          pay_range_type: job.pay_range_type || undefined,
          status: job.status,
          position_level: job.position_level || undefined,
        };
      })
      .filter((job: JobMapPin | null): job is JobMapPin => job !== null);

    // Apply limit (max 500 jobs per viewport)
    return filtered.slice(0, Math.min(limit ?? 500, 500));
  };
};

export const useJobs = (options: UseJobsOptions = {}) => {
  const { bounds = null, limit = 500, enabled = true } = options;

  return useQuery({
    queryKey: ["map-jobs", bounds],
    enabled,
    queryFn: buildJobsQuery({ bounds, limit }),
    staleTime: 5 * 60 * 1000, // 5 minutes - jobs change frequently
  });
};
