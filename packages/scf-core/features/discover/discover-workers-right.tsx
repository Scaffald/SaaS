import { Users, TrendingUp } from 'lucide-react-native'
import { View } from 'react-native'
import {
  Card,
  Row,
  ScrollView,
  Stack,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

/**
 * Discover Workers Right Panel — Sidebar widgets
 * Shows insights, top trades distribution, and community hub.
 * All search/filter functionality is handled by the PageHeader.
 */
export function DiscoverWorkersRight() {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <Stack gap={20} padding="md">
        {/* Worker Growth Widget */}
        <WorkerGrowthWidget theme={t} />

        {/* Top Trades Widget */}
        <TopTradesWidget theme={t} />

        {/* Community Hub Widget */}
        <CommunityHubWidget theme={t} />
      </Stack>
    </ScrollView>
  )
}

// ---------------------------------------------------------------------------
// Worker Growth Widget
// ---------------------------------------------------------------------------

function WorkerGrowthWidget({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <Card variant="glass" glassMaterial="thin" padding="lg" radius="xl">
      <Stack gap={12}>
        <Row justify="space-between" align="center">
          <Text
            style={{
              fontWeight: '700',
              fontSize: 18,
              color: colors.text[theme].primary,
            }}
          >
            Worker Growth
          </Text>
          <TrendingUp size={18} color={colors.text[theme].secondary} />
        </Row>

        <Stack gap={2}>
          <Text
            style={{
              fontWeight: '800',
              fontSize: 28,
              color: colors.text[theme].primary,
              letterSpacing: -0.5,
            }}
          >
            124
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '500',
              color: colors.text[theme].tertiary,
            }}
          >
            New Signups (Last 30 Days)
          </Text>
        </Stack>

        {/* Trend line placeholder */}
        <View
          style={{
            height: 48,
            width: '100%',
            marginTop: 4,
            borderRadius: 8,
            backgroundColor: theme === 'dark'
              ? 'rgba(79, 100, 91, 0.1)'
              : 'rgba(79, 100, 91, 0.05)',
          }}
        />
      </Stack>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Top Trades Widget
// ---------------------------------------------------------------------------

const TOP_TRADES = [
  { name: 'Structural Mason', percentage: 42 },
  { name: 'LEED Specialist', percentage: 28 },
  { name: 'Master Electrician', percentage: 18 },
  { name: 'Safety Lead', percentage: 12 },
]

function TopTradesWidget({ theme }: { theme: 'light' | 'dark' }) {
  const barBg = theme === 'dark' ? colors.gray[700] : 'rgba(214, 211, 205, 0.4)'
  const barFill = theme === 'dark' ? colors.green[400] : '#4f645b'

  return (
    <Card variant="glass" glassMaterial="thin" padding="lg" radius="xl">
      <Stack gap={16}>
        <Text
          style={{
            fontWeight: '700',
            fontSize: 18,
            color: colors.text[theme].primary,
          }}
        >
          Top Trades
        </Text>

        <Stack gap={14}>
          {TOP_TRADES.map((trade) => (
            <Stack key={trade.name} gap={6}>
              <Row justify="space-between" align="center">
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: colors.text[theme].primary,
                  }}
                >
                  {trade.name}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: colors.text[theme].secondary,
                  }}
                >
                  {trade.percentage}%
                </Text>
              </Row>
              <View
                style={{
                  height: 6,
                  width: '100%',
                  borderRadius: 9999,
                  backgroundColor: barBg,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    height: '100%',
                    width: `${trade.percentage}%`,
                    borderRadius: 9999,
                    backgroundColor: barFill,
                  }}
                />
              </View>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Community Hub Widget
// ---------------------------------------------------------------------------

const SUGGESTED_CONTACTS = [
  { name: 'Julian Voss', role: 'Arch. Planner' },
  { name: 'Lana Dre', role: 'Sustainability' },
]

function CommunityHubWidget({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <Card variant="glass" glassMaterial="thin" padding="lg" radius="xl">
      <Stack gap={16}>
        <Row gap={8} align="center">
          <Users size={18} color={colors.text[theme].secondary} />
          <Text
            style={{
              fontWeight: '700',
              fontSize: 18,
              color: colors.text[theme].primary,
            }}
          >
            Community Hub
          </Text>
        </Row>

        {/* Growth Tip Card */}
        <View
          style={{
            backgroundColor: theme === 'dark'
              ? colors.bg.dark.subtle
              : colors.bg.light.subtle,
            padding: 14,
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: 1.2,
              color: colors.text[theme].secondary,
              marginBottom: 6,
            }}
          >
            Growth Tip
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '500',
              lineHeight: 19,
              color: colors.text[theme].primary,
            }}
          >
            Prioritize organic material sourcing to increase your sustainability
            score by up to 15%.
          </Text>
        </View>

        {/* Suggested Contacts */}
        <Stack gap={12}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: colors.text[theme].tertiary,
            }}
          >
            Suggested Contacts
          </Text>
          {SUGGESTED_CONTACTS.map((contact) => (
            <Row key={contact.name} justify="space-between" align="center">
              <Row gap={10} align="center" style={{ flex: 1, minWidth: 0 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: theme === 'dark'
                      ? colors.gray[700]
                      : colors.gray[200],
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: colors.text[theme].secondary,
                    }}
                  >
                    {contact.name.charAt(0)}
                  </Text>
                </View>
                <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: colors.text[theme].primary,
                    }}
                    numberOfLines={1}
                  >
                    {contact.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.text[theme].tertiary,
                    }}
                    numberOfLines={1}
                  >
                    {contact.role}
                  </Text>
                </Stack>
              </Row>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: colors.text[theme].secondary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Connect
              </Text>
            </Row>
          ))}
        </Stack>
      </Stack>
    </Card>
  )
}
