import { ROUTES } from '@scf/core/constants/routes'
import { api } from '@scf/core/utils/api'
import {
  useProject,
  useCreateProjectMutation,
  useUpdateProjectMutation,
} from '@scf/core/utils/projects-sdk-hooks'
import { useAllOrganizations } from '@scf/core/utils/useAllOrganizations'
import { ResponsiveSelect } from '@unicornlove/beyond-ui'
import { useToast } from '@unicornlove/beyond-ui'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  Input,
  Spinner,
  Switch,
  Text,
  TextArea,
  Row,
  Stack,
} from '@unicornlove/beyond-ui'

type ProjectFormData = {
  name: string
  description: string
  organization_id: string
  status: 'planning' | 'active' | 'completed' | 'on_hold'
  start_date: string
  end_date: string
  location_visibility: 'public' | 'authenticated' | 'organization_only' | 'private'
  location_visibility_override: boolean
}

type ProjectFormProps = {
  mode: 'create' | 'edit'
  projectId?: string
  initialData?: Partial<ProjectFormData>
  onSuccess?: () => void
}

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
]

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'authenticated', label: 'Authenticated' },
  { value: 'organization_only', label: 'Organization Only' },
  { value: 'private', label: 'Private' },
]

export function ProjectForm({ mode, projectId, initialData, onSuccess }: ProjectFormProps) {
  const router = useRouter()
  const toast = useToast()
  const { data: organizationsData } = useAllOrganizations()

  const { data: projectData } = useProject(projectId, {
    enabled: mode === 'edit' && !!projectId,
  })

  const [formData, setFormData] = useState<ProjectFormData>({
    name: initialData?.name || projectData?.name || '',
    description: initialData?.description || projectData?.description || '',
    organization_id: initialData?.organization_id || projectData?.organization_id || '',
    status: initialData?.status || projectData?.status || 'planning',
    start_date: initialData?.start_date || projectData?.start_date || '',
    end_date: initialData?.end_date || projectData?.end_date || '',
    location_visibility:
      initialData?.location_visibility || projectData?.location_visibility || 'organization_only',
    location_visibility_override:
      initialData?.location_visibility_override ||
      projectData?.location_visibility_override ||
      false,
  })

  const { data: orgData } = api.organizations.getOrganization.useQuery(
    { id: formData.organization_id },
    { enabled: !!formData.organization_id }
  )

  // Update visibility when organization changes
  useEffect(() => {
    if (orgData?.default_project_location_visibility && !formData.location_visibility_override) {
      const orgVisibility = orgData.default_project_location_visibility
      if (
        orgVisibility === 'public' ||
        orgVisibility === 'authenticated' ||
        orgVisibility === 'organization_only' ||
        orgVisibility === 'private'
      ) {
        setFormData((prev) => ({
          ...prev,
          location_visibility: orgVisibility,
        }))
      }
    }
  }, [orgData?.default_project_location_visibility, formData.location_visibility_override])

  const createMutation = useCreateProjectMutation()
  const updateMutation = useUpdateProjectMutation()

  const handleSubmit = async () => {
    try {
      if (mode === 'create') {
        await createMutation.mutateAsync({
          organizationId: formData.organization_id,
          name: formData.name,
          description: formData.description || undefined,
          status: formData.status,
          startDate: formData.start_date || undefined,
          endDate: formData.end_date || undefined,
          locationVisibility: formData.location_visibility,
          locationVisibilityOverride: formData.location_visibility_override,
        })
        toast.show({
          title: 'Project created successfully',
          variant: 'success',
        })
        router.push(ROUTES.OFFICE.CMS.PROJECTS.path)
      } else if (projectId) {
        await updateMutation.mutateAsync({
          id: projectId,
          name: formData.name,
          description: formData.description || null,
          status: formData.status,
          startDate: formData.start_date || null,
          endDate: formData.end_date || null,
          locationVisibility: formData.location_visibility,
          locationVisibilityOverride: formData.location_visibility_override,
        })
        toast.show({
          title: 'Project updated successfully',
          variant: 'success',
        })
        onSuccess?.()
        router.back()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save project'
      toast.show(message, { variant: 'error' })
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Stack gap={16} padding="md" style={{ maxWidth: 800 }} marginHorizontal="auto">
      <Text>{mode === 'create' ? 'Create Project' : 'Edit Project'}</Text>

      <Card padding="md" gap={16}>
        <Stack gap={16}>
          <Stack gap={8}>
            <Text>Organization</Text>
            {organizationsData?.organizations && (
              <ResponsiveSelect
                value={formData.organization_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, organization_id: value }))
                }
                placeholder="Select organization"
                options={organizationsData.organizations.map(
                  (org: { id: string; name: string }) => ({
                    value: org.id,
                    label: org.name,
                  })
                )}
              />
            )}
          </Stack>

          <Stack gap={8}>
            <Text>Project Name *</Text>
            <Input
              value={formData.name}
              onChangeText={(value) => setFormData((prev) => ({ ...prev, name: value }))}
              placeholder="Enter project name"
            />
          </Stack>

          <Stack gap={8}>
            <Text>Description</Text>
            <TextArea
              value={formData.description}
              onChangeText={(value) => setFormData((prev) => ({ ...prev, description: value }))}
              placeholder="Enter project description"
              style={{ minHeight: 100 }}
            />
          </Stack>

          <Row gap={16}>
            <Stack gap={8} flex={1}>
              <Text>Status</Text>
              <ResponsiveSelect
                value={formData.status}
                onValueChange={(value) => {
                  if (
                    value === 'planning' ||
                    value === 'active' ||
                    value === 'completed' ||
                    value === 'on_hold'
                  ) {
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                }}
                placeholder="Select status"
                options={STATUS_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              />
            </Stack>

            <Stack gap={8} flex={1}>
              <Text>Start Date</Text>
              <Input
                value={formData.start_date}
                onChangeText={(value) => setFormData((prev) => ({ ...prev, start_date: value }))}
                placeholder="YYYY-MM-DD"
              />
            </Stack>

            <Stack gap={8} flex={1}>
              <Text>End Date</Text>
              <Input
                value={formData.end_date}
                onChangeText={(value) => setFormData((prev) => ({ ...prev, end_date: value }))}
                placeholder="YYYY-MM-DD"
              />
            </Stack>
          </Row>

          <Card padding="md" backgroundColor="$yellow2" borderColor="$yellow8" borderWidth={1}>
            <Stack gap={16}>
              <Text>Location Visibility Settings</Text>

              <Row gap={8} align="center">
                <Switch
                  checked={formData.location_visibility_override}
                  onChange={(checked) =>
                    setFormData((prev) => ({ ...prev, location_visibility_override: checked }))
                  }
                />
                <Text>Override organization's global setting</Text>
              </Row>

              {formData.location_visibility_override && (
                <Stack gap={8} padding="xs" backgroundColor="$yellow3" borderRadius={8}>
                  <Text color="$yellow11">⚠️ This overrides your organization's global setting</Text>
                </Stack>
              )}

              <Stack gap={8}>
                <Text>Visibility Level</Text>
                <ResponsiveSelect
                  value={formData.location_visibility}
                  onValueChange={(value) => {
                    if (
                      value === 'public' ||
                      value === 'authenticated' ||
                      value === 'organization_only' ||
                      value === 'private'
                    ) {
                      setFormData((prev) => ({ ...prev, location_visibility: value }))
                    }
                  }}
                  placeholder="Select visibility"
                  options={VISIBILITY_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                />
                <Text color="$gray10">
                  {formData.location_visibility === 'public' && 'Anyone can see exact locations'}
                  {formData.location_visibility === 'authenticated' &&
                    'Only logged-in users see exact locations'}
                  {formData.location_visibility === 'organization_only' &&
                    'Only organization members see exact locations'}
                  {formData.location_visibility === 'private' &&
                    'Only project team and admins see exact locations'}
                </Text>
              </Stack>
            </Stack>
          </Card>

          <Row gap={16} justify="flex-end">
            <Button variant="outline" onPress={() => router.back()} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              disabled={isLoading || !formData.name || !formData.organization_id}
            >
              {isLoading ? <Spinner /> : mode === 'create' ? 'Create Project' : 'Save Changes'}
            </Button>
          </Row>
        </Stack>
      </Card>
    </Stack>
  )
}
