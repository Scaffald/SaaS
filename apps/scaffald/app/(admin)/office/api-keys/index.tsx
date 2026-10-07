/**
 * Office API Keys Management Page
 * Developer Portal for managing organization API keys
 */

import { OfficeLayout } from '@scf/core/components/layouts/OfficeLayout'
import { DeveloperPortal } from '@scf/core/features/api-keys'

// OfficeLayout, like the other office screens: this page rendered the portal
// in a bare SafeAreaView, at an 8px gutter where the office sits at 16 (#1022).
export default function OfficeAPIKeysPage() {
  return <OfficeLayout leftContent={<DeveloperPortal />} leftContainerProps={{ minWidth: '100%' }} />
}
