import { useLocationCounts } from '@scf/core/utils/map-sdk-hooks'
import type { ViewportBounds } from '@scaffald/ui'

/**
 * Calculate approximate viewport bounds from a location point
 * Uses ±0.5 degrees (roughly 50km radius) for city-level searches
 */
function calculateBoundsFromLocation(
  lat: number,
  lng: number,
  radiusDegrees = 0.5
): ViewportBounds {
  return {
    north: lat + radiusDegrees,
    south: lat - radiusDegrees,
    east: lng + radiusDegrees,
    west: lng - radiusDegrees,
  }
}

interface UseLocationResultCountsOptions {
  coordinates?: { lat: number; lng: number } | null
  city?: string
  state?: string
  enabled?: boolean
}

interface LocationResultCounts {
  workers: number
  jobs: number
  employers: number
  cached: boolean
}

/**
 * Hook to fetch result counts for a location
 * Used to display counts in search suggestions
 */
export function useLocationResultCounts({
  coordinates,
  city,
  state,
  enabled = true,
}: UseLocationResultCountsOptions) {
  // Calculate bounds from coordinates if provided
  const bounds = coordinates ? calculateBoundsFromLocation(coordinates.lat, coordinates.lng) : null

  const query = useLocationCounts(
    bounds
      ? { city, state, north: bounds.north, south: bounds.south, east: bounds.east, west: bounds.west }
      : null,
    { enabled: enabled && !!bounds }
  )

  return {
    counts: query.data as LocationResultCounts | undefined,
    isLoading: query.isLoading,
    error: query.error,
    isCached: query.data?.cached ?? false,
  }
}

/**
 * Format number with commas
 */
export function formatCount(count: number | 'many'): string {
  if (count === 'many' || count >= 500) {
    return 'Many results'
  }
  return new Intl.NumberFormat('en-US').format(count)
}

/**
 * Format location result with counts
 * Example: "Boston, MA - 45 workers, 23 jobs, 12 employers"
 */
export function formatLocationWithCounts(
  city: string,
  state: string,
  counts?: LocationResultCounts
): string {
  const location = `${city}, ${state}`
  if (!counts) {
    return location
  }

  const parts: string[] = []
  if (counts.workers > 0) {
    parts.push(`${formatCount(counts.workers)} workers`)
  }
  if (counts.jobs > 0) {
    parts.push(`${formatCount(counts.jobs)} jobs`)
  }
  if (counts.employers > 0) {
    parts.push(`${formatCount(counts.employers)} employers`)
  }

  if (parts.length === 0) {
    return location
  }

  return `${location} - ${parts.join(', ')}`
}
