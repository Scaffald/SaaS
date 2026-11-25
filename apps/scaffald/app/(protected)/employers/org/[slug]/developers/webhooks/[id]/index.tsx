import { DevelopersFrame, WebhookDetailScreen } from '@scf/core/features/developers'
import { useLocalSearchParams } from 'expo-router'

// One of an organization's webhooks (#1440). The Office list pushed to this
// screen's old path, but no screen ever existed there.
export default function OrgWebhookDetailPage() {
  const { slug, id } = useLocalSearchParams<{ slug: string; id: string }>()
  return (
    <DevelopersFrame slug={slug} view="webhooks">
      {({ org, canManage }) => (
        <WebhookDetailScreen
          id={id ?? ''}
          organizationId={org.organizationId}
          slug={org.slug}
          canManage={canManage}
        />
      )}
    </DevelopersFrame>
  )
}
