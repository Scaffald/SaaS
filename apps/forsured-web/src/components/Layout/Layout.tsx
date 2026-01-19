/**
 * Layout - Main application layout using Beyond UI
 * Migrated from Tamagui to Beyond UI
 *
 * Accessibility features:
 * - Skip link for keyboard users to bypass navigation
 * - Proper landmark roles (main, navigation)
 * - Focus management
 */
import { useState, useEffect } from 'react'
import { Outlet, useNavigate, Navigate, useLocation } from 'react-router-dom'
import { Stack, SkipLink, CommandMenu } from '@unicornlove/beyond-ui'
import type { CommandMenuItemData } from '@unicornlove/beyond-ui'
import Sidebar from './Sidebar'
import DashboardHeader from './DashboardHeader'
import ProfileModal from '../Settings/ProfileModal'
import { NotificationModal } from '../Notifications/NotificationModal'
import { useAuth } from '../../contexts/AuthContext'
import { useApprovals } from '../../hooks/useApprovals'
import { useNotifications } from '../../hooks/useNotifications'
import { useCommandMenu } from '../../hooks/useCommandMenu'
import { getCommandMenuItems } from '../../utils/commandMenuItems'
import LoadingSpinner from '../Common/LoadingSpinner'
import { PageViewTracker } from '../../hooks/usePageView'

// Sidebar widths from beyond-ui design system
const SIDEBAR_WIDTH_EXPANDED = 272
const SIDEBAR_WIDTH_COLLAPSED = 80

/**
 * Map database user types to UI user types
 * Database uses: gc, contractor, broker, admin
 * UI uses: manager, subcontractor, broker, admin
 */
function mapDbTypeToUiType(dbType: string): 'manager' | 'subcontractor' | 'broker' {
  const mapping: Record<string, 'manager' | 'subcontractor' | 'broker'> = {
    gc: 'manager',
    contractor: 'subcontractor',
    broker: 'broker',
    admin: 'broker', // Admin uses broker layout for now
    // Also accept already-mapped types
    manager: 'manager',
    subcontractor: 'subcontractor',
  }
  return mapping[dbType] || 'broker'
}

export default function Layout() {
  const { user, profile, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { approvals } = useApprovals({ status: 'pending' })
  const pendingApprovalsCount = approvals.length

  // Sidebar collapse state with localStorage persistence
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('forsured-sidebar-collapsed') === 'true'
    }
    return false
  })

  // Profile modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  // Notifications modal state
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false)

  // Fetch unread notification count
  const { unreadCount } = useNotifications({
    status: 'all',
    limit: 1,
    enabled: true, // Always fetch unread count
  })

  // CommandMenu integration - MUST be called before any conditional returns
  const { isOpen, closeMenu } = useCommandMenu()

  // Sync to localStorage when collapse state changes
  useEffect(() => {
    localStorage.setItem('forsured-sidebar-collapsed', String(sidebarCollapsed))
  }, [sidebarCollapsed])

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED

  // Show loading while auth state is being determined
  if (isLoading) {
    return <LoadingSpinner />
  }

  // Redirect unauthenticated users to start page
  if (!user) {
    return <Navigate to="/" replace />
  }

  // Redirect users without profile to signup
  if (!profile) {
    return <Navigate to="/signup" replace />
  }

  // Map database type to UI type
  const uiUserType = mapDbTypeToUiType(profile.user_type)

  // Get command menu items based on user type
  const { tabs, items } = getCommandMenuItems(uiUserType)

  const handleItemSelect = (item: CommandMenuItemData) => {
    const path = item.data?.path as string | undefined
    if (path) {
      navigate(path)
      closeMenu()
    }
  }


  // Get page title from current path
  const getPageTitle = (pathname: string): string => {
    // Extract page name from path
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length === 0) return 'Dashboard'

    // Get the last segment and capitalize it
    const lastSegment = segments[segments.length - 1]
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ')
  }

  return (
    <>
      {/* Skip link for keyboard accessibility - allows users to skip navigation */}
      <SkipLink targetId="main-content">Skip to main content</SkipLink>

      <Stack
        style={{
          flexDirection: 'row',
          height: '100vh',
          backgroundColor: 'var(--color-background-hover)',
        }}
      >
        {/* Track page views for audit logging */}
        <PageViewTracker excludePaths={['/api', '/health']} />
        <Sidebar
          userRole={uiUserType}
          user={profile}
          onNotificationsClick={() => setIsNotificationsModalOpen(true)}
          onSettingsClick={() => setIsProfileModalOpen(true)}
          alertCount={pendingApprovalsCount}
          collapsed={sidebarCollapsed}
          onCollapseChange={setSidebarCollapsed}
        />

        <Stack
          flex={1}
          style={{
            flexDirection: 'column',
            overflow: 'hidden',
            marginLeft: sidebarWidth,
            transition: 'margin-left 0.2s ease-in-out',
            backgroundColor: 'var(--color-background-hover)',
          }}
        >
          {/* Dashboard Header */}
          <DashboardHeader
            title={getPageTitle(location.pathname)}
            onNotificationsPress={() => setIsNotificationsModalOpen(true)}
            notificationCount={unreadCount}
          />

          <Stack
            as="main"
            id="main-content"
            flex={1}
            style={{
              overflowX: 'hidden',
              overflowY: 'auto',
              paddingTop: '24px',
              paddingBottom: '24px',
              paddingLeft: 'clamp(24px, 4vw, 48px)', // Responsive: 24-48px based on viewport
              paddingRight: 'clamp(32px, 5vw, 64px)', // Responsive: 32-64px based on viewport
              backgroundColor: 'var(--color-background)',
            }}
            tabIndex={-1}
          >
            <Outlet />
          </Stack>
        </Stack>
      </Stack>

      {/* CommandMenu with backdrop */}
      {isOpen && (
        <Stack
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onPress={closeMenu}
        >
          <Stack
            style={{
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <CommandMenu
              open={isOpen}
              onOpenChange={closeMenu}
              tabs={tabs}
              items={items}
              onItemSelect={handleItemSelect}
              placeholder="Search commands..."
              helperText="Type to search or use arrow keys to navigate"
            />
          </Stack>
        </Stack>
      )}

      {/* Profile Settings Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Notifications Modal */}
      <NotificationModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
      />
    </>
  )
}
