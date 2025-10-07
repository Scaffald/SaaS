import { useState, useEffect } from 'react'
import { YStack, XStack, Text, Input, Button, Spinner, ScrollView } from '@app/ui'
import { TextArea, Adapt, Sheet, Select } from 'tamagui'
import { api } from '@app/core/utils/api'
import { useToastController } from '@tamagui/toast'
import { useRouter } from 'expo-router'
import { useAllOrganizations } from '@app/core/utils/useAllOrganizations'
import { Check, ChevronDown } from '@tamagui/lucide-icons'

type JobFormData = {
  title: string
  description: string
  organization_id: string
  employment_type?: string
  remote_option?: string
  location?: string
  pay_range_min_cents?: number
  pay_range_max_cents?: number
  pay_range_type?: string
  position_level?: string
}

type JobFormProps = {
  mode: 'create' | 'edit'
  jobId?: string
  initialData?: Partial<JobFormData>
  onSuccess?: () => void
}

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temp', label: 'Temporary' },
  { value: 'intern', label: 'Internship' },
]

const REMOTE_OPTIONS = [
  { value: 'on_site', label: 'On-Site' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'remote', label: 'Remote' },
]

const PAY_RANGE_TYPES = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'salary', label: 'Salary' },
  { value: 'contract', label: 'Contract' },
  { value: 'project', label: 'Project' },
]

