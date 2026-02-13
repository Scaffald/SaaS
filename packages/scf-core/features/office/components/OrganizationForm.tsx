import { ROUTES } from '@scf/core/constants/routes'
import { normalizeOrganizationSlug } from '@scf/core/features/discover/utils/normalizeOrganizationSlug'
import { OrganizationDeletionPanel } from '@scf/core/features/organizations/components/OrganizationDeletionPanel'
import { api } from '@scf/core/utils/api'
import { isSlugValid } from '@scf/core/utils/slugify'
import { supabase } from '@scf/core/utils/supabase/client'
import { organizationCreateSchema, type OrganizationCreate } from '@scf/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast, useThemeContext } from '@scaffald/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Button, Input, ScrollView, Spinner, Text, Row, Stack } from '@scaffald/ui'
import { ResponsiveSelect } from '@scaffald/ui'
import { OrganizationCreditsPanel } from '../payments/OrganizationCreditsPanel'
import { OrganizationPaymentMethodsPanel } from '../payments/OrganizationPaymentMethodsPanel'
import { OrganizationLocationsInput } from './OrganizationLocationsInput'
import { OrganizationProjectPrivacySettings } from './OrganizationProjectPrivacySettings'
import { colors } from '@scaffald/ui/tokens'

type OrganizationFormData = OrganizationCreate

interface OrganizationFormProps {
  mode: 'create' | 'edit'
  organizationId?: string
  initialData?: Partial<OrganizationFormData>
}

type SlugAvailabilityState =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available' }
  | { state: 'invalid'; message: string }
  | { state: 'taken'; message: string; suggestions?: string[] }
  | { state: 'error'; message: string }

