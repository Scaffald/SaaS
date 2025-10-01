import { useState } from 'react'
import { View, Text, YStack, XStack, Button, Sheet } from '@app/ui'
import { MapContainer, mockMapPins, type MapPinType } from '@app/ui/src/components/maps'
import { Filter, X, Settings } from '@tamagui/lucide-icons'

export default function MapTestPage() {
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null)
  const [pins, setPins] = useState<MapPinType[]>(mockMapPins)
  const [showFilterSheet, setShowFilterSheet] = useState(false)
  const [showSettingsSheet, setShowSettingsSheet] = useState(false)

  const handlePinPress = (pinId: string) => {
    setSelectedPinId(selectedPinId === pinId ? null : pinId)
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

      {/* Bottom Control Bar - Always visible */}
      <View
        position="absolute"
        b={0}
        l={0}
        r={0}
        z={50}
        bg="$background"
        borderTopWidth={1}
        borderTopColor="$borderColor"
        shadowColor="$shadowColor"
        shadowOffset={{ width: 0, height: -2 }}
        shadowOpacity={0.1}
        shadowRadius={8}
      >
        <XStack gap="$2" p="$3" items="center" justify="space-between">
          <Button size="$4" flex={1} icon={Filter} onPress={() => setShowFilterSheet(true)}>
            Filter
          </Button>
          <Button
            size="$4"
            flex={1}
            icon={X}
            variant="outlined"
            onPress={() => setPins(mockMapPins)}
          >
            Clear
          </Button>
          <Button size="$4" flex={1} icon={Settings} onPress={() => setShowSettingsSheet(true)}>
            Settings
          </Button>
        </XStack>
      </View>

      {/* Filter Sheet */}
      <Sheet
        modal
        open={showFilterSheet}
        onOpenChange={setShowFilterSheet}
        snapPoints={[40]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Frame bg="$background" p="$4" gap="$4">
          <Sheet.Handle />
          <YStack gap="$3">
            <Text fontSize="$6" fontWeight="bold" color="$color12">
              Filters
            </Text>
            <Text color="$color11">Hello World - Filter options will go here</Text>
          </YStack>
        </Sheet.Frame>
      </Sheet>

      {/* Settings Sheet */}
      <Sheet
        modal
        open={showSettingsSheet}
        onOpenChange={setShowSettingsSheet}
        snapPoints={[40]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Frame bg="$background" p="$4" gap="$4">
          <Sheet.Handle />
          <YStack gap="$3">
            <Text fontSize="$6" fontWeight="bold" color="$color12">
              Settings
            </Text>
            <Text color="$color11">Hello World - Settings options will go here</Text>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </View>
  )
}
