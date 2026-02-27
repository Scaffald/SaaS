/**
 * Authorized Apps Settings Page
 * User can view and manage authorized OAuth apps
 */

import { SafeAreaView } from 'react-native-safe-area-context'
import { ScrollView } from 'react-native'
import { AuthorizedAppsList } from '@scf/core/features/oauth/components/AuthorizedAppsList'

export default function AuthorizedAppsSettingsPage() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <AuthorizedAppsList />
      </ScrollView>
    </SafeAreaView>
  )
}
