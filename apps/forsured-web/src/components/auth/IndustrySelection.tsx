/**
 * Industry Selection Component
 * REQ-4: Multi-Industry User Set Type System with Configurable Lexicon
 *
 * Displays available industries for user selection during signup
 */
import { YStack, XStack, Text, styled, Spinner } from '@unicornlove/ui'
import { Factory, Home, Briefcase } from 'lucide-react'

/** REQ-4: User set type data from API */
export interface UserSetType {
  id: string
  name: string
  slug: string
  managerLabelSingular: string
  managerLabelPlural: string
  contractorLabelSingular: string
  contractorLabelPlural: string
  description: string | null
}

export interface IndustrySelectionProps {
  userSetTypes: UserSetType[] | undefined
  isLoading: boolean
  error: Error | null
  selectedId?: string
  onSelect: (userSetType: UserSetType) => void
  disabled?: boolean
}

const IndustryCard = styled(YStack, {
  name: 'IndustryCard',
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

/** Helper to get icon for user set type */
function getIndustryIcon(slug: string) {
  switch (slug) {
    case 'construction':
      return <Factory size={24} color="currentColor" />
    case 'property-management':
      return <Home size={24} color="currentColor" />
    default:
      return <Briefcase size={24} color="currentColor" />
  }
}

/** Helper to get icon background color */
function getIndustryColor(slug: string) {
  switch (slug) {
    case 'construction':
      return '$orange3'
    case 'property-management':
      return '$green3'
    default:
      return '$blue3'
  }
}

export function IndustrySelection({
  userSetTypes,
  isLoading,
  error,
  selectedId,
  onSelect,
  disabled = false,
}: IndustrySelectionProps) {
  if (isLoading) {
    return (
      <YStack alignItems="center" padding="$8">
        <Spinner size="large" />
        <Text color="$color10" marginTop="$4">
          Loading industries...
        </Text>
      </YStack>
    )
  }

  if (error) {
    return (
      <YStack
        data-testid="user-set-types-error"
        backgroundColor="$red2"
        borderWidth={1}
        borderColor="$red6"
        borderRadius="$md"
        padding="$4"
        gap="$2"
      >
        <Text fontSize="$3" fontWeight="600" color="$red11">
          Failed to load industries
        </Text>
        <Text fontSize="$2" color="$red10">
          Please refresh the page or contact support if the problem persists.
        </Text>
      </YStack>
    )
  }

  if (!userSetTypes || userSetTypes.length === 0) {
    return (
      <YStack
        data-testid="no-user-set-types"
        backgroundColor="$yellow2"
        borderWidth={1}
        borderColor="$yellow6"
        borderRadius="$md"
        padding="$4"
        gap="$2"
      >
        <Text fontSize="$3" fontWeight="600" color="$yellow11">
          No industries available
        </Text>
        <Text fontSize="$2" color="$yellow10">
          Please contact support to set up your account.
        </Text>
      </YStack>
    )
  }

  return (
    <>
      <Text fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">
        What industry are you in?
      </Text>

      <XStack flexDirection="row" flexWrap="wrap" gap="$4" marginBottom="$8">
        {userSetTypes.map((ust) => (
          <IndustryCard
            key={ust.id}
            as="button"
            onClick={() => onSelect(ust)}
            disabled={disabled}
            selected={selectedId === ust.id}
            data-testid={`industry-${ust.slug}`}
            flex={1}
            minWidth={280}
          >
            <XStack alignItems="flex-start" gap="$4">
              <XStack
                width={48}
                height={48}
                backgroundColor={getIndustryColor(ust.slug)}
                borderRadius="$md"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                {getIndustryIcon(ust.slug)}
              </XStack>
              <YStack gap="$1">
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  {ust.name}
                </Text>
                {ust.description && (
                  <Text fontSize="$2" color="$color10" marginTop="$1">
                    {ust.description}
                  </Text>
                )}
              </YStack>
            </XStack>
          </IndustryCard>
        ))}
      </XStack>
    </>
  )
}
