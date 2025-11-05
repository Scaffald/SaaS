import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { t } from "../middleware.ts";

/**
 * Viewport bounds schema for spatial queries
 */
const ViewportBoundsSchema = z.object({
  north: z.number(),
  south: z.number(),
  east: z.number(),
  west: z.number(),
});

/**
 * In-memory cache for location result counts
 * Key: `${city}-${state}` or `${lat}-${lng}`
 * Value: { counts, timestamp }
 */
interface CachedCounts {
  workers: number;
  jobs: number;
  employers: number;
  // Using 'employers' instead of 'organizations' for consistency
  timestamp: number;
}

const locationCountsCache = new Map<string, CachedCounts>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Clean expired cache entries
 */
function cleanExpiredCacheEntries(): void {
  const now = Date.now();
  for (const [key, value] of locationCountsCache.entries()) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      locationCountsCache.delete(key);
    }
  }
}

/**
 * Get cache key from location
 */
function getCacheKey(city?: string, state?: string, bounds?: z.infer<typeof ViewportBoundsSchema>): string {
  if (city && state) {
    return `${city.toLowerCase()}-${state.toLowerCase()}`;
  }
  if (bounds) {
    // Use center point as key
    const centerLat = (bounds.north + bounds.south) / 2;
    const centerLng = (bounds.east + bounds.west) / 2;
    return `${centerLat.toFixed(2)}-${centerLng.toFixed(2)}`;
  }
  return "unknown";
}

/**
 * Map Router
 * Handles map-related queries including location result counts
 */
