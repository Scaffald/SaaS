import {
  FormWrapper,
  FullscreenSpinner,
  Paragraph,
  SizableText,
  SubmitButton,
  Theme,
  YStack,
  useToastController,
} from '@app/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, type ReactNode } from 'react'
import { useFormContext, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { SchemaForm, formFields } from '@app/core/utils/SchemaForm'
import { Database } from '@app/supabase/types'
import { useSupabase } from '@app/core/utils/supabase/useSupabase'
import { useUser } from '@app/core/utils/useUser'
import { useRouter } from 'solito/router'

const EMPLOYEE_RANGE_OPTIONS = [
  { value: '1-10', name: '1-10 employees' },
  { value: '11-50', name: '11-50 employees' },
  { value: '51-200', name: '51-200 employees' },
  { value: '201-500', name: '201-500 employees' },
  { value: '501-1000', name: '501-1,000 employees' },
  { value: '1000+', name: '1,000+ employees' },
] as const

const REVENUE_RANGE_OPTIONS = [
  { value: 'lt-1m', name: 'Less than $1M' },
  { value: '1m-5m', name: '$1M - $5M' },
  { value: '5m-20m', name: '$5M - $20M' },
  { value: '20m-50m', name: '$20M - $50M' },
  { value: '50m-100m', name: '$50M - $100M' },
  { value: '100m+', name: '$100M+' },
] as const

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const OrganizationSchema = z
  .object({
    name: formFields.text.describe('Organization name // Acme Corp').min(2, 'Name is required'),
    slug: formFields.text.describe('Organization slug // acme-corp').min(1, 'Slug is required'),
    description: formFields.textarea
      .describe('About the organization // Tell us what Acme Corp does')
      .optional(),
    websiteUrl: formFields.text.describe('Website URL // https://www.acmecorp.com').optional(),
    industryId: formFields.select.describe('Industry').optional(),
    employeeCountRange: formFields.select.describe('Number of employees').optional(),
    annualRevenueRange: formFields.select.describe('Annual revenue').optional(),
    location: formFields.address.describe('Headquarters location').optional(),
  })
  .superRefine((value, ctx) => {
    if (value.slug && !slugRegex.test(value.slug)) {
      ctx.addIssue({
        code: 'custom',
        path: ['slug'],
        message: 'Use lowercase letters, numbers, and hyphens only.',
      })
    }

    if (value.websiteUrl && value.websiteUrl.trim().length > 0) {
      try {
        const url = new URL(value.websiteUrl)
        if (!url.protocol.startsWith('http')) {
          throw new Error('Invalid protocol')
        }
      } catch (_error) {
        ctx.addIssue({
          code: 'custom',
          path: ['websiteUrl'],
          message: 'Enter a valid URL starting with http:// or https://',
        })
      }
    }
  })

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)

export const CreateOrganizationScreen = () => {
  const { user, isPending } = useUser()

  if (isPending) {
    return <FullscreenSpinner />
  }

  if (!user) {
    return null
  }

  return <CreateOrganizationForm userId={user.id} />
}

type OrganizationFormValues = z.infer<typeof OrganizationSchema>

type SchemaFormPropConfig = Record<string, unknown>
type OrganizationFieldElements = {
  name: ReactNode
  slug: ReactNode
  description: ReactNode
  websiteUrl: ReactNode
  industryId: ReactNode
  employeeCountRange: ReactNode
  annualRevenueRange: ReactNode
  location: ReactNode
}
type SelectFieldProps = Parameters<typeof import('@app/ui')['SelectField']>[0]
type SelectFieldConfig = Pick<SelectFieldProps, 'options' | 'placeholder' | 'native' | 'size'>
type OrganizationSelectFieldProps = Partial<
  Record<'industryId' | 'employeeCountRange' | 'annualRevenueRange', SelectFieldConfig>
>

type OrganizationFormProps = {
  userId: string
}

