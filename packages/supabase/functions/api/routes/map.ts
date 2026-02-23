/**
 * Map REST API
 * Handles map-related queries including location result counts
 * Migrated from: packages/supabase/functions/trpc/routers/map.router.ts
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()

// In-memory cache for location result counts (matches tRPC behavior)
interface CachedCounts {
  workers: number
  jobs: number
  employers: number
  timestamp: number
}

const locationCountsCache = new Map<string, CachedCounts>()
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

function getCacheKey(city?: string, state?: string, north?: number, south?: number, east?: number, west?: number): string {
  if (city && state) return `${city.toLowerCase()}-${state.toLowerCase()}`
  if (north !== undefined && south !== undefined && east !== undefined && west !== undefined) {
    const centerLat = ((north + south) / 2).toFixed(2)
    const centerLng = ((east + west) / 2).toFixed(2)
    return `${centerLat}-${centerLng}`
  }
  return 'unknown'
}

// GET /location-counts?city=&state=&north=&south=&east=&west=
app.get(
  '/location-counts',
  zValidator(
    'query',
    z.object({
      city: z.string().optional(),
      state: z.string().optional(),
      north: z.coerce.number(),
      south: z.coerce.number(),
      east: z.coerce.number(),
      west: z.coerce.number(),
    })
  ),
  async (c) => {
    const supabase = c.get('supabase')
    const { city, state, north, south, east, west } = c.req.valid('query')

    // Probabilistic cache cleanup (10% chance)
    if (Math.random() < 0.1) {
      const now = Date.now()
      for (const [key, value] of locationCountsCache.entries()) {
        if (now - value.timestamp > CACHE_TTL_MS) locationCountsCache.delete(key)
      }
    }

    const cacheKey = getCacheKey(city, state, north, south, east, west)
    const cached = locationCountsCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return c.json({ workers: cached.workers, jobs: cached.jobs, employers: cached.employers, cached: true })
    }

    const timeoutPromise = new Promise<{ workers: number; jobs: number; employers: number }>(
      (_, reject) => setTimeout(() => reject(new Error('Query timeout')), 1000)
    )

    const countQueries = Promise.all([
      supabase
        .schema('core')
        .from('v_profile_search')
        .select('*', { count: 'exact', head: true })
        .gte('longitude', west)
        .lte('longitude', east)
        .gte('latitude', south)
        .lte('latitude', north)
        .then(({ count, error }: { count: number | null; error: unknown }) => {
          if (error) { console.error('Error counting workers:', error); return 0 }
          return count || 0
        }),

      supabase
        .schema('core')
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open')
        .then(({ count, error }: { count: number | null; error: unknown }) => {
          if (error) { console.error('Error counting jobs:', error); return 0 }
          return count || 0
        }),

      supabase
        .schema('core')
        .rpc('get_organizations_with_coords')
        .then(({ data, error }: { data: unknown; error: unknown }) => {
          if (error) { console.error('Error counting employers:', error); return 0 }
          // biome-ignore lint/suspicious/noExplicitAny: Supabase RPC result
          return ((data as any) || []).filter(
            (org: { longitude: number; latitude: number }) =>
              org.longitude >= west && org.longitude <= east &&
              org.latitude >= south && org.latitude <= north
          ).length
        }),
    ]).then(([workers, jobs, employers]) => ({ workers, jobs, employers }))

    try {
      const counts = await Promise.race([countQueries, timeoutPromise])
      locationCountsCache.set(cacheKey, { ...counts, timestamp: Date.now() })
      return c.json({ ...counts, cached: false })
    } catch {
      return c.json({ workers: 500, jobs: 500, employers: 200, cached: false })
    }
  }
)

// GET /find-nearest?lat=&lng=&radius=
app.get(
  '/find-nearest',
  zValidator(
    'query',
    z.object({
      lat: z.coerce.number(),
      lng: z.coerce.number(),
      radius: z.coerce.number().min(1).max(200).default(50),
    })
  ),
  async (c) => {
    const supabase = c.get('supabase')
    const { lat, lng, radius } = c.req.valid('query')

    const radiusDegrees = radius / 69
    const bounds = {
      north: lat + radiusDegrees,
      south: lat - radiusDegrees,
      east: lng + radiusDegrees,
      west: lng - radiusDegrees,
    }

    const [workersResult, jobsResult, orgsResult] = await Promise.all([
      supabase.schema('core').from('v_profile_search').select('id, latitude, longitude, location')
        .gte('longitude', bounds.west).lte('longitude', bounds.east)
        .gte('latitude', bounds.south).lte('latitude', bounds.north).limit(50),
      supabase.schema('core').from('jobs').select('id, address, location').eq('status', 'open').limit(100),
      supabase.schema('core').rpc('get_organizations_with_coords').limit(100),
    ])

    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
      const R = 3959
      const dLat = ((lat2 - lat1) * Math.PI) / 180
      const dLng = ((lng2 - lng1) * Math.PI) / 180
      const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    }

    let nearestResult: { coordinates: { lat: number; lng: number }; label: string; distance: number } | null = null
    let minDistance = Infinity

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const checkNearest = (itemLat: number, itemLng: number, label: string) => {
      const distance = calculateDistance(lat, lng, itemLat, itemLng)
      if (distance < minDistance && distance <= radius) {
        minDistance = distance
        nearestResult = { coordinates: { lat: itemLat, lng: itemLng }, label, distance }
      }
    }

    for (const worker of (workersResult.data || [])) {
      if (worker.latitude && worker.longitude) {
        checkNearest(worker.latitude, worker.longitude, worker.location || 'Worker location')
      }
    }

    for (const job of (jobsResult.data || [])) {
      const address = job.address as { latitude?: number; longitude?: number } | null
      if (address?.latitude && address?.longitude) {
        checkNearest(address.latitude, address.longitude, (job as { location?: string }).location || 'Job location')
      }
    }

    for (const org of (orgsResult.data || [])) {
      if (org.latitude && org.longitude) {
        checkNearest(org.latitude, org.longitude, org.name || 'Organization location')
      }
    }

    if (!nearestResult) return c.json(null)

    const nr = nearestResult as { coordinates: { lat: number; lng: number }; label: string; distance: number }
    const nearestBounds = {
      north: nr.coordinates.lat + 0.1, south: nr.coordinates.lat - 0.1,
      east: nr.coordinates.lng + 0.1, west: nr.coordinates.lng - 0.1,
    }

    const [workerCount, jobCount, orgCount] = await Promise.all([
      supabase.schema('core').from('v_profile_search').select('*', { count: 'exact', head: true })
        .gte('longitude', nearestBounds.west).lte('longitude', nearestBounds.east)
        .gte('latitude', nearestBounds.south).lte('latitude', nearestBounds.north),
      supabase.schema('core').from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.schema('core').rpc('get_organizations_with_coords'),
    ])

    return c.json({
      location: nr.coordinates,
      label: nr.label,
      distance: Math.round(nr.distance),
      counts: {
        workers: workerCount.count || 0,
        jobs: jobCount.count || 0,
        employers: orgCount.data?.length || 0,
      },
    })
  }
)

export default app
