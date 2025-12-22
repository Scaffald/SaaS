/**
 * User Type Selection Component
 * REQ-4: Multi-Industry User Set Type System with Configurable Lexicon
 *
 * Displays role options (Manager/Contractor) with dynamic lexicon labels
 */
import { YStack, XStack, Text, styled, Spinner } from '@unicornlove/ui'
import { Button as CoreButton } from '@unicornlove/ui'
import { Building2, HardHat, ChevronLeft } from 'lucide-react'
import type { UserSetType } from './IndustrySelection'

export type UserType = 'manager' | 'subcontractor'

export interface UserTypeSelectionProps {
  userSetType: UserSetType
  selectedType: UserType | null
  onSelect: (type: UserType) => void
  onBack: () => void
  isLoading: boolean
}

const UserTypeCard = styled(YStack, {
  name: 'UserTypeCard',
  position: 'relative',
  backgroundColor: '$background',
  borderRadius: '$md',
  shadowColor: '$shadowColor',
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
  padding: '$6',
  textAlign: 'left',
  borderWidth: 2,
  borderColor: 'transparent',
  cursor: 'pointer',

  hoverStyle: {
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    borderColor: '$blue9',
  },

  variants: {
    selected: {
      true: {
        borderColor: '$blue9',
      },
    },
    disabled: {
      true: {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    },
  } as const,
})

export function UserTypeSelection({
  userSetType,
  selectedType,
  onSelect,
  onBack,
  isLoading,
}: UserTypeSelectionProps) {
  return (
    <>
      {/* Back button */}
      <CoreButton onClick={onBack} variant="ghost" data-testid="back-to-industry">
        <XStack alignItems="center" gap="$2">
          <ChevronLeft size={16} />
          <Text>Back to industry selection</Text>
        </XStack>
      </CoreButton>

      <Text fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">
        How will you use ForSured?
      </Text>

      <XStack flexDirection="row" flexWrap="wrap" gap="$4" marginBottom="$8">
        {/* Manager Card - uses lexicon labels */}
        <UserTypeCard
          as="button"
          onClick={() => onSelect('manager')}
          disabled={isLoading}
          selected={selectedType === 'manager'}
          data-testid="user-type-manager"
          flex={1}
          minWidth={280}
        >
          <XStack alignItems="flex-start" gap="$4">
            <XStack
              width={48}
              height={48}
              backgroundColor="$blue3"
              borderRadius="$md"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Building2 size={24} color="currentColor" />
            </XStack>
            <YStack gap="$1">
              <Text fontSize="$5" fontWeight="600" color="$color12">
                {userSetType.managerLabelSingular}
              </Text>
              <Text fontSize="$2" color="$color10" marginTop="$1">
                I hire {userSetType.contractorLabelPlural.toLowerCase()} and manage projects
              </Text>
            </YStack>
          </XStack>
          {isLoading && selectedType === 'manager' && (
            <YStack
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              backgroundColor="rgba(255, 255, 255, 0.8)"
              alignItems="center"
              justifyContent="center"
              borderRadius="$md"
            >
              <Spinner />
            </YStack>
          )}
        </UserTypeCard>

        {/* Contractor Card - uses lexicon labels */}
        <UserTypeCard
          as="button"
          onClick={() => onSelect('subcontractor')}
          disabled={isLoading}
          selected={selectedType === 'subcontractor'}
          data-testid="user-type-contractor"
          flex={1}
          minWidth={280}
        >
          <XStack alignItems="flex-start" gap="$4">
            <XStack
              width={48}
              height={48}
              backgroundColor="$yellow3"
              borderRadius="$md"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <HardHat size={24} color="currentColor" />
            </XStack>
            <YStack gap="$1">
              <Text fontSize="$5" fontWeight="600" color="$color12">
                {userSetType.contractorLabelSingular}
              </Text>
              <Text fontSize="$2" color="$color10" marginTop="$1">
                I work on projects for {userSetType.managerLabelPlural.toLowerCase()}
              </Text>
            </YStack>
          </XStack>
          {isLoading && selectedType === 'subcontractor' && (
            <YStack
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              backgroundColor="rgba(255, 255, 255, 0.8)"
              alignItems="center"
              justifyContent="center"
              borderRadius="$md"
            >
              <Spinner />
            </YStack>
          )}
        </UserTypeCard>
      </XStack>
    </>
  )
}
