import {
  DashboardWidget,
  DashboardWidgetHeader,
  Stack,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

type ActivityItem = {
  id: string
  parts: Array<{ text: string; bold?: boolean; accent?: boolean }>
  timestamp: string
}

const PLACEHOLDER_ITEMS: ActivityItem[] = [
  {
    id: '1',
    parts: [
      { text: 'You connected with ' },
      { text: 'a new contact', bold: true },
    ],
    timestamp: '2 hours ago',
  },
  {
    id: '2',
    parts: [
      { text: 'Your application for ' },
      { text: 'a position', bold: true },
      { text: ' was viewed' },
    ],
    timestamp: '5 hours ago',
  },
  {
    id: '3',
    parts: [
      { text: 'You appeared in ' },
      { text: '12 searches', bold: true },
      { text: ' this week' },
    ],
    timestamp: 'Yesterday',
  },
  {
    id: '4',
    parts: [
      { text: 'You commented on ' },
      { text: 'a community post', accent: true },
    ],
    timestamp: '2 days ago',
  },
]

function ActivityRow({ item }: { item: ActivityItem }) {
  const { theme } = useThemeContext()

  return (
    <Stack gap={4}>
      <Text style={{ fontSize: 13, color: colors.text[theme].secondary, lineHeight: 19 }}>
        {item.parts.map((part, i) => {
          if (part.bold) {
            return (
              <Text
                key={i}
                style={{ fontSize: 13, fontWeight: '700', color: colors.text[theme].primary }}
              >
                {part.text}
              </Text>
            )
          }
          if (part.accent) {
            return (
              <Text
                key={i}
                style={{ fontSize: 13, fontWeight: '500', color: colors.primary[600] }}
              >
                {part.text}
              </Text>
            )
          }
          return part.text
        })}
      </Text>
      <Text style={{ fontSize: 12, color: colors.text[theme].tertiary }}>
        {item.timestamp}
      </Text>
    </Stack>
  )
}

/**
 * RecentActivityWidget
 * Lightweight text-based activity feed for the dashboard right column.
 */
export function RecentActivityWidget() {
  return (
    <DashboardWidget>
      <DashboardWidgetHeader title="Recent Activity" />
      <Stack gap={16}>
        {PLACEHOLDER_ITEMS.map((item) => (
          <ActivityRow key={item.id} item={item} />
        ))}
      </Stack>
    </DashboardWidget>
  )
}
