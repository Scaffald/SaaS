import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { api } from '@scf/core/utils/api'
import { useDebounce } from '@scf/core/utils/useDebounce'
import { DashboardWidget } from '@unicornlove/ui'
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  Pencil,
} from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Button, Input, Label, Separator, Stack, Text, XStack, YStack } from '@unicornlove/ui'
import { normalizeOrganizationSlug } from '../utils/normalizeOrganizationSlug'

const MIN_QUERY_LENGTH = 2

/**
 * AddOrganizationWidget
 * Allows users to validate organization uniqueness and navigate to creation flow.
 */
export function AddOrganizationWidget() {
  const router = useRouter()
  const toast = useToastController()
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
  } = api.employers.getEmployers.useQuery(
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

  const createOrganizationRequestMutation = api.organizations.createOrganizationRequest.useMutation(
    {
      onSuccess: ({ request }: { request: SubmissionSummaryProps['request'] }) => {
        setSubmittedRequest(request)
        toast.show('Request submitted', {
          message:
            'Thanks for the submission! Our team will review your organization and follow up shortly.',
        })
      },
      onError: (error: { message?: string }) => {
        toast.show('Unable to submit organization', {
          message: error.message ?? 'Please try again in a moment.',
        })
      },
    }
  )

  const handleCreatePress = () => {
    if (!isQueryReady || candidateSlug.length === 0) return

    createOrganizationRequestMutation.mutate({
      name: trimmedQuery,
      slug: candidateSlug,
    })
  }

  const isSubmitting = createOrganizationRequestMutation.isPending

  return (
    <DashboardWidget gap="$4">
      <YStack gap="$2">
        <XStack gap="$2" alignItems="center">
          <Building2 size={20} color="$blue10" />
          <Text fontSize="$5" fontWeight="700" color="$color12">
            Add an Organization
          </Text>
        </XStack>
        <Text fontSize="$3" color="$color11">
          Enter the organization name to check if we already have it. You can continue to the
          creation flow once we confirm it&apos;s new.
        </Text>
      </YStack>

      <YStack gap="$2">
        <Label htmlFor="add-organization-name" fontSize="$3" fontWeight="600" color="$color12">
          Organization Name
        </Label>
        <Input
          id="add-organization-name"
          value={organizationName}
          onChangeText={setOrganizationName}
          placeholder="Start typing the organization name"
          autoCapitalize="words"
        />
      </YStack>

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
        <XStack gap="$2" alignItems="center">
          <Loader2 size={16} color="$blue10" />
          <Text fontSize="$3" color="$color11">
            Checking for existing organizations...
          </Text>
        </XStack>
      ) : (
        <StatusSummary
          hasDuplicate={hasDuplicate}
          isQueryReady={isQueryReady}
          matchingEmployers={matchingEmployers}
          candidateSlug={candidateSlug}
        />
      )}

      <Button
        size="$4"
        theme="info"
        iconAfter={!isSubmitting ? ArrowRight : undefined}
        disabled={isSubmitDisabled || isSubmitting}
        onPress={handleCreatePress}
      >
        {isSubmitting ? (
          <XStack gap="$2" alignItems="center">
            <Loader2 size={16} color="$color1" />
            <Text fontSize="$4" fontWeight="600" color="$color1">
              Submitting...
            </Text>
          </XStack>
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
      <Text fontSize="$3" color="$color10">
        Enter at least {MIN_QUERY_LENGTH} characters to check for duplicates.
      </Text>
    )
  }

  if (hasDuplicate) {
    return (
      <YStack gap="$3">
        <XStack gap="$2" alignItems="center">
          <AlertTriangle size={16} color="$yellow10" />
          <Text fontSize="$3" fontWeight="600" color="$yellow10">
            We found existing organizations that match your search.
          </Text>
        </XStack>
        <YStack gap="$2">
          {matchingEmployers.map((employer) => (
            <DuplicateLink key={employer.id} id={employer.id} name={employer.name || 'Unknown'} />
          ))}
        </YStack>
        <Text fontSize="$2" color="$color10">
          Review the existing organization before creating a new one.
        </Text>
      </YStack>
    )
  }

  return (
    <YStack gap="$2">
      <XStack gap="$2" alignItems="center">
        <CheckCircle2 size={16} color="$green10" />
        <Text fontSize="$3" fontWeight="600" color="$green10">
          This name looks available.
        </Text>
      </XStack>
      <Text fontSize="$2" color="$color10">
        We&apos;ll use the slug <Text fontWeight="600">{candidateSlug}</Text> when you create the
        organization.
      </Text>
    </YStack>
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
      variant="outlined"
      size="$3"
      onPress={() => router.push(buildPath(ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.DETAIL, { id }))}
      iconAfter={ArrowRight}
      justifyContent="space-between"
    >
      <Stack flex={1}>
        <Text fontSize="$3" color="$color12" numberOfLines={1}>
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
    <YStack gap="$2">
      <XStack gap="$2" alignItems="center">
        <CheckCircle2 size={16} color="$green10" />
        <Text fontSize="$3" fontWeight="600" color="$green10">
          Request submitted for {request.name}
        </Text>
      </XStack>
      <Text fontSize="$2" color="$color10">
        We&apos;ll review <Text fontWeight="600">{request.slug}</Text> and notify you once it&apos;s
        approved. You can keep browsing employers while we take a look.
      </Text>
      {onAddDetails ? (
        <Button
          size="$3"
          variant="outlined"
          icon={Pencil}
          onPress={onAddDetails}
          style={{ alignSelf: 'flex-start' }}
        >
          Add more details
        </Button>
      ) : null}
    </YStack>
  )
}
