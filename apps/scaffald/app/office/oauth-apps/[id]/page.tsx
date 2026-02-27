/**
 * Admin OAuth App Detail Page
 * OAuth app detail and approval
 */

import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { OAuthAppDetail } from '@scf/core/features/oauth/components/OAuthAppDetail'
import { ScrollView } from 'react-native'

export default function OfficeOAuthAppDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>()

  if (!id || typeof id !== 'string') {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
        <div>Invalid app ID</div>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <OAuthAppDetail appId={id} />
      </ScrollView>
    </SafeAreaView>
  )
}
