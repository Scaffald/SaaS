import { Building, MapPin, Users } from '@tamagui/lucide-icons'
import { forwardRef, memo } from 'react'
import type { TamaguiElement } from 'tamagui'
import { Text, XStack } from 'tamagui'
import {
  CardActions,
  CardHeader,
  CardMetadata,
  SelectableCard,
  type MetadataItem,
} from '@scaffald/tamagui-ui'

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
 *   isSelected={selected === "org-1"}
 *   onSelect={setSelected}
 *   onViewDetails={() => router.push(ROUTES.DASHBOARD.ORGANIZATIONS.path)}
 * />
 * ```
 */
export const OrganizationCard = memo(
  forwardRef<TamaguiElement, OrganizationCardProps>(
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
          icon: <MapPin size={14} color={isSelected ? '$color1' : '$color10'} />,
          label: location,
        })
      }

      if (employeeCount) {
        metadataItems.push({
          key: 'employees',
          icon: <Users size={14} color={isSelected ? '$color1' : '$color10'} />,
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
            icon={<Building size={20} color={isSelected ? '$color1' : '$blue11'} />}
          />

          {/* Industry badge */}
          {industry && (
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
                  {industry}
                </Text>
              </XStack>
            </XStack>
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
