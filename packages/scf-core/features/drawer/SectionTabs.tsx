import { useScreenRhythm } from '@scf/core/constants/layout'
import { useUserRoles } from '@scf/core/utils/auth/useUserRoles'
import { useOrganizations } from '@scf/core/utils/useOrganizations'
import { usePathname } from '@scf/core/utils/usePathname'
import { useTranslation } from '@scf/core/utils/useTranslation'
import { useRouter } from 'expo-router'
import { useCallback, useMemo } from 'react'
import { View } from 'react-native'
import { Tabs } from '@scaffald/ui'
import { getNavItems } from './config'
import { getSectionTabs } from './section-tabs'
import { normalizePath } from './utils'

/**
 * The folder-tab strip across the top of a section's screens.
 *
 * Where the drawer used to open a section into an indented tree of its
 * children, the children are now tabs here — the prototype's arrangement,
 * and the same `Tabs type="folder"` every list screen already uses for its
 * primary partition. Rendered once by the shell, so a screen gets its tabs
 * without drawing them; a route the nav config does not claim gets nothing.
 */
export function SectionTabs() {
  const pathname = normalizePath(usePathname())
  const router = useRouter()
  const { t } = useTranslation()
  const { gutter, isDesktop } = useScreenRhythm()
  const { data: memberships } = useOrganizations()
  const { hasOfficeRole } = useUserRoles()

  const items = useMemo(
    () => getNavItems(memberships ?? undefined, hasOfficeRole),
    [memberships, hasOfficeRole]
  )
  const strip = useMemo(() => getSectionTabs(pathname, items), [pathname, items])

  const go = useCallback(
    (key: string) => {
      const tab = strip?.tabs.find((candidate) => candidate.key === key)
      if (tab && tab.key !== strip?.activeKey) router.push(tab.href as never)
    },
    [router, strip]
  )

  if (!strip) return null

  return (
    <View
      testID="section-tabs"
      style={{ paddingHorizontal: gutter, paddingTop: isDesktop ? 20 : 12 }}
    >
      <Tabs type="folder" value={strip.activeKey ?? ''} onValueChange={go} scrollable={!isDesktop}>
        {strip.tabs.map((tab) => (
          <Tabs.Item key={tab.key} value={tab.key}>
            <Tabs.Trigger>{tab.titleKey ? t(tab.titleKey) : (tab.title ?? tab.key)}</Tabs.Trigger>
          </Tabs.Item>
        ))}
      </Tabs>
    </View>
  )
}
