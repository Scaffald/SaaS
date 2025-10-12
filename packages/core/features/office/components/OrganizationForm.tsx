import { useState, useEffect } from 'react'
import { YStack, XStack, Text, Button, Input, H4, Spinner, Select } from 'tamagui'
import { useRouter } from 'expo-router'
import { useToastController } from '@tamagui/toast'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { organizationCreateSchema, type OrganizationCreate } from '@app/schemas'
import { api } from '@app/core/utils/api'
import { Check, ChevronDown } from '@tamagui/lucide-icons'
import { supabase } from '@app/core/utils/supabase/client'

type OrganizationFormData = OrganizationCreate

interface OrganizationFormProps {
  mode: 'create' | 'edit'
  organizationId?: string
  initialData?: Partial<OrganizationFormData>
}

export function OrganizationForm({ mode, organizationId, initialData }: OrganizationFormProps) {
  const router = useRouter()
  const toast = useToastController()
  const [isLoading, setIsLoading] = useState(false)
  const [industries, setIndustries] = useState<Array<{ id: string; name: string }>>([])

  // Fetch industries from Supabase
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const { data, error } = await supabase.from('industries').select('id, name').order('name')

        if (error) throw error
        setIndustries(data || [])
      } catch (error) {
        console.error('Failed to fetch industries:', error)
        toast.show('Error', { message: 'Failed to load industries' })
      }
    }

    fetchIndustries()
  }, [toast])

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationCreateSchema),
    defaultValues: initialData || {
      name: '',
      slug: '',
      industry_id: undefined,
      logo_url: '',
      visibility: 'public',
      address: undefined,
    },
  })

  // Auto-generate slug from name
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleNameChange = (value: string) => {
    setValue('name', value, { shouldValidate: true })
    // Only auto-generate slug in create mode if slug is empty
    if (mode === 'create' && !watch('slug')) {
      setValue('slug', generateSlug(value))
    }
  }

  const createMutation = api.office.createOrganization.useMutation({
    onSuccess: () => {
      toast.show('Success', { message: 'Organization created successfully' })
      router.push('/office/organizations')
    },
    onError: (error: Error) => {
      toast.show('Error', { message: error.message || 'Failed to create organization' })
    },
  })

  const updateMutation = api.office.updateOrganization.useMutation({
    onSuccess: () => {
      toast.show('Success', { message: 'Organization updated successfully' })
      router.push('/office/organizations')
    },
    onError: (error: Error) => {
      toast.show('Error', { message: error.message || 'Failed to update organization' })
    },
  })

  const onSubmit = async (data: OrganizationFormData) => {
    setIsLoading(true)
    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(data)
      } else {
        await updateMutation.mutateAsync({ id: organizationId!, ...data })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <YStack flex={1} bg="$background" p="$4" gap="$4">
      <H4>{mode === 'create' ? 'Create Organization' : 'Edit Organization'}</H4>

      {/* Name */}
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <YStack gap="$2">
            <Text fontWeight="600">Name *</Text>
            <Input
              value={field.value}
              onChangeText={handleNameChange}
              placeholder="Enter organization name"
              borderColor={errors.name ? '$red8' : '$borderColor'}
            />
            {errors.name && (
              <Text color="$red10" fontSize="$2">
                {errors.name.message}
              </Text>
            )}
          </YStack>
        )}
      />

      {/* Slug */}
      <Controller
        name="slug"
        control={control}
        render={({ field }) => (
          <YStack gap="$2">
            <Text fontWeight="600">Slug *</Text>
            <Input
              value={field.value}
              onChangeText={field.onChange}
              placeholder="organization-slug"
              borderColor={errors.slug ? '$red8' : '$borderColor'}
            />
            <Text fontSize="$2" opacity={0.7}>
              URL-friendly identifier (lowercase, hyphens only)
            </Text>
            {errors.slug && (
              <Text color="$red10" fontSize="$2">
                {errors.slug.message}
              </Text>
            )}
          </YStack>
        )}
      />

      {/* Industry */}
      <Controller
        name="industry_id"
        control={control}
        render={({ field }) => {
          const selectedIndustry = industries.find(
            (i: { id: string; name: string }) => i.id === field.value
          )
          return (
            <YStack gap="$2">
              <Text fontWeight="600">Industry</Text>
              <Select
                value={field.value || ''}
                onValueChange={field.onChange}
                disablePreventBodyScroll
              >
                <Select.Trigger iconAfter={ChevronDown}>
                  <Select.Value placeholder="Select an industry">
                    {selectedIndustry ? selectedIndustry.name : 'Select an industry'}
                  </Select.Value>
                </Select.Trigger>

                <Select.Content zIndex={200000}>
                  <Select.ScrollUpButton />
                  <Select.Viewport>
                    <Select.Group>
                      <Select.Label>Industries</Select.Label>
                      <Select.Item index={0} value="">
                        <Select.ItemText>None</Select.ItemText>
                        <Select.ItemIndicator>
                          <Check size={16} />
                        </Select.ItemIndicator>
                      </Select.Item>
                      {industries.map((industry: { id: string; name: string }, index: number) => (
                        <Select.Item key={industry.id} index={index + 1} value={industry.id}>
                          <Select.ItemText>{industry.name}</Select.ItemText>
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
              {errors.industry_id && (
                <Text color="$red10" fontSize="$2">
                  {errors.industry_id.message}
                </Text>
              )}
            </YStack>
          )
        }}
      />

      {/* Logo URL */}
      <Controller
        name="logo_url"
        control={control}
        render={({ field }) => (
          <YStack gap="$2">
            <Text fontWeight="600">Logo URL</Text>
            <Input
              value={field.value || ''}
              onChangeText={field.onChange}
              placeholder="https://example.com/logo.png"
              borderColor={errors.logo_url ? '$red8' : '$borderColor'}
            />
            {errors.logo_url && (
              <Text color="$red10" fontSize="$2">
                {errors.logo_url.message}
              </Text>
            )}
          </YStack>
        )}
      />

      {/* Visibility */}
      <Controller
        name="visibility"
        control={control}
        render={({ field }) => (
          <YStack gap="$2">
            <Text fontWeight="600">Visibility</Text>
            <Select value={field.value} onValueChange={field.onChange} disablePreventBodyScroll>
              <Select.Trigger iconAfter={ChevronDown}>
                <Select.Value placeholder="Select visibility" />
              </Select.Trigger>

              <Select.Content zIndex={200000}>
                <Select.ScrollUpButton />
                <Select.Viewport>
                  <Select.Group>
                    <Select.Label>Visibility</Select.Label>
                    <Select.Item index={0} value="public">
                      <Select.ItemText>Public</Select.ItemText>
                      <Select.ItemIndicator>
                        <Check size={16} />
                      </Select.ItemIndicator>
                    </Select.Item>
                    <Select.Item index={1} value="private">
                      <Select.ItemText>Private</Select.ItemText>
                      <Select.ItemIndicator>
                        <Check size={16} />
                      </Select.ItemIndicator>
                    </Select.Item>
                  </Select.Group>
                </Select.Viewport>
                <Select.ScrollDownButton />
              </Select.Content>
            </Select>
            {errors.visibility && (
              <Text color="$red10" fontSize="$2">
                {errors.visibility.message}
              </Text>
            )}
          </YStack>
        )}
      />

      {/* Submit buttons */}
      <XStack justify="flex-end" gap="$2" mt="$4">
        <Button variant="outlined" onPress={() => router.back()} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onPress={handleSubmit(onSubmit)}
          disabled={!isDirty || isLoading}
          icon={isLoading ? <Spinner /> : undefined}
        >
          {isLoading ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
        </Button>
      </XStack>
    </YStack>
  )
}
