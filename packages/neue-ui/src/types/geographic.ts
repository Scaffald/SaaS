/**
 * Geographic type definitions
 * Extracted from @app/schemas for standalone package use
 */

/**
 * Coordinate pair [longitude, latitude]
 */
export type Coordinate = [longitude: number, latitude: number]

/**
 * Boundary - array of coordinate pairs forming a polygon
 * Must have at least 3 points to form a valid polygon
 */
export type Boundary = Coordinate[]
