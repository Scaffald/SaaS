import { useMemo, useState } from 'react'
import { useRouter } from 'expo-router'
import { DashboardWidget } from '@app/ui'
import { AlertTriangle, ArrowRight, Building2, CheckCircle2, Loader2 } from '@tamagui/lucide-icons'
import {
  Button,
  Input,
  Label,
  Separator,
  Stack,
  Text,
  XStack,
  YStack,
} from 'tamagui'
import { ROUTES, RouteBuilder } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import { useDebounce } from '@app/core/utils/useDebounce'

const MIN_QUERY_LENGTH = 2

const normalizeSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/**
 * AddOrganizationWidget
 * Allows users to validate organization uniqueness and navigate to creation flow.
 */
export function AddOrganizationWidget() {
  const router = useRouter()
  const [organizationName, setOrganizationName] = useState('')
  const debouncedQuery = useDebounce(organizationName, 300)
  const trimmedQuery = debouncedQuery.trim()
  const candidateSlug = normalizeSlug(trimmedQuery)

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
    !isQueryReady || isFetching || isLoading || hasDuplicate || candidateSlug.length === 0

  const handleCreatePress = () => {
    router.push(ROUTES.OFFICE_ORGANIZATIONS_CREATE.path)
  }

  return (
    <DashboardWidget gap="$4">
      <YStack gap="$2">
        <XStack gap="$2" items="center">
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

      {isFetching || isLoading ? (
        <XStack gap="$2" items="center">
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
        theme="blue"
        iconAfter={ArrowRight}
        disabled={isSubmitDisabled}
        onPress={handleCreatePress}
      >
        Continue to Create Organization
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
        <XStack gap="$2" items="center">
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
      <XStack gap="$2" items="center">
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
      onPress={() => router.push(RouteBuilder.dashboardEmployer(id))}
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

