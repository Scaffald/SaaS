import { useState } from 'react'
import { View, Text, YStack, XStack, Button, Sheet } from 'tamagui'
import { MapContainer, mockMapPins, type MapPinType } from '@app/ui/src/components/maps'
import { FilterBar } from '@app/core/features/discover/components/FilterBar'

export default function MapTestPage() {
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null)
  const [pins, setPins] = useState<MapPinType[]>(mockMapPins)
  const [showFilterSheet, setShowFilterSheet] = useState(false)
  const [showSearchSheet, setShowSearchSheet] = useState(false)

  const handlePinPress = (pinId: string | null) => {
    if (pinId === null) {
      setSelectedPinId(null)
    } else {
      setSelectedPinId(selectedPinId === pinId ? null : pinId)
    }
    // Note: We don't update the pins array to avoid map refresh
    // The selection state is tracked via selectedPinId only
  }

  const selectedPin = pins.find((pin) => pin.id === selectedPinId)

  return (
    <View flex={1} position="relative">
      {/* Fullscreen Map - Base Layer */}
      <View position="absolute" t={0} l={0} r={0} b={0} z={0}>
        <MapContainer
          pins={pins}
          center={[-84.5555, 42.7325]} // Lansing, MI
          zoom={6}
          onPinPress={handlePinPress}
        />
      </View>

      {/* Overlay UI - Card Layers */}

      {/* Selected Pin Card - Animates up above controls when selected */}
      {selectedPin && (
        <View
          position="absolute"
          b={90}
          l={20}
          r={20}
          z={100}
          bg="$background"
          p="$4"
          rounded="$6"
          gap="$3"
          borderWidth={1}
          borderColor="$borderColor"
          shadowColor="$shadowColor"
          shadowOffset={{ width: 0, height: 4 }}
          shadowOpacity={0.15}
          shadowRadius={12}
          animation="quick"
          enterStyle={{ opacity: 0, y: 100 }}
          exitStyle={{ opacity: 0, y: 100 }}
        >
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
                        ? '$green3'
                        : badge.tone === 'warning'
                          ? '$yellow3'
                          : '$red3'
                    }
                    px="$2"
                    py="$1"
                    rounded="$2"
                  >
                    <Text
                      fontSize="$2"
                      color={
                        badge.tone === 'success'
                          ? '$green10'
                          : badge.tone === 'warning'
                            ? '$yellow10'
                            : '$red10'
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

      {/* Filter Bar - Simple button overlay */}
      <FilterBar
        onSearchPress={() => setShowSearchSheet(true)}
        onFilterPress={() => setShowFilterSheet(true)}
        onResetPress={() => {
          setPins(mockMapPins)
          setSelectedPinId(null)
        }}
      />

      {/* Search Sheet */}
      <Sheet
        modal
        open={showSearchSheet}
        onOpenChange={setShowSearchSheet}
        snapPoints={[60]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Frame bg="$background" p="$4" gap="$4">
          <Sheet.Handle />
          <YStack gap="$3">
            <Text fontSize="$6" fontWeight="bold" color="$color12">
              Search
            </Text>
            <Text color="$color11">Search by location, worker name, or skills...</Text>
          </YStack>
        </Sheet.Frame>
      </Sheet>

      {/* Filter Sheet */}
      <Sheet
        modal
        open={showFilterSheet}
        onOpenChange={setShowFilterSheet}
        snapPoints={[60]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Frame bg="$background" p="$4" gap="$4">
          <Sheet.Handle />
          <YStack gap="$3">
            <Text fontSize="$6" fontWeight="bold" color="$color12">
              Filters
            </Text>
            <Text color="$color11">Filter by skills, availability, certifications, etc.</Text>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </View>
  )
}
