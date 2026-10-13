/**
 * Admin OAuth Apps List Page
 * Admin OAuth app approval dashboard
 */

import { OfficeLayout } from '@scf/core/components/layouts/OfficeLayout'
import { OAuthAppList } from '@scf/core/features/oauth/components/OAuthAppList'

// OfficeLayout, like the rest of the office: a bare SafeAreaView put the list
// flush against the sidebar with the cards running past the viewport (#1098).
export default function OfficeOAuthAppsPage() {
  return <OfficeLayout leftContent={<OAuthAppList />} leftContainerProps={{ minWidth: '100%' }} />
}
