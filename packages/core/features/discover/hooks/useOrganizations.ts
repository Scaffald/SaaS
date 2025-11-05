import { useQuery } from "@tanstack/react-query";
import { supabase } from "@app/core/utils/supabase/client";
import type { ViewportBounds } from "@app/ui/src/components/maps/types";

// Type for organization data
export interface OrganizationMapPin {
  id: string;
  name: string;
  industry?: string;
  address?: {
    city?: string;
    state?: string;
  };
  coordinates: [number, number]; // [longitude, latitude]
  employeeCount?: string;
  openJobs?: number;
}

// Type for the RPC function response
interface OrgWithCoords {
  id: string;
  name: string;
  slug: string;
  longitude: number;
  latitude: number;
  address: unknown;
  employee_count_range: string | null;
  industry_name: string | null;
}

interface UseOrganizationsOptions {
  bounds?: ViewportBounds | null;
  limit?: number;
}

export const useOrganizations = (options: UseOrganizationsOptions = {}) => {
  const { bounds, limit = 200 } = options;

  return useQuery({
    queryKey: ["map-organizations", bounds],
    queryFn: async (): Promise<OrganizationMapPin[]> => {
      // Get organizations with coordinates extracted from PostGIS geography
      // Note: RPC function doesn't support bounds filtering yet
      // We'll fetch all and filter in memory (with a reasonable limit)
      const { data: organizations, error: orgsError } = await supabase
        .schema("core")
        .rpc("get_organizations_with_coords")
        .returns<OrgWithCoords[]>();

      if (orgsError) {
        console.error("Error fetching organizations:", orgsError);
        throw new Error(`Failed to fetch organizations: ${orgsError.message}`);
      }

      if (!organizations || organizations.length === 0) {
        console.log("No organizations found in database");
        return [];
      }

      console.log(`Found ${organizations.length} organizations from database`);

      // Transform to OrganizationMapPin format and filter by viewport bounds if provided
      const filtered = organizations
        .map((org): OrganizationMapPin | null => {
          // Skip organizations without valid coordinates
          if (
            org.longitude === null ||
            org.latitude === null ||
            typeof org.longitude !== "number" ||
            typeof org.latitude !== "number"
          ) {
            return null;
          }

          // Filter by viewport bounds if provided
          if (bounds) {
            if (
              org.longitude < bounds.west ||
              org.longitude > bounds.east ||
              org.latitude < bounds.south ||
              org.latitude > bounds.north
            ) {
              return null;
            }
          }

          const address = org.address as
            | { city?: string; state?: string }
            | null;

          return {
            id: org.id,
            name: org.name || "Unknown Organization",
            industry: org.industry_name || undefined,
            address: address || undefined,
            coordinates: [org.longitude, org.latitude],
            employeeCount: org.employee_count_range || undefined,
          };
        })
        .filter((org): org is OrganizationMapPin => org !== null);

      // Apply limit (max 200 employers per viewport)
      return filtered.slice(0, Math.min(limit, 200));
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - organizations change less frequently
  });
};
