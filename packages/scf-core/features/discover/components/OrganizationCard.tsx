import { Card, Text, Row, Stack } from '@scaffald/ui'
import { Building2, MapPin, Users } from 'lucide-react-native'
import type { ComponentRef } from 'react'
import { forwardRef, memo } from 'react'
import { View } from 'react-native'
import type { OrganizationMapPin } from '../hooks/useOrganizations'

type OrganizationCardProps = {
  organization: OrganizationMapPin
  isSelected?: boolean
  onSelect: (orgId: string) => void
  variant?: 'compact' | 'full'
}

/**
 * Organization Card — consistent with ProfileCard layout.
 * Header: icon + name + industry
 * Metrics: location, employee count
 */
export const OrganizationCard = memo(
  forwardRef<ComponentRef<typeof View>, OrganizationCardProps>(
    ({ organization, isSelected, onSelect, variant = 'compact' }, forwardedRef) => {
      const isCompact = variant === 'compact'
      const location = organization.address
        ? [organization.address.city, organization.address.state].filter(Boolean).join(', ')
        : null

      return (
        <View ref={forwardedRef}>
          <Card
            pressable
            onPress={() => onSelect(organization.id)}
            padding="md"
            variant={isSelected ? 'elevated' : 'surface'}
            style={[isSelected && { borderColor: '#7c3aed', borderWidth: 1 }]}
          >
            <Stack gap={isCompact ? 10 : 12}>
              {/* Header: Icon + Name + Industry */}
              <Row gap={12} align="center">
                <View
                  style={{
                    width: isCompact ? 44 : 48,
                    height: isCompact ? 44 : 48,
                    borderRadius: 12,
                    backgroundColor: '#f5f0ff',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Building2 size={isCompact ? 20 : 22} color="#7c3aed" />
                </View>
                <Stack flex={1} gap={2}>
                  <Text
                    style={{ fontWeight: '600', fontSize: isCompact ? 14 : 15 }}
                    numberOfLines={1}
                  >
                    {organization.name}
                  </Text>
                  {organization.industry && (
                    <Text style={{ fontSize: 13, color: '#6e6760' }} numberOfLines={1}>
                      {organization.industry}
                    </Text>
                  )}
                </Stack>
              </Row>

              {/* Metrics */}
              <Row gap={6} align="center" wrap>
                {location && (
                  <>
                    <MapPin size={14} color="#6e6760" />
                    <Text style={{ fontSize: 13, color: '#6e6760', flex: 1 }} numberOfLines={1}>
                      {location}
                    </Text>
                  </>
                )}
              </Row>

              {!isCompact && organization.employeeCount && (
                <Row gap={6} align="center">
                  <Users size={14} color="#6e6760" />
                  <Text style={{ fontSize: 13, color: '#6e6760' }}>
                    {organization.employeeCount} employees
                  </Text>
                </Row>
              )}
            </Stack>
          </Card>
        </View>
      )
    }
  )
)

OrganizationCard.displayName = 'OrganizationCard'
