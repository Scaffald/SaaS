import { Users, MessageSquare, Calendar } from 'lucide-react-native'
import { Pressable } from 'react-native'
import { Card, Row, Stack, Button, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { communityPalette, CardHeader, MetricRow, MetricDot, Pill } from '@scf/core/components/ui'
import type { Community } from '@scaffald/sdk/resources/communities'

interface CommunityCardProps {
  community: Community
  onPress: () => void
  /** Show Join button (for "All" tab) */
  onJoin?: () => void
  /** Show "Verified" badge and joined date (for "My" tab) */
  joinedAt?: string
  isVerified?: boolean
}

export function CommunityCard({
  community,
  onPress,
  onJoin,
  joinedAt,
  isVerified,
}: CommunityCardProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const pal = communityPalette[t]

  // When there's a Join button, avoid Card pressable to prevent nested <button> in HTML.
  // Use a Pressable wrapper (renders as <div>) instead.
  const hasInteractiveTrailing = !!onJoin

  const trailing = onJoin ? (
    <Button variant="outline" size="sm" onPress={onJoin}>
      Join
    </Button>
  ) : isVerified ? (
    <Pill
      label="Verified"
      bgColor={t === 'dark' ? colors.success[900] : colors.success[100]}
      textColor={colors.success[600]}
    />
  ) : undefined

  const cardContent = (
    <Stack gap={12}>
      <CardHeader
        icon={Users}
        iconBg={pal.iconBg}
        iconColor={pal.iconFg}
        title={community.name}
        subtitle={community.description}
        theme={t}
        trailing={trailing}
      />

      {/* Metrics — inline row matching EmployerCard / JobCard convention */}
      <Row gap={6} align="center">
        <MetricRow icon={Users} text={`${community.member_count} members`} theme={t} />
        <MetricDot theme={t} />
        <MetricRow icon={MessageSquare} text={`${community.post_count} posts`} theme={t} />
        {joinedAt && (
          <>
            <MetricDot theme={t} />
            <MetricRow
              icon={Calendar}
              text={`Joined ${new Date(joinedAt).toLocaleDateString()}`}
              theme={t}
            />
          </>
        )}
      </Row>
    </Stack>
  )

  if (hasInteractiveTrailing) {
    return (
      <Pressable onPress={onPress} style={{ cursor: 'pointer' } as never}>
        <Card padding="md" variant="glass" glassMaterial="thin">
          {cardContent}
        </Card>
      </Pressable>
    )
  }

  return (
    <Card pressable onPress={onPress} padding="md" variant="glass" glassMaterial="thin">
      {cardContent}
    </Card>
  )
}
