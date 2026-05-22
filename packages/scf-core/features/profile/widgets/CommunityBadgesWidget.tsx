/**
 * SC-42: profile widget that surfaces the user's verified community
 * memberships as chips (e.g. "Active in: Electrical, HVAC"). Membership-
 * only for v1.5.0; no endorse/upvote mechanic.
 */

import {
  DashboardWidget,
  DashboardWidgetHeader,
  Row,
  Skeleton,
  Stack,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Users } from 'lucide-react-native'
import { Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useCommunityBadges } from '../../communities/hooks/useCommunityBadges'
import type { ProfileWidgetProps } from './types'

export function CommunityBadgesWidget({ userId }: ProfileWidgetProps) {
  const { theme } = useThemeContext()
  const router = useRouter()
  const { data: badges, isLoading } = useCommunityBadges(userId)

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={12}>
          <Skeleton width={140} height={20} shape="text" />
          <Row gap={8}>
            <Skeleton width={80} height={28} shape="text" />
            <Skeleton width={64} height={28} shape="text" />
            <Skeleton width={96} height={28} shape="text" />
          </Row>
        </Stack>
      </DashboardWidget>
    )
  }

  if (!badges || badges.length === 0) return null

  return (
    <DashboardWidget>
      <Stack gap={12}>
        <DashboardWidgetHeader title="Communities" />
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {badges.map((badge) => (
            <Pressable
              key={badge.community_id}
              accessibilityRole="link"
              accessibilityLabel={`View ${badge.name} community`}
              onPress={() => router.push(`/communities/${badge.slug}` as never)}
              hitSlop={6}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: colors.bg[theme].subtle,
                borderWidth: 1,
                borderColor: colors.border[theme].subtle,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              })}
            >
              <Users size={14} color={colors.text[theme].secondary} />
              <Text style={{ color: colors.text[theme].primary, fontSize: 13, fontWeight: '500' }}>
                {badge.name}
              </Text>
            </Pressable>
          ))}
        </Row>
      </Stack>
    </DashboardWidget>
  )
}
