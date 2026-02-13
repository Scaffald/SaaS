import { Building, MapPin, Users } from 'lucide-react-native'
import { forwardRef, memo } from 'react'
import type { ComponentRef } from 'react'
import { Text, Row } from '@unicornlove/beyond-ui'
import {
  CardActions,
  CardHeader,
  CardMetadata,
  SelectableCard,
  type MetadataItem,
} from '@unicornlove/beyond-ui'

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
 *   onViewDetails={() => router.push(ROUTES.DASHBOARD.ORGANIZATIONS.path)}
 * />
 * ```
 */
export const OrganizationCard = memo(
  forwardRef<ComponentRef<typeof SelectableCard>, OrganizationCardProps>(
    (
      { id, name, industry, address, employeeCount, isSelected = false, onSelect, onViewDetails },
      forwardedRef
    ) => {
      // Build metadata items
      const metadataItems: MetadataItem[] = []

      if (address && (address.city || address.state)) {
        const location = [address.city, address.state].filter(Boolean).join(', ')
        metadataItems.push({
          key: 'location',
          icon: <MapPin size="md" color={isSelected ? '$color1' : '$color10'} />,
          label: location,
        })
      }

      if (employeeCount) {
        metadataItems.push({
          key: 'employees',
          icon: <Users size="md" color={isSelected ? '$color1' : '$color10'} />,
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
            selectedBorderColor: '$blue7',
            selectedBgColor: '$blue2',
            selectedShadow: '0 4px 8px rgba(35, 156, 178, 0.2)',
          }}
        >
          {/* Header with building icon */}
          <CardHeader
            title={name}
            isSelected={isSelected}
            iconStart={<Building size={20} color={isSelected ? '$color1' : '$blue11'} />}
          />

          {/* Industry badge */}
          {industry && (
            <Row align="center" gap={8}>
              <Row
                align="center"
                gap={4}
                backgroundColor={isSelected ? '$blue3' : '$blue3'}
                borderRadius={16}
                paddingHorizontal={8}
                paddingVertical={4}
              >
                <Text color={isSelected ? '$color1' : '$blue11'}>{industry}</Text>
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
                  label: 'View Organization',
                  onPress: onViewDetails,
                  variant: 'primary',
                },
              ]}
              isSelected={isSelected}
            />
          )}
        </SelectableCard>
      )
    }
  )
)

OrganizationCard.displayName = 'OrganizationCard'
