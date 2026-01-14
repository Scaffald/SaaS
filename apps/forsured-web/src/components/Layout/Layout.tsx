/**
 * Layout - Main application layout using Beyond UI
 * Migrated from Tamagui to Beyond UI
 *
 * Accessibility features:
 * - Skip link for keyboard users to bypass navigation
 * - Proper landmark roles (main, navigation)
 * - Focus management
 */
import { useState, useEffect } from 'react';
import { Outlet, useNavigate, Navigate } from 'react-router-dom';
import { Row, Stack, Text, SkipLink } from '@unicornlove/beyond-ui';
import Sidebar from './Sidebar';
import ClientsDropdown from './ClientsDropdown';
import { useAuth } from '../../contexts/AuthContext';
import { useApprovals } from '../../hooks/useApprovals';
import LoadingSpinner from '../Common/LoadingSpinner';
import { PageViewTracker } from '../../hooks/usePageView';

// Sidebar widths from beyond-ui design system
const SIDEBAR_WIDTH_EXPANDED = 272;
const SIDEBAR_WIDTH_COLLAPSED = 80;

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
  };
  return mapping[dbType] || 'broker';
}

export default function Layout() {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const { approvals } = useApprovals({ status: 'pending' });
  const pendingApprovalsCount = approvals.length;

  // Sidebar collapse state with localStorage persistence
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('forsured-sidebar-collapsed') === 'true';
    }
    return false;
  });

  // Sync to localStorage when collapse state changes
  useEffect(() => {
    localStorage.setItem('forsured-sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  // Show loading while auth state is being determined
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Redirect unauthenticated users to start page
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Redirect users without profile to signup
  if (!profile) {
    return <Navigate to="/signup" replace />;
  }

  // Map database type to UI type
  const uiUserType = mapDbTypeToUiType(profile.user_type);

  const getNotificationsPath = () => {
    if (uiUserType === 'manager') return '/manager/notifications';
    if (uiUserType === 'broker') return '/broker/notifications';
    if (uiUserType === 'subcontractor')
      return '/subcontractor/notifications';
    return '/notifications';
  };

  return (
    <>
      {/* Skip link for keyboard accessibility - allows users to skip navigation */}
      <SkipLink targetId="main-content">Skip to main content</SkipLink>

      <Row
        style={{
          height: '100vh',
          backgroundColor: 'var(--color-background-hover)',
        }}
      >
        {/* Track page views for audit logging */}
        <PageViewTracker excludePaths={['/api', '/health']} />
        <Sidebar
        userRole={uiUserType}
        user={profile}
        onNotificationsClick={() => navigate(getNotificationsPath())}
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
        }}
      >
        {/* Header Bar for Broker - shows Clients dropdown */}
        {uiUserType === 'broker' && (
          <Row
            as="header"
            alignItems="center"
            justifyContent="space-between"
            style={{
              backgroundColor: 'var(--color-background-hover)',
              borderBottom: '1px solid var(--color-border)',
              paddingLeft: 24,
              paddingRight: 24,
              paddingTop: 12,
              paddingBottom: 12,
            }}
          >
            <ClientsDropdown />
            <Text size="sm" muted>
              Quick Jump to Client
            </Text>
          </Row>
        )}
        <Stack
          as="main"
          id="main-content"
          flex={1}
          style={{
            overflowX: 'hidden',
            overflowY: 'auto',
            padding: 24,
          }}
          tabIndex={-1}
        >
          <Outlet />
        </Stack>
      </Stack>
      </Row>
    </>
  );
}
