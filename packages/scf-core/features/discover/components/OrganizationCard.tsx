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
          <Row justify="space-between" align="center">
            <Row align="center" gap={8} flex={1}>
              <Building size="lg" color={isSelected ? '$color1' : '$blue11'} />
              <SizableText size="lg" color={isSelected ? '$color1' : '$color12'} flex={1}>
                {organization.name}
              </SizableText>
            </Row>
          </Row>

          {organization.address && (
            <Row align="center" gap={4}>
              <MapPin size="md" color={isSelected ? '$color1' : '$color10'} />
              <Text color={isSelected ? '$color1' : '$color11'}>
                {organization.address.city}
                {organization.address.state && `, ${organization.address.state}`}
              </Text>
            </Row>
          )}

          {organization.employeeCount && (
            <Row align="center" gap={4}>
              <Users size="md" color={isSelected ? '$color1' : '$color10'} />
              <Text color={isSelected ? '$color1' : '$color11'}>
                {organization.employeeCount} employees
              </Text>
            </Row>
          )}

          <Button
            size="xs"
            borderRadius={8}
            backgroundColor={isSelected ? '$color1' : '$blue9'}
            color={isSelected ? '$blue9' : '$color1'}
            hoverStyle={{
              backgroundColor: isSelected ? '$color2' : '$blue10',
            }}
            marginTop={8}
          >
            View Organization
          </Button>
        </DiscoverCard>
      )
    }
  )
)

OrganizationCard.displayName = 'OrganizationCard'
