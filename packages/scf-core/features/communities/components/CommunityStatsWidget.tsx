import { ROUTES } from '@scf/core/constants/routes'
import {
  useMyCommunities,
  useScaffoldScore,
} from '@scf/core/utils/communities-sdk-hooks'
import { useConnections } from '@scf/core/utils/engagement-sdk-hooks'
import {
  Button,
  DashboardWidget,
  DashboardWidgetHeader,
  Skeleton,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Award, Bookmark, Link2, Users } from 'lucide-react-native'
import { useRouter } from 'expo-router'

function StatRow({
  icon,
  label,
  value,
  theme,
  onPress,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  theme: 'light' | 'dark'
  onPress?: () => void
}) {
  const content = (
    <Row align="center" justify="space-between" style={{ paddingVertical: 8 }}>
      <Row align="center" gap={8}>
        {icon}
        <Text size="md" style={{ color: colors.text[theme].secondary }}>
          {label}
        </Text>
      </Row>
      <Text size="md" weight="semibold" style={{ color: colors.text[theme].primary }}>
        {value}
      </Text>
    </Row>
  )

  if (onPress) {
    return (
      <Button variant="text" onPress={onPress} style={{ paddingHorizontal: 0 }}>
        {content}
      </Button>
    )
  }
  return content
}

function CommunityStatsWidgetSkeleton() {
  return (
    <DashboardWidget gap={12}>
      <Skeleton width={130} height={16} shape="text" />
      {[0, 1, 2, 3].map((i) => (
        <Row key={i} align="center" justify="space-between">
          <Skeleton width={120} height={14} shape="text" />
          <Skeleton width={30} height={14} shape="text" />
        </Row>
      ))}
    </DashboardWidget>
  )
}

/**
 * Shows community engagement stats: communities joined, connections, reputation score, bookmarks.
 */
export function CommunityStatsWidget() {
  const router = useRouter()
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  const { data: myCommunitiesData, isLoading: communitiesLoading } = useMyCommunities()
  const { data: scoreData, isLoading: scoreLoading } = useScaffoldScore()
  const { data: connectionsData, isLoading: connectionsLoading } = useConnections()

  if (communitiesLoading || scoreLoading || connectionsLoading) {
    return <CommunityStatsWidgetSkeleton />
  }

  const communityCount = myCommunitiesData?.data?.length ?? 0
  const connectionCount = connectionsData?.data?.length ?? 0
  const score = scoreData?.data?.score ?? 0

  return (
    <DashboardWidget gap={0} elevated>
      <DashboardWidgetHeader title="Your Network" />

      <Stack
        gap={0}
        style={{
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <StatRow
          icon={<Users size={16} color={colors.icon[t].default} />}
          label="Communities"
          value={communityCount}
          theme={t}
          onPress={() => router.push(ROUTES.COMMUNITIES.path)}
        />
        <Stack style={{ height: 1, backgroundColor: colors.border[t].default }} />
        <StatRow
          icon={<Link2 size={16} color={colors.icon[t].default} />}
          label="Connections"
          value={connectionCount}
          theme={t}
          onPress={() => router.push(ROUTES.COMMUNITIES.CONNECTIONS.path)}
        />
        <Stack style={{ height: 1, backgroundColor: colors.border[t].default }} />
        <StatRow
          icon={<Award size={16} color={colors.icon[t].default} />}
          label="Scaffold Score"
          value={score}
          theme={t}
          onPress={() => router.push(ROUTES.COMMUNITIES.REPUTATION.path)}
        />
        <Stack style={{ height: 1, backgroundColor: colors.border[t].default }} />
        <StatRow
          icon={<Bookmark size={16} color={colors.icon[t].default} />}
          label="Bookmarks"
          value="View"
          theme={t}
          onPress={() => router.push(ROUTES.COMMUNITIES.BOOKMARKS.path)}
        />
      </Stack>
    </DashboardWidget>
  )
}
