/**
 * Sidebar menu configuration
 * Centralized menu items for different user roles
 */

import {
  LayoutDashboard,
  Users,
  Handshake,
  FileText,
  Building,
  Briefcase,
  CheckSquare,
  LifeBuoy,
  Shield,
  type LucideIcon,
} from 'lucide-react';

export type UserRole = 'manager' | 'subcontractor' | 'broker';

export interface MenuItem {
  path: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  exact?: boolean;
}

export interface MenuConfig {
  manager: MenuItem[];
  subcontractor: MenuItem[];
  broker: MenuItem[];
}

/**
 * Get sidebar menu items for a specific user role
 */
export function getSidebarMenuItems(
  userRole: UserRole,
  t: (key: string) => string,
  badges?: Partial<Record<string, number>>
): MenuItem[] {
  const menuConfig: MenuConfig = {
    manager: [
      {
        path: '/manager/dashboard',
        label: t('nav.dashboard'),
        icon: LayoutDashboard,
        exact: true,
      },
      {
        path: '/manager/tasks',
        label: t('nav.tasks'),
        icon: CheckSquare,
        badge: badges?.tasks,
      },
      {
        path: '/manager/projects',
        label: t('nav.projects'),
        icon: Building,
      },
      {
        path: '/manager/subcontractors',
        label: t('nav.contractors'),
        icon: Users,
      },
      {
        path: '/manager/broker',
        label: 'My Broker',
        icon: Shield,
      },
      {
        path: '/manager/documents',
        label: t('nav.documents'),
        icon: FileText,
      },
      {
        path: '/manager/acknowledgements',
        label: t('nav.acknowledgements'),
        icon: Briefcase,
      },
      {
        path: '/manager/help',
        label: t('nav.help'),
        icon: LifeBuoy,
      },
    ],
    subcontractor: [
      {
        path: '/subcontractor/dashboard',
        label: t('nav.dashboard'),
        icon: LayoutDashboard,
        exact: true,
      },
      {
        path: '/subcontractor/relationships',
        label: t('nav.managers'),
        icon: Handshake,
      },
      {
        path: '/subcontractor/broker',
        label: 'My Broker',
        icon: Briefcase,
      },
      {
        path: '/subcontractor/projects',
        label: t('nav.projects'),
        icon: Building,
      },
      {
        path: '/subcontractor/documents',
        label: t('nav.documents'),
        icon: FileText,
      },
      {
        path: '/subcontractor/help',
        label: t('nav.help'),
        icon: LifeBuoy,
      },
    ],
    broker: [
      {
        path: '/broker/dashboard',
        label: t('nav.dashboard'),
        icon: LayoutDashboard,
        exact: true,
      },
      {
        path: '/broker/tasks',
        label: t('nav.tasks'),
        icon: CheckSquare,
        badge: badges?.tasks,
      },
      {
        path: '/broker/clients',
        label: t('nav.clients'),
        icon: Briefcase,
      },
      {
        path: '/broker/team',
        label: t('nav.team'),
        icon: Users,
      },
      {
        path: '/broker/help',
        label: t('nav.help'),
        icon: LifeBuoy,
      },
    ],
  };

  return menuConfig[userRole];
}

/**
 * Get settings path for a specific user role
 */
export function getSettingsPath(userRole: UserRole): string {
  const paths = {
    manager: '/manager/settings/profile',
    subcontractor: '/subcontractor/settings/profile',
    broker: '/broker/settings/profile',
  };
  return paths[userRole];
}
