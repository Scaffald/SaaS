/**
 * Scaffald Company Card Component
 * REQ-126: User Signup with Scaffald Integration
 *
 * Displays the user's Scaffald company and allows connection toggle
 */
import { YStack, XStack, Text, Spinner } from '@unicornlove/ui'
import { Checkbox } from '@unicornlove/ui'
import { Building2 } from 'lucide-react'

export interface Address {
  street: string
  city: string
  state: string
  zip: string
}

export interface ScaffaldCompany {
  id: string
  name: string
  address?: Address
}

export interface ScaffaldCompanyCardProps {
  company: ScaffaldCompany | null
  isLoading: boolean
  connectCompany: boolean
  onToggleConnect: (connect: boolean) => void
}

export function ScaffaldCompanyCard({
  company,
  isLoading,
  connectCompany,
  onToggleConnect,
}: ScaffaldCompanyCardProps) {
  if (isLoading) {
    return (
      <YStack
        backgroundColor="$background"
        borderRadius="$md"
        shadowColor="$shadowColor"
        shadowRadius={4}
        shadowOffset={{ width: 0, height: 2 }}
        padding="$6"
        gap="$3"
      >
        <XStack alignItems="center" gap="$3">
          <Spinner size="small" />
          <Text color="$color10">Checking for existing company...</Text>
        </XStack>
      </YStack>
    )
  }

  if (!company) {
    return null
  }

  return (
    <YStack
      backgroundColor="$background"
      borderRadius="$md"
      shadowColor="$shadowColor"
      shadowRadius={4}
      shadowOffset={{ width: 0, height: 2 }}
      padding="$6"
      gap="$4"
    >
      <XStack alignItems="flex-start" gap="$4">
        <Building2 size={32} color="currentColor" />
        <YStack flex={1} gap="$1">
          <Text fontSize="$5" fontWeight="600" color="$color12">
            {company.name}
          </Text>
          {company.address && (
            <Text fontSize="$2" color="$color10" marginTop="$1">
              {company.address.street}, {company.address.city}, {company.address.state}{' '}
              {company.address.zip}
            </Text>
          )}
          <XStack alignItems="center" marginTop="$4" gap="$2">
            <Checkbox
              checked={connectCompany}
              onCheckedChange={(checked) => onToggleConnect(!!checked)}
              data-testid="connect-company-checkbox"
            />
            <Text fontSize="$2" color="$color11">
              Connect this company to ForSured
            </Text>
          </XStack>
        </YStack>
      </XStack>
    </YStack>
  )
}
