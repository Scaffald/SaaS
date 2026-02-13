import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useEmployers } from '@scf/core/utils/employers-sdk-hooks'
import { useCreateOrganizationRequestMutation } from '@scf/core/utils/organizations-sdk-hooks'
import { useDebounce } from '@scf/core/utils/useDebounce'
import { DashboardWidget } from '@unicornlove/beyond-ui'
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  Pencil,
} from 'lucide-react-native'
import { useToast } from '@unicornlove/beyond-ui'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Button, Input, Label, Separator, Stack, Text, Row } from '@unicornlove/beyond-ui'
import { normalizeOrganizationSlug } from '../utils/normalizeOrganizationSlug'

const MIN_QUERY_LENGTH = 2

/**
 * AddOrganizationWidget
 * Allows users to validate organization uniqueness and navigate to creation flow.
 */
export function AddOrganizationWidget() {
  const router = useRouter()
  const toast = useToast()
  const [organizationName, setOrganizationName] = useState('')
  const debouncedQuery = useDebounce(organizationName, 300)
  const trimmedQuery = debouncedQuery.trim()
  const candidateSlug = normalizeOrganizationSlug(trimmedQuery)
  const [submittedRequest, setSubmittedRequest] = useState<{
    id: string
    name: string
    slug: string
    created_at: string
  } | null>(null)

  const {
    data: searchResults,
    isFetching,
    isLoading,
  } = useEmployers(
    { search: trimmedQuery, limit: 12 },
    {
      enabled: trimmedQuery.length >= MIN_QUERY_LENGTH,
      staleTime: 30_000,
    }
  )

  const matchingEmployers = useMemo(() => {
    if (!Array.isArray(searchResults?.employers) || trimmedQuery.length < MIN_QUERY_LENGTH) {
      return []
    }

    const normalizedQuery = trimmedQuery.toLowerCase()

    return searchResults.employers
      .filter((employer: { id: string; name?: string | null; slug?: string | null }) => {
        if (!employer) return false
        const nameMatch = employer.name?.toLowerCase().includes(normalizedQuery)
        const slugMatch = employer.slug && employer.slug.toLowerCase() === candidateSlug
        return Boolean(nameMatch || slugMatch)
      })
      .slice(0, 5)
  }, [candidateSlug, searchResults?.employers, trimmedQuery])

  const hasDuplicate = matchingEmployers.length > 0
  const isQueryReady = trimmedQuery.length >= MIN_QUERY_LENGTH
  const isSubmitDisabled =
    !isQueryReady ||
    isFetching ||
    isLoading ||
    hasDuplicate ||
    candidateSlug.length === 0 ||
    Boolean(submittedRequest)

  const createOrganizationRequestMutation = useCreateOrganizationRequestMutation({
    onSuccess: ({ request }: { request: SubmissionSummaryProps['request'] }) => {
      setSubmittedRequest(request)
      toast.show({
        title: 'Request submitted',
        message:
          'Thanks for the submission! Our team will review your organization and follow up shortly.',
        variant: 'success',
      })
    },
    onError: (error: { message?: string }) => {
      toast.show({
        title: 'Unable to submit organization',
        message: error.message ?? 'Please try again in a moment.',
        variant: 'error',
      })
    },
  })

  const handleCreatePress = () => {
    if (!isQueryReady || candidateSlug.length === 0) return

    createOrganizationRequestMutation.mutate({
      name: trimmedQuery,
      slug: candidateSlug,
    })
  }

  const isSubmitting = createOrganizationRequestMutation.isPending

  return (
    <DashboardWidget gap={16}>
      <Stack gap={8}>
        <Row gap={8} align="center">
          <Building2 size="lg" color="$blue10" />
          <Text color="$gray11">Add an Organization</Text>
        </Row>
        <Text color="$gray11">
          Enter the organization name to check if we already have it. You can continue to the
          creation flow once we confirm it&apos;s new.
        </Text>
      </Stack>

      <Stack gap={8}>
        <Label htmlFor="add-organization-name" color="$gray11">
          Organization Name
        </Label>
        <Input
          id="add-organization-name"
          value={organizationName}
          onChangeText={setOrganizationName}
          placeholder="Start typing the organization name"
          autoCapitalize="words"
        />
      </Stack>

      <Separator />

      {submittedRequest ? (
        <SubmissionSummary
          request={submittedRequest}
          onAddDetails={() =>
            router.push({
              pathname: ROUTES.DASHBOARD.ORGANIZATIONS.CREATE.path,
              params: {
                name: submittedRequest.name ?? trimmedQuery,
                slug: submittedRequest.slug,
              },
            })
          }
        />
      ) : isFetching || isLoading ? (
        <Row gap={8} align="center">
          <Loader2 size="md" color="$blue10" />
          <Text color="$gray11">Checking for existing organizations...</Text>
        </Row>
      ) : (
        <StatusSummary
          hasDuplicate={hasDuplicate}
          isQueryReady={isQueryReady}
          matchingEmployers={matchingEmployers}
          candidateSlug={candidateSlug}
        />
      )}

      <Button
        size="md"
        theme="info"
        iconAfter={!isSubmitting ? ArrowRight : undefined}
        disabled={isSubmitDisabled || isSubmitting}
        onPress={handleCreatePress}
      >
        {isSubmitting ? (
          <Row gap={8} align="center">
            <Loader2 size="md" color="$gray11" />
            <Text color="$gray11">Submitting...</Text>
          </Row>
        ) : submittedRequest ? (
          'Request Submitted'
        ) : (
          'Submit for Review'
        )}
      </Button>
    </DashboardWidget>
  )
}

