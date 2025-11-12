import { YStack } from 'tamagui'
import { DrawerContentScrollView } from '@react-navigation/drawer'
import { getDrawerSections } from './config'
import { DrawerHeader } from './DrawerHeader'
import { DrawerSection } from './DrawerSection'
import type { DrawerContentProps } from './types'
import { useUserRoles } from '@app/core/utils/auth/useUserRoles'
import { useAssessmentStatus } from '@app/core/features/assessments/hooks/useAssessmentStatus'

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
  const { hasOfficeRole, roles, isLoading } = useUserRoles()
  const assessmentStatus = useAssessmentStatus()

  const teamManagementRoles = new Set([
    'office',
    'super_admin',
    'partner_admin',
    'admin',
    'manager',
  ])
  const hasTeamManagementAccess = roles.some((role: string) =>
    teamManagementRoles.has(role)
  )

  // Debug logging
  console.log('[DrawerContent] Role status:', {
    hasOfficeRole,
    roles,
    isLoading,
    willShowOffice: hasOfficeRole,
  })

  // Get drawer sections with Office link if user has office role and assessment status
  const drawerSections = getDrawerSections({
    includeOfficeLink: hasOfficeRole,
    includeTeamManagementLink: hasTeamManagementAccess,
    assessmentStatus,
  })

  return (
    <YStack flex={1} gap="$4" px="$4" py="$4">
      {/* Top Section - User Profile - Sticky */}
      <DrawerHeader />

      {/* Scrollable Content - Using DrawerContentScrollView for proper gesture handling */}
      <DrawerContentScrollView {...drawerProps} showsVerticalScrollIndicator={false}>
        <YStack gap="$1" flex={1}>
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
