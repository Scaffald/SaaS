import { TeamForm } from '@scf/core/features/office/teams'
import { useAllOrganizations } from '@scf/core/utils/useAllOrganizations'
import type { AppRouter } from '@scf/supabase/client-types'
import { Check, ChevronDown } from '@tamagui/lucide-icons'
import type { inferRouterOutputs } from '@trpc/server'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Button, Label, Select, Spinner, Text, YStack } from '@unicornlove/ui'

type OfficeOrganizationsOutput = inferRouterOutputs<AppRouter>['office']['getOrganizations']
type OrganizationOption = OfficeOrganizationsOutput['organizations'][number]

export default function CreateTeamPage() {
  const router = useRouter()
  const { data, isLoading } = useAllOrganizations()
  const organizations = useMemo<OrganizationOption[]>(
    () => (data?.organizations ?? []) as OrganizationOption[],
    [data?.organizations]
  )
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedOrganizationId && organizations.length === 1) {
      setSelectedOrganizationId(organizations[0].id as string)
    }
  }, [organizations, selectedOrganizationId])

  if (isLoading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Spinner size="large" />
      </YStack>
    )
  }

  if (!organizations.length) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$2">
        <Text fontSize="$5" fontWeight="600">
          No organizations available
        </Text>
        <Text color="$color11">Create an organization before adding teams.</Text>
        <Button onPress={() => router.back()} variant="outlined">
          Go Back
        </Button>
      </YStack>
    )
  }

  return (
    <YStack flex={1} padding="$4" gap="$4">
      <YStack gap="$2" style={{ maxWidth: 520 }}>
        <Label htmlFor="team-create-organization">Select organization</Label>
        <Select
          id="team-create-organization"
          value={selectedOrganizationId ?? ''}
          onValueChange={(value) => setSelectedOrganizationId(value)}
          disablePreventBodyScroll
        >
          <Select.Trigger iconAfter={ChevronDown}>
            <Select.Value
              placeholder={
                selectedOrganizationId
                  ? (organizations.find((org) => org.id === selectedOrganizationId)?.name ??
                    'Select organization')
                  : 'Select organization'
              }
            />
          </Select.Trigger>
          <Select.Content zIndex={200000}>
            <Select.ScrollUpButton />
            <Select.Viewport>
              <Select.Group>
                <Select.Label>Organizations</Select.Label>
                {organizations.map((org, index) => (
                  <Select.Item key={org.id} value={org.id} index={index}>
                    <Select.ItemText>
                      {(org.name as string) ?? 'Untitled Organization'}
                    </Select.ItemText>
                    <Select.ItemIndicator>
                      <Check size={16} />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Group>
            </Select.Viewport>
            <Select.ScrollDownButton />
          </Select.Content>
        </Select>
      </YStack>

      {selectedOrganizationId ? (
        <TeamForm
          mode="create"
          organizationId={selectedOrganizationId}
          onCancel={() => router.back()}
        />
      ) : (
        <YStack
          padding="$6"
          backgroundColor="$color3"
          borderRadius="$6"
          alignItems="center"
          gap="$2"
        >
          <Text fontSize="$6" fontWeight="700">
            Choose an organization to continue
          </Text>
          <Text color="$color11" style={{ textAlign: 'center' }}>
            Teams belong to a single organization. Select one above to configure the team.
          </Text>
        </YStack>
      )}
    </YStack>
  )
}
