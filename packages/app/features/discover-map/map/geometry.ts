import type { Feature, Polygon } from 'geojson'

const EARTH_RADIUS_METERS = 6378137

export const createRadiusFeature = (
  center: [number, number],
  radiusMeters: number,
  points = 64,
): Feature<Polygon> => {
  const [lng, lat] = center
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const toDegrees = (radians: number) => (radians * 180) / Math.PI
  const latitudeRadians = toRadians(lat)
  const longitudeRadians = toRadians(lng)
  const angularDistance = radiusMeters / EARTH_RADIUS_METERS

  const coordinates: [number, number][] = []

  for (let i = 0; i <= points; i += 1) {
    const bearing = (2 * Math.PI * i) / points
    const latitude = Math.asin(
      Math.sin(latitudeRadians) * Math.cos(angularDistance) +
        Math.cos(latitudeRadians) * Math.sin(angularDistance) * Math.cos(bearing),
    )
    const longitude =
      longitudeRadians +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitudeRadians),
        Math.cos(angularDistance) - Math.sin(latitudeRadians) * Math.sin(latitude),
      )
    coordinates.push([toDegrees(longitude), toDegrees(latitude)])
  }

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates],
    },
  }
}

export const radiusToZoomLevel = (radiusMeters: number) => {
  const WORLD_CIRCUMFERENCE = 40075016.686
  const diameter = Math.max(radiusMeters, 1) * 2
  const zoom = Math.log2(WORLD_CIRCUMFERENCE / diameter)
  return Math.min(Math.max(zoom, 3), 15)
}
