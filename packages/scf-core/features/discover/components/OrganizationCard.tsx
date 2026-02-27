import { DiscoverCard } from '@scaffald/ui'
import { Building, MapPin, Users } from 'lucide-react-native'
import type { ComponentRef } from 'react'
import { forwardRef, memo } from 'react'
import { Button, Text, Row } from '@scaffald/ui'
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
              <Text size="lg" color={isSelected ? '$color1' : '$color12'} style={{ flex: 1 }}>
                {organization.name}
              </Text>
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
            size="sm"
            color={isSelected ? 'gray' : 'primary'}
            style={{ borderRadius: 8, marginTop: 8 }}
          >
            View Organization
          </Button>
        </DiscoverCard>
      )
    }
  )
)

OrganizationCard.displayName = 'OrganizationCard'