export const mapRouter = t.router({
  /**
   * Get result counts for a location (workers, jobs, employers)
   * Used to display counts in search suggestions
   */
  getLocationCounts: t.procedure
    .input(
      z.object({
        city: z.string().optional(),
        state: z.string().optional(),
        bounds: ViewportBoundsSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      const { city, state, bounds } = input;

      // Clean expired cache entries periodically
      if (Math.random() < 0.1) {
        // 10% chance to clean cache (avoid doing it every time)
        cleanExpiredCacheEntries();
      }

      // Check cache first
      const cacheKey = getCacheKey(city, state, bounds);
      const cached = locationCountsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return {
          workers: cached.workers,
          jobs: cached.jobs,
          employers: cached.employers,
          cached: true,
        };
      }

      // Create timeout promise (1 second)
      const timeoutPromise = new Promise<{ workers: number; jobs: number; employers: number }>(
        (_, reject) => {
          setTimeout(() => {
            reject(new Error("Query timeout"));
          }, 1000);
        },
      );

      // Create count queries
      const countQueries = Promise.all([
        // Workers count from v_profile_search view
        ctx.supabase
          .schema("core")
          .from("v_profile_search")
          .select("*", { count: "exact", head: true })
          .gte("longitude", bounds.west)
          .lte("longitude", bounds.east)
          .gte("latitude", bounds.south)
          .lte("latitude", bounds.north)
          .then(({ count, error }) => {
            if (error) {
              console.error("Error counting workers:", error);
              return 0;
            }
            return count || 0;
          }),

        // Jobs count
        ctx.supabase
          .schema("core")
          .from("jobs")
          .select("*", { count: "exact", head: true })
          .eq("status", "open")
          .then(({ count, error }) => {
            if (error) {
              console.error("Error counting jobs:", error);
              return 0;
            }
            // Note: Jobs have coordinates in address JSONB, so we can't filter by bounds directly
            // For now, return total count (will be filtered client-side)
            return count || 0;
          }),

        // Employers count (using RPC function then filtering)
        ctx.supabase
          .schema("core")
          .rpc("get_organizations_with_coords")
          .then(({ data, error }) => {
            if (error) {
              console.error("Error counting employers:", error);
              return 0;
            }
            // Filter by bounds in memory
            const filtered = (data || []).filter(
              (org) =>
                org.longitude >= bounds.west &&
                org.longitude <= bounds.east &&
                org.latitude >= bounds.south &&
                org.latitude <= bounds.north,
            );
            return filtered.length;
          }),
      ]).then(([workers, jobs, employers]) => ({
        workers,
        jobs,
        employers,
      }));

      try {
        // Race between queries and timeout
        const counts = await Promise.race([countQueries, timeoutPromise]);

        // Cache the results
        locationCountsCache.set(cacheKey, {
          ...counts,
          timestamp: Date.now(),
        });

        return {
          ...counts,
          cached: false,
        };
      } catch (error) {
        // Timeout or error - return fallback
        console.warn("Location count query failed or timed out:", error);
        return {
          workers: 500, // Fallback: "Many results"
          jobs: 500,
          employers: 200,
          cached: false,
        };
      }
    }),

  /**
   * Find nearest location with results from a given search location
   * Used for no-results scenarios to suggest nearby locations
   */
  findNearestResults: t.procedure
    .input(
      z.object({
        coordinates: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
        radius: z.number().min(1).max(200).default(50), // radius in miles
      }),
    )
    .query(async ({ ctx, input }) => {
      const { coordinates, radius } = input;

      // Convert miles to approximate degrees (rough approximation: 1 degree ≈ 69 miles)
      const radiusDegrees = radius / 69;

      // Calculate bounding box for search area
      const bounds = {
        north: coordinates.lat + radiusDegrees,
        south: coordinates.lat - radiusDegrees,
        east: coordinates.lng + radiusDegrees,
        west: coordinates.lng - radiusDegrees,
      };

      // Query for workers, jobs, and employers within radius
      // We'll find the nearest one by calculating distance
      const [workersResult, jobsResult, orgsResult] = await Promise.all([
        // Workers
        ctx.supabase
          .schema("core")
          .from("v_profile_search")
          .select("id, latitude, longitude, location")
          .gte("longitude", bounds.west)
          .lte("longitude", bounds.east)
          .gte("latitude", bounds.south)
          .lte("latitude", bounds.north)
          .limit(50), // Get more to find nearest

        // Jobs (we'll filter in memory since coordinates are in JSONB)
        ctx.supabase
          .schema("core")
          .from("jobs")
          .select("id, address, location")
          .eq("status", "open")
          .limit(100), // Get more to filter in memory

        // Organizations
        ctx.supabase
          .schema("core")
          .rpc("get_organizations_with_coords")
          .limit(100),
      ]);

      // Find nearest result from all types
      let nearestResult: {
        coordinates: { lat: number; lng: number };
        label: string;
        distance: number;
      } | null = null;
      let minDistance = Infinity;

      // Helper function to calculate distance (Haversine formula approximation)
      const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 3959; // Earth radius in miles
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLng = ((lng2 - lng1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      // Check workers
      if (workersResult.data && workersResult.data.length > 0) {
        for (const worker of workersResult.data) {
          if (worker.latitude && worker.longitude) {
            const distance = calculateDistance(
              coordinates.lat,
              coordinates.lng,
              worker.latitude,
              worker.longitude,
            );
            if (distance < minDistance && distance <= radius) {
              minDistance = distance;
              nearestResult = {
                coordinates: { lat: worker.latitude, lng: worker.longitude },
                label: worker.location || "Worker location",
                distance,
              };
            }
          }
        }
      }

      // Check jobs (filter in memory)
      if (jobsResult.data && jobsResult.data.length > 0) {
        for (const job of jobsResult.data) {
          const address = job.address as { latitude?: number; longitude?: number } | null;
          if (address?.latitude && address?.longitude) {
            const distance = calculateDistance(
              coordinates.lat,
              coordinates.lng,
              address.latitude,
              address.longitude,
            );
            if (distance < minDistance && distance <= radius) {
              minDistance = distance;
              nearestResult = {
                coordinates: { lat: address.latitude, lng: address.longitude },
                label: job.location || "Job location",
                distance,
              };
            }
          }
        }
      }

      // Check organizations
      if (orgsResult.data && orgsResult.data.length > 0) {
        for (const org of orgsResult.data) {
          if (org.latitude && org.longitude) {
            const distance = calculateDistance(
              coordinates.lat,
              coordinates.lng,
              org.latitude,
              org.longitude,
            );
            if (distance < minDistance && distance <= radius) {
              minDistance = distance;
              nearestResult = {
                coordinates: { lat: org.latitude, lng: org.longitude },
                label: org.name || "Organization location",
                distance,
              };
            }
          }
        }
      }

      if (!nearestResult) {
        return null;
      }

      // Get counts for the nearest location (using approximate bounds)
      const nearestBounds = {
        north: nearestResult.coordinates.lat + 0.1,
        south: nearestResult.coordinates.lat - 0.1,
        east: nearestResult.coordinates.lng + 0.1,
        west: nearestResult.coordinates.lng - 0.1,
      };

      const [workerCount, jobCount, orgCount] = await Promise.all([
        ctx.supabase
          .schema("core")
          .from("v_profile_search")
          .select("*", { count: "exact", head: true })
          .gte("longitude", nearestBounds.west)
          .lte("longitude", nearestBounds.east)
          .gte("latitude", nearestBounds.south)
          .lte("latitude", nearestBounds.north),
        ctx.supabase
          .schema("core")
          .from("jobs")
          .select("*", { count: "exact", head: true })
          .eq("status", "open"),
        ctx.supabase.schema("core").rpc("get_organizations_with_coords"),
      ]);

      return {
        location: nearestResult.coordinates,
        label: nearestResult.label,
        distance: Math.round(nearestResult.distance),
        counts: {
          workers: workerCount.count || 0,
          jobs: jobCount.count || 0,
          employers: (orgCount.data?.length || 0) > 0 ? orgCount.data?.length || 0 : 0,
        },
      };
    }),
});

