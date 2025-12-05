import { DiscoverCard } from '@unicornlove/ui'
import { Building, MapPin, Users } from '@tamagui/lucide-icons'
import { forwardRef, memo } from 'react'
import type { TamaguiElement } from '@unicornlove/ui'
import { Button, SizableText, Text, XStack } from '@unicornlove/ui'
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
        <DiscoverCard
          ref={forwardedRef}
          variant="info"
          isSelected={isSelected}
          onPress={() => onSelect(organization.id)}
        >
          <XStack justifyContent="space-between" alignItems="center">
            <XStack alignItems="center" gap="$2" flex={1}>
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

          {organization.address && (
            <XStack alignItems="center" gap="$1">
              <MapPin size={14} color={isSelected ? '$color1' : '$color10'} />
              <Text color={isSelected ? '$color1' : '$color11'} fontSize="$2">
                {organization.address.city}
                {organization.address.state && `, ${organization.address.state}`}
              </Text>
            </XStack>
          )}

          {organization.employeeCount && (
            <XStack alignItems="center" gap="$1">
              <Users size={14} color={isSelected ? '$color1' : '$color10'} />
              <Text color={isSelected ? '$color1' : '$color11'} fontSize="$2">
                {organization.employeeCount} employees
              </Text>
            </XStack>
          )}

          <Button
            size="$2"
            borderRadius="$2"
            backgroundColor={isSelected ? '$color1' : '$blue9'}
            color={isSelected ? '$blue9' : '$color1'}
            hoverStyle={{
              backgroundColor: isSelected ? '$color2' : '$blue10',
            }}
            marginTop="$2"
          >
            View Organization
          </Button>
        </DiscoverCard>
      )
    }
  )
)

OrganizationCard.displayName = 'OrganizationCard'
