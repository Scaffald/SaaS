import type mapboxgl from 'mapbox-gl'
import type { ViewportBounds } from '@scaffald/ui'

/**
 * Validate GeoJSON FeatureCollection structure
 */
export function validateGeoJSONFeatureCollection(data: unknown): data is GeoJSON.FeatureCollection {
  if (!data || typeof data !== 'object') {
    return false
  }

  const obj = data as Record<string, unknown>

  if (obj.type !== 'FeatureCollection') {
    return false
  }

  if (!Array.isArray(obj.features)) {
    return false
  }

  return obj.features.every((feature) => {
    if (!feature || typeof feature !== 'object') {
      return false
    }
    const f = feature as Record<string, unknown>
    return f.type === 'Feature' && f.geometry && f.properties
  })
}

/**
 * Extract viewport bounds from a Mapbox map instance
 */
export function extractViewportBounds(map: mapboxgl.Map): ViewportBounds {
  const bounds = map.getBounds()
  if (!bounds) {
    throw new Error('Map bounds are not available')
  }
  return {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
  }
}
