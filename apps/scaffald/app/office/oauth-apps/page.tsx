/**
 * Admin OAuth Apps List Page
 * REQ-10 Task 11: Admin OAuth app approval dashboard
 */

import { OAuthAppList } from '@scf/core/features/oauth/components/OAuthAppList'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function OfficeOAuthAppsPage() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <OAuthAppList />
    </SafeAreaView>
  )
}

