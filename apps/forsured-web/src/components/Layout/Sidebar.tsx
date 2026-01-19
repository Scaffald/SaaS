/**
 * Sidebar - Navigation sidebar component using Beyond UI
 * REQ-4: Multi-Industry User Set Type System with Configurable Lexicon
 * Fully migrated to Beyond UI Sidebar components with enhanced features
 */

import { useMemo } from 'react';
import {
  Sidebar as BeyondSidebar,
  SidebarHeader,
  SidebarMenuItem,
  SidebarFooter,
  useSidebarState,
} from '@unicornlove/beyond-ui';
import type { User as UserType } from '../../types';
import ForsuredLogo from '../Common/ForsuredLogo';
import { SidebarUserProfile } from './SidebarUserProfile';
import { useSidebar } from '../../hooks/useSidebar';
import type { UserRole } from '../../config/sidebarMenus';

interface SidebarProps {
  userRole: UserRole;
  user: UserType;
  onNotificationsClick?: () => void;
  onSettingsClick?: () => void;
  alertCount?: number;
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  badges?: Partial<Record<string, number>>;
}

export default function Sidebar({
  userRole,
  user,
  onNotificationsClick: _onNotificationsClick,
  onSettingsClick,
  alertCount: _alertCount,
  collapsed: controlledCollapsed,
  onCollapseChange,
  badges,
}: SidebarProps) {
  // Use sidebar state persistence hook
  const [persistedCollapsed, setPersistedCollapsed] = useSidebarState({
    storageKey: 'forsured-sidebar-collapsed',
    defaultCollapsed: false,
  });

  // Support both controlled and uncontrolled mode
  const isControlled = controlledCollapsed !== undefined;
  const isCollapsed = isControlled ? controlledCollapsed : persistedCollapsed;

  const handleCollapseChange = (newCollapsed: boolean) => {
    if (isControlled && onCollapseChange) {
      onCollapseChange(newCollapsed);
    } else {
      setPersistedCollapsed(newCollapsed);
    }
  };

  // Get sidebar data from custom hook
  const {
    menuItems,
    footerActions,
    isActive,
    userInitials,
    userDisplayName,
    userSupportingText,
  } = useSidebar({ userRole, user, badges, onSettingsClick });

  // Memoized menu items to prevent re-renders
  const renderedMenuItems = useMemo(
    () =>
      menuItems.map((item) => (
        <SidebarMenuItem
          key={item.path}
          icon={item.icon}
          label={item.label}
          state={isActive(item.path, item.exact) ? 'active' : 'default'}
          badge={item.badge}
          onPress={() => window.location.href = item.path}
        />
      )),
    [menuItems, isActive]
  );

  return (
    <BeyondSidebar
      variant="main"
      collapsed={isCollapsed}
      onCollapseChange={handleCollapseChange}
      showHamburger
      hamburgerPosition="header"
      mode="auto"
      keyboard={{
        enabled: true,
        toggleShortcut: 'ctrl+b',
        arrowNavigation: true,
      }}
      animated
      animationDuration={250}
      header={
        <SidebarHeader
          logo={<ForsuredLogo height={32} />}
          onCollapse={() => handleCollapseChange(!isCollapsed)}
        />
      }
      footer={<SidebarFooter actions={footerActions} />}
    >
      {/* User Profile Section */}
      {!isCollapsed && (
        <>
          <SidebarUserProfile
            initials={userInitials}
            displayName={userDisplayName}
            supportingText={userSupportingText}
          />
          <SidebarMenuItem type="divider" />
        </>
      )}

      {/* Navigation Menu Items */}
      {renderedMenuItems}
    </BeyondSidebar>
  );
}
