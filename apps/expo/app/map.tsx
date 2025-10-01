import { useState } from 'react'
import { View, Text, YStack, XStack, Button } from '@app/ui'
import { MapContainer, mockMapPins, type MapPinType } from '@app/ui/src/components/maps'

export default function MapTestPage() {
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null)
  const [pins, setPins] = useState<MapPinType[]>(mockMapPins)

  const handlePinPress = (pinId: string) => {
    setSelectedPinId(selectedPinId === pinId ? null : pinId)
    // Update pins to reflect selection
    setPins(pins.map((pin) => ({ ...pin, selected: pin.id === pinId })))
  }

  const selectedPin = pins.find((pin) => pin.id === selectedPinId)

  return (
    <View flex={1} bg="$background">
      <YStack flex={1} gap="$4" p="$4">
        {/* Header */}
        <YStack gap="$2">
          <Text fontSize="$8" fontWeight="bold" color="$color12">
            Map Test Page
          </Text>
          <Text fontSize="$4" color="$color11">
            Testing reusable map components with {mockMapPins.length} pins
          </Text>
        </YStack>

        {/* Map Container */}
        <View flex={1} rounded="$5" overflow="hidden" bg="$background">
          <MapContainer
            pins={pins}
            center={[-84.5555, 42.7325]} // Lansing, MI
            zoom={6}
            onPinPress={handlePinPress}
          />
        </View>

        {/* Selected Pin Info */}
        {selectedPin && (
          <View bg="$backgroundHover" p="$4" rounded="$4" gap="$3">
            <XStack justify="space-between" items="center">
              <Text fontSize="$6" fontWeight="bold" color="$color12">
                {selectedPin.title}
              </Text>
              <Button size="$2" onPress={() => handlePinPress(selectedPin.id)}>
                Close
              </Button>
            </XStack>

            <YStack gap="$2">
              <Text color="$color11">{selectedPin.subtitle}</Text>

              <XStack gap="$4" items="center">
                {selectedPin.score && (
                  <Text fontSize="$3" color="$color10">
                    Score: {selectedPin.score}
                  </Text>
                )}
                {selectedPin.hourlyRate && (
                  <Text fontSize="$3" color="$color10">
                    Rate: ${selectedPin.hourlyRate}/hr
                  </Text>
                )}
                <Text fontSize="$3" color="$color10" textTransform="capitalize">
                  {selectedPin.availability}
                </Text>
              </XStack>

              {selectedPin.badges && selectedPin.badges.length > 0 && (
                <XStack gap="$2" flexWrap="wrap">
                  {selectedPin.badges.map((badge) => (
                    <View
                      key={badge.id}
                      bg={
                        badge.tone === 'success'
                          ? '$green4'
                          : badge.tone === 'warning'
                            ? '$orange4'
                            : '$red4'
                      }
                      px="$2"
                      py="$1"
                      rounded="$2"
                    >
                      <Text
                        fontSize="$2"
                        color={
                          badge.tone === 'success'
                            ? '$green11'
                            : badge.tone === 'warning'
                              ? '$orange11'
                              : '$red11'
                        }
                      >
                        {badge.label}
                      </Text>
                    </View>
                  ))}
                </XStack>
              )}
            </YStack>
          </View>
        )}

        {/* Test Controls */}
        <XStack gap="$2" flexWrap="wrap">
          <Button
            size="$3"
            onPress={() => setPins(pins.filter((p) => p.availability === 'available'))}
          >
            Show Available Only
          </Button>
          <Button size="$3" onPress={() => setPins(mockMapPins)}>
            Show All
          </Button>
          <Button size="$3" onPress={() => setSelectedPinId(null)}>
            Clear Selection
          </Button>
        </XStack>
      </YStack>
    </View>
  )
}
