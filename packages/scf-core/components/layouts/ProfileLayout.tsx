import type { ReactNode } from 'react'
import { ScrollView } from 'react-native'
import {
  Grid,
  Row,
  Stack,
  Breadcrumb,
  type BreadcrumbItemData,
  useResponsive,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs'

/** Golden ratio (φ) for column proportion: left ~61.8%, right ~38.2% */
const GOLDEN_RATIO_TEMPLATE = 'minmax(300px, 1.618fr) minmax(300px, 1fr)'

type ProfileLayoutProps = {
  rightContent?: ReactNode
  leftContent: ReactNode
  /** Whether to show breadcrumb navigation (default: true) */
  showBreadcrumb?: boolean
  /** Manual breadcrumb items to override auto-generation */
  breadcrumbItems?: BreadcrumbItemData[]
  /** Whether to auto-generate breadcrumbs from route (default: true) */
  autoGenerateBreadcrumbs?: boolean
}

export const ProfileLayout = ({
  rightContent,
  leftContent,
  showBreadcrumb = false,
  breadcrumbItems,
  autoGenerateBreadcrumbs = true,
}: ProfileLayoutProps) => {
  const { isDesktop } = useResponsive()
  const { theme } = useThemeContext()
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light'
  const hasRightContent = rightContent != null
  const contentPadding = isDesktop ? '2xl' : 'lg'
  const columnGap = isDesktop ? 48 : 24

  const { breadcrumbs } = useBreadcrumbs({
    autoGenerate: autoGenerateBreadcrumbs && !breadcrumbItems,
    customItems: breadcrumbItems,
  })

  const displayBreadcrumbs = breadcrumbItems || breadcrumbs
  const currentIndex = displayBreadcrumbs.length - 1
  const bgColor = colors.bg[resolvedTheme].emphasis

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bgColor }} showsVerticalScrollIndicator={false}>
      <Stack gap={24} paddingTop="sm" paddingBottom="lg">
        {/* Breadcrumb - positioned at top */}
        {showBreadcrumb && displayBreadcrumbs.length > 0 && (
          <Row paddingHorizontal={contentPadding}>
            <Breadcrumb items={displayBreadcrumbs} currentIndex={currentIndex} />
          </Row>
        )}

        {/* Content Area - Two-column golden ratio (lg+) or single column */}
        <Stack paddingHorizontal={contentPadding}>
          <Grid
            columns={{ base: 1, lg: hasRightContent ? GOLDEN_RATIO_TEMPLATE : '1fr' }}
            gap={columnGap}
            rowGap={isDesktop ? 32 : 24}
          >
            <Stack>{leftContent}</Stack>
            {rightContent ? <Stack>{rightContent}</Stack> : null}
          </Grid>
        </Stack>
      </Stack>
    </ScrollView>
  )
}
