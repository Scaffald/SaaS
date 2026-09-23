import { ROUTES } from '@scf/core/constants/routes'
import { DisputeBackgroundCheckContent } from '@scf/core/features/background-check'
import { ProfilePage } from '@scf/core/features/profile/ProfilePage'
import { useBackgroundChecks } from '@scf/core/utils/background-checks-sdk-hooks'
import type { BackgroundCheck } from '@scaffald/sdk/resources/background-checks'
import { RefreshCcw } from 'lucide-react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useMemo } from 'react'
import { Button, Row, Spinner, Stack, Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

type BackgroundCheckSummary = BackgroundCheck

/**
 * Disputing a result (#830).
 *
 * Like the initiate screen, this was a bare `SafeAreaView` with the header
 * hidden and its own scroll view. Its two failure states were bordered boxes
 * with a hardcoded `#e5e7eb` hairline.
 */
export default function BackgroundCheckDisputeScreen() {
  const { checkId } = useLocalSearchParams<{ checkId?: string }>()
  const router = useRouter()
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  const checksQuery = useBackgroundChecks({ enabled: true })

  const selectedCheck = useMemo<BackgroundCheckSummary | null>(() => {
    if (!checkId || !checksQuery.data) return null
    const checks = checksQuery.data as BackgroundCheck[]
    return checks.find((check: BackgroundCheck) => check.id === checkId) ?? null
  }, [checkId, checksQuery.data])

  const handleClose = useCallback(() => {
    router.back()
  }, [router])

  const handleSubmitted = useCallback(async () => {
    await checksQuery.refetch()
    router.back()
  }, [checksQuery, router])

  const content = (
    <Stack gap={16}>
      {checksQuery.isLoading && (
        <Stack gap={12} align="center" paddingVertical={24}>
          <Spinner variant="ios" size="lg" color="gray" />
          <Text style={{ color: colors.text[t].secondary }}>Loading background checks…</Text>
        </Stack>
      )}

      {checksQuery.isError && (
        <Stack gap={12} align="flex-start">
          <Text style={{ color: colors.text[t].secondary }}>
            We couldn't load your background checks. Please try again.
          </Text>
          <Button
            size="sm"
            variant="outline"
            iconStart={RefreshCcw}
            onPress={() => checksQuery.refetch()}
          >
            Retry
          </Button>
        </Stack>
      )}

      {!checksQuery.isLoading && !checksQuery.isError && !selectedCheck && (
        <Stack gap={12} align="flex-start">
          <Text style={{ color: colors.text[t].secondary }}>
            We couldn't find that background check, or your access to it has expired.
          </Text>
          <Row gap={8} wrap>
            <Button size="sm" variant="filled" color="primary" onPress={handleClose}>
              Go back
            </Button>
            <Button
              size="sm"
              variant="outline"
              iconStart={RefreshCcw}
              onPress={() => checksQuery.refetch()}
            >
              Refresh
            </Button>
          </Row>
        </Stack>
      )}

      {selectedCheck && (
        <DisputeBackgroundCheckContent
          check={selectedCheck}
          isActive
          onSubmitted={handleSubmitted}
          onClose={handleClose}
          renderHeaderAction={({ isSubmitting, isUploading }) => (
            <Button
              size="sm"
              variant="outline"
              disabled={isSubmitting || isUploading}
              onPress={handleClose}
            >
              Close
            </Button>
          )}
        />
      )}
    </Stack>
  )

  return (
    <ProfilePage
      breadcrumbs={[
        { route: ROUTES.PROFILE },
        { route: ROUTES.PROFILE.ID_VERIFICATION },
        { route: ROUTES.PROFILE.BACKGROUND_CHECK.DISPUTE },
      ]}
      screenTitle="Dispute a result"
      screenTip="Tell us what is wrong and attach anything that supports it. The provider has to respond."
      leftContent={content}
    />
  )
}
