import { ROUTES } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import { useAllOrganizations } from '@app/core/utils/useAllOrganizations'
import { ResponsiveSelect } from '@app/ui'
import { useToastController } from '@tamagui/toast'
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
  XStack,
  YStack,
} from 'tamagui'

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
  const toast = useToastController()
  const { data: organizationsData } = useAllOrganizations()

  const { data: projectData } = api.projects.get.useQuery(
    { id: projectId ?? '' },
    { enabled: mode === 'edit' && !!projectId }
  )

  const [formData, setFormData] = useState<ProjectFormData>({
    name: initialData?.name || projectData?.project?.name || '',
    description: initialData?.description || projectData?.project?.description || '',
    organization_id: initialData?.organization_id || projectData?.project?.organization_id || '',
    status: initialData?.status || projectData?.project?.status || 'planning',
    start_date: initialData?.start_date || projectData?.project?.start_date || '',
    end_date: initialData?.end_date || projectData?.project?.end_date || '',
    location_visibility:
      initialData?.location_visibility ||
      projectData?.project?.location_visibility ||
      'organization_only',
    location_visibility_override:
      initialData?.location_visibility_override ||
      projectData?.project?.location_visibility_override ||
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

  const createMutation = api.projects.create.useMutation()
  const updateMutation = api.projects.update.useMutation()

  const handleSubmit = async () => {
    try {
      if (mode === 'create') {
        await createMutation.mutateAsync({
          organization_id: formData.organization_id,
          name: formData.name,
          description: formData.description || undefined,
          status: formData.status,
          start_date: formData.start_date || undefined,
          end_date: formData.end_date || undefined,
          location_visibility: formData.location_visibility,
          location_visibility_override: formData.location_visibility_override,
        })
        toast.show('Project created successfully', { variant: 'success' })
        router.push(ROUTES.OFFICE.CMS.PROJECTS.path)
      } else if (projectId) {
        await updateMutation.mutateAsync({
          id: projectId,
          name: formData.name,
          description: formData.description || null,
          status: formData.status,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          location_visibility: formData.location_visibility,
          location_visibility_override: formData.location_visibility_override,
        })
        toast.show('Project updated successfully', { variant: 'success' })
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
    <YStack gap="$4" p="$4" style={{ maxWidth: 800 }} mx="auto">
      <Text fontSize="$8" fontWeight="600">
        {mode === 'create' ? 'Create Project' : 'Edit Project'}
      </Text>

      <Card p="$4" gap="$4">
        <YStack gap="$4">
          <YStack gap="$2">
            <Text fontWeight="600">Organization</Text>
            {organizationsData?.organizations && (
              <ResponsiveSelect
                value={formData.organization_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, organization_id: value }))
                }
                placeholder="Select organization"
                options={organizationsData.organizations.map((org: { id: string; name: string }) => ({
                  value: org.id,
                  label: org.name,
                }))}
              />
            )}
          </YStack>

          <YStack gap="$2">
            <Text fontWeight="600">Project Name *</Text>
            <Input
              value={formData.name}
              onChangeText={(value) => setFormData((prev) => ({ ...prev, name: value }))}
              placeholder="Enter project name"
            />
          </YStack>

          <YStack gap="$2">
            <Text fontWeight="600">Description</Text>
            <TextArea
              value={formData.description}
              onChangeText={(value) => setFormData((prev) => ({ ...prev, description: value }))}
              placeholder="Enter project description"
              style={{ minHeight: 100 }}
            />
          </YStack>

          <XStack gap="$4">
            <YStack gap="$2" flex={1}>
              <Text fontWeight="600">Status</Text>
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
            </YStack>

            <YStack gap="$2" flex={1}>
              <Text fontWeight="600">Start Date</Text>
              <Input
                value={formData.start_date}
                onChangeText={(value) => setFormData((prev) => ({ ...prev, start_date: value }))}
                placeholder="YYYY-MM-DD"
              />
            </YStack>

            <YStack gap="$2" flex={1}>
              <Text fontWeight="600">End Date</Text>
              <Input
                value={formData.end_date}
                onChangeText={(value) => setFormData((prev) => ({ ...prev, end_date: value }))}
                placeholder="YYYY-MM-DD"
              />
            </YStack>
          </XStack>

          <Card p="$4" bg="$yellow2" borderColor="$yellow8" borderWidth={1}>
            <YStack gap="$4">
              <Text fontWeight="600">Location Visibility Settings</Text>

              <XStack gap="$2" items="center">
                <Switch
                  checked={formData.location_visibility_override}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, location_visibility_override: checked }))
                  }
                />
                <Text>Override organization's global setting</Text>
              </XStack>

              {formData.location_visibility_override && (
                <YStack gap="$2" p="$2" bg="$yellow3" rounded="$2">
                  <Text fontSize="$2" color="$yellow11">
                    ⚠️ This overrides your organization's global setting
                  </Text>
                </YStack>
              )}

              <YStack gap="$2">
                <Text fontWeight="600">Visibility Level</Text>
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
                <Text fontSize="$2" color="$gray10">
                  {formData.location_visibility === 'public' && 'Anyone can see exact locations'}
                  {formData.location_visibility === 'authenticated' &&
                    'Only logged-in users see exact locations'}
                  {formData.location_visibility === 'organization_only' &&
                    'Only organization members see exact locations'}
                  {formData.location_visibility === 'private' &&
                    'Only project team and admins see exact locations'}
                </Text>
              </YStack>
            </YStack>
          </Card>

          <XStack gap="$4" justify="flex-end">
            <Button variant="outlined" onPress={() => router.back()} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              theme="blue"
              onPress={handleSubmit}
              disabled={isLoading || !formData.name || !formData.organization_id}
            >
              {isLoading ? <Spinner /> : mode === 'create' ? 'Create Project' : 'Save Changes'}
            </Button>
          </XStack>
        </YStack>
      </Card>
    </YStack>
  )
}
