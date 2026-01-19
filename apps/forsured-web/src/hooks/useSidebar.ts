/**
 * useSidebar hook
 * Custom hook to manage sidebar state and actions for Forsured
 */

import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Settings, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLexicon } from '../contexts/LexiconContext';
import { getSidebarMenuItems, getSettingsPath, type UserRole, type MenuItem } from '../config/sidebarMenus';
import type { User as UserType } from '../types';

export interface UseSidebarOptions {
  userRole: UserRole;
  user: UserType;
  badges?: Partial<Record<string, number>>;
  onSettingsClick?: () => void;
}

export interface UseSidebarReturn {
  menuItems: MenuItem[];
  footerActions: Array<{
    id: string;
    icon: typeof Settings | typeof Moon | typeof Sun | typeof LogOut;
    onPress: () => void;
    label: string;
    tooltip: string;
  }>;
  isActive: (path: string, exact?: boolean) => boolean;
  userInitials: string;
  userDisplayName: string;
  userSupportingText: string;
}

/**
 * Custom hook to manage sidebar logic
 */
export function useSidebar({ userRole, user, badges, onSettingsClick }: UseSidebarOptions): UseSidebarReturn {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { t, getContractorLabel } = useLexicon();

  // Check if a path is active
  const isActive = useCallback(
    (path: string, exact?: boolean) => {
      return exact ? location.pathname === path : location.pathname.startsWith(path);
    },
    [location.pathname]
  );

  // Get menu items for the user role
  const menuItems = useMemo(
    () => getSidebarMenuItems(userRole, t, badges),
    [userRole, t, badges]
  );

  // Get role display text
  const getRoleDisplay = useCallback(() => {
    switch (userRole) {
      case 'broker':
        return `CMR (${t('role.broker')} View)`;
      case 'manager':
        return `MRC (${t('role.manager_view')})`;
      case 'subcontractor':
        return getContractorLabel();
    }
  }, [userRole, t, getContractorLabel]);

  // Get user initials
  const userInitials = useMemo(() => {
    const name = user.name || user.email;
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  }, [user.name, user.email]);

  // User display name
  const userDisplayName = user.name || user.email || 'User';

  // User supporting text
  const userSupportingText = user.email || getRoleDisplay();

  // Footer actions
  const footerActions = useMemo(
    () => [
      {
        id: 'settings',
        icon: Settings,
        onPress: onSettingsClick || (() => navigate(getSettingsPath(userRole))),
        label: 'Settings',
        tooltip: 'Profile Settings',
      },
      {
        id: 'theme',
        icon: theme === 'dark' ? Sun : Moon,
        onPress: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
        label: theme === 'dark' ? 'Light Mode' : 'Dark Mode',
        tooltip: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      },
      {
        id: 'logout',
        icon: LogOut,
        onPress: () => {
          logout();
          navigate('/');
        },
        label: 'Logout',
        tooltip: 'Logout',
      },
    ],
    [theme, setTheme, userRole, logout, navigate, onSettingsClick]
  );

  return {
    menuItems,
    footerActions,
    isActive,
    userInitials,
    userDisplayName,
    userSupportingText,
  };
}
