import { ROUTES } from '@scf/core/constants/routes'
import { useCurrentIdVerification } from '@scf/core/utils/id-verification-sdk-hooks'
import { Button, DashboardWidget } from '@scaffald/ui'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Text, Stack } from '@scaffald/ui'
import { IdVerificationBadge } from './IdVerificationBadge'

export function IdVerificationWidget() {
  const router = useRouter()
  const badgeQuery = useCurrentIdVerification(undefined, { staleTime: 60 * 1000 })

  const status = useMemo(() => deriveStatus(badgeQuery), [badgeQuery])

  return (
    <DashboardWidget>
      <Stack gap={12}>
        <Text color="$gray11">Identity verification</Text>
        <IdVerificationBadge
          status={status.badgeStatus}
          badgeExpiresAt={status.badgeExpiresAt}
          muted={status.muted}
          size="md"
        />
        {status.caption && <Text color="$gray11">{status.caption}</Text>}

        <Button
          size="sm"
          color="primary"
          onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.ID_VERIFICATION.path)}
        >
          Manage verification
        </Button>
      </Stack>
    </DashboardWidget>
  )
}

type StatusDescriptor = {
  badgeStatus: 'active' | 'expired' | 'revoked' | null
  badgeExpiresAt?: string | null
  caption?: string | null
  muted?: boolean
}

function deriveStatus(
  badgeQuery: ReturnType<typeof useCurrentIdVerification>
): StatusDescriptor {
  if (badgeQuery.isLoading) {
    return {
      badgeStatus: null,
      caption: 'Fetching your latest verification status.',
      muted: true,
    }
  }

  if (badgeQuery.isError || !badgeQuery.data) {
    return {
      badgeStatus: null,
      caption: 'Add a verified badge to boost trust with organizations.',
      muted: true,
    }
  }

  const badge = badgeQuery.data as { badgeStatus?: string; badgeExpiresAt?: string | null }
  return {
    badgeStatus: (badge?.badgeStatus ?? null) as 'active' | 'expired' | 'revoked' | null,
    badgeExpiresAt: badge?.badgeExpiresAt ?? null,
    caption:
      badge.badgeStatus === 'revoked'
        ? 'Contact support to resolve badge issues.'
        : badge.badgeStatus === 'expired'
          ? 'Renew to keep your profile highlighted.'
          : 'Renew before expiry to keep this badge active.',
  }
}
