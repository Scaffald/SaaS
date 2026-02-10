/**
 * Opt-Out Manager Component
 * REQ-3: CCPA Compliance Implementation
 *
 * Component for managing CCPA opt-out preferences:
 * - Sale of personal information
 * - Sharing of personal information
 * - Targeted advertising
 * - GPC (Global Privacy Control) status display
 */

import { useState, useEffect } from 'react'
import { Button, Text, Row, Stack, Spinner } from '@unicornlove/beyond-ui'
import { api } from '@scf/core/utils/api'

/**
 * Opt-out category type
 */
export type OptOutCategory =
  | 'sale'
  | 'sharing'
  | 'targeted_advertising'
  | 'sensitive_data'

/**
 * Opt-out status structure
 */
interface OptOutStatus {
  category: OptOutCategory
  opted_out: boolean
  opted_out_at?: string
  source: 'user' | 'gpc' | 'default'
}

/**
 * Props for OptOutManager
 */
interface OptOutManagerProps {
  onClose?: () => void
}

/**
 * Category metadata
 */
const CATEGORY_INFO: Record<
  OptOutCategory,
  {
    title: string
    description: string
    legalBasis: string
  }
> = {
  sale: {
    title: 'Sale of Personal Information',
    description:
      'Opt-out of the sale of your personal information to third parties. Under CCPA, "sale" includes any exchange of personal information for valuable consideration.',
    legalBasis: 'Cal. Civ. Code § 1798.120(a)',
  },
  sharing: {
    title: 'Sharing for Cross-Context Behavioral Advertising',
    description:
      'Opt-out of sharing your personal information for cross-context behavioral advertising purposes.',
    legalBasis: 'Cal. Civ. Code § 1798.120(a)',
  },
  targeted_advertising: {
    title: 'Targeted Advertising',
    description:
      'Opt-out of the use of your personal information for targeted advertising based on your activities across different services.',
    legalBasis: 'Cal. Civ. Code § 1798.120(a)',
  },
  sensitive_data: {
    title: 'Use of Sensitive Personal Information',
    description:
      'Limit the use of your sensitive personal information to only what is necessary for providing the services you requested.',
    legalBasis: 'Cal. Civ. Code § 1798.121',
  },
}

/**
 * Format date string
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Toggle switch component
 */
function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <Row
      width={50}
      height={28}
      borderRadius={14}
      backgroundColor={checked ? '$green9' : '$color6'}
      padding={2}
      cursor={disabled ? 'not-allowed' : 'pointer'}
      opacity={disabled ? 0.5 : 1}
      onPress={disabled ? undefined : () => onChange(!checked)}
    >
      <Stack
        width={24}
        height={24}
        borderRadius={12}
        backgroundColor="white"
        marginLeft={checked ? 22 : 0}
        animation="quick"
      />
    </Row>
  )
}

/**
 * Opt-out category row component
 */
function OptOutRow({
  category,
  status,
  onToggle,
  isPending,
}: {
  category: OptOutCategory
  status: OptOutStatus | undefined
  onToggle: (category: OptOutCategory, optOut: boolean) => void
  isPending: boolean
}) {
  const info = CATEGORY_INFO[category]
  const isOptedOut = status?.opted_out ?? false
  const isGPCOptOut = status?.source === 'gpc'

  return (
    <Stack
      padding="$4"
      backgroundColor="$color2"
      borderRadius="$3"
      borderWidth={1}
      borderColor="$borderColor"
      gap="$3"
    >
      <Row justifyContent="space-between" alignItems="flex-start">
        <Stack flex={1} gap="$1" marginRight="$4">
          <Text fontSize="$4" fontWeight="600">
            {info.title}
          </Text>
          <Text fontSize="$3" color="$color11">
            {info.description}
          </Text>
        </Stack>

        <Stack alignItems="center" gap="$1">
          <ToggleSwitch
            checked={isOptedOut}
            onChange={(checked) => onToggle(category, checked)}
            disabled={isPending || isGPCOptOut}
          />
          <Text fontSize="$2" color={isOptedOut ? '$green10' : '$color10'}>
            {isOptedOut ? 'Opted Out' : 'Opted In'}
          </Text>
        </Stack>
      </Row>

      {/* Status info */}
      {status?.opted_out_at && (
        <Row gap="$2" alignItems="center">
          <Text fontSize="$2" color="$color10">
            {isGPCOptOut ? 'Via GPC signal' : 'Manual opt-out'} on{' '}
            {formatDate(status.opted_out_at)}
          </Text>
        </Row>
      )}

      {isGPCOptOut && (
        <Row
          padding="$2"
          backgroundColor="$blue2"
          borderRadius="$2"
        >
          <Text fontSize="$2" color="$blue11">
            This opt-out was automatically applied based on your browser&apos;s Global Privacy
            Control (GPC) signal. To change this setting, disable GPC in your browser.
          </Text>
        </Row>
      )}

      {/* Legal basis */}
      <Text fontSize="$2" color="$color9">
        Legal basis: {info.legalBasis}
      </Text>
    </Stack>
  )
}

/**
 * Opt-Out Manager Component
 */
