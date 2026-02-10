import { DisputeBackgroundCheckContent } from '@scf/core/features/background-check'
import { api } from '@scf/core/utils/api'
import type { AppRouter } from '@scf/supabase/client-types'
import { RefreshCcw } from '@tamagui/lucide-icons'
import type { inferRouterOutputs } from '@trpc/server'
import { Stack as ExpoStack, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useMemo } from 'react'
import { ScrollView } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Row, Spinner, Stack, Text } from '@unicornlove/beyond-ui'

type RouterOutputs = inferRouterOutputs<AppRouter>
type BackgroundCheckSummary = RouterOutputs['backgroundChecks']['listChecks'][number]

export default function BackgroundCheckDisputeScreen() {
  const { checkId } = useLocalSearchParams<{ checkId?: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const checksQuery = api.backgroundChecks.listChecks.useQuery(undefined, {
    refetchOnWindowFocus: true,
    staleTime: 60 * 1000,
  })

  const selectedCheck = useMemo<BackgroundCheckSummary | null>(() => {
    if (!checkId || !checksQuery.data) return null
    return checksQuery.data.find((check: BackgroundCheckSummary) => check.id === checkId) ?? null
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
          <Stack flex={1} gap={16} padding={16}>
            {checksQuery.isLoading && (
              <Stack gap={12} align="center" paddingVertical={24}>
                <Spinner size="large" color="secondary" />
                <Text size="sm" color="secondary">
                  Loading background checks…
                </Text>
              </Stack>
            )}

            {checksQuery.isError && (
              <Stack
                gap={12}
                padding={16}
                backgroundColor="#f3f4f6"
                borderRadius={8}
                style={{ borderWidth: 1, borderColor: '#e5e7eb' }}
              >
                <Text size="sm" color="secondary">
                  We couldn't load your background checks. Please try again.
                </Text>
                <Button
                  size="sm"
                  variant="outline"
                  color="blue"
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
                backgroundColor="#f3f4f6"
                borderRadius={8}
                style={{ borderWidth: 1, borderColor: '#e5e7eb' }}
              >
                <Text size="sm" color="secondary">
                  We couldn't find that background check or your access has expired.
                </Text>
                <Row gap={8}>
                  <Button size="sm" variant="filled" color="blue" onPress={handleClose}>
                    Go back
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    color="blue"
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
                    color="blue"
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
