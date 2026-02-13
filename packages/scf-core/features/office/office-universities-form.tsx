import { api } from '@scf/core/utils/api'
import { DashboardWidget } from '@unicornlove/beyond-ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Save, X } from 'lucide-react-native'
import { useToast } from '@unicornlove/beyond-ui'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Button, H4, Input, Spinner, Text, TextArea, Row, Stack } from '@unicornlove/beyond-ui'
import { z } from 'zod'

const universitySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Vanity URL is required'),
  country: z.string().min(1, 'Country is required'),
  alpha_two_code: z.string().length(2, 'Must be 2-letter country code'),
  state_province: z.string().optional(),
  domains: z.string().optional(),
  web_pages: z.string().optional(),
})

type UniversityFormData = z.infer<typeof universitySchema>

interface OfficeUniversitiesFormProps {
  selectedUniversity?: {
    id: string
    name: string
    slug: string
    country: string
    alpha_two_code: string
    state_province: string | null
    domains: string[]
    web_pages: string[]
    is_active: boolean
  } | null
  onUniversitySaved: () => void
  onCancel: () => void
}

/**
 * Office Universities Form Component
 * Form for creating and editing universities in the catalog
 */
export function OfficeUniversitiesForm({
  selectedUniversity,
  onUniversitySaved,
  onCancel,
}: OfficeUniversitiesFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<UniversityFormData>({
    resolver: zodResolver(universitySchema),
    defaultValues: {
      name: '',
      slug: '',
      country: '',
      alpha_two_code: '',
      state_province: '',
      domains: '',
      web_pages: '',
    },
  })

  // Mutations
  const createMutation = api.office.universities.createUniversity.useMutation({
    onSuccess: () => {
      toast.show({
        title: 'Success',
        message: 'University created successfully',
        variant: 'success',
      })
      reset()
      onUniversitySaved()
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create university'
      toast.show({
        title: 'Error',
        message: errorMessage,
        variant: 'error',
      })
    },
  })

  const updateMutation = api.office.universities.updateUniversity.useMutation({
    onSuccess: () => {
      toast.show({
        title: 'Success',
        message: 'University updated successfully',
        variant: 'success',
      })
      onUniversitySaved()
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update university'
      toast.show({
        title: 'Error',
        message: errorMessage,
        variant: 'error',
      })
    },
  })

  // Load selected university data
  useEffect(() => {
    if (selectedUniversity) {
      reset({
        name: selectedUniversity.name,
        slug: selectedUniversity.slug,
        country: selectedUniversity.country,
        alpha_two_code: selectedUniversity.alpha_two_code,
        state_province: selectedUniversity.state_province || '',
        domains: selectedUniversity.domains.join(', '),
        web_pages: selectedUniversity.web_pages.join(', '),
      })
    }
  }, [selectedUniversity, reset])

  // Auto-generate slug from name
  const handleNameChange = (name: string, onChange: (value: string) => void) => {
    onChange(name)
    if (!selectedUniversity) {
      // Only auto-generate slug for new universities
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      setValue('slug', slug, { shouldValidate: true })
    }
  }

  const onSubmit = async (data: UniversityFormData) => {
    setIsLoading(true)
    try {
      // Parse comma-separated values into arrays
      const domains = data.domains
        ? data.domains
            .split(',')
            .map((d) => d.trim())
            .filter(Boolean)
        : []
      const web_pages = data.web_pages
        ? data.web_pages
            .split(',')
            .map((w) => w.trim())
            .filter(Boolean)
        : []

      const payload = {
        name: data.name,
        slug: data.slug,
        country: data.country,
        alpha_two_code: data.alpha_two_code.toUpperCase(),
        state_province: data.state_province || undefined,
        domains,
        web_pages,
        metadata: {},
      }

      if (selectedUniversity) {
        await updateMutation.mutateAsync({
          id: selectedUniversity.id,
          ...payload,
        })
      } else {
        await createMutation.mutateAsync(payload)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const isEditing = !!selectedUniversity

  return (
    <DashboardWidget>
      <Stack gap={16} padding="md">
        <Row justify="space-between" align="center">
          <H4>{isEditing ? 'Edit University' : 'New University'}</H4>
          {isEditing && (
            <Button
              size="xs"
              variant="outline"
              onPress={onCancel}
              icon={X}
              data-testid="cancel-button"
            >
              Cancel
            </Button>
          )}
        </Row>

        <Stack gap={16}>
          {/* Name */}
          <Stack gap={8}>
            <Text>
              Name <Text color="$red10">*</Text>
            </Text>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  data-testid="university-name-input"
                  placeholder="e.g. Harvard University"
                  value={field.value}
                  onChangeText={(text) => handleNameChange(text, field.onChange)}
                  borderColor={errors.name ? '$red8' : '$borderColor'}
                />
              )}
            />
            {errors.name && (
              <Text data-testid="name-error" color="$red10">
                {errors.name.message}
              </Text>
            )}
          </Stack>

          {/* Vanity URL */}
          <Stack gap={8}>
            <Text>
              Vanity URL <Text color="$red10">*</Text>
            </Text>
            <Text color="$gray11">URL-friendly username (auto-generated from name)</Text>
            <Controller
              name="slug"
              control={control}
              render={({ field }) => (
                <Input
                  data-testid="university-slug-input"
                  placeholder="e.g. harvard-university"
                  value={field.value}
                  onChangeText={field.onChange}
                  borderColor={errors.slug ? '$red8' : '$borderColor'}
                />
              )}
            />
            {errors.slug && (
              <Text data-testid="slug-error" color="$red10">
                {errors.slug.message}
              </Text>
            )}
          </Stack>

          {/* Country */}
          <Stack gap={8}>
            <Text>
              Country <Text color="$red10">*</Text>
            </Text>
            <Controller
              name="country"
              control={control}
              render={({ field }) => (
                <Input
                  data-testid="university-country-input"
                  placeholder="e.g. United States"
                  value={field.value}
                  onChangeText={field.onChange}
                  borderColor={errors.country ? '$red8' : '$borderColor'}
                />
              )}
            />
            {errors.country && (
              <Text data-testid="country-error" color="$red10">
                {errors.country.message}
              </Text>
            )}
          </Stack>

          {/* Alpha Two Code */}
          <Stack gap={8}>
            <Text>
              Country Code <Text color="$red10">*</Text>
            </Text>
            <Text color="$gray11">2-letter ISO country code (e.g. US, CA, GB)</Text>
            <Controller
              name="alpha_two_code"
              control={control}
              render={({ field }) => (
                <Input
                  data-testid="university-country-code-input"
                  placeholder="e.g. US"
                  value={field.value}
                  onChangeText={(text) => field.onChange(text.toUpperCase())}
                  borderColor={errors.alpha_two_code ? '$red8' : '$borderColor'}
                  maxLength={2}
                />
              )}
            />
            {errors.alpha_two_code && (
              <Text data-testid="country-code-error" color="$red10">
                {errors.alpha_two_code.message}
              </Text>
            )}
          </Stack>

          {/* State/Province */}
          <Stack gap={8}>
            <Text>State/Province</Text>
            <Text color="$gray11">Optional state or province (e.g. Massachusetts, Ontario)</Text>
            <Controller
              name="state_province"
              control={control}
              render={({ field }) => (
                <Input
                  data-testid="university-state-input"
                  placeholder="e.g. Massachusetts"
                  value={field.value}
                  onChangeText={field.onChange}
                />
              )}
            />
          </Stack>

          {/* Domains */}
          <Stack gap={8}>
            <Text>Domains</Text>
            <Text color="$gray11">Email domains (comma-separated, e.g. harvard.edu, hbs.edu)</Text>
            <Controller
              name="domains"
              control={control}
              render={({ field }) => (
                <TextArea
                  data-testid="university-domains-input"
                  placeholder="e.g. harvard.edu, hbs.edu"
                  value={field.value}
                  onChangeText={field.onChange}
                  minHeight={60}
                />
              )}
            />
          </Stack>

          {/* Web Pages */}
          <Stack gap={8}>
            <Text>Web Pages</Text>
            <Text color="$gray11">Official websites (comma-separated URLs)</Text>
            <Controller
              name="web_pages"
              control={control}
              render={({ field }) => (
                <TextArea
                  data-testid="university-webpages-input"
                  placeholder="e.g. https://www.harvard.edu, https://www.hbs.edu"
                  value={field.value}
                  onChangeText={field.onChange}
                  minHeight={60}
                />
              )}
            />
          </Stack>

          {/* Submit Button */}
          <Row justify="flex-end" paddingTop={16} gap={8}>
            {isEditing && (
              <Button
                variant="outline"
                onPress={onCancel}
                disabled={isLoading}
                data-testid="cancel-button"
              >
                Cancel
              </Button>
            )}
            <Button
              data-testid="save-button"
              onPress={handleSubmit(onSubmit)}
              disabled={!isDirty || isLoading}
              opacity={!isDirty || isLoading ? 0.5 : 1}
              icon={isLoading ? <Spinner /> : isEditing ? Save : Plus}
            >
              {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </Row>
        </Stack>
      </Stack>
    </DashboardWidget>
  )
}
