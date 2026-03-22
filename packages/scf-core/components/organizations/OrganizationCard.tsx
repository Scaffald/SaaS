import { Building, MapPin, Users } from 'lucide-react-native'
import { forwardRef, memo } from 'react'
import type { ComponentRef } from 'react'
import { Text, Row, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import {
  CardActions,
  CardHeader,
  CardMetadata,
  SelectableCard,
  type MetadataItem,
} from '@scaffald/ui'

/**
 * Organization address data
 */
export interface OrganizationAddress {
  street?: string
  city?: string
  state?: string
  zipCode?: string
}

/**
 * Organization card props
 */
export interface OrganizationCardProps {
  id: string
  name: string
  industry?: string
  address?: OrganizationAddress
  employeeCount?: number
  isSelected?: boolean
  onSelect: (id: string) => void
  onViewDetails?: () => void
}

/**
 * OrganizationCard - Displays organization/employer information
 *
 * Consistent with ResultCard design pattern with selection states
 * and hover effects.
 *
 * @example
 * ```tsx
 * <OrganizationCard
 *   id="org-1"
 *   name="Acme Corp"
 *   industry="Technology"
 *   address={{ city: "San Francisco", state: "CA" }}
 *   employeeCount={500}
 *   isSelected={selected === "org-1"
 *   onSelect={setSelected}
 *   onViewDetails={() => router.push(ROUTES.EMPLOYERS.path)}
 * />
 * ```
 */
export const OrganizationCard = memo(
  forwardRef<ComponentRef<typeof SelectableCard>, OrganizationCardProps>(
    (
      { id, name, industry, address, employeeCount, isSelected = false, onSelect, onViewDetails },
      forwardedRef
    ) => {
      const { theme } = useThemeContext()
      const t = theme === 'dark' ? 'dark' : 'light'

      // Build metadata items
      const metadataItems: MetadataItem[] = []

      if (address && (address.city || address.state)) {
        const location = [address.city, address.state].filter(Boolean).join(', ')
        metadataItems.push({
          key: 'location',
          icon: <MapPin size="md" color={isSelected ? colors.bg[t].default : colors.text[t].secondary} />,
          label: location,
        })
      }

      if (employeeCount) {
        metadataItems.push({
          key: 'employees',
          icon: <Users size="md" color={isSelected ? colors.bg[t].default : colors.text[t].secondary} />,
          label: `${employeeCount} employees`,
        })
      }

      return (
        <SelectableCard
          ref={forwardedRef}
          id={id}
          isSelected={isSelected}
          onPress={() => onSelect(id)}
          selection={{
            enabled: true,
            selectedBorderColor: t === 'dark' ? colors.blue[500] : colors.blue[300],
            selectedBgColor: t === 'dark' ? colors.blue[900] : colors.blue[50],
            selectedShadow: '0 4px 8px rgba(35, 156, 178, 0.2)',
          }}
        >
          {/* Header with building icon */}
          <CardHeader
            title={name}
            action={<Building size={20} color={isSelected ? colors.bg[t].default : (t === 'dark' ? colors.blue[300] : colors.blue[700])} />}
            children={undefined}
          />

          {/* Industry badge */}
          {industry && (
            <Row align="center" gap={8}>
              <Row
                align="center"
                gap={4}
                style={{
                  backgroundColor: t === 'dark' ? colors.blue[900] : colors.blue[50],
                }}
                borderRadius={16}
                paddingHorizontal={8}
                paddingVertical={4}
              >
                <Text style={{ color: isSelected ? colors.bg[t].default : (t === 'dark' ? colors.blue[300] : colors.blue[700]) }}>{industry}</Text>
              </Row>
            </Row>
          )}

          {/* Metadata */}
          {metadataItems.length > 0 && (
            <CardMetadata items={metadataItems} isSelected={isSelected} />
          )}

          {/* Actions */}
          {onViewDetails && (
            <CardActions
              actions={[
                {
                  key: 'view',
                  label: 'View Organization',
                  onPress: onViewDetails,
                  color: 'primary',
                  variant: 'filled',
                },
              ]}
            />
          )}
        </SelectableCard>
      )
    }
  )
)

OrganizationCard.displayName = 'OrganizationCard'
