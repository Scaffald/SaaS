import { getChildRoutes } from '@app/core/utils/navigation/routeHierarchy'
import { useTranslation } from '@app/core/utils/useTranslation'
import { usePathname } from '@app/core/utils/usePathname'
import { useMemo } from 'react'
import { useWindowDimensions } from '@unicornlove/ui'
import { Tab, TabGroup, type TabGroupProps } from '@unicornlove/ui'

export type AssessmentsTabsItem = {
  key: string
  label: string
  href: string
  badge?: string
  isActive?: boolean
}

export type AssessmentsTabsProps = {
  ariaLabel?: string
} & Omit<TabGroupProps, 'value' | 'onValueChange' | 'children' | 'ariaLabel'>

const isPathActive = (currentPath: string, targetHref: string) => {
  if (!targetHref) return false

  const normalizedCurrent = currentPath.replace(/\/$/, '')
  const normalizedTarget = targetHref.replace(/\/$/, '')

  if (normalizedCurrent === normalizedTarget) {
    return true
  }

  const base = normalizedTarget.split('/:')[0]
  if (!base) {
    return false
  }

  if (normalizedTarget.startsWith('/dashboard/assessments/')) {
    const targetDepth = base.split('/').filter(Boolean).length
    const currentDepth = normalizedCurrent.split('/').filter(Boolean).length

    if (targetDepth === 3 && currentDepth >= 3) {
      return normalizedCurrent === base || normalizedCurrent.startsWith(`${base}/`)
    }
  }

  return normalizedCurrent === base || normalizedCurrent.startsWith(`${base}/`)
}

export const AssessmentsTabs = ({
  ariaLabel = 'Assessments navigation',
  ...tabGroupProps
}: AssessmentsTabsProps) => {
  const pathname = usePathname()
  const currentPath = pathname ?? ''
  const { width } = useWindowDimensions()
  const isSmallScreen = width <= 800
  const { t } = useTranslation()

  const childRoutes = useMemo(() => getChildRoutes('/dashboard/assessments'), [])

  const directChildRoutes = useMemo(() => {
    return childRoutes.filter((route) => {
      const pathSegments = route.path.split('/').filter(Boolean)
      return pathSegments.length === 3
    })
  }, [childRoutes])

  const items: AssessmentsTabsItem[] = useMemo(
    () =>
      directChildRoutes.map((route) => ({
        key: route.path,
        label: t(route.titleKey),
        href: route.path,
      })),
    [directChildRoutes, t]
  )

  const activeValue = useMemo(() => {
    const activeItem = items.find((item) => isPathActive(currentPath, item.href))
    return activeItem?.key ?? items[0]?.key ?? ''
  }, [currentPath, items])

  if (items.length === 0) {
    return null
  }

  const handleValueChange = (_value: string) => {
    // Navigation handled by Link components
  }

  return (
    <TabGroup
      value={activeValue}
      onValueChange={handleValueChange}
      ariaLabel={ariaLabel}
      scrollable={isSmallScreen}
      {...tabGroupProps}
    >
      {items.map((item) => (
        <Tab
          key={item.key}
          value={item.key}
          label={item.label}
          href={item.href}
          badge={item.badge}
        />
      ))}
    </TabGroup>
  )
}
