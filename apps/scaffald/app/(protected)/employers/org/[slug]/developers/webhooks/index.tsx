import { DevelopersFrame, WebhooksListScreen } from '@scf/core/features/developers'
import { useLocalSearchParams } from 'expo-router'

// An organization's webhooks (#1440); moved from /office/webhooks.
export default function OrgWebhooksPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  return (
    <DevelopersFrame slug={slug} view="webhooks">
      {({ org, canManage }) => (
        <WebhooksListScreen
          organizationId={org.organizationId}
          slug={org.slug}
          canManage={canManage}
        />
      )}
    </DevelopersFrame>
  )
}
