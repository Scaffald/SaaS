import { DeveloperPortal } from '@scf/core/features/api-keys'
import { DevelopersFrame } from '@scf/core/features/developers'
import { useLocalSearchParams } from 'expo-router'

// An organization's API keys (#1440); moved from /office/api-keys.
export default function OrgApiKeysPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  return (
    <DevelopersFrame slug={slug} view="api-keys">
      {({ org, canManage }) => (
        <DeveloperPortal organizationId={org.organizationId} canManage={canManage} />
      )}
    </DevelopersFrame>
  )
}
