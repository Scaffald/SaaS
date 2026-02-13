import { api } from '@scf/core/utils/api'
import { ResponsiveSelect, useThemeContext } from '@scaffald/ui'
import { ExternalLink } from 'lucide-react-native'
import { useToast } from '@scaffald/ui'
import { useEffect, useState } from 'react'
import { Button, Card, Spinner, Text, Row, Stack } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

interface OrganizationProjectPrivacySettingsProps {
  organizationId: string
}

type ProjectLocationVisibility = 'public' | 'authenticated' | 'organization_only' | 'private'

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', description: 'Anyone can see exact locations' },
  {
    value: 'authenticated',
    label: 'Authenticated',
    description: 'Only logged-in users see exact locations',
  },
  {
    value: 'organization_only',
    label: 'Organization Only',
    description: 'Only organization members see exact locations',
  },
  {
    value: 'private',
    label: 'Private',
    description: 'Only project team and admins see exact locations',
  },
] as const

export function OrganizationProjectPrivacySettings({
  organizationId,
}: OrganizationProjectPrivacySettingsProps) {
  const { theme } = useThemeContext()
  const toast = useToast()
  const { data: orgData, isLoading } = api.organizations.getOrganization.useQuery(
    { id: organizationId },
    { enabled: !!organizationId }
  )

  const { data: projectsWithOverrides } = api.organizations.getProjectsWithOverrides.useQuery(
    { organization_id: organizationId },
    { enabled: !!organizationId }
  )

  const [selectedVisibility, setSelectedVisibility] =
    useState<ProjectLocationVisibility>('organization_only')
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
      toast.show({
        title: 'Success',
        message: 'Location visibility setting updated',
        variant: 'success',
      })
    } catch (error) {
      const _message = error instanceof Error ? error.message : 'Failed to update setting'
      toast.show({
        title: 'Error',
        variant: 'error',
      })
    }
  }

  const overrideCount = projectsWithOverrides?.projects?.length || 0
  const _totalProjects = 0 // TODO: Get total project count

  if (isLoading) {
    return (
      <Card padding="md" style={{ backgroundColor: colors.bg[theme].subtle }}>
        <Spinner />
      </Card>
    )
  }

  return (
    <Card
      padding="md"
      style={{ backgroundColor: theme === "light" ? colors.blue[50] : colors.blue[900] }}
      borderColor={theme === "light" ? colors.blue[300] : colors.blue[700]}
      borderWidth={1}
    >
      <Stack gap={16}>
        <Text>Project Location Privacy</Text>
        <Text style={{ color: colors.text[theme].secondary }}>
          Set the default visibility level for project locations. Individual projects can override
          this setting.
        </Text>

        <Stack gap={8}>
          <Text>Default Project Location Visibility</Text>
          <ResponsiveSelect
            value={selectedVisibility}
            onValueChange={(value) => setSelectedVisibility(value as ProjectLocationVisibility)}
            placeholder="Select visibility"
            options={VISIBILITY_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />
        </Stack>

        <Card
          padding="sm"
          style={{ backgroundColor: theme === "light" ? colors.yellow[50] : colors.yellow[900] }}
          borderColor={theme === "light" ? colors.yellow[300] : colors.yellow[700]}
          borderWidth={1}
        >
          <Stack gap={8}>
            <Text>Project Override Statistics</Text>
            <Text style={{ color: colors.text[theme].secondary }}>
              {overrideCount} project{overrideCount !== 1 ? 's' : ''} override this default setting
            </Text>
            {overrideCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                iconStart={ExternalLink}
                onPress={() => {
                  // TODO: Navigate to projects list filtered by this org
                  console.log('View projects with overrides')
                }}
              >
                View Projects with Overrides
              </Button>
            )}
          </Stack>
        </Card>

        <Row justify="flex-end">
          <Button
            color="primary"
            onPress={handleSave}
            disabled={
              updateMutation.isPending ||
              selectedVisibility === orgData?.default_project_location_visibility
            }
          >
            {updateMutation.isPending ? <Spinner /> : 'Save Setting'}
          </Button>
        </Row>
      </Stack>
    </Card>
  )
}
