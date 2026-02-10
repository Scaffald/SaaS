import { DiscoverCard } from '@unicornlove/beyond-ui'
import { Building, MapPin, Users } from 'lucide-react-native'
import type { ComponentRef } from 'react'
import { forwardRef, memo } from 'react'
import { Button, SizableText, Text, Row } from '@unicornlove/beyond-ui'
import type { OrganizationMapPin } from '../hooks/useOrganizations'

type OrganizationCardProps = {
  organization: OrganizationMapPin
  isSelected?: boolean
  onSelect: (orgId: string) => void
}

export const OrganizationCard = memo(
  forwardRef<ComponentRef<typeof DiscoverCard>, OrganizationCardProps>(
    ({ organization, isSelected, onSelect }, forwardedRef) => {
      return (
        <DiscoverCard
          ref={forwardedRef}
          variant="info"
          isSelected={isSelected}
          onPress={() => onSelect(organization.id)}
        >
          <Row justifyContent="space-between" alignItems="center">
            <Row alignItems="center" gap="$2" flex={1}>
              <Building size={20} color={isSelected ? '$color1' : '$blue11'} />
              <SizableText
                size="$5"
                fontWeight="700"
                color={isSelected ? '$color1' : '$color12'}
                flex={1}
              >
                {organization.name}
              </SizableText>
            </Row>
          </Row>

          {organization.address && (
            <Row alignItems="center" gap="$1">
              <MapPin size={14} color={isSelected ? '$color1' : '$color10'} />
              <Text color={isSelected ? '$color1' : '$color11'} fontSize="$2">
                {organization.address.city}
                {organization.address.state && `, ${organization.address.state}`}
              </Text>
            </Row>
          )}

          {organization.employeeCount && (
            <Row alignItems="center" gap="$1">
              <Users size={14} color={isSelected ? '$color1' : '$color10'} />
              <Text color={isSelected ? '$color1' : '$color11'} fontSize="$2">
                {organization.employeeCount} employees
              </Text>
            </Row>
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