const CreateOrganizationForm = ({ userId }: OrganizationFormProps) => {
  const supabase = useSupabase()
  const toast = useToastController()
  const queryClient = useQueryClient()
  const router = useRouter()

  const industriesQuery = useQuery({
    queryKey: ['industries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('industries')
        .select('id, name')
        .order('name', { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      return data ?? []
    },
  })

  const industryOptions = useMemo(
    () =>
      industriesQuery.data?.map((industry) => ({
        value: industry.id,
        name: industry.name,
      })) ?? [],
    [industriesQuery.data]
  )

  const selectFieldProps = useMemo<OrganizationSelectFieldProps>(
    () => ({
      industryId: {
        options: industryOptions,
        placeholder: industriesQuery.isPending ? 'Loading industries…' : 'Select an industry',
      },
      employeeCountRange: {
        options: EMPLOYEE_RANGE_OPTIONS.map((option) => ({ ...option })),
        placeholder: 'Choose a range',
      },
      annualRevenueRange: {
        options: REVENUE_RANGE_OPTIONS.map((option) => ({ ...option })),
        placeholder: 'Choose a range',
      },
    }),
    [industryOptions, industriesQuery.isPending]
  )

  const mutation = useMutation<
    Database['public']['Tables']['organizations']['Row'],
    Error,
    OrganizationFormValues
  >({
    mutationFn: async (values: OrganizationFormValues) => {
      const payload = {
        p_name: values.name.trim(),
        p_slug: slugify(values.slug),
        p_website_url: values.websiteUrl?.trim() ? values.websiteUrl.trim() : undefined,
        p_industry_id:
          values.industryId && values.industryId.length > 0 ? values.industryId : undefined,
        p_employee_count_range:
          values.employeeCountRange && values.employeeCountRange.length > 0
            ? values.employeeCountRange
            : undefined,
        p_annual_revenue_range:
          values.annualRevenueRange && values.annualRevenueRange.length > 0
            ? values.annualRevenueRange
            : undefined,
        p_description: values.description?.trim() ? values.description.trim() : undefined,
        p_address: values.location
          ? {
              street: values.location.street.trim(),
              zipCode: values.location.zipCode.trim(),
            }
          : null,
        p_visibility: 'public' as const,
      }

      const { data, error } = await supabase.rpc('create_organization', payload)

      if (error) {
        throw new Error(error.message)
      }

      if (!data) {
        throw new Error('No organization was returned from the server')
      }

      return data
    },
    onSuccess: async (organization) => {
      toast.show('Organization created', {
        message: `${organization.name} is ready to go.`,
      })

      await queryClient.invalidateQueries({ queryKey: ['organizations', userId] })
      router.push('/')
    },
    onError: (error) => {
      toast.show('Unable to create organization', {
        message: error.message,
      })
    },
  })

  return (
    <FormWrapper>
      <YStack gap="$2" px="$4">
        <SizableText size="$7" fontWeight="700">
          Create an organization
        </SizableText>
        <Paragraph size="$3" color="$gray11">
          Set up your company profile to invite team members, publish opportunities, and manage your
          crews.
        </Paragraph>
      </YStack>

      <SchemaForm
        schema={OrganizationSchema}
        defaultValues={{
          name: '',
          slug: '',
          description: '',
          websiteUrl: '',
          industryId: '',
          employeeCountRange: '',
          annualRevenueRange: '',
          location: undefined,
        }}
        props={selectFieldProps as SchemaFormPropConfig}
        onSubmit={(values) => mutation.mutate(values)}
        renderAfter={({ submit }) => (
          <Theme inverse>
            <SubmitButton onPress={() => submit()}>Create organization</SubmitButton>
          </Theme>
        )}
      >
        {renderOrganizationFields}
      </SchemaForm>
    </FormWrapper>
  )
}

type OrganizationFormFieldsProps = {
  fields: OrganizationFieldElements
}

const OrganizationFormFields = ({ fields }: OrganizationFormFieldsProps) => {
  const form = useFormContext<OrganizationFormValues>()
  useAutoSlug(form)

  const {
    name,
    slug,
    description,
    websiteUrl,
    industryId,
    employeeCountRange,
    annualRevenueRange,
    location,
  } = fields as OrganizationFieldElements

  return (
    <YStack gap="$4">
      {name}
      <YStack gap="$2">
        {slug}
        <Paragraph size="$2" color="$gray11">
          Your slug becomes part of the public organization URL and must be unique.
        </Paragraph>
      </YStack>
      {description}
      {websiteUrl}
      {industryId}
      <YStack gap="$4">
        {employeeCountRange}
        {annualRevenueRange}
      </YStack>
      {location}
    </YStack>
  )
}

const renderOrganizationFields = ({ children: _unused, ...fields }: Record<string, unknown>) => (
  <OrganizationFormFields fields={fields as OrganizationFieldElements} />
)

const useAutoSlug = (form: UseFormReturn<OrganizationFormValues>) => {
  const nameValue = form.watch('name')
  const slugDirty = Boolean(form.formState.dirtyFields.slug)

  useEffect(() => {
    if (slugDirty) return

    const nextSlug = nameValue ? slugify(nameValue) : ''
    form.setValue('slug', nextSlug, { shouldDirty: false })
  }, [nameValue, slugDirty, form])
}
