import { Button, Row } from '@scaffald/ui'
import { ROUTES } from '@scf/core/constants/routes'
import { useRouter, usePathname } from 'expo-router'

const TABS = [
  { label: 'Overview', path: ROUTES.DASHBOARD.ANALYTICS.OVERVIEW.path },
  { label: 'Engagement', path: ROUTES.DASHBOARD.ANALYTICS.ENGAGEMENT.path },
  { label: 'Visibility', path: ROUTES.DASHBOARD.ANALYTICS.VISIBILITY.path },
  { label: 'Search', path: ROUTES.DASHBOARD.ANALYTICS.SEARCH.path },
]

export function AnalyticsTabBar() {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <Row gap={4} style={{ flexWrap: 'wrap' }}>
      {TABS.map((tab) => {
        const isActive = pathname === tab.path
        return (
          <Button
            key={tab.path}
            size="sm"
            variant={isActive ? 'filled' : 'ghost'}
            color={isActive ? 'primary' : undefined}
            onPress={() => router.push(tab.path as Parameters<typeof router.push>[0])}
          >
            {tab.label}
          </Button>
        )
      })}
    </Row>
  )
}
