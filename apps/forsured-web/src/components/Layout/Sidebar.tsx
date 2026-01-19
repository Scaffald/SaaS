/**
 * Sidebar - Navigation sidebar component using Beyond UI
 * REQ-4: Multi-Industry User Set Type System with Configurable Lexicon
 * Fully migrated to Beyond UI Sidebar components
 * Updated to match Figma design system comps
 */
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Settings,
  Handshake,
  FileText,
  Building,
  Briefcase,
  LogOut,
  CheckSquare,
  LifeBuoy,
  Shield,
  Moon,
  Sun,
} from 'lucide-react';
import {
  Sidebar as BeyondSidebar,
  SidebarHeader,
  SidebarMenuItem,
  SidebarFooter,
  Avatar,
  useThemeContext,
} from '@unicornlove/beyond-ui';
import type { User as UserType } from '../../types';
import ForsuredLogo from '../Common/ForsuredLogo';
import { useAuth } from '../../contexts/AuthContext';
import { useLexicon } from '../../contexts/LexiconContext';
import { useTheme } from '../../contexts/ThemeContext';

interface SidebarProps {
  userRole: 'manager' | 'subcontractor' | 'broker';
  user: UserType;
  onNotificationsClick: () => void;
  alertCount: number;
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
}

// Helper to get initials from name
const getInitials = (name: string | undefined | null): string => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';
};

export default function Sidebar({
  userRole,
  user,
  onNotificationsClick: _onNotificationsClick,
  alertCount: _alertCount,
  collapsed: controlledCollapsed,
  onCollapseChange,
}: SidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { toggleTheme } = useThemeContext();

  // Support both controlled and uncontrolled mode
  const isControlled = controlledCollapsed !== undefined;

  // Internal state for uncontrolled mode with localStorage persistence
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('forsured-sidebar-collapsed') === 'true';
    }
    return false;
  });

  const isCollapsed = isControlled ? controlledCollapsed : internalCollapsed;

  const handleCollapseChange = (newCollapsed: boolean) => {
    if (isControlled && onCollapseChange) {
      onCollapseChange(newCollapsed);
    } else {
      setInternalCollapsed(newCollapsed);
    }
  };

  // Persist to localStorage (for both controlled and uncontrolled)
  useEffect(() => {
    localStorage.setItem('forsured-sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  // REQ-4: Use lexicon for dynamic labels
  const { t, getContractorLabel } = useLexicon();

  // Check if path is active (supports nested routes)
  const isActive = (path: string) => location.pathname.startsWith(path);

  // REQ-4: Menu items with lexicon-based labels
  const managerMenuItems = [
    { path: '/manager/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { path: '/manager/tasks', label: t('nav.tasks'), icon: CheckSquare },
    { path: '/manager/projects', label: t('nav.projects'), icon: Building },
    { path: '/manager/subcontractors', label: t('nav.contractors'), icon: Users },
    { path: '/manager/broker', label: 'My Broker', icon: Shield },
    { path: '/manager/documents', label: t('nav.documents'), icon: FileText },
    { path: '/manager/acknowledgements', label: t('nav.acknowledgements'), icon: Briefcase },
    { path: '/manager/help', label: t('nav.help'), icon: LifeBuoy },
  ];

  const subcontractorMenuItems = [
    { path: '/subcontractor/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { path: '/subcontractor/relationships', label: t('nav.managers'), icon: Handshake },
    { path: '/subcontractor/broker', label: 'My Broker', icon: Briefcase },
    { path: '/subcontractor/projects', label: t('nav.projects'), icon: Building },
    { path: '/subcontractor/documents', label: t('nav.documents'), icon: FileText },
    { path: '/subcontractor/help', label: t('nav.help'), icon: LifeBuoy },
  ];

  const brokerMenuItems = [
    { path: '/broker/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { path: '/broker/tasks', label: t('nav.tasks'), icon: CheckSquare },
    { path: '/broker/clients', label: t('nav.clients'), icon: Briefcase },
    { path: '/broker/team', label: t('nav.team'), icon: Users },
    { path: '/broker/help', label: t('nav.help'), icon: LifeBuoy },
  ];

  const menuItems =
    userRole === 'manager'
      ? managerMenuItems
      : userRole === 'subcontractor'
        ? subcontractorMenuItems
        : brokerMenuItems;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getSettingsPath = () => {
    switch (userRole) {
      case 'manager':
        return '/manager/settings/profile';
      case 'subcontractor':
        return '/subcontractor/settings/profile';
      case 'broker':
        return '/broker/settings/profile';
    }
  };

  // REQ-4: Get role display text
  const getRoleDisplay = () => {
    switch (userRole) {
      case 'broker':
        return `CMR (${t('role.broker')} View)`;
      case 'manager':
        return `MRC (${t('role.manager_view')})`;
      case 'subcontractor':
        return getContractorLabel();
    }
  };

  // Handle dark mode toggle (for icon click)
  const handleDarkModeToggle = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setTheme(newTheme);
    if (toggleTheme) {
      toggleTheme();
    }
  };

  // Check if dark mode is enabled
  const isDarkMode = theme === 'dark';

  return (
    <BeyondSidebar
      variant="main"
      collapsed={isCollapsed}
      onCollapseChange={handleCollapseChange}
      header={
        <SidebarHeader
          logo={<ForsuredLogo height={32} />}
          onCollapse={() => handleCollapseChange(!isCollapsed)}
        />
      }
      footer={
        <SidebarFooter
          actions={[
            {
              icon: Settings,
              onPress: () => navigate(getSettingsPath()),
              label: 'Settings',
              tooltip: 'Settings',
            },
            {
              icon: isDarkMode ? Sun : Moon,
              onPress: handleDarkModeToggle,
              label: isDarkMode ? 'Light Mode' : 'Dark Mode',
              tooltip: isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
            },
            {
              icon: LogOut,
              onPress: handleLogout,
              label: 'Logout',
              tooltip: 'Logout',
            },
          ]}
        />
      }
    >
      {/* User Profile Section at Top */}
      {!isCollapsed && (
        <>
          <SidebarMenuItem
            type="double"
            avatar={<Avatar initials={getInitials(user.name || user.email)} size={40} />}
            label={user.name || user.email || 'User'}
            supportingText={user.email || getRoleDisplay()}
          />
          <SidebarMenuItem type="divider" />
        </>
      )}

      {/* Primary Navigation Items */}
      {menuItems.map((item) => (
        <SidebarMenuItem
          key={item.path}
          icon={item.icon}
          label={item.label}
          state={isActive(item.path) ? 'active' : 'default'}
          onPress={() => navigate(item.path)}
        />
      ))}
    </BeyondSidebar>
  );
}
