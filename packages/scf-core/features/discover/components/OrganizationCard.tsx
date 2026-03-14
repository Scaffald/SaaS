import { Card, Stack, useThemeContext } from '@scaffald/ui'
import { Building2, MapPin, Users } from 'lucide-react-native'
import type { ComponentRef } from 'react'
import { forwardRef, memo } from 'react'
import { View } from 'react-native'
import { orgPalette, CardHeader, MetricRow } from '@scf/core/components/ui'
import type { OrganizationMapPin } from '../hooks/useOrganizations'

type OrganizationCardProps = {
  organization: OrganizationMapPin
  isSelected?: boolean
  onSelect: (orgId: string) => void
  variant?: 'compact' | 'full'
}

/**
 * Organization Card — uses shared card primitives for consistency.
 * Header: purple icon + name + industry
 * Metrics: location, employee count
 */
export const OrganizationCard = memo(
  forwardRef<ComponentRef<typeof View>, OrganizationCardProps>(
    ({ organization, isSelected, onSelect, variant = 'compact' }, forwardedRef) => {
      const { theme } = useThemeContext()
      const t = theme === 'dark' ? 'dark' : 'light'
      const pal = orgPalette[t]
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
            style={[isSelected && { borderColor: pal.selectedBorder, borderWidth: 1 }]}
          >
            <Stack gap={isCompact ? 10 : 12}>
              <CardHeader
                icon={Building2}
                iconBg={pal.iconBg}
                iconColor={pal.iconFg}
                title={organization.name}
                subtitle={organization.industry}
                compact={isCompact}
                theme={t}
              />

              {/* Metrics */}
              {location && <MetricRow icon={MapPin} text={location} theme={t} flex />}

              {!isCompact && organization.employeeCount && (
                <MetricRow
                  icon={Users}
                  text={`${organization.employeeCount} employees`}
                  theme={t}
                />
              )}
            </Stack>
          </Card>
        </View>
      )
    }
  )
)

OrganizationCard.displayName = 'OrganizationCard'