export function OptOutManager({ onClose }: OptOutManagerProps) {
  const [hasGPC, setHasGPC] = useState(false)
  const [pendingCategory, setPendingCategory] = useState<OptOutCategory | null>(null)

  // Detect GPC signal
  useEffect(() => {
    // Check for GPC signal in browser
    const gpcSignal =
      typeof navigator !== 'undefined' &&
      // @ts-expect-error - GPC is not yet in TypeScript types
      (navigator.globalPrivacyControl === true || navigator.doNotTrack === '1')

    setHasGPC(gpcSignal)
  }, [])

  // Fetch current opt-out status
  const {
    data: optOutData,
    isLoading,
    error,
    refetch,
  } = api.ccpa.getMyOptOuts.useQuery()

  // Set opt-out mutation
  const setOptOut = api.ccpa.setOptOut.useMutation({
    onSuccess: () => {
      refetch()
      setPendingCategory(null)
    },
    onError: () => {
      setPendingCategory(null)
    },
  })

  const handleToggle = (category: OptOutCategory, optOut: boolean) => {
    setPendingCategory(category)
    setOptOut.mutate({ category, optOut })
  }

  // Build status map from API response
  const statusMap: Record<OptOutCategory, OptOutStatus | undefined> = {
    sale: optOutData?.optOuts?.find((o: OptOutStatus) => o.category === 'sale'),
    sharing: optOutData?.optOuts?.find((o: OptOutStatus) => o.category === 'sharing'),
    targeted_advertising: optOutData?.optOuts?.find(
      (o: OptOutStatus) => o.category === 'targeted_advertising'
    ),
    sensitive_data: optOutData?.optOuts?.find(
      (o: OptOutStatus) => o.category === 'sensitive_data'
    ),
  }

  if (error) {
    return (
      <Stack padding="$4" gap="$4" alignItems="center">
        <Text color="$red10" fontSize="$4">
          Error loading opt-out preferences
        </Text>
        <Text color="$color11">{error.message}</Text>
        <Button onPress={() => refetch()} variant="outlined">
          Retry
        </Button>
      </Stack>
    )
  }

  return (
    <Stack gap="$4" padding="$4">
      {/* Header */}
      <Stack gap="$2">
        <Text fontSize="$6" fontWeight="600">
          Manage Opt-Out Preferences
        </Text>
        <Text fontSize="$3" color="$color11">
          Control how your personal information is used and shared. Your choices here are
          protected under the California Consumer Privacy Act (CCPA).
        </Text>
      </Stack>

      {/* GPC Detection Banner */}
      {hasGPC && (
        <Row
          padding="$3"
          backgroundColor="$green2"
          borderRadius="$3"
          borderWidth={1}
          borderColor="$green6"
          gap="$2"
          alignItems="center"
        >
          <Stack
            width={24}
            height={24}
            borderRadius={12}
            backgroundColor="$green9"
            alignItems="center"
            justifyContent="center"
          >
            <Text color="white" fontSize="$2" fontWeight="bold">
              ✓
            </Text>
          </Stack>
          <Stack flex={1}>
            <Text fontSize="$3" fontWeight="600" color="$green11">
              Global Privacy Control Detected
            </Text>
            <Text fontSize="$2" color="$green11">
              Your browser has sent a Global Privacy Control (GPC) signal. We honor this signal
              and have automatically opted you out of data sale and sharing.
            </Text>
          </Stack>
        </Row>
      )}

      {/* Loading state */}
      {isLoading ? (
        <Row padding="$6" justifyContent="center">
          <Spinner size="large" />
        </Row>
      ) : (
        <>
          {/* Opt-out categories */}
          <Stack gap="$3">
            <OptOutRow
              category="sale"
              status={statusMap.sale}
              onToggle={handleToggle}
              isPending={pendingCategory === 'sale'}
            />
            <OptOutRow
              category="sharing"
              status={statusMap.sharing}
              onToggle={handleToggle}
              isPending={pendingCategory === 'sharing'}
            />
            <OptOutRow
              category="targeted_advertising"
              status={statusMap.targeted_advertising}
              onToggle={handleToggle}
              isPending={pendingCategory === 'targeted_advertising'}
            />
            <OptOutRow
              category="sensitive_data"
              status={statusMap.sensitive_data}
              onToggle={handleToggle}
              isPending={pendingCategory === 'sensitive_data'}
            />
          </Stack>

          {/* Opt-out all button */}
          <Row gap="$3" justifyContent="center" marginTop="$2">
            <Button
              size="$4"
              onPress={() => {
                // Opt out of all categories
                const categories: OptOutCategory[] = [
                  'sale',
                  'sharing',
                  'targeted_advertising',
                  'sensitive_data',
                ]
                categories.forEach((cat) => {
                  if (!statusMap[cat]?.opted_out) {
                    setOptOut.mutate({ category: cat, optOut: true })
                  }
                })
              }}
            >
              Opt Out of All
            </Button>
          </Row>
        </>
      )}

      {/* Non-discrimination notice */}
      <Stack
        padding="$3"
        backgroundColor="$color3"
        borderRadius="$2"
        marginTop="$2"
      >
        <Text fontSize="$2" color="$color10">
          <Text fontWeight="600">Non-Discrimination Notice:</Text> We will not discriminate
          against you for exercising any of your privacy rights. You will receive the same
          service and pricing regardless of your privacy choices.
        </Text>
      </Stack>

      {/* Info about processing */}
      <Stack gap="$2" marginTop="$2">
        <Text fontSize="$3" fontWeight="500">
          How Opt-Outs Work
        </Text>
        <Text fontSize="$2" color="$color10">
          • Opt-out preferences take effect immediately
        </Text>
        <Text fontSize="$2" color="$color10">
          • We will not sell or share your data with third parties while you are opted out
        </Text>
        <Text fontSize="$2" color="$color10">
          • You can change your preferences at any time
        </Text>
        <Text fontSize="$2" color="$color10">
          • If you use GPC, your opt-out will be automatically applied across all participating
          sites
        </Text>
      </Stack>

      {/* Close button */}
      {onClose && (
        <Row justifyContent="flex-end" marginTop="$4">
          <Button variant="outlined" onPress={onClose}>
            Close
          </Button>
        </Row>
      )}
    </Stack>
  )
}

export default OptOutManager
