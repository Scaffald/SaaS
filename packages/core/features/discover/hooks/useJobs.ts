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

// Type for the database response
interface JobWithCoords {
  id: string;
  title: string;
  organization_id: string;
  employment_type: string | null;
  remote_option: string | null;
  location: string | null;
  address: unknown;
  pay_range_min_cents: number | null;
  pay_range_max_cents: number | null;
  pay_range_type: string | null;
  status: string;
  position_level: string | null;
  organizations: {
    name: string;
  } | null;
}

interface UseJobsOptions {
  bounds?: ViewportBounds | null;
  limit?: number;
  enabled?: boolean;
}

export const buildJobsQuery = (options: UseJobsOptions = {}) => {
  const { bounds = null, limit = 500 } = options;

  return async (): Promise<JobMapPin[]> => {
    // Fetch jobs with coordinates from address JSONB field
    let query = supabase
      .schema("core")
      .from("jobs")
      .select(
        `
          id,
          title,
          organization_id,
          employment_type,
          remote_option,
          location,
          address,
          pay_range_min_cents,
          pay_range_max_cents,
          pay_range_type,
          status,
          position_level,
          organizations (
            name
          )
        `,
      )
      .eq("status", "open"); // Only show open jobs on map

    // Note: We can't filter by JSONB coordinates directly in Supabase query
    // We'll filter in memory after fetching (with a reasonable limit)
    // Apply limit before filtering (max 500 jobs per viewport)
    query = query.limit(Math.min(limit ?? 500, 500));

    const { data: jobs, error: jobsError } = await query.returns<JobWithCoords[]>();

    if (jobsError) {
      console.error("Error fetching jobs:", jobsError);
      throw new Error(`Failed to fetch jobs: ${jobsError.message}`);
    }

    if (!jobs || jobs.length === 0) {
      console.log("No jobs found in database");
      return [];
    }

    console.log(`Found ${jobs?.length || 0} jobs from database`);

    // Transform to JobMapPin format and filter by viewport bounds if provided
    return (jobs || [])
      .map((job: JobWithCoords): JobMapPin | null => {
        // Extract coordinates from address JSONB
        const address = job.address as
          | {
              latitude?: number;
              longitude?: number;
              city?: string;
              state?: string;
            }
          | null;

        // Skip jobs without valid coordinates
        if (
          !address ||
          typeof address.latitude !== "number" ||
          typeof address.longitude !== "number"
        ) {
          return null;
        }

        // Filter by viewport bounds if provided
        if (bounds) {
          const lng = address.longitude;
          const lat = address.latitude;
          if (
            lng < bounds.west ||
            lng > bounds.east ||
            lat < bounds.south ||
            lat > bounds.north
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
          coordinates: [address.longitude, address.latitude],
          pay_range_min_cents: job.pay_range_min_cents || undefined,
          pay_range_max_cents: job.pay_range_max_cents || undefined,
          pay_range_type: job.pay_range_type || undefined,
          status: job.status,
          position_level: job.position_level || undefined,
        };
      })
      .filter((job: JobMapPin | null): job is JobMapPin => job !== null);
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
