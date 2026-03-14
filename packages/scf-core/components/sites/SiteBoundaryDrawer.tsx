import type { MapCoordinate } from '@scaffald/ui'
import { Edit3, Plus, Trash2 } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { Button, Card, Input, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

/** Polygon boundary as array of [lng, lat] coordinates */
export type Boundary = MapCoordinate[]

export interface SiteBoundaryDrawerProps {
  boundary?: Boundary
  onBoundaryChange?: (boundary: Boundary) => void
  onAreaChange?: (areaSqft: number) => void
  center?: MapCoordinate
  zoom?: number
}

// Calculate area in square feet (simplified calculation)
const calculateArea = (coords: Boundary): number => {
  if (coords.length < 3) return 0

  // Use shoelace formula for polygon area
  let area = 0
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length
    area += coords[i][0] * coords[j][1]
    area -= coords[j][0] * coords[i][1]
  }

  // Convert to square feet (approximate, assumes WGS84)
  // More accurate calculation would use PostGIS on the backend
  const areaSqMeters = (Math.abs(area) / 2) * 111000 * 111000 // Rough conversion
  return areaSqMeters * 10.764 // Convert to square feet
}

/**
 * Site Boundary Drawer Component
 *
 * Interactive map interface for drawing site boundaries using Mapbox.
 * Supports complex polygons with multiple coordinate points.
 *
 * TODO: Full Mapbox GL Draw integration for interactive polygon drawing
 * This is a placeholder structure - full implementation requires:
 * - Mapbox GL Draw library integration
 * - Click-to-add-point functionality
 * - Drag-to-edit existing points
 * - Real-time area calculation
 * - Coordinate list editing
 */
export function SiteBoundaryDrawer({
  boundary = [],
  onBoundaryChange,
  onAreaChange,
  center = [-84.5555, 42.7325],
  zoom: _zoom = 12,
}: SiteBoundaryDrawerProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light' as const

  const [coordinates, setCoordinates] = useState<Boundary>(boundary)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const area = calculateArea(coordinates)
    onAreaChange?.(area)
  }, [coordinates, onAreaChange])

  const handleAddPoint = () => {
    // Add a new point at the center of the current boundary or at map center
    const newPoint: MapCoordinate = center
    const newCoords = [...coordinates, newPoint]
    setCoordinates(newCoords)
    onBoundaryChange?.(newCoords)
  }

  const handleRemovePoint = (index: number) => {
    if (coordinates.length <= 3) {
      // Need at least 3 points for a polygon
      return
    }
    const newCoords = coordinates.filter((_: MapCoordinate, i: number) => i !== index)
    setCoordinates(newCoords)
    onBoundaryChange?.(newCoords)
  }

  const handleCoordinateChange = (index: number, coord: MapCoordinate) => {
    const newCoords = [...coordinates]
    newCoords[index] = coord
    setCoordinates(newCoords)
    onBoundaryChange?.(newCoords)
  }

  const areaSqft = calculateArea(coordinates)

  return (
    <Stack gap={16}>
      <Card padding="md">
        <Stack gap={16}>
          <Row justify="space-between" align="center">
            <Text>Site Boundary</Text>
            <Button size="sm" iconStart={Plus} onPress={handleAddPoint}>
              Add Point
            </Button>
          </Row>

          {/* Map Container - TODO: Integrate Mapbox GL Draw */}
          <Card
            padding="md"
            style={{ backgroundColor: colors.bg[t].muted, minHeight: 400, borderRadius: 16 }}
          >
            <Text style={{ color: colors.text[t].tertiary, textAlign: 'center' }}>
              Map display with interactive polygon drawing coming soon.
              {'\n'}
              This will use Mapbox GL Draw for click-to-add-point functionality.
            </Text>
            <div
              ref={mapContainerRef}
              style={{
                width: '100%',
                height: '400px',
                backgroundColor: colors.bg[t].muted,
                borderRadius: '8px',
              }}
            />
          </Card>

          {/* Area Display */}
          {areaSqft > 0 && (
            <Card
              padding="md"
              style={{ backgroundColor: t === 'dark' ? colors.blue[900] : colors.blue[50], borderColor: t === 'dark' ? colors.blue[700] : colors.blue[300], borderWidth: 1 }}
            >
              <Text style={{ color: t === 'dark' ? colors.blue[300] : colors.blue[600] }}>
                Calculated Area: {areaSqft.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                sq ft
              </Text>
            </Card>
          )}

          {/* Coordinate List */}
          <Stack gap={8}>
            <Text>Boundary Coordinates</Text>
            {coordinates.length === 0 ? (
              <Text style={{ color: colors.text[t].tertiary }}>No points added yet. Click "Add Point" to start drawing.</Text>
            ) : (
              <Stack gap={8}>
                {coordinates.map((coord: MapCoordinate, index: number) => (
                  <Card
                    key={`${coord[0]}-${coord[1]}-${index}`}
                    padding="sm"
                    style={{ backgroundColor: colors.bg[t].muted }}
                  >
                    <Row gap={8} align="center" justify="space-between">
                      <Row gap={8} style={{ flex: 1 }}>
                        <Text style={{ color: colors.text[t].tertiary }}>Point {index + 1}:</Text>
                        {editingIndex === index ? (
                          <Row gap={8} style={{ flex: 1 }}>
                            <Input
                              value={coord[0].toString()}
                              onChangeText={(value) => {
                                const lng = Number.parseFloat(value) || 0
                                handleCoordinateChange(index, [lng, coord[1]])
                              }}
                              placeholder="Longitude"
                              keyboardType="numeric"
                            />
                            <Input
                              value={coord[1].toString()}
                              onChangeText={(value) => {
                                const lat = Number.parseFloat(value) || 0
                                handleCoordinateChange(index, [coord[0], lat])
                              }}
                              placeholder="Latitude"
                              keyboardType="numeric"
                            />
                            <Button size="sm" onPress={() => setEditingIndex(null)}>
                              Save
                            </Button>
                          </Row>
                        ) : (
                          <Text style={{ flex: 1 }}>
                            [{coord[0].toFixed(6)}, {coord[1].toFixed(6)}]
                          </Text>
                        )}
                      </Row>
                      <Row gap={8}>
                        <Button
                          size="sm"
                          variant="outline"
                          iconStart={Edit3}
                          onPress={() => setEditingIndex(index)}
                          disabled={editingIndex !== null}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          iconStart={Trash2}
                          onPress={() => handleRemovePoint(index)}
                          disabled={coordinates.length <= 3 || editingIndex !== null}
                        />
                      </Row>
                    </Row>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>

          {coordinates.length > 0 && (
            <Button
              color="error"
              style={{ backgroundColor: t === 'dark' ? colors.error[400] : colors.error[500] }}
              onPress={() => {
                setCoordinates([])
                onBoundaryChange?.([])
              }}
            >
              Clear All Points
            </Button>
          )}
        </Stack>
      </Card>
    </Stack>
  )
}
