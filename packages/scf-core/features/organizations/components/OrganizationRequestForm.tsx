import { normalizeOrganizationSlug } from '@scf/core/features/discover/utils/normalizeOrganizationSlug'
import { api } from '@scf/core/utils/api'
import { type OrganizationRequest, organizationRequestSchema } from '@scf/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Loader2 } from 'lucide-react-native'
import { useToast } from '@unicornlove/beyond-ui'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Button, Card, Input, Label, Text, TextArea, Row, Stack } from '@unicornlove/beyond-ui'

interface OrganizationRequestSummary {
  id: string
  name: string
  slug: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

interface CreateOrganizationRequestResult {
  request: OrganizationRequestSummary | null
}

type OrganizationRequestFormProps = {
  defaultName?: string
  defaultSlug?: string
}

/**
 * OrganizationRequestForm
 * Collects additional details for dashboard organization submissions.
 */
export function OrganizationRequestForm({
  defaultName = '',
  defaultSlug = '',
}: OrganizationRequestFormProps) {
  const toast = useToast()

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

  const createOrganizationRequestMutation = api.organizations.createOrganizationRequest.useMutation(
    {
      onSuccess: ({ request }: CreateOrganizationRequestResult) => {
        toast.show({
          title: 'Request submitted',
          message: 'We received your organization details and will follow up after review.',
          variant: 'success',
        })
        if (request?.slug) {
          setValue('slug', request.slug, { shouldValidate: false })
        }
      },
      onError: (error: { message?: string }) => {
        toast.show({
          title: 'Unable to submit request',
          message: error?.message ?? 'Please try again shortly.',
          variant: 'error',
        })
      },
    }
  )

  const onSubmit = handleSubmit((values) => {
    createOrganizationRequestMutation.mutate(values)
  })

  const isSubmitting = createOrganizationRequestMutation.isPending || formState.isSubmitting
  const submissionSucceeded = createOrganizationRequestMutation.isSuccess

  return (
    <Stack gap={16}>
      <Stack gap={8}>
        <Label htmlFor="organization-request-name" color="gray">
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
          <Text color="$red10">
            {formState.errors.name.message}
          </Text>
        ) : null}
      </Stack>

      <Stack gap={8}>
        <Label htmlFor="organization-request-slug" color="gray">
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
          <Text color="$red10">
            {formState.errors.slug.message}
          </Text>
        ) : null}
      </Stack>

      <Stack gap={8}>
        <Label
          htmlFor="organization-request-website"
          color="gray"
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
          <Text color="$red10">
            {formState.errors.website.message}
          </Text>
        ) : null}
      </Stack>

      <Stack gap={8}>
        <Label htmlFor="organization-request-notes" color="gray">
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
          <Text color="$red10">
            {formState.errors.notes.message}
          </Text>
        ) : null}
      </Stack>

      <Button
        size={16}
        theme="info"
        icon={isSubmitting ? Loader2 : undefined}
        disabled={isSubmitting}
        onPress={onSubmit}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Organization Request'}
      </Button>

      {submissionSucceeded ? (
        <Card bordered theme="success" padding={16} gap={12}>
          <Row gap={12} align="center">
            <CheckCircle2 size={20} color="$green10" />
            <Text color="$green10">
              Request submitted successfully
            </Text>
          </Row>
          <Text color="gray">
            We&apos;ve logged your request. Our team will review it and follow up if we need
            additional details.
          </Text>
        </Card>
      ) : null}
    </Stack>
  )
}
