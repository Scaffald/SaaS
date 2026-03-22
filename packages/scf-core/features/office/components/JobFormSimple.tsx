import {
  useOfficeCreateJobMutation,
  useOfficeUpdateJobMutation,
} from '@scf/core/utils/jobs-sdk-hooks'
import { Button, Input, ScrollView, Spinner, Text, Row, Stack } from '@scaffald/ui'
import { useToast } from '@scaffald/ui'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { TextArea } from '@scaffald/ui'

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

  const createJob = useOfficeCreateJobMutation({
    onSuccess: () => {
      toast.show({
        title: 'Job created successfully',
        message: '',
        variant: 'success',
      })
      onSuccess?.()
      router.back()
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.show({
        title: `Error: ${message}`,
        message: '',
        variant: 'error',
      })
    },
  })

  const updateJob = useOfficeUpdateJobMutation({
    onSuccess: () => {
      toast.show({
        title: 'Job updated successfully',
        message: '',
        variant: 'success',
      })
      onSuccess?.()
      router.back()
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.show({
        title: `Error: ${message}`,
        message: '',
        variant: 'error',
      })
    },
  })

  const handleSubmit = (asDraft = true) => {
    const status = asDraft ? ('draft' as const) : ('open' as const)

    if (mode === 'create') {
      createJob.mutate({
        organization_id: formData.organization_id,
        title: formData.title,
        description: formData.description,
        status,
        employment_type: formData.employment_type as 'full_time' | 'part_time' | 'contract' | 'temp' | 'intern' | undefined,
        remote_option: formData.remote_option as 'on_site' | 'hybrid' | 'remote' | undefined,
        position_level: formData.position_level,
        location: formData.location,
        pay_range_min_cents: formData.pay_range_min_cents,
        pay_range_max_cents: formData.pay_range_max_cents,
        pay_range_type: formData.pay_range_type as 'hourly' | 'salary' | 'contract' | 'project' | undefined,
      })
    } else if (jobId) {
      updateJob.mutate({
        id: jobId,
        params: {
          title: formData.title,
          description: formData.description,
          status,
          employment_type: formData.employment_type as 'full_time' | 'part_time' | 'contract' | 'temp' | 'intern' | undefined,
          remote_option: formData.remote_option as 'on_site' | 'hybrid' | 'remote' | undefined,
          position_level: formData.position_level,
          location: formData.location,
          pay_range_min_cents: formData.pay_range_min_cents,
          pay_range_max_cents: formData.pay_range_max_cents,
          pay_range_type: formData.pay_range_type as 'hourly' | 'salary' | 'contract' | 'project' | undefined,
        },
      })
    }
  }

  const isLoading = createJob.isPending || updateJob.isPending

  return (
    <ScrollView>
      <Stack gap={16} padding="md">
        {/* Title */}
        <Stack gap={8}>
          <Text>Job Title *</Text>
          <Input
            placeholder="e.g. Senior Construction Manager"
            value={formData.title}
            onChangeText={(text: string) => setFormData({ ...formData, title: text })}
            disabled={isLoading}
          />
        </Stack>

        {/* Description */}
        <Stack gap={8}>
          <Text>Description *</Text>
          <TextArea
            placeholder="Describe the job role, responsibilities, and requirements..."
            value={formData.description}
            onChangeText={(text: string) => setFormData({ ...formData, description: text })}
            disabled={isLoading}
            style={{ minHeight: 150 }}
          />
        </Stack>

        {/* Employment Type */}
        <Stack gap={8}>
          <Text>Employment Type</Text>
          <Input
            placeholder="e.g. full_time, part_time, contract"
            value={formData.employment_type}
            onChangeText={(text: string) => setFormData({ ...formData, employment_type: text })}
            disabled={isLoading}
          />
        </Stack>

        {/* Remote Option */}
        <Stack gap={8}>
          <Text>Work Location</Text>
          <Input
            placeholder="e.g. on_site, hybrid, remote"
            value={formData.remote_option}
            onChangeText={(text: string) => setFormData({ ...formData, remote_option: text })}
            disabled={isLoading}
          />
        </Stack>

        {/* Location */}
        <Stack gap={8}>
          <Text>Location *</Text>
          <Input
            placeholder="e.g. San Francisco, CA"
            value={formData.location}
            onChangeText={(text: string) => setFormData({ ...formData, location: text })}
            disabled={isLoading}
          />
        </Stack>

        {/* Pay Range */}
        <Stack gap={8}>
          <Text>Pay Range</Text>
          <Row gap={8}>
            <Stack gap={8} flex={1}>
              <Text>Min ($)</Text>
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
            <Stack gap={8} flex={1}>
              <Text>Max ($)</Text>
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
            <Stack gap={8} flex={1}>
              <Text>Type</Text>
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
        <Stack gap={8}>
          <Text>Position Level</Text>
          <Input
            placeholder="e.g. Senior, Mid-Level, Entry Level"
            value={formData.position_level}
            onChangeText={(text: string) => setFormData({ ...formData, position_level: text })}
            disabled={isLoading}
          />
        </Stack>

        {/* Actions */}
        <Row gap={12} paddingTop={16}>
          <Button style={{ flex: 1 }} variant="outline" onPress={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            style={{ flex: 1 }}
            onPress={() => handleSubmit(true)}
            disabled={isLoading || !formData.title || !formData.description}
          >
            {isLoading && <Spinner variant="ios" />}
            {!isLoading && 'Save as Draft'}
          </Button>
          <Button
            style={{ flex: 1 }}
            variant="filled"
            color="primary"
            onPress={() => handleSubmit(false)}
            disabled={isLoading || !formData.title || !formData.description || !formData.location}
          >
            {isLoading && <Spinner variant="ios" />}
            {!isLoading && 'Publish'}
          </Button>
        </Row>
      </Stack>
    </ScrollView>
  )
}
