import { DisputeBackgroundCheckContent } from '@scf/core/features/background-check'
import { useBackgroundChecks } from '@scf/core/utils/background-checks-sdk-hooks'
import type { BackgroundCheck } from '@scaffald/sdk/resources/background-checks'
import { RefreshCcw } from 'lucide-react-native'
import { Stack as ExpoStack, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useMemo } from 'react'
import { ScrollView } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Row, Spinner, Stack, Text } from '@unicornlove/beyond-ui'

type BackgroundCheckSummary = BackgroundCheck

export default function BackgroundCheckDisputeScreen() {
  const { checkId } = useLocalSearchParams<{ checkId?: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const checksQuery = useBackgroundChecks({
    enabled: true,
  })

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

  return (
    <>
      <ExpoStack.Screen
        options={{
          headerShown: false,
          title: 'Dispute background check',
        }}
      />
      <SafeAreaView style={{ flex: 1, paddingTop: insets.top }}>
        <ScrollView style={{ flex: 1 }}>
          <Stack gap={16} padding={16}>
            {checksQuery.isLoading && (
              <Stack gap={12} align="center" paddingVertical={24}>
                <Spinner size="lg" color="$color11" />
                <Text size="sm" color="$color11">
                  Loading background checks…
                </Text>
              </Stack>
            )}

            {checksQuery.isError && (
              <Stack
                gap={12}
                padding={16}
               
               
                style={{ borderWidth: 1, borderColor: '#e5e7eb' }}
              >
                <Text size="sm" color="$color11">
                  We couldn't load your background checks. Please try again.
                </Text>
                <Button
                  size="sm"
                  variant="outline"
                  color="primary"
                  onPress={() => checksQuery.refetch()}
                >
                  <Row gap={8} align="center">
                    <RefreshCcw size={16} />
                    <Text size="sm">Retry</Text>
                  </Row>
                </Button>
              </Stack>
            )}

            {!checksQuery.isLoading && !checksQuery.isError && !selectedCheck && (
              <Stack
                gap={12}
                padding={16}
               
               
                style={{ borderWidth: 1, borderColor: '#e5e7eb' }}
              >
                <Text size="sm" color="$color11">
                  We couldn't find that background check or your access has expired.
                </Text>
                <Row gap={8}>
                  <Button size="sm" variant="filled" color="primary" onPress={handleClose}>
                    Go back
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    color="primary"
                    onPress={() => checksQuery.refetch()}
                  >
                    <Row gap={8} align="center">
                      <RefreshCcw size={16} />
                      <Text size="sm">Refresh</Text>
                    </Row>
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
                    color="primary"
                    disabled={isSubmitting || isUploading}
                    onPress={handleClose}
                  >
                    Close
                  </Button>
                )}
              />
            )}
          </Stack>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}
