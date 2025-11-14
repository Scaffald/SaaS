import { useState, useEffect } from 'react'
import { YStack, XStack, Text, Button, Select, Adapt, Sheet, Card, Spinner } from 'tamagui'
import { Check, ChevronDown, ExternalLink } from '@tamagui/lucide-icons'
import { api } from '@app/core/utils/api'
import { useToastController } from '@tamagui/toast'
import { RouteBuilder } from '@app/core/constants/routes'

interface OrganizationProjectPrivacySettingsProps {
  organizationId: string
}

type ProjectLocationVisibility = 'public' | 'authenticated' | 'organization_only' | 'private'

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', description: 'Anyone can see exact locations' },
  { value: 'authenticated', label: 'Authenticated', description: 'Only logged-in users see exact locations' },
  { value: 'organization_only', label: 'Organization Only', description: 'Only organization members see exact locations' },
  { value: 'private', label: 'Private', description: 'Only project team and admins see exact locations' },
] as const

export function OrganizationProjectPrivacySettings({
  organizationId,
}: OrganizationProjectPrivacySettingsProps) {
  const toast = useToastController()
  const { data: orgData, isLoading } = api.organizations.getOrganization.useQuery(
    { id: organizationId },
    { enabled: !!organizationId }
  )

  const { data: projectsWithOverrides } = api.organizations.getProjectsWithOverrides.useQuery(
    { organization_id: organizationId },
    { enabled: !!organizationId }
  )

  const [selectedVisibility, setSelectedVisibility] = useState<ProjectLocationVisibility>('organization_only')
  const updateMutation = api.organizations.updateLocationVisibility.useMutation()

  useEffect(() => {
    if (orgData?.default_project_location_visibility) {
      setSelectedVisibility(orgData.default_project_location_visibility)
    }
  }, [orgData?.default_project_location_visibility])

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        organization_id: organizationId,
        default_project_location_visibility: selectedVisibility as ProjectLocationVisibility,
      })
      toast.show('Success', { message: 'Location visibility setting updated' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update setting'
      toast.show('Error', { message })
    }
  }

  const overrideCount = projectsWithOverrides?.projects?.length || 0
  const _totalProjects = 0 // TODO: Get total project count

  if (isLoading) {
    return (
      <Card p="$4" bg="$gray2">
        <Spinner />
      </Card>
    )
  }

  return (
    <Card p="$4" bg="$blue2" borderColor="$blue8" borderWidth={1}>
      <YStack gap="$4">
        <Text fontSize="$6" fontWeight="600">Project Location Privacy</Text>
        <Text fontSize="$3" color="$gray11">
          Set the default visibility level for project locations. Individual projects can override this setting.
        </Text>

        <YStack gap="$2">
          <Text fontWeight="600">Default Project Location Visibility</Text>
          <Select
            value={selectedVisibility}
            onValueChange={setSelectedVisibility}
            disabled={updateMutation.isPending}
          >
            <Select.Trigger iconAfter={ChevronDown}>
              <Select.Value />
            </Select.Trigger>
            <Adapt when="sm" platform="touch">
              <Sheet modal dismissOnSnapToBottom>
                <Sheet.Frame>
                  <Sheet.ScrollView>
                    <Adapt.Contents />
                  </Sheet.ScrollView>
                </Sheet.Frame>
                <Sheet.Overlay />
              </Sheet>
            </Adapt>
            <Select.Content zIndex={200000}>
              <Select.Viewport>
                {VISIBILITY_OPTIONS.map((option, index) => (
                  <Select.Item key={option.value} value={option.value} index={index}>
                    <Select.ItemText>
                      <YStack>
                        <Text fontWeight="600">{option.label}</Text>
                        <Text fontSize="$2" color="$gray10">{option.description}</Text>
                      </YStack>
                    </Select.ItemText>
                    <Select.ItemIndicator marginLeft="auto">
                      <Check size={16} />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select>
        </YStack>

        <Card p="$3" bg="$yellow2" borderColor="$yellow8" borderWidth={1}>
          <YStack gap="$2">
            <Text fontWeight="600" fontSize="$3">Project Override Statistics</Text>
            <Text fontSize="$2" color="$gray11">
              {overrideCount} project{overrideCount !== 1 ? 's' : ''} override this default setting
            </Text>
            {overrideCount > 0 && (
              <Button
                size="$2"
                variant="outlined"
                icon={ExternalLink}
                onPress={() => {
                  // TODO: Navigate to projects list filtered by this org
                  console.log('View projects with overrides')
                }}
              >
                View Projects with Overrides
              </Button>
            )}
          </YStack>
        </Card>

        <XStack jc="flex-end">
          <Button
            theme="blue"
            onPress={handleSave}
            disabled={updateMutation.isPending || selectedVisibility === orgData?.default_project_location_visibility}
          >
            {updateMutation.isPending ? <Spinner /> : 'Save Setting'}
          </Button>
        </XStack>
      </YStack>
    </Card>
  )
}