export function JobForm({ mode, jobId, initialData, onSuccess }: JobFormProps) {
  const router = useRouter()
  const toast = useToastController()
  const { data: organizationsData } = useAllOrganizations()

  const [formData, setFormData] = useState<JobFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    organization_id: initialData?.organization_id || '',
    employment_type: initialData?.employment_type,
    remote_option: initialData?.remote_option,
    location: initialData?.location || '',
    pay_range_min_cents: initialData?.pay_range_min_cents,
    pay_range_max_cents: initialData?.pay_range_max_cents,
    pay_range_type: initialData?.pay_range_type,
    position_level: initialData?.position_level || '',
  })

  // Auto-select organization if only one available
  useEffect(() => {
    if (
      organizationsData?.organizations &&
      organizationsData.organizations.length === 1 &&
      !formData.organization_id
    ) {
      const orgId = organizationsData.organizations[0].id
      if (orgId) {
        setFormData((prev) => ({
          ...prev,
          organization_id: orgId,
        }))
      }
    }
  }, [organizationsData, formData.organization_id])

  const createJob = api.office.createJob.useMutation({
    onSuccess: () => {
      toast.show('Job created successfully', { variant: 'success' })
      onSuccess?.()
      router.back()
    },
    onError: (error: Error) => {
      toast.show(`Error: ${error.message}`, { variant: 'error' })
    },
  })

  const updateJob = api.office.updateJob.useMutation({
    onSuccess: () => {
      toast.show('Job updated successfully', { variant: 'success' })
      onSuccess?.()
      router.back()
    },
    onError: (error: Error) => {
      toast.show(`Error: ${error.message}`, { variant: 'error' })
    },
  })

  const handleSubmit = (asDraft = true) => {
    // Build submit data, excluding empty strings for optional enums
    const submitData: Record<string, unknown> = {
      title: formData.title,
      description: formData.description,
      organization_id: formData.organization_id,
      status: asDraft ? ('draft' as const) : ('open' as const),
    }

    // Only include optional fields if they have values
    if (formData.employment_type) submitData.employment_type = formData.employment_type
    if (formData.remote_option) submitData.remote_option = formData.remote_option
    if (formData.location) submitData.location = formData.location
    if (formData.pay_range_min_cents) submitData.pay_range_min_cents = formData.pay_range_min_cents
    if (formData.pay_range_max_cents) submitData.pay_range_max_cents = formData.pay_range_max_cents
    if (formData.pay_range_type) submitData.pay_range_type = formData.pay_range_type
    if (formData.position_level) submitData.position_level = formData.position_level

    if (mode === 'create') {
      createJob.mutate(submitData)
    } else if (jobId) {
      updateJob.mutate({ id: jobId, ...submitData })
    }
  }

  const isLoading = createJob.isPending || updateJob.isPending
  const organizations = organizationsData?.organizations || []

  type Organization = { id: string; name: string; slug: string; owner_user_id: string | null }

  return (
    <ScrollView>
      <YStack gap="$4" p="$4">
        {/* Organization Selector */}
        <YStack gap="$2">
          <Text fontWeight="600">Organization *</Text>
          <Select
            value={formData.organization_id}
            onValueChange={(value: string) => setFormData({ ...formData, organization_id: value })}
          >
            <Select.Trigger iconAfter={ChevronDown}>
              <Select.Value placeholder="Select organization" />
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
              <Select.ScrollUpButton />
              <Select.Viewport>
                <Select.Group>
                  <Select.Label>Organizations</Select.Label>
                  {organizations.map((org: Organization, i: number) => (
                    <Select.Item key={org.id} index={i} value={org.id}>
                      <Select.ItemText>{org.name}</Select.ItemText>
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

        {/* Title */}
        <YStack gap="$2">
          <Text fontWeight="600">Job Title *</Text>
          <Input
            placeholder="e.g. Senior Construction Manager"
            value={formData.title}
            onChangeText={(text: string) => setFormData({ ...formData, title: text })}
            disabled={isLoading}
          />
        </YStack>

        {/* Description */}
        <YStack gap="$2">
          <Text fontWeight="600">Description *</Text>
          <TextArea
            placeholder="Describe the job role, responsibilities, and requirements..."
            value={formData.description}
            onChangeText={(text: string) => setFormData({ ...formData, description: text })}
            disabled={isLoading}
            height={150}
          />
        </YStack>

        {/* Employment Type */}
        <YStack gap="$2">
          <Text fontWeight="600">Employment Type</Text>
          <Select
            value={formData.employment_type || ''}
            onValueChange={(value: string) =>
              setFormData({ ...formData, employment_type: value || undefined })
            }
          >
            <Select.Trigger iconAfter={ChevronDown}>
              <Select.Value placeholder="Select employment type" />
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
              <Select.ScrollUpButton />
              <Select.Viewport>
                <Select.Group>
                  <Select.Label>Employment Type</Select.Label>
                  {EMPLOYMENT_TYPES.map((type, i) => (
                    <Select.Item key={type.value} index={i} value={type.value}>
                      <Select.ItemText>{type.label}</Select.ItemText>
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

        {/* Remote Option */}
        <YStack gap="$2">
          <Text fontWeight="600">Work Location</Text>
          <Select
            value={formData.remote_option || ''}
            onValueChange={(value: string) =>
              setFormData({ ...formData, remote_option: value || undefined })
            }
          >
            <Select.Trigger iconAfter={ChevronDown}>
              <Select.Value placeholder="Select work location type" />
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
              <Select.ScrollUpButton />
              <Select.Viewport>
                <Select.Group>
                  <Select.Label>Work Location</Select.Label>
                  {REMOTE_OPTIONS.map((option, i) => (
                    <Select.Item key={option.value} index={i} value={option.value}>
                      <Select.ItemText>{option.label}</Select.ItemText>
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

        {/* Location */}
        <YStack gap="$2">
          <Text fontWeight="600">Location *</Text>
          <Input
            placeholder="e.g. San Francisco, CA"
            value={formData.location}
            onChangeText={(text: string) => setFormData({ ...formData, location: text })}
            disabled={isLoading}
          />
        </YStack>

        {/* Pay Range */}
        <YStack gap="$2">
          <Text fontWeight="600">Pay Range</Text>
          <XStack gap="$2">
            <YStack gap="$2" flex={1}>
              <Text fontSize="$2">Min ($)</Text>
              <Input
                placeholder="Min"
                keyboardType="numeric"
                value={
                  formData.pay_range_min_cents
                    ? (formData.pay_range_min_cents / 100).toString()
                    : ''
                }
                onChangeText={(text: string) => {
                  const value = Number.parseFloat(text) || 0
                  setFormData({ ...formData, pay_range_min_cents: Math.round(value * 100) })
                }}
                disabled={isLoading}
              />
            </YStack>
            <YStack gap="$2" flex={1}>
              <Text fontSize="$2">Max ($)</Text>
              <Input
                placeholder="Max"
                keyboardType="numeric"
                value={
                  formData.pay_range_max_cents
                    ? (formData.pay_range_max_cents / 100).toString()
                    : ''
                }
                onChangeText={(text: string) => {
                  const value = Number.parseFloat(text) || 0
                  setFormData({ ...formData, pay_range_max_cents: Math.round(value * 100) })
                }}
                disabled={isLoading}
              />
            </YStack>
          </XStack>
          <Select
            value={formData.pay_range_type || ''}
            onValueChange={(value: string) =>
              setFormData({ ...formData, pay_range_type: value || undefined })
            }
          >
            <Select.Trigger iconAfter={ChevronDown}>
              <Select.Value placeholder="Select pay range type" />
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
              <Select.ScrollUpButton />
              <Select.Viewport>
                <Select.Group>
                  <Select.Label>Pay Range Type</Select.Label>
                  {PAY_RANGE_TYPES.map((type, i) => (
                    <Select.Item key={type.value} index={i} value={type.value}>
                      <Select.ItemText>{type.label}</Select.ItemText>
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

        {/* Position Level */}
        <YStack gap="$2">
          <Text fontWeight="600">Position Level</Text>
          <Input
            placeholder="e.g. Senior, Mid-Level, Entry Level"
            value={formData.position_level}
            onChangeText={(text: string) => setFormData({ ...formData, position_level: text })}
            disabled={isLoading}
          />
        </YStack>

        {/* Actions */}
        <XStack gap="$3" pt="$4">
          <Button flex={1} variant="outlined" onPress={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            flex={1}
            onPress={() => handleSubmit(true)}
            disabled={
              isLoading || !formData.title || !formData.description || !formData.organization_id
            }
          >
            {isLoading && <Spinner />}
            {!isLoading && 'Save as Draft'}
          </Button>
          <Button
            flex={1}
            themeInverse
            onPress={() => handleSubmit(false)}
            disabled={
              isLoading ||
              !formData.title ||
              !formData.description ||
              !formData.location ||
              !formData.organization_id
            }
          >
            {isLoading && <Spinner />}
            {!isLoading && 'Publish'}
          </Button>
        </XStack>
      </YStack>
    </ScrollView>
  )
}
