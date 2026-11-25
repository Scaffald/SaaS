import { DevelopersFrame, WebhookCreateScreen } from '@scf/core/features/developers'
import { useLocalSearchParams } from 'expo-router'

// Create a webhook for an organization (#1440); moved from /office/webhooks/create.
export default function OrgWebhookCreatePage() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  return (
    <DevelopersFrame slug={slug} view="webhooks">
      {({ org, canManage }) => (
        <WebhookCreateScreen
          organizationId={org.organizationId}
          slug={org.slug}
          canManage={canManage}
        />
      )}
    </DevelopersFrame>
  )
}
