import type { Boundary, Coordinate } from '@scaffald/tamagui-ui/types/geographic'
import { Edit3, Plus, Trash2 } from '@tamagui/lucide-icons'
import { useEffect, useRef, useState } from 'react'
import { Button, Card, Input, Text, XStack, YStack } from 'tamagui'

export interface SiteBoundaryDrawerProps {
  boundary?: Boundary
  onBoundaryChange?: (boundary: Boundary) => void
  onAreaChange?: (areaSqft: number) => void
  center?: [number, number]
  zoom?: number
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
  const [coordinates, setCoordinates] = useState<Boundary>(boundary)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const area = calculateArea(coordinates)
    onAreaChange?.(area)
  }, [coordinates, onAreaChange])

  const handleAddPoint = () => {
    // Add a new point at the center of the current boundary or at map center
    const newPoint: Coordinate = center
    const newCoords = [...coordinates, newPoint]
    setCoordinates(newCoords)
    onBoundaryChange?.(newCoords)
  }

  const handleRemovePoint = (index: number) => {
    if (coordinates.length <= 3) {
      // Need at least 3 points for a polygon
      return
    }
    const newCoords = coordinates.filter((_, i) => i !== index)
    setCoordinates(newCoords)
    onBoundaryChange?.(newCoords)
  }

  const handleCoordinateChange = (index: number, coord: Coordinate) => {
    const newCoords = [...coordinates]
    newCoords[index] = coord
    setCoordinates(newCoords)
    onBoundaryChange?.(newCoords)
  }

  const areaSqft = calculateArea(coordinates)

  return (
    <YStack gap="$4">
      <Card p="$4">
        <YStack gap="$4">
          <XStack justify="space-between" items="center">
            <Text fontSize="$6" fontWeight="600">
              Site Boundary
            </Text>
            <Button size="$2" icon={Plus} onPress={handleAddPoint}>
              Add Point
            </Button>
          </XStack>

          {/* Map Container - TODO: Integrate Mapbox GL Draw */}
          <Card p="$4" bg="$gray2" minHeight={400} borderRadius="$4">
            <Text color="$gray10" style={{ textAlign: 'center' }}>
              Map display with interactive polygon drawing coming soon.
              {'\n'}
              This will use Mapbox GL Draw for click-to-add-point functionality.
            </Text>
            <div
              ref={mapContainerRef}
              style={{
                width: '100%',
                height: '400px',
                backgroundColor: '#f0f0f0',
                borderRadius: '8px',
              }}
            />
          </Card>

          {/* Area Display */}
          {areaSqft > 0 && (
            <Card p="$3" bg="$blue2" borderColor="$blue8" borderWidth={1}>
              <Text fontWeight="600" color="$blue11">
                Calculated Area: {areaSqft.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                sq ft
              </Text>
            </Card>
          )}

          {/* Coordinate List */}
          <YStack gap="$2">
            <Text fontWeight="600">Boundary Coordinates</Text>
            {coordinates.length === 0 ? (
              <Text color="$gray10">No points added yet. Click "Add Point" to start drawing.</Text>
            ) : (
              <YStack gap="$2">
                {coordinates.map((coord, index) => (
                  <Card key={`${coord[0]}-${coord[1]}-${index}`} p="$2" bg="$gray2">
                    <XStack gap="$2" items="center" justify="space-between">
                      <XStack gap="$2" flex={1}>
                        <Text fontSize="$2" color="$gray10">
                          Point {index + 1}:
                        </Text>
                        {editingIndex === index ? (
                          <XStack gap="$2" flex={1}>
                            <Input
                              size="$2"
                              value={coord[0].toString()}
                              onChangeText={(value) => {
                                const lng = Number.parseFloat(value) || 0
                                handleCoordinateChange(index, [lng, coord[1]])
                              }}
                              placeholder="Longitude"
                              keyboardType="numeric"
                            />
                            <Input
                              size="$2"
                              value={coord[1].toString()}
                              onChangeText={(value) => {
                                const lat = Number.parseFloat(value) || 0
                                handleCoordinateChange(index, [coord[0], lat])
                              }}
                              placeholder="Latitude"
                              keyboardType="numeric"
                            />
                            <Button size="$2" onPress={() => setEditingIndex(null)}>
                              Save
                            </Button>
                          </XStack>
                        ) : (
                          <Text flex={1}>
                            [{coord[0].toFixed(6)}, {coord[1].toFixed(6)}]
                          </Text>
                        )}
                      </XStack>
                      <XStack gap="$2">
                        <Button
                          size="$2"
                          variant="outlined"
                          icon={Edit3}
                          onPress={() => setEditingIndex(index)}
                          disabled={editingIndex !== null}
                        />
                        <Button
                          size="$2"
                          variant="outlined"
                          icon={Trash2}
                          onPress={() => handleRemovePoint(index)}
                          disabled={coordinates.length <= 3 || editingIndex !== null}
                        />
                      </XStack>
                    </XStack>
                  </Card>
                ))}
              </YStack>
            )}
          </YStack>

          {coordinates.length > 0 && (
            <Button
              bg="$red9"
              color="$red12"
              onPress={() => {
                setCoordinates([])
                onBoundaryChange?.([])
              }}
            >
              Clear All Points
            </Button>
          )}
        </YStack>
      </Card>
    </YStack>
  )
}