type StatusSummaryProps = {
  hasDuplicate: boolean
  isQueryReady: boolean
  matchingEmployers: Array<{ id: string; name?: string | null }>
  candidateSlug: string
}

function StatusSummary({
  hasDuplicate,
  isQueryReady,
  matchingEmployers,
  candidateSlug,
}: StatusSummaryProps) {
  if (!isQueryReady) {
    return (
      <Text color="$gray11">
        Enter at least {MIN_QUERY_LENGTH} characters to check for duplicates.
      </Text>
    )
  }

  if (hasDuplicate) {
    return (
      <Stack gap={12}>
        <Row gap={8} align="center">
          <AlertTriangle size="md" color="$yellow10" />
          <Text color="$yellow10">We found existing organizations that match your search.</Text>
        </Row>
        <Stack gap={8}>
          {matchingEmployers.map((employer) => (
            <DuplicateLink key={employer.id} id={employer.id} name={employer.name || 'Unknown'} />
          ))}
        </Stack>
        <Text color="$gray11">Review the existing organization before creating a new one.</Text>
      </Stack>
    )
  }

  return (
    <Stack gap={8}>
      <Row gap={8} align="center">
        <CheckCircle2 size="md" color="$green10" />
        <Text color="$green10">This name looks available.</Text>
      </Row>
      <Text color="$gray11">
        We&apos;ll use the slug <Text>{candidateSlug}</Text> when you create the organization.
      </Text>
    </Stack>
  )
}

type DuplicateLinkProps = {
  id: string
  name: string
}

function DuplicateLink({ id, name }: DuplicateLinkProps) {
  const router = useRouter()

  return (
    <Button
      variant="outline"
      size="sm"
      onPress={() => router.push(buildPath(ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.DETAIL, { id }))}
      iconAfter={ArrowRight}
      justify="space-between"
    >
      <Stack flex={1}>
        <Text color="$gray11" >
          {name}
        </Text>
      </Stack>
    </Button>
  )
}

type SubmissionSummaryProps = {
  request: {
    id: string
    name: string
    slug: string
    created_at: string
  }
  onAddDetails?: () => void
}

function SubmissionSummary({ request, onAddDetails }: SubmissionSummaryProps) {
  return (
    <Stack gap={8}>
      <Row gap={8} align="center">
        <CheckCircle2 size="md" color="$green10" />
        <Text color="$green10">Request submitted for {request.name}</Text>
      </Row>
      <Text color="$gray11">
        We&apos;ll review <Text>{request.slug}</Text> and notify you once it&apos;s approved. You
        can keep browsing employers while we take a look.
      </Text>
      {onAddDetails ? (
        <Button
          size="sm"
          variant="outline"
          icon={Pencil}
          onPress={onAddDetails}
          style={{ alignSelf: 'flex-start' }}
        >
          Add more details
        </Button>
      ) : null}
    </Stack>
  )
}
