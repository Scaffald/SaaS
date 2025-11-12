import { useCallback, useMemo } from 'react'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { RefreshCcw } from '@tamagui/lucide-icons'
import { ScrollView, Spinner, Text, XStack, YStack, Button } from 'tamagui'

import { api } from '@app/core/utils/api'
import { DisputeBackgroundCheckContent } from '@app/core/features/background-check'
import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@app/supabase/client-types'

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
      <Stack.Screen
        options={{
          title: 'Dispute background check',
          headerShown: false,
        }}
      />
      <SafeAreaView style={{ flex: 1, paddingTop: insets.top }}>
        <ScrollView flex={1}>
          <YStack flex={1} gap="$4" p="$4">
            {checksQuery.isLoading && (
              <YStack gap="$3" items="center" py="$6">
                <Spinner size="large" color="$color11" />
                <Text fontSize="$3" color="$color11">
                  Loading background checks…
                </Text>
              </YStack>
            )}

            {checksQuery.isError && (
              <YStack
                gap="$3"
                p="$4"
                bg="$color2"
                rounded="$4"
                borderWidth={1}
                borderColor="$borderColor"
              >
                <Text fontSize="$3" color="$color11">
                  We couldn’t load your background checks. Please try again.
                </Text>
                <Button size="$3" variant="outlined" onPress={() => checksQuery.refetch()}>
                  <XStack gap="$2" items="center">
                    <RefreshCcw size={16} />
                    <Text fontSize="$2">Retry</Text>
                  </XStack>
                </Button>
              </YStack>
            )}

            {!checksQuery.isLoading && !checksQuery.isError && !selectedCheck && (
              <YStack
                gap="$3"
                p="$4"
                bg="$color2"
                rounded="$4"
                borderWidth={1}
                borderColor="$borderColor"
              >
                <Text fontSize="$3" color="$color11">
                  We couldn’t find that background check or your access has expired.
                </Text>
                <XStack gap="$2">
                  <Button size="$3" onPress={handleClose}>
                    Go back
                  </Button>
                  <Button size="$3" variant="outlined" onPress={() => checksQuery.refetch()}>
                    <XStack gap="$2" items="center">
                      <RefreshCcw size={16} />
                      <Text fontSize="$2">Refresh</Text>
                    </XStack>
                  </Button>
                </XStack>
              </YStack>
            )}

            {selectedCheck && (
              <DisputeBackgroundCheckContent
                check={selectedCheck}
                isActive
                onSubmitted={handleSubmitted}
                onClose={handleClose}
                renderHeaderAction={({ isSubmitting, isUploading }) => (
                  <Button
                    size="$2"
                    variant="outlined"
                    disabled={isSubmitting || isUploading}
                    onPress={handleClose}
                  >
                    Close
                  </Button>
                )}
              />
            )}
          </YStack>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}
