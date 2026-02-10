import { api } from '@scf/core/utils/api'
import { Button, Input, ScrollView, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { useToast } from '@unicornlove/beyond-ui'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { TextArea } from '@unicornlove/beyond-ui'

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

export function JobFormSimple({ mode, jobId, initialData, onSuccess }: JobFormProps) {
  const router = useRouter()
  const toast = useToast()

  const [formData, setFormData] = useState<JobFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    organization_id: initialData?.organization_id || '',
    employment_type: initialData?.employment_type || '',
    remote_option: initialData?.remote_option || '',
    location: initialData?.location || '',
    pay_range_min_cents: initialData?.pay_range_min_cents,
    pay_range_max_cents: initialData?.pay_range_max_cents,
    pay_range_type: initialData?.pay_range_type || 'hourly',
    position_level: initialData?.position_level || '',
  })

  const createJob = api.office.createJob.useMutation({
    onSuccess: () => {
      toast.show({
          title: 'Job created successfully',
          variant: 'success',
        })
      onSuccess?.()
      router.back()
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.show({
          title: `Error: ${message}`,
          variant: 'error',
        })
    },
  })

  const updateJob = api.office.updateJob.useMutation({
    onSuccess: () => {
      toast.show({
          title: 'Job updated successfully',
          variant: 'success',
        })
      onSuccess?.()
      router.back()
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.show({
          title: `Error: ${message}`,
          variant: 'error',
        })
    },
  })

  const handleSubmit = (asDraft = true) => {
    const submitData = {
      ...formData,
      status: asDraft ? ('draft' as const) : ('open' as const),
    }

    if (mode === 'create') {
      // Form data is compatible with mutation input but has slightly different structure
      createJob.mutate(submitData as unknown as Parameters<typeof createJob.mutate>[0])
    } else if (jobId) {
      // Form data is compatible with mutation input but has slightly different structure
      updateJob.mutate({ id: jobId, ...submitData } as unknown as Parameters<
        typeof updateJob.mutate
      >[0])
    }
  }

  const isLoading = createJob.isPending || updateJob.isPending

  return (
    <ScrollView>
      <Stack gap="$4" padding="$4">
        {/* Title */}
        <Stack gap="$2">
          <Text fontWeight="600">Job Title *</Text>
          <Input
            placeholder="e.g. Senior Construction Manager"
            value={formData.title}
            onChangeText={(text: string) => setFormData({ ...formData, title: text })}
            disabled={isLoading}
          />
        </Stack>

        {/* Description */}
        <Stack gap="$2">
          <Text fontWeight="600">Description *</Text>
          <TextArea
            placeholder="Describe the job role, responsibilities, and requirements..."
            value={formData.description}
            onChangeText={(text: string) => setFormData({ ...formData, description: text })}
            disabled={isLoading}
            height={150}
          />
        </Stack>

        {/* Employment Type */}
        <Stack gap="$2">
          <Text fontWeight="600">Employment Type</Text>
          <Input
            placeholder="e.g. full_time, part_time, contract"
            value={formData.employment_type}
            onChangeText={(text: string) => setFormData({ ...formData, employment_type: text })}
            disabled={isLoading}
          />
        </Stack>

        {/* Remote Option */}
        <Stack gap="$2">
          <Text fontWeight="600">Work Location</Text>
          <Input
            placeholder="e.g. on_site, hybrid, remote"
            value={formData.remote_option}
            onChangeText={(text: string) => setFormData({ ...formData, remote_option: text })}
            disabled={isLoading}
          />
        </Stack>

        {/* Location */}
        <Stack gap="$2">
          <Text fontWeight="600">Location *</Text>
          <Input
            placeholder="e.g. San Francisco, CA"
            value={formData.location}
            onChangeText={(text: string) => setFormData({ ...formData, location: text })}
            disabled={isLoading}
          />
        </Stack>

        {/* Pay Range */}
        <Stack gap="$2">
          <Text fontWeight="600">Pay Range</Text>
          <Row gap="$2">
            <Stack gap="$2" flex={1}>
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
            </Stack>
            <Stack gap="$2" flex={1}>
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
            </Stack>
            <Stack gap="$2" flex={1}>
              <Text fontSize="$2">Type</Text>
              <Input
                placeholder="hourly/salary"
                value={formData.pay_range_type}
                onChangeText={(text: string) => setFormData({ ...formData, pay_range_type: text })}
                disabled={isLoading}
              />
            </Stack>
          </Row>
        </Stack>

        {/* Position Level */}
        <Stack gap="$2">
          <Text fontWeight="600">Position Level</Text>
          <Input
            placeholder="e.g. Senior, Mid-Level, Entry Level"
            value={formData.position_level}
            onChangeText={(text: string) => setFormData({ ...formData, position_level: text })}
            disabled={isLoading}
          />
        </Stack>

        {/* Actions */}
        <Row gap="$3" paddingTop="$4">
          <Button flex={1} variant="outlined" onPress={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            flex={1}
            onPress={() => handleSubmit(true)}
            disabled={isLoading || !formData.title || !formData.description}
          >
            {isLoading && <Spinner />}
            {!isLoading && 'Save as Draft'}
          </Button>
          <Button
            flex={1}
            themeInverse
            onPress={() => handleSubmit(false)}
            disabled={isLoading || !formData.title || !formData.description || !formData.location}
          >
            {isLoading && <Spinner />}
            {!isLoading && 'Publish'}
          </Button>
        </Row>
      </Stack>
    </ScrollView>
  )
}
