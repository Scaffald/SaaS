import { normalizeOrganizationSlug } from '@app/core/features/discover/utils/normalizeOrganizationSlug'
import { OrganizationDeletionPanel } from '@app/core/features/organizations/components/OrganizationDeletionPanel'
import { api } from '@app/core/utils/api'
import { isSlugValid } from '@app/core/utils/slugify'
import { supabase } from '@app/core/utils/supabase/client'
import { organizationCreateSchema } from '@app/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToastController } from '@tamagui/toast'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Button, Input, ScrollView, Spinner, Text, XStack, YStack } from 'tamagui'
import { ResponsiveSelect } from '@app/ui'
import { OrganizationCreditsPanel } from '../payments/OrganizationCreditsPanel'
import { OrganizationPaymentMethodsPanel } from '../payments/OrganizationPaymentMethodsPanel'
import { OrganizationLocationsInput } from './OrganizationLocationsInput'
import { OrganizationProjectPrivacySettings } from './OrganizationProjectPrivacySettings'

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
  const router = useRouter()
  const toast = useToastController()
  const utils = api.useUtils()
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
        const result = await utils.office.checkOrganizationSlug.fetch({
          slug: normalizedSlug,
          organizationId,
        })

        if (isCancelled) return

        if (result.available) {
          setSlugStatus({ state: 'available' })
          return
        }

        const reason = result.reason ?? 'taken'
        const fallbackMessage =
          reason === 'reserved'
            ? 'This vanity URL is reserved for internal routes.'
            : reason === 'format'
              ? 'Vanity URL must be 3-50 characters, lowercase letters, numbers, and single hyphens.'
              : 'An organization with this vanity URL already exists.'

        setSlugStatus({
          state: reason === 'taken' ? 'taken' : 'invalid',
          message: result.message ?? fallbackMessage,
          suggestions: result.suggestions,
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
  }, [slugValue, utils, organizationId, mode, initialSlug])

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
        if (!organizationId) {
          throw new Error('Organization ID is required for update')
        }
        await updateMutation.mutateAsync({ id: organizationId, ...data })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ScrollView flex={1} bg="$color2" p="$5" showsVerticalScrollIndicator={false}>
      {/* Name */}
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <YStack gap="$2">
            <Text fontWeight="600">Name *</Text>
            <Input
              testID="org-form-name"
              value={field.value}
              onChangeText={handleNameChange}
              placeholder="Enter organization name"
              borderColor={errors.name ? '$red8' : '$borderColor'}
            />
            {errors.name && (
              <Text data-testid="name-error" color="$red10" fontSize="$2">
                {errors.name.message}
              </Text>
            )}
          </YStack>
        )}
      />

      {/* Vanity URL */}
      <Controller
        name="slug"
        control={control}
        render={({ field }) => (
          <YStack gap="$2">
            <Text fontWeight="600">Vanity URL *</Text>
            <Input
              testID="org-form-slug"
              value={field.value}
              onChangeText={(value) => field.onChange(normalizeOrganizationSlug(value))}
              placeholder="organization-username"
              autoCapitalize="none"
              autoCorrect={false}
              borderColor={slugHasAvailabilityError || errors.slug ? '$red8' : '$borderColor'}
            />
            <Text fontSize="$2" opacity={0.7}>
              Lowercase, URL-friendly username (hyphens only)
            </Text>
            {errors.slug && (
              <Text data-testid="slug-error" color="$red10" fontSize="$2">
                {errors.slug.message}
              </Text>
            )}
            {slugStatus.state === 'checking' && slugNeedsValidation && (
              <XStack gap="$2" alignItems="center">
                <Spinner size="small" />
                <Text fontSize="$2" color="$color11">
                  Checking availability...
                </Text>
              </XStack>
            )}
            {slugStatus.state === 'available' && slugNeedsValidation && (
              <Text color="$green10" fontSize="$2">
                This vanity URL is available.
              </Text>
            )}
            {slugStatus.state === 'invalid' && (
              <Text color="$red10" fontSize="$2">
                {slugStatus.message}
              </Text>
            )}
            {slugStatus.state === 'taken' && (
              <YStack gap="$2">
                <Text color="$red10" fontSize="$2">
                  {slugStatus.message}
                </Text>
                {slugStatus.suggestions?.length ? (
                  <XStack gap="$2" flexWrap="wrap">
                    {slugStatus.suggestions.map((suggestion) => (
                      <Button
                        key={suggestion}
                        size="$2"
                        variant="outlined"
                        onPress={() => setValue('slug', suggestion, { shouldValidate: true })}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </XStack>
                ) : null}
              </YStack>
            )}
            {slugStatus.state === 'error' && (
              <Text color="$orange10" fontSize="$2">
                {slugStatus.message}
              </Text>
            )}
          </YStack>
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
          <YStack gap="$2">
            <Text fontWeight="600">Logo URL</Text>
            <Input
              testID="org-form-logo-url"
              value={field.value || ''}
              onChangeText={field.onChange}
              placeholder="https://example.com/logo.png"
              borderColor={errors.logo_url ? '$red8' : '$borderColor'}
            />
            {errors.logo_url && (
              <Text data-testid="logo-error" color="$red10" fontSize="$2">
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
              <Text color="$red10" fontSize="$2">
                {errors.visibility.message}
              </Text>
            )}
          </YStack>
        )}
      />

      {/* Locations */}
      <Controller
        name="locations"
        control={control}
        render={({ field }) => (
          <YStack data-testid="org-form-locations">
            <OrganizationLocationsInput
              value={field.value}
              onChange={field.onChange}
              errors={errors.locations?.message}
              disabled={isLoading}
              provider="mapbox"
              apiKey={process.env.EXPO_PUBLIC_MAPBOX_TOKEN}
            />
          </YStack>
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
      <XStack
        justify="flex-end"
        gap="$2"
        mt="$4"
        $sm={{ flexDirection: 'column' }}
        $md={{ flexDirection: 'row' }}
      >
        <Button
          testID="org-form-cancel-btn"
          variant="outlined"
          onPress={() => router.back()}
          disabled={isLoading}
          $sm={{ height: 44, width: '100%' }}
          $md={{ height: undefined, width: undefined }}
        >
          Cancel
        </Button>
        <Button
          testID="org-form-save-btn"
          onPress={handleSubmit(onSubmit)}
          disabled={
            !isDirty ||
            isLoading ||
            (slugNeedsValidation &&
              (slugStatus.state === 'checking' ||
                slugStatus.state === 'invalid' ||
                slugStatus.state === 'taken'))
          }
          icon={isLoading ? <Spinner /> : undefined}
          $sm={{ height: 44, width: '100%' }}
          $md={{ height: undefined, width: undefined }}
        >
          {isLoading ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
        </Button>
      </XStack>
    </ScrollView>
  )
}
