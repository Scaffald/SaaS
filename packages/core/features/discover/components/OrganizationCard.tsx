import { memo, forwardRef, type Ref } from 'react'
import { type TamaguiElement } from 'tamagui'
import { Button, Paragraph, SizableText, Text, XStack, YStack } from 'tamagui'
import { Building, MapPin, Users } from '@tamagui/lucide-icons'

import type { OrganizationMapPin } from '../hooks/useOrganizations'

type OrganizationCardProps = {
  organization: OrganizationMapPin
  isSelected?: boolean
  onSelect: (orgId: string) => void
}

export const OrganizationCard = memo(
  forwardRef<TamaguiElement, OrganizationCardProps>(
    ({ organization, isSelected, onSelect }, forwardedRef) => {
      return (
        <YStack
          ref={(node) => {
            // Forward to parent ref
            if (typeof forwardedRef === 'function') {
              forwardedRef(node)
            } else if (forwardedRef) {
              forwardedRef.current = node
            }
          }}
          borderWidth={1}
          borderColor={isSelected ? '$blue9' : '$color5'}
          rounded="$3"
          p="$3"
          bg={isSelected ? '$blue9' : '$background'}
          gap="$2"
          pressStyle={{ scale: 0.98 }}
          hoverStyle={{ bg: isSelected ? '$blue9' : '$color2' }}
          onPress={() => onSelect(organization.id)}
          animation={isSelected ? 'bouncy' : undefined}
          animateOnly={['backgroundColor', 'borderColor']}
          style={isSelected ? { boxShadow: '0 4px 8px rgba(168, 85, 247, 0.2)' } : undefined}
        >
          <XStack justify="space-between" items="center">
            <XStack items="center" gap="$2" flex={1}>
              <Building size={20} color={isSelected ? '$color1' : '$blue11'} />
              <SizableText
                size="$5"
                fontWeight="700"
                color={isSelected ? '$color1' : '$color12'}
                flex={1}
              >
                {organization.name}
              </SizableText>
            </XStack>
          </XStack>

          {organization.industry && (
            <XStack items="center" gap="$2">
              <XStack
                items="center"
                gap="$1"
                bg={isSelected ? '$blue3' : '$blue3'}
                rounded="$4"
                px="$2"
                py="$1"
              >
                <Text color={isSelected ? '$color1' : '$blue11'} fontWeight="600" fontSize="$2">
                  {organization.industry}
                </Text>
              </XStack>
            </XStack>
          )}

          {organization.address && (
            <XStack items="center" gap="$1">
              <MapPin size={14} color={isSelected ? '$color1' : '$color10'} />
              <Text color={isSelected ? '$color1' : '$color11'} fontSize="$2">
                {organization.address.city}
                {organization.address.state && `, ${organization.address.state}`}
              </Text>
            </XStack>
          )}

          {organization.employeeCount && (
            <XStack items="center" gap="$1">
              <Users size={14} color={isSelected ? '$color1' : '$color10'} />
              <Text color={isSelected ? '$color1' : '$color11'} fontSize="$2">
                {organization.employeeCount} employees
              </Text>
            </XStack>
          )}

          <Button
            size="$2"
            rounded="$2"
            bg={isSelected ? '$color1' : '$blue9'}
            color={isSelected ? '$blue9' : '$color1'}
            hoverStyle={{
              bg: isSelected ? '$color2' : '$blue10',
            }}
            mt="$2"
          >
            View Organization
          </Button>
        </YStack>
      )
    }
  )
)

OrganizationCard.displayName = 'OrganizationCard'
