import * as LucideIcons from '@tamagui/lucide-icons'
import { ChevronDown, Search, X } from '@tamagui/lucide-icons'
import { type ComponentType, useMemo, useState } from 'react'
import { Button, Input, ScrollView, Text, XStack, YStack } from 'tamagui'

// Icon names that can be used (subset of Lucide icons)
const ICON_NAMES = [
  'UserSearch',
  'Share2',
  'Sprout',
  'Home',
  'User',
  'Users',
  'Building2',
  'Briefcase',
  'Map',
  'Star',
  'Heart',
  'MessageCircle',
  'Bell',
  'Settings',
  'Search',
  'Filter',
  'Calendar',
  'Clock',
  'Mail',
  'Phone',
  'MapPin',
  'Globe',
  'FileText',
  'Image',
  'Video',
  'Music',
  'Download',
  'Upload',
  'Eye',
  'EyeOff',
  'ThumbsUp',
  'ThumbsDown',
  'Share',
  'Send',
  'Edit',
  'Trash2',
  'Plus',
  'Minus',
  'Check',
  'X',
  'ChevronRight',
  'ChevronLeft',
  'ChevronUp',
  'ChevronDown',
  'ArrowRight',
  'ArrowLeft',
  'ArrowUp',
  'ArrowDown',
  'MoreHorizontal',
  'MoreVertical',
] as const

interface IconSelectorProps {
  value: string
  onChange: (iconName: string) => void
  disabled?: boolean
}

/**
 * Icon selector component for choosing Lucide icons
 * Provides search functionality and visual preview
 */
export function IconSelector({ value, onChange, disabled }: IconSelectorProps) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  // Filter icons based on search
  const filteredIcons = useMemo(() => {
    if (!search) return ICON_NAMES
    const lowerSearch = search.toLowerCase()
    return ICON_NAMES.filter((name) => name.toLowerCase().includes(lowerSearch))
  }, [search])

  // Get the icon component for the selected value
  const SelectedIcon = value
    ? (LucideIcons as Record<string, ComponentType<{ size?: number }>>)[value]
    : null

  return (
    <YStack gap="$2">
      <Text fontWeight="600">Icon</Text>

      {/* Selected icon display and trigger */}
      <XStack
        onPress={() => !disabled && setIsOpen(!isOpen)}
        borderWidth={1}
        borderColor="$borderColor"
        rounded="$2"
        gap="$2"
        bg="$background"
        p="$3"
        pressStyle={{ bg: '$backgroundHover' }}
        hoverStyle={{ bg: '$backgroundHover' }}
        cursor={disabled ? 'not-allowed' : 'pointer'}
        opacity={disabled ? 0.5 : 1}
      >
        {SelectedIcon && <SelectedIcon size={20} />}
        <Text flex={1}>{value || 'Select an icon'}</Text>
        <ChevronDown size={16} />
      </XStack>

      {/* Icon picker dropdown */}
      {isOpen && (
        <YStack
          borderWidth={1}
          borderColor="$borderColor"
          rounded="$2"
          bg="$background"
          p="$2"
          gap="$2"
          z={1000}
        >
          {/* Search input */}
          <XStack gap="$2" px="$2" items="center">
            <Search size={16} opacity={0.5} />
            <Input
              flex={1}
              placeholder="Search icons..."
              value={search}
              onChangeText={setSearch}
              size="$3"
            />
            {search && (
              <Button size="$2" circular icon={X} onPress={() => setSearch('')} chromeless />
            )}
          </XStack>

          {/* Icon grid */}
          <ScrollView maxH={320}>
            <XStack flexWrap="wrap" gap="$1" p="$2">
              {filteredIcons.map((iconName) => {
                const IconComponent = (
                  LucideIcons as Record<string, ComponentType<{ size?: number }>>
                )[iconName]
                const isSelected = iconName === value

                return (
                  <YStack
                    key={iconName}
                    onPress={() => {
                      onChange(iconName)
                      setIsOpen(false)
                      setSearch('')
                    }}
                    bg={isSelected ? '$blue4' : '$background'}
                    borderWidth={1}
                    borderColor={isSelected ? '$blue8' : '$borderColor'}
                    rounded="$2"
                    width={44}
                    height={44}
                    items="center"
                    justify="center"
                    cursor="pointer"
                    hoverStyle={{
                      bg: isSelected ? '$blue5' : '$backgroundHover',
                    }}
                    pressStyle={{
                      bg: isSelected ? '$blue6' : '$backgroundPress',
                    }}
                  >
                    {IconComponent && <IconComponent size={20} />}
                  </YStack>
                )
              })}
            </XStack>
          </ScrollView>

          {/* Results count */}
          <Text fontSize="$2" opacity={0.6} text="center">
            {filteredIcons.length} icon{filteredIcons.length !== 1 ? 's' : ''}
          </Text>
        </YStack>
      )}
    </YStack>
  )
}
