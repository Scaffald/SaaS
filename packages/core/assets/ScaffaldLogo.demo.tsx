import React from 'react'
import { YStack, XStack, Text } from 'tamagui'
import { ScaffaldLogo, ScaffaldIcon, BRAND_COLORS } from './index'

/**
 * ScaffaldLogo Demo - Examples of how to use the logo components
 */
export const ScaffaldLogoDemo = () => {
  return (
    <YStack gap="$6" p="$4">
      <Text fontSize="$8" fontWeight="bold" color="$color12">
        Scaffald Brand Assets Demo
      </Text>

      {/* Full Logo Examples */}
      <YStack gap="$4">
        <Text fontSize="$6" fontWeight="600" color="$color11">
          Full Logo Variations
        </Text>

        {/* Default Logo */}
        <YStack gap="$2">
          <Text fontSize="$4" color="$color10">
            Default Logo
          </Text>
          <ScaffaldLogo />
        </YStack>

        {/* Small Logo */}
        <YStack gap="$2">
          <Text fontSize="$4" color="$color10">
            Small Logo (200px)
          </Text>
          <ScaffaldLogo width={200} height={33} />
        </YStack>

        {/* Custom Colors */}
        <YStack gap="$2">
          <Text fontSize="$4" color="$color10">
            Custom Colors
          </Text>
          <ScaffaldLogo
            width={300}
            height={50}
            primaryColor={BRAND_COLORS.gray[800]}
            secondaryColor={BRAND_COLORS.gray[600]}
            gradientStart={BRAND_COLORS.gradientAlt.start}
            gradientEnd={BRAND_COLORS.gradientAlt.end}
          />
        </YStack>
      </YStack>

      {/* Icon Examples */}
      <YStack gap="$4">
        <Text fontSize="$6" fontWeight="600" color="$color11">
          Icon Variations
        </Text>

        <XStack gap="$4" items="center">
          {/* Small Icon */}
          <YStack gap="$2" items="center">
            <Text fontSize="$3" color="$color10">
              Small (24px)
            </Text>
            <ScaffaldIcon size={24} />
          </YStack>

          {/* Medium Icon */}
          <YStack gap="$2" items="center">
            <Text fontSize="$3" color="$color10">
              Medium (48px)
            </Text>
            <ScaffaldIcon size={48} />
          </YStack>

          {/* Large Icon */}
          <YStack gap="$2" items="center">
            <Text fontSize="$3" color="$color10">
              Large (72px)
            </Text>
            <ScaffaldIcon size={72} />
          </YStack>
        </XStack>

        {/* Custom Icon Colors */}
        <YStack gap="$2">
          <Text fontSize="$4" color="$color10">
            Custom Icon Colors
          </Text>
          <XStack gap="$4" items="center">
            <ScaffaldIcon
              size={48}
              primaryColor={BRAND_COLORS.success}
              secondaryColor={BRAND_COLORS.warning}
              gradientStart={BRAND_COLORS.success}
              gradientEnd={BRAND_COLORS.warning}
            />
            <ScaffaldIcon
              size={48}
              primaryColor={BRAND_COLORS.error}
              secondaryColor={BRAND_COLORS.info}
              gradientStart={BRAND_COLORS.error}
              gradientEnd={BRAND_COLORS.info}
            />
          </XStack>
        </YStack>
      </YStack>

      {/* Usage Examples */}
      <YStack gap="$4">
        <Text fontSize="$6" fontWeight="600" color="$color11">
          Usage Examples
        </Text>

        <YStack gap="$2">
          <Text fontSize="$4" color="$color10">
            Header Logo
          </Text>
          <XStack items="center" gap="$3" p="$3" bg="$color2" rounded="$4">
            <ScaffaldLogo width={120} height={20} />
            <Text fontSize="$4" color="$color11">
              Navigation Menu
            </Text>
          </XStack>
        </YStack>

        <YStack gap="$2">
          <Text fontSize="$4" color="$color10">
            App Icon
          </Text>
          <XStack items="center" gap="$3" p="$3" bg="$color2" rounded="$4">
            <ScaffaldIcon size={32} />
            <Text fontSize="$4" color="$color11">
              App Title
            </Text>
          </XStack>
        </YStack>

        <YStack gap="$2">
          <Text fontSize="$4" color="$color10">
            Loading State
          </Text>
          <XStack items="center" gap="$3" p="$3" bg="$color2" rounded="$4">
            <ScaffaldIcon size={24} />
            <Text fontSize="$4" color="$color11">
              Loading...
            </Text>
          </XStack>
        </YStack>
      </YStack>
    </YStack>
  )
}

export default ScaffaldLogoDemo
