import { ROUTES } from '@scf/core/constants/routes'
import { DashboardWidget, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { ArrowRight } from 'lucide-react-native'
import { Link, usePathname } from 'expo-router'

type BackgroundCheckNavItem = {
  key: string
  title: string
  description: string
  path: string
}

const BACKGROUND_CHECK_NAV_ITEMS: BackgroundCheckNavItem[] = [
  {
    key: 'overview',
    title: 'Overview',
    description: 'Monitor organization requests, statuses, and results.',
    path: ROUTES.OFFICE.ATS.CHECKS.path,
  },
  {
    key: 'admin',
    title: 'Admin Review',
    description: 'Review escalated checks and manage compliance workflows.',
    path: ROUTES.OFFICE.ATS.CHECKS.ADMIN.path,
  },
  {
    key: 'request',
    title: 'Request Check',
    description: 'Launch a new background check for an organization member.',
    path: ROUTES.OFFICE.ATS.CHECKS.REQUEST.path,
  },
]

export function BackgroundCheckNavigationMenu() {
  const pathname = usePathname()
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light' as const

  return (
    <DashboardWidget gap={16}>
      <Stack gap={4}>
        <Text style={{ color: colors.text[t].secondary }}>Background Check Tools</Text>
        <Text style={{ color: colors.text[t].secondary }}>Switch between related workflows and management tools.</Text>
      </Stack>

      <Stack gap={8}>
        {BACKGROUND_CHECK_NAV_ITEMS.map((item) => {
          const normalizedPath = pathname?.replace(/\/$/, '') ?? ''
          const itemPath = item.path.replace(/\/$/, '')
          const isOverview = item.key === 'overview'
          const isActive = isOverview
            ? normalizedPath === itemPath
            : normalizedPath === itemPath || normalizedPath.startsWith(`${itemPath}/`)

          return (
            <Link key={item.key} href={item.path} asChild>
              <Stack
                paddingHorizontal={16}
                paddingVertical={12}
                gap={8}
                borderRadius={16}
                borderWidth={1}
                style={{
                  borderColor: isActive ? (t === 'dark' ? colors.blue[700] : colors.blue[300]) : colors.border[t].default,
                  backgroundColor: isActive ? (t === 'dark' ? colors.blue[900] : colors.blue[50]) : colors.bg[t].muted,
                }}
              >
                <Stack gap={4}>
                  <Text style={{ color: isActive ? (t === 'dark' ? colors.blue[100] : colors.blue[900]) : colors.text[t].primary }}>{item.title}</Text>
                  <Text style={{ color: isActive ? (t === 'dark' ? colors.blue[300] : colors.blue[600]) : colors.text[t].secondary }}>{item.description}</Text>
                </Stack>

                <Row gap={8} align="center">
                  <Text style={{ color: isActive ? (t === 'dark' ? colors.blue[100] : colors.blue[900]) : colors.text[t].primary }}>View workspace</Text>
                  <ArrowRight size={20} color={isActive ? (t === 'dark' ? colors.blue[300] : colors.blue[600]) : colors.text[t].secondary} />
                </Row>
              </Stack>
            </Link>
          )
        })}
      </Stack>
    </DashboardWidget>
  )
}
