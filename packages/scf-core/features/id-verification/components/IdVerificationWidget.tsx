import { ROUTES } from '@scf/core/constants/routes'
import { api } from '@scf/core/utils/api'
import { Button, DashboardWidget } from '@unicornlove/beyond-ui'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Text, Stack } from '@unicornlove/beyond-ui'
import { IdVerificationBadge } from './IdVerificationBadge'

export function IdVerificationWidget() {
  const router = useRouter()
  const badgeQuery = api.idVerification.getCurrentVerification.useQuery(
    {},
    {
      staleTime: 60 * 1000,
    }
  )

  const status = useMemo(() => deriveStatus(badgeQuery), [badgeQuery])

  return (
    <DashboardWidget>
      <Stack gap={12}>
        <Text color="gray">
          Identity verification
        </Text>
        <IdVerificationBadge
          status={status.badgeStatus}
          badgeExpiresAt={status.badgeExpiresAt}
          muted={status.muted}
          size="md"
        />
        {status.caption && (
          <Text color="gray">
            {status.caption}
          </Text>
        )}

        <Button
          size={12}
          theme="blue"
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
  badgeQuery: ReturnType<typeof api.idVerification.getCurrentVerification.useQuery>
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
