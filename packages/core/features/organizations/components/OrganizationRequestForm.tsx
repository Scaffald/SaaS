import { useMemo } from 'react'
import { useToastController } from '@tamagui/toast'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Card,
  Input,
  Label,
  Text,
  TextArea,
  XStack,
  YStack,
} from 'tamagui'
import {
  organizationRequestSchema,
  type OrganizationRequest,
} from '@app/schemas'
import { api } from '@app/core/utils/api'
import { normalizeOrganizationSlug } from '@app/core/features/discover/utils/normalizeOrganizationSlug'
import { CheckCircle2, Loader2 } from '@tamagui/lucide-icons'

type OrganizationRequestFormProps = {
  defaultName?: string
  defaultSlug?: string
};

/**
 * OrganizationRequestForm
 * Collects additional details for dashboard organization submissions.
 */
export function OrganizationRequestForm({
  defaultName = '',
  defaultSlug = '',
}: OrganizationRequestFormProps) {
  const toast = useToastController()

  const form = useForm<OrganizationRequest>({
    resolver: zodResolver(organizationRequestSchema),
    mode: 'onChange',
    defaultValues: useMemo(
      () => ({
        name: defaultName,
        slug: normalizeOrganizationSlug(defaultSlug || defaultName),
        website: '',
        notes: '',
      }),
      [defaultName, defaultSlug]
    ),
  })

  const { control, handleSubmit, setValue, formState, watch } = form

  const slugValue = watch('slug')

  const createOrganizationRequestMutation =
    api.organizations.createOrganizationRequest.useMutation({
      onSuccess: ({ request }) => {
        toast.show('Request submitted', {
          message:
            'We received your organization details and will follow up after review.',
        })
        if (request?.slug) {
          setValue('slug', request.slug, { shouldValidate: false })
        }
      },
      onError: (error) => {
        toast.show('Unable to submit request', {
          message: error.message ?? 'Please try again shortly.',
        })
      },
    })

  const onSubmit = handleSubmit((values) => {
    createOrganizationRequestMutation.mutate(values)
  })

  const isSubmitting =
    createOrganizationRequestMutation.isLoading || formState.isSubmitting
  const submissionSucceeded = createOrganizationRequestMutation.isSuccess

  return (
    <YStack gap="$4">
      <YStack gap="$2">
        <Label
          htmlFor="organization-request-name"
          fontSize="$3"
          fontWeight="600"
          color="$color12"
        >
          Organization Name
        </Label>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Input
              id="organization-request-name"
              value={field.value}
              onChangeText={(value) => {
                field.onChange(value)
                if (!slugValue) {
                  setValue('slug', normalizeOrganizationSlug(value), {
                    shouldValidate: true,
                  })
                }
              }}
              placeholder="Acme Construction"
              autoCapitalize="words"
            />
          )}
        />
        {formState.errors.name ? (
          <Text fontSize="$2" color="$red10">
            {formState.errors.name.message}
          </Text>
        ) : null}
      </YStack>

      <YStack gap="$2">
        <Label
          htmlFor="organization-request-slug"
          fontSize="$3"
          fontWeight="600"
          color="$color12"
        >
          Preferred Slug
        </Label>
        <Controller
          control={control}
          name="slug"
          render={({ field }) => (
            <Input
              id="organization-request-slug"
              value={field.value}
              onChangeText={(value) => field.onChange(normalizeOrganizationSlug(value))}
              placeholder="acme-construction"
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
        />
        {formState.errors.slug ? (
          <Text fontSize="$2" color="$red10">
            {formState.errors.slug.message}
          </Text>
        ) : null}
      </YStack>

      <YStack gap="$2">
        <Label
          htmlFor="organization-request-website"
          fontSize="$3"
          fontWeight="600"
          color="$color12"
        >
          Website (optional)
        </Label>
        <Controller
          control={control}
          name="website"
          render={({ field }) => (
            <Input
              id="organization-request-website"
              value={field.value ?? ''}
              onChangeText={field.onChange}
              placeholder="https://example.com"
              autoCapitalize="none"
              keyboardType="url"
            />
          )}
        />
        {formState.errors.website ? (
          <Text fontSize="$2" color="$red10">
            {formState.errors.website.message}
          </Text>
        ) : null}
      </YStack>

      <YStack gap="$2">
        <Label
          htmlFor="organization-request-notes"
          fontSize="$3"
          fontWeight="600"
          color="$color12"
        >
          Notes for the review team (optional)
        </Label>
        <Controller
          control={control}
          name="notes"
          render={({ field }) => (
            <TextArea
              id="organization-request-notes"
              value={field.value ?? ''}
              onChangeText={field.onChange}
              placeholder="Share context or verification details that help us approve the organization quickly."
              rows={5}
            />
          )}
        />
        {formState.errors.notes ? (
          <Text fontSize="$2" color="$red10">
            {formState.errors.notes.message}
          </Text>
        ) : null}
      </YStack>

      <Button
        size="$4"
        theme="blue"
        icon={isSubmitting ? Loader2 : undefined}
        disabled={isSubmitting}
        onPress={onSubmit}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Organization Request'}
      </Button>

      {submissionSucceeded ? (
        <Card bordered theme="green" padding="$4" gap="$3">
          <XStack gap="$3" items="center">
            <CheckCircle2 size={20} color="$green10" />
            <Text fontSize="$4" fontWeight="700" color="$green10">
              Request submitted successfully
            </Text>
          </XStack>
          <Text fontSize="$3" color="$color11">
            We&apos;ve logged your request. Our team will review it and follow up if we need additional
            details.
          </Text>
        </Card>
      ) : null}
    </YStack>
  )
}


