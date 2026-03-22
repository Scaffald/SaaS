import {
  usePendingConnections,
  useAcceptConnectionMutation,
  useDeclineConnectionMutation,
} from '@scf/core/utils/engagement-sdk-hooks'
import { getAvatarUrl } from '@scf/core/utils/supabase/storage'
import {
  Avatar,
  Button,
  DashboardWidget,
  DashboardWidgetHeader,
  Row,
  Skeleton,
  SkeletonAvatar,
  SkeletonGroup,
  Stack,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

type PendingContact = {
  id: string
  name: string
  headline: string
  initials: string
  avatarUrl?: string
}

function ContactRow({
  contact,
  onAccept,
  onDecline,
  isAccepting,
  isDeclining,
}: {
  contact: PendingContact
  onAccept: () => void
  onDecline: () => void
  isAccepting: boolean
  isDeclining: boolean
}) {
  const { theme } = useThemeContext()

  return (
    <Row justify="space-between" align="center" gap={12}>
      <Row align="center" gap={12} flex={1}>
        <Avatar
          size={40}
          src={contact.avatarUrl}
          initials={contact.initials}
          color="gray"
        />
        <Stack gap={2} flex={1}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text[theme].primary }}>
            {contact.name}
          </Text>
          {contact.headline ? (
            <Text
              style={{ fontSize: 12, color: colors.text[theme].secondary }}
              numberOfLines={1}
            >
              {contact.headline}
            </Text>
          ) : null}
        </Stack>
      </Row>
      <Row gap={6}>
        <Button
          variant="outline"
          color="primary"
          size="sm"
          onPress={onAccept}
          disabled={isAccepting || isDeclining}
        >
          Accept
        </Button>
        <Button
          variant="outline"
          color="gray"
          size="sm"
          onPress={onDecline}
          disabled={isAccepting || isDeclining}
        >
          Decline
        </Button>
      </Row>
    </Row>
  )
}

/**
 * SuggestedContactsWidget
 * Shows pending connection requests for the dashboard right column.
 * Replaces placeholder data with real pending connections.
 */
export function SuggestedContactsWidget() {
  const { data: pendingData, isLoading } = usePendingConnections({
    enabled: true,
  })
  const acceptMutation = useAcceptConnectionMutation()
  const declineMutation = useDeclineConnectionMutation()

  if (isLoading) {
    return (
      <DashboardWidget>
        <DashboardWidgetHeader title="Pending Connections" />
        <SkeletonGroup gap={20} animation="wave">
          {[1, 2].map((i) => (
            <Row key={i} align="center" gap={12}>
              <SkeletonAvatar size={40} animation="wave" />
              <Stack gap={4} flex={1}>
                <Skeleton width={120} height={14} borderRadius={4} />
                <Skeleton width={80} height={12} borderRadius={4} />
              </Stack>
              <Skeleton width={70} height={28} borderRadius={8} />
            </Row>
          ))}
        </SkeletonGroup>
      </DashboardWidget>
    )
  }

  const pending = (pendingData as { data?: Array<{
    id: string
    sender?: {
      id?: string
      display_name?: string | null
      username?: string | null
      avatar_path?: string | null
      avatar_url?: string | null
      headline?: string | null
    } | null
  }> })?.data ?? []

  if (pending.length === 0) {
    return null // Don't render if no pending connections
  }

  const contacts: PendingContact[] = pending.slice(0, 3).map((req) => {
    const sender = req.sender
    const name = sender?.display_name || sender?.username || 'Unknown'
    const initials = name
      .split(/\s+/)
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    return {
      id: req.id,
      name,
      headline: sender?.headline ?? '',
      initials,
      avatarUrl: getAvatarUrl(sender?.avatar_path) || sender?.avatar_url || undefined,
    }
  })

  return (
    <DashboardWidget>
      <DashboardWidgetHeader title="Pending Connections" />
      <Stack gap={20}>
        {contacts.map((contact) => (
          <ContactRow
            key={contact.id}
            contact={contact}
            onAccept={() => acceptMutation.mutate(contact.id)}
            onDecline={() => declineMutation.mutate(contact.id)}
            isAccepting={acceptMutation.isPending}
            isDeclining={declineMutation.isPending}
          />
        ))}
      </Stack>
    </DashboardWidget>
  )
}