export function OrganizationForm({ mode, organizationId, initialData }: OrganizationFormProps) {
  const { theme } = useThemeContext()
  const router = useRouter()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [industries, setIndustries] = useState<Array<{ id: string; name: string }>>([])
  const [slugStatus, setSlugStatus] = useState<SlugAvailabilityState>({ state: 'idle' })

  // Fetch industries from Supabase
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const { data, error } = await supabase
          .schema('core')
          .from('industries')
          .select('id, name')
          .order('name')

        if (error) throw error
        setIndustries(data || [])
      } catch (error) {
        console.error('Failed to fetch industries:', error)
        toast.show({
          title: 'Error',
          message: 'Failed to load industries',
          variant: 'error',
        })
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
    reset,
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationCreateSchema),
    defaultValues: initialData || {
      name: '',
      slug: '',
      industry_id: undefined,
      logo_url: '',
      visibility: 'public',
      address: undefined,
      locations: [{ name: '', address: {} }],
    },
  })
  const slugValue = watch('slug') || ''
  const initialSlug = initialData?.slug?.toLowerCase() ?? ''
  const slugNeedsValidation =
    Boolean(slugValue) && (mode === 'create' || slugValue.toLowerCase() !== initialSlug)
  const slugAvailabilityBlocksSubmit =
    slugNeedsValidation &&
    (slugStatus.state === 'checking' ||
      slugStatus.state === 'invalid' ||
      slugStatus.state === 'taken')
  const slugHasAvailabilityError = slugStatus.state === 'invalid' || slugStatus.state === 'taken'

  // Reset form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      reset(initialData)
    }
  }, [initialData, reset])

  const handleNameChange = (value: string) => {
    setValue('name', value, { shouldValidate: true })
    // Only auto-generate slug in create mode if slug is empty
    if (mode === 'create' && !slugValue) {
      setValue('slug', normalizeOrganizationSlug(value))
    }
  }

  useEffect(() => {
    if (!slugValue) {
      setSlugStatus({ state: 'idle' })
      return
    }

    const normalizedSlug = slugValue.toLowerCase()
    const slugMatchesOriginal = mode === 'edit' && normalizedSlug === initialSlug

    if (slugMatchesOriginal) {
      setSlugStatus({ state: 'available' })
      return
    }

    if (!isSlugValid(normalizedSlug)) {
      setSlugStatus({
        state: 'invalid',
        message:
          'Vanity URL must be 3-50 characters, lowercase letters, numbers, and single hyphens. Reserved words are not allowed.',
      })
      return
    }

    let isCancelled = false
    setSlugStatus({ state: 'checking' })
    const timeoutId = setTimeout(async () => {
      try {
        // Fetch using queryClient to check slug availability
        const result = await queryClient.fetchQuery({
          queryKey: [
            ['office', 'checkOrganizationSlug'],
            { input: { slug: normalizedSlug, organizationId } },
          ],
        })

        if (isCancelled) return

        if (result.available) {
          setSlugStatus({ state: 'available' })
          return
        }

        // Slug validation response type from tRPC router
        type SlugValidationResult = {
          available: boolean
          reason?: 'format' | 'reserved' | 'taken'
          message?: string
          suggestions?: string[]
          slug?: string
        }
        const validationResult = result as SlugValidationResult
        const reason = validationResult.reason ?? 'taken'
        const fallbackMessage =
          reason === 'reserved'
            ? 'This vanity URL is reserved for internal routes.'
            : reason === 'format'
              ? 'Vanity URL must be 3-50 characters, lowercase letters, numbers, and single hyphens.'
              : 'An organization with this vanity URL already exists.'

        setSlugStatus({
          state: reason === 'taken' ? 'taken' : 'invalid',
          message: validationResult.message ?? fallbackMessage,
          suggestions: validationResult.suggestions ?? [],
        })
      } catch (error) {
        if (isCancelled) return
        console.error('Failed to check slug availability', error)
        setSlugStatus({
          state: 'error',
          message: 'Unable to verify vanity URL availability. Please try again.',
        })
      }
    }, 400)

    return () => {
      isCancelled = true
      clearTimeout(timeoutId)
    }
  }, [slugValue, queryClient, organizationId, mode, initialSlug])

  const createMutation = api.office.createOrganization.useMutation({
    onSuccess: () => {
      toast.show({
        title: 'Success',
        message: 'Organization created successfully',
        variant: 'success',
      })
      router.push(ROUTES.OFFICE.CMS.ORGANIZATIONS.path)
    },
    onError: (error: unknown) => {
      toast.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create organization',
        variant: 'error',
      })
    },
  })

  const updateMutation = api.office.updateOrganization.useMutation({
    onSuccess: () => {
      toast.show({
        title: 'Success',
        message: 'Organization updated successfully',
        variant: 'success',
      })
      router.push(ROUTES.OFFICE.CMS.ORGANIZATIONS.path)
    },
    onError: (error: unknown) => {
      toast.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update organization',
        variant: 'error',
      })
    },
  })

  const onSubmit = async (data: OrganizationFormData) => {
    setIsLoading(true)
    try {
      if (mode === 'create') {
        // Form data is compatible with mutation input but has extra fields
        await createMutation.mutateAsync(
          data as unknown as Parameters<typeof createMutation.mutateAsync>[0]
        )
      } else {
        if (!organizationId) {
          throw new Error('Organization ID is required for update')
        }
        // Form data is compatible with mutation input but has extra fields
        await updateMutation.mutateAsync({ id: organizationId, ...data } as unknown as Parameters<
          typeof updateMutation.mutateAsync
        >[0])
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ScrollView
      flex={1}
      style={{ backgroundColor: colors.bg[theme].subtle }}
      padding="lg"
      showsVerticalScrollIndicator={false}
    >
      {/* Name */}
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <Stack gap={8}>
            <Text>Name *</Text>
            <Input
              testID="org-form-name"
              value={field.value}
              onChangeText={handleNameChange}
              placeholder="Enter organization name"
              borderColor={errors.name ? theme === "light" ? colors.error[300] : colors.error[700] : colors.border[theme].default}
            />
            {errors.name && (
              <Text data-testid="name-error" style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>
                {errors.name.message}
              </Text>
            )}
          </Stack>
        )}
      />

      {/* Vanity URL */}
      <Controller
        name="slug"
        control={control}
        render={({ field }) => (
          <Stack gap={8}>
            <Text>Vanity URL *</Text>
            <Input
              testID="org-form-slug"
              value={field.value}
              onChangeText={(value) => field.onChange(normalizeOrganizationSlug(value))}
              placeholder="organization-username"
              autoCapitalize="none"
              autoCorrect={false}
              borderColor={
                slugHasAvailabilityError || errors.slug
                  ? theme === "light" ? colors.error[300] : colors.error[700]
                  : colors.border[theme].default
              }
            />
            <Text opacity={0.7}>Lowercase, URL-friendly username (hyphens only)</Text>
            {errors.slug && (
              <Text data-testid="slug-error" style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>
                {errors.slug.message}
              </Text>
            )}
            {slugStatus.state === 'checking' && slugNeedsValidation && (
              <Row gap={8} align="center">
                <Spinner size="sm" />
                <Text style={{ color: colors.text[theme].secondary }}>
                  Checking availability...
                </Text>
              </Row>
            )}
            {slugStatus.state === 'available' && slugNeedsValidation && (
              <Text style={{ color: theme === "light" ? colors.green[700] : colors.green[300] }}>
                This vanity URL is available.
              </Text>
            )}
            {slugStatus.state === 'invalid' && (
              <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>{slugStatus.message}</Text>
            )}
            {slugStatus.state === 'taken' && (
              <Stack gap={8}>
                <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>{slugStatus.message}</Text>
                {slugStatus.suggestions?.length ? (
                  <Row gap={8} flexWrap="wrap">
                    {slugStatus.suggestions.map((suggestion) => (
                      <Button
                        key={suggestion}
                        size="sm"
                        variant="outline"
                        onPress={() => setValue('slug', suggestion, { shouldValidate: true })}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </Row>
                ) : null}
              </Stack>
            )}
            {slugStatus.state === 'error' && (
              <Text style={{ color: theme === "light" ? colors.yellow[700] : colors.yellow[300] }}>{slugStatus.message}</Text>
            )}
          </Stack>
        )}
      />

      {/* Industry */}
      <Controller
        name="industry_id"
        control={control}
        render={({ field }) => (
          <ResponsiveSelect
            value={field.value || ''}
            onValueChange={field.onChange}
            placeholder="Select an industry"
            label="Industry"
            testID="org-form-industry"
            error={errors.industry_id?.message}
            options={[
              { value: '', label: 'None' },
              ...industries.map((industry: { id: string; name: string }) => ({
                value: industry.id,
                label: industry.name,
              })),
            ]}
          />
        )}
      />

      {/* Logo URL */}
      <Controller
        name="logo_url"
        control={control}
        render={({ field }) => (
          <Stack gap={8}>
            <Text>Logo URL</Text>
            <Input
              testID="org-form-logo-url"
              value={field.value || ''}
              onChangeText={field.onChange}
              placeholder="https://example.com/logo.png"
              borderColor={
                errors.logo_url ? theme === "light" ? colors.error[300] : colors.error[700] : colors.border[theme].default
              }
            />
            {errors.logo_url && (
              <Text data-testid="logo-error" style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>
                {errors.logo_url.message}
              </Text>
            )}
          </Stack>
        )}
      />

      {/* Visibility */}
      <Controller
        name="visibility"
        control={control}
        render={({ field }) => (
          <Stack gap={8}>
            <Text>Visibility</Text>
            <ResponsiveSelect
              value={field.value}
              onValueChange={field.onChange}
              placeholder="Select visibility"
              label="Visibility"
              testID="org-form-visibility"
              options={[
                { value: 'public', label: 'Public' },
                { value: 'private', label: 'Private' },
              ]}
            />
            {errors.visibility && (
              <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>{errors.visibility.message}</Text>
            )}
          </Stack>
        )}
      />

      {/* Locations */}
      <Controller
        name="locations"
        control={control}
        render={({ field }) => (
          <Stack data-testid="org-form-locations">
            <OrganizationLocationsInput
              value={field.value}
              onChange={field.onChange}
              errors={errors.locations?.message}
              disabled={isLoading}
              provider="mapbox"
              apiKey={process.env.EXPO_PUBLIC_MAPBOX_TOKEN}
            />
          </Stack>
        )}
      />

      {/* Project Location Privacy - Only in edit mode */}
      {mode === 'edit' && organizationId && (
        <OrganizationProjectPrivacySettings organizationId={organizationId} />
      )}

      {/* Payment Methods - Only in edit mode */}
      {mode === 'edit' && organizationId && (
        <OrganizationPaymentMethodsPanel organizationId={organizationId} />
      )}

      {/* Account Credits - Only in edit mode */}
      {mode === 'edit' && organizationId && (
        <OrganizationCreditsPanel organizationId={organizationId} />
      )}

      {/* Account Deletion - Only in edit mode */}
      {mode === 'edit' && organizationId && (
        <OrganizationDeletionPanel organizationId={organizationId} />
      )}

      {/* Submit buttons */}
      <Row justify="flex-end" gap={8} marginTop={16}>
        <Button
          testID="org-form-cancel-btn"
          variant="outline"
          onPress={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          testID="org-form-save-btn"
          onPress={handleSubmit(onSubmit)}
          disabled={!isDirty || isLoading || slugAvailabilityBlocksSubmit}
          iconStart={isLoading ? <Spinner /> : undefined}
        >
          {isLoading ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
        </Button>
      </Row>
    </ScrollView>
  )
}
