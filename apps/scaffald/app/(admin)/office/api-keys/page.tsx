/**
 * Office API Keys Management Page
 * Developer Portal for managing organization API keys
 */

import { DeveloperPortal } from '@scf/core/features/api-keys'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function OfficeAPIKeysPage() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <DeveloperPortal />
    </SafeAreaView>
  )
}
