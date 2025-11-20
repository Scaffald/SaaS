import { memo } from 'react'
import { Text, View, XStack, YStack } from 'tamagui'
import type { MapTooltipData } from './types'

interface MapTooltipProps {
  data: MapTooltipData
  visible: boolean
  position?: { x: number; y: number }
}

export const MapTooltip = memo(({ data, visible, position }: MapTooltipProps) => {
  if (!visible) return null

  return (
    <View
      position="absolute"
      bg="$background"
      borderColor="$color6"
      borderWidth={1}
      rounded="$4"
      p="$3"
      minW={200}
      maxW={280}
      z={1000}
      style={{
        transform: 'translate(-50%, -100%)',
        top: position?.y ?? 0,
        left: position?.x ?? 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <YStack gap="$2">
        {/* Title */}
        <Text fontSize="$5" fontWeight="600" color="$color12">
          {data.title}
        </Text>

        {/* Location */}
        {data.location && (
          <Text fontSize="$3" color="$color11">
            📍 {data.location}
          </Text>
        )}

        {/* Stats Row */}
        <XStack gap="$4" flexWrap="wrap">
          {data.score && (
            <XStack gap="$1" items="center">
              <Text fontSize="$2" fontWeight="600" color="$color10">
                Score:
              </Text>
              <Text fontSize="$2" color="$color11">
                {data.score}
              </Text>
            </XStack>
          )}

          {data.experienceYears && (
            <XStack gap="$1" items="center">
              <Text fontSize="$2" fontWeight="600" color="$color10">
                Experience:
              </Text>
              <Text fontSize="$2" color="$color11">
                {data.experienceYears}y
              </Text>
            </XStack>
          )}

          {data.hourlyRate && (
            <XStack gap="$1" items="center">
              <Text fontSize="$2" fontWeight="600" color="$color10">
                Rate:
              </Text>
              <Text fontSize="$2" color="$color11">
                ${data.hourlyRate}/hr
              </Text>
            </XStack>
          )}
        </XStack>

        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <YStack gap="$1">
            <Text fontSize="$2" fontWeight="600" color="$color10">
              Skills:
            </Text>
            <XStack gap="$1" flexWrap="wrap">
              {data.skills.slice(0, 3).map((skill) => (
                <View key={skill} bg="$blue4" px="$2" py="$1" rounded="$2">
                  <Text fontSize="$1" color="$blue11">
                    {skill}
                  </Text>
                </View>
              ))}
              {data.skills.length > 3 && (
                <Text fontSize="$1" color="$color10">
                  +{data.skills.length - 3} more
                </Text>
              )}
            </XStack>
          </YStack>
        )}

        {/* Badges */}
        {data.badges && data.badges.length > 0 && (
          <YStack gap="$1">
            <Text fontSize="$2" fontWeight="600" color="$color10">
              Certifications:
            </Text>
            <XStack gap="$1" flexWrap="wrap">
              {data.badges.slice(0, 2).map((badge) => (
                <View
                  key={badge.label}
                  bg={
                    badge.tone === 'success'
                      ? '$green4'
                      : badge.tone === 'warning'
                        ? '$yellow4'
                        : '$red4'
                  }
                  px="$2"
                  py="$1"
                  rounded="$2"
                >
                  <Text
                    fontSize="$1"
                    color={
                      badge.tone === 'success'
                        ? '$green11'
                        : badge.tone === 'warning'
                          ? '$yellow11'
                          : '$red11'
                    }
                  >
                    {badge.label}
                  </Text>
                </View>
              ))}
              {data.badges.length > 2 && (
                <Text fontSize="$1" color="$color10">
                  +{data.badges.length - 2} more
                </Text>
              )}
            </XStack>
          </YStack>
        )}
      </YStack>
    </View>
  )
})

MapTooltip.displayName = 'MapTooltip'
