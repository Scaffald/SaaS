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
});

