import { YStack } from 'tamagui'
import { DrawerContentScrollView } from '@react-navigation/drawer'
import { getDrawerSections } from './config'
import { DrawerSection } from './DrawerSection'
import type { DrawerContentProps } from './types'
import { useUserRoles } from '@app/core/utils/auth/useUserRoles'
import { useAssessmentStatus } from '@app/core/features/assessments/hooks/useAssessmentStatus'
import { ScaffaldLogo } from '@app/core/assets'

/**
 * DrawerContent component renders the main content area of the drawer
 * Includes the user header and scrollable navigation sections
 * Uses DrawerContentScrollView for proper gesture handling
 */
export const DrawerContent = ({
  pathname,
  onNavigate,
  expandedItems,
  onToggleExpanded,
  drawerProps,
}: DrawerContentProps) => {
  const { hasOfficeRole, roles } = useUserRoles()
  const assessmentStatus = useAssessmentStatus()

  const teamManagementRoles = new Set([
    'office',
    'super_admin',
    'partner_admin',
    'admin',
    'manager',
  ])
  const hasTeamManagementAccess = roles.some((role: string) => teamManagementRoles.has(role))

  // Get drawer sections with Office link if user has office role and assessment status
  const drawerSections = getDrawerSections({
    includeOfficeLink: hasOfficeRole,
    includeTeamManagementLink: hasTeamManagementAccess,
    assessmentStatus,
  })

  return (
    <YStack flex={1} gap="$4" px="$4" py="$4">
      {/* Top Section - Scaffald Logo */}
      <ScaffaldLogo height={20} width={120} style={{ marginLeft: 26 }} />

      {/* Scrollable Content - Using DrawerContentScrollView for proper gesture handling */}
      <DrawerContentScrollView {...drawerProps} showsVerticalScrollIndicator={false}>
        <YStack flex={1}>
          {drawerSections.map((section) => (
            <DrawerSection
              key={section.key}
              section={section}
              pathname={pathname}
              onNavigate={onNavigate}
              expandedItems={expandedItems}
              onToggleExpanded={onToggleExpanded}
            />
          ))}
        </YStack>
      </DrawerContentScrollView>
    </YStack>
  )
}
