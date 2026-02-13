import { TeamForm } from '@scf/core/features/office/teams'
import { useAllOrganizations } from '@scf/core/utils/useAllOrganizations'
import type { AppRouter } from '@scf/supabase/client-types'
import { Check, ChevronDown } from 'lucide-react-native'
import type { inferRouterOutputs } from '@trpc/server'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Button, Label, Select, Spinner, Text, Stack } from '@unicornlove/beyond-ui'

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
      <Stack align="center" justify="center">
        <Spinner size="lg" />
      </Stack>
    )
  }

  if (!organizations.length) {
    return (
      <Stack align="center" justify="center" gap={8}>
        <Text>
          No organizations available
        </Text>
        <Text color="gray">Create an organization before adding teams.</Text>
        <Button onPress={() => router.back()} variant="outline">Go Back</Button>
      </Stack>
    )
  }

  return (
    <Stack padding={16} gap={16}>
      <Stack gap={8} style={{ maxWidth: 520 }}>
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
                      <Check size="lg" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Group>
            </Select.Viewport>
            <Select.ScrollDownButton />
          </Select.Content>
        </Select>
      </Stack>

      {selectedOrganizationId ? (
        <TeamForm
          mode="create"
          organizationId={selectedOrganizationId}
          onCancel={() => router.back()}
        />
      ) : (
        <Stack
          padding={24}
         
         
          align="center"
          gap={8}
        >
          <Text>
            Choose an organization to continue
          </Text>
          <Text color="gray" style={{ textAlign: 'center' }}>
            Teams belong to a single organization. Select one above to configure the team.
          </Text>
        </Stack>
      )}
    </Stack>
  )
}
