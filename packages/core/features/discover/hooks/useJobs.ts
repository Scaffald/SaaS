import { supabase } from "@app/core/utils/supabase/client";
import type { ViewportBounds } from "@scaffald/neue-ui";
import { useQuery } from "@tanstack/react-query";

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

// Type for the RPC function response
interface JobWithCoords {
  id: string;
  title: string;
  organization_id: string;
  employment_type: string | null;
  remote_option: string | null;
  location: string | null;
  longitude: number;
  latitude: number;
  address: unknown;
  pay_range_min_cents: number | null;
  pay_range_max_cents: number | null;
  pay_range_type: string | null;
  status: string;
  position_level: string | null;
  organization_name: string | null;
}

interface UseJobsOptions {
  bounds?: ViewportBounds | null;
  limit?: number;
  enabled?: boolean;
}

export const buildJobsQuery = (options: UseJobsOptions = {}) => {
  const { bounds = null, limit = 500 } = options;

  return async (): Promise<JobMapPin[]> => {
    // Get jobs with coordinates extracted from PostGIS geography
    // Note: RPC function doesn't support bounds filtering yet
    // We'll fetch all and filter in memory (with a reasonable limit)
    const result = (await (supabase
      .schema("public")
      .rpc("get_jobs_with_coords") as unknown)) as {
        data: JobWithCoords[] | null;
        error: { message: string } | null;
      };
    const { data: jobs, error: jobsError } = result;

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
        // Skip jobs without valid coordinates
        if (
          job.longitude === null ||
          job.latitude === null ||
          typeof job.longitude !== "number" ||
          typeof job.latitude !== "number"
        ) {
          return null;
        }

        // Filter by viewport bounds if provided
        if (bounds) {
          if (
            job.longitude < bounds.west ||
            job.longitude > bounds.east ||
            job.latitude < bounds.south ||
            job.latitude > bounds.north
          ) {
            return null;
          }
        }

        return {
          id: job.id,
          title: job.title || "Untitled Job",
          organization_name: job.organization_name || undefined,
          organization_id: job.organization_id,
          employment_type: job.employment_type || undefined,
          remote_option: job.remote_option || undefined,
          location: job.location || undefined,
          coordinates: [job.longitude, job.latitude],
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
