/**
 * CommandMenu Items
 * Data structure mapping Forsured routes to CommandMenu items
 * Organized by tabs for easy navigation
 */

import type { CommandMenuItemData } from '@unicornlove/beyond-ui'
import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  Building,
  Briefcase,
  Bell,
  CheckSquare,
  LifeBuoy,
  Shield,
  Handshake,
  Plus,
  Search,
  HelpCircle,
  User,
  Plug,
  Gift,
} from 'lucide-react'

export type UserRole = 'manager' | 'subcontractor' | 'broker'

/**
 * Get command menu items based on user role
 */
export function getCommandMenuItems(userRole: UserRole): {
  tabs: Array<{ value: string; label: string }>
  items: CommandMenuItemData[]
} {
  const tabs = [
    { value: 'navigation', label: 'Navigation' },
    { value: 'actions', label: 'Actions' },
    { value: 'settings', label: 'Settings' },
  ]

  const items: CommandMenuItemData[] = []

  // Navigation items based on role
  if (userRole === 'manager') {
    items.push(
      {
        id: 'nav-dashboard',
        type: 'Icon',
        title: 'Dashboard',
        subtitle: 'View overview and metrics',
        icon: LayoutDashboard,
        tab: 'navigation',
        shortcut: ['⌘', 'D'],
        data: { path: '/manager/dashboard' },
      },
      {
        id: 'nav-tasks',
        type: 'Icon',
        title: 'Tasks',
        subtitle: 'Manage tasks and assignments',
        icon: CheckSquare,
        tab: 'navigation',
        shortcut: ['⌘', 'T'],
        data: { path: '/manager/tasks' },
      },
      {
        id: 'nav-projects',
        type: 'Icon',
        title: 'Projects',
        subtitle: 'View and manage projects',
        icon: Building,
        tab: 'navigation',
        shortcut: ['⌘', 'P'],
        data: { path: '/manager/projects' },
      },
      {
        id: 'nav-subcontractors',
        type: 'Icon',
        title: 'Subcontractors',
        subtitle: 'Manage subcontractor relationships',
        icon: Users,
        tab: 'navigation',
        data: { path: '/manager/subcontractors' },
      },
      {
        id: 'nav-broker',
        type: 'Icon',
        title: 'My Broker',
        subtitle: 'View broker information',
        icon: Shield,
        tab: 'navigation',
        data: { path: '/manager/broker' },
      },
      {
        id: 'nav-documents',
        type: 'Icon',
        title: 'Documents',
        subtitle: 'Access documents and files',
        icon: FileText,
        tab: 'navigation',
        data: { path: '/manager/documents' },
      },
      {
        id: 'nav-acknowledgements',
        type: 'Icon',
        title: 'Acknowledgements',
        subtitle: 'View acknowledgements',
        icon: Briefcase,
        tab: 'navigation',
        data: { path: '/manager/acknowledgements' },
      },
      {
        id: 'nav-notifications',
        type: 'Icon',
        title: 'Notifications',
        subtitle: 'View notifications and approvals',
        icon: Bell,
        tab: 'navigation',
        shortcut: ['⌘', 'N'],
        data: { path: '/manager/notifications' },
      },
      {
        id: 'nav-help',
        type: 'Icon',
        title: 'Help',
        subtitle: 'Get help and support',
        icon: LifeBuoy,
        tab: 'navigation',
        data: { path: '/manager/help' },
      }
    )

    // Actions for manager
    items.push(
      {
        id: 'action-new-project',
        type: 'Icon',
        title: 'New Project',
        subtitle: 'Create a new project',
        icon: Plus,
        tab: 'actions',
        shortcut: ['⌘', 'Shift', 'P'],
        data: { path: '/manager/projects/new' },
      },
      {
        id: 'action-new-subcontractor',
        type: 'Icon',
        title: 'Add Subcontractor',
        subtitle: 'Add a new subcontractor',
        icon: Plus,
        tab: 'actions',
        data: { path: '/manager/subcontractors/new' },
      }
    )

    // Settings for manager
    items.push(
      {
        id: 'settings-profile',
        type: 'Icon',
        title: 'Profile Settings',
        subtitle: 'Edit your profile',
        icon: User,
        tab: 'settings',
        data: { path: '/manager/settings/profile' },
      },
      {
        id: 'settings-company',
        type: 'Icon',
        title: 'Company Settings',
        subtitle: 'Manage company information',
        icon: Building,
        tab: 'settings',
        data: { path: '/manager/settings/company' },
      },
      {
        id: 'settings-insurance',
        type: 'Icon',
        title: 'Insurance Requirements',
        subtitle: 'Configure insurance settings',
        icon: Shield,
        tab: 'settings',
        data: { path: '/manager/settings/insurance' },
      },
      {
        id: 'settings-notifications',
        type: 'Icon',
        title: 'Notification Settings',
        subtitle: 'Manage notification preferences',
        icon: Bell,
        tab: 'settings',
        data: { path: '/manager/settings/notifications' },
      },
      {
        id: 'settings-team',
        type: 'Icon',
        title: 'Team Settings',
        subtitle: 'Manage team members',
        icon: Users,
        tab: 'settings',
        data: { path: '/manager/settings/team' },
      },
      {
        id: 'settings-integrations',
        type: 'Icon',
        title: 'Integrations',
        subtitle: 'Connect external services',
        icon: Plug,
        tab: 'settings',
        data: { path: '/manager/settings/integrations' },
      },
      {
        id: 'settings-referrals',
        type: 'Icon',
        title: 'Referrals',
        subtitle: 'Manage referral program',
        icon: Gift,
        tab: 'settings',
        data: { path: '/manager/settings/referrals' },
      }
    )
  } else if (userRole === 'subcontractor') {
    items.push(
      {
        id: 'nav-dashboard',
        type: 'Icon',
        title: 'Dashboard',
        subtitle: 'View overview and metrics',
        icon: LayoutDashboard,
        tab: 'navigation',
        shortcut: ['⌘', 'D'],
        data: { path: '/subcontractor/dashboard' },
      },
      {
        id: 'nav-relationships',
        type: 'Icon',
        title: 'Managers',
        subtitle: 'View manager relationships',
        icon: Handshake,
        tab: 'navigation',
        data: { path: '/subcontractor/relationships' },
      },
      {
        id: 'nav-broker',
        type: 'Icon',
        title: 'My Broker',
        subtitle: 'View broker information',
        icon: Briefcase,
        tab: 'navigation',
        data: { path: '/subcontractor/broker' },
      },
      {
        id: 'nav-projects',
        type: 'Icon',
        title: 'Projects',
        subtitle: 'View assigned projects',
        icon: Building,
        tab: 'navigation',
        shortcut: ['⌘', 'P'],
        data: { path: '/subcontractor/projects' },
      },
      {
        id: 'nav-documents',
        type: 'Icon',
        title: 'Documents',
        subtitle: 'Access documents and files',
        icon: FileText,
        tab: 'navigation',
        data: { path: '/subcontractor/documents' },
      },
      {
        id: 'nav-help',
        type: 'Icon',
        title: 'Help',
        subtitle: 'Get help and support',
        icon: LifeBuoy,
        tab: 'navigation',
        data: { path: '/subcontractor/help' },
      }
    )

    // Settings for subcontractor
    items.push(
      {
        id: 'settings-profile',
        type: 'Icon',
        title: 'Profile Settings',
        subtitle: 'Edit your profile',
        icon: User,
        tab: 'settings',
        data: { path: '/subcontractor/settings/profile' },
      },
      {
        id: 'settings-company',
        type: 'Icon',
        title: 'Company Settings',
        subtitle: 'Manage company information',
        icon: Building,
        tab: 'settings',
        data: { path: '/subcontractor/settings/company' },
      },
      {
        id: 'settings-insurance',
        type: 'Icon',
        title: 'Insurance Info',
        subtitle: 'View insurance information',
        icon: Shield,
        tab: 'settings',
        data: { path: '/subcontractor/settings/insurance' },
      },
      {
        id: 'settings-notifications',
        type: 'Icon',
        title: 'Notification Settings',
        subtitle: 'Manage notification preferences',
        icon: Bell,
        tab: 'settings',
        data: { path: '/subcontractor/settings/notifications' },
      },
      {
        id: 'settings-documents',
        type: 'Icon',
        title: 'Documents',
        subtitle: 'Manage documents',
        icon: FileText,
        tab: 'settings',
        data: { path: '/subcontractor/settings/documents' },
      },
      {
        id: 'settings-referrals',
        type: 'Icon',
        title: 'Referrals',
        subtitle: 'Manage referral program',
        icon: Gift,
        tab: 'settings',
        data: { path: '/subcontractor/settings/referrals' },
      }
    )
  } else if (userRole === 'broker') {
    items.push(
      {
        id: 'nav-dashboard',
        type: 'Icon',
        title: 'Dashboard',
        subtitle: 'View overview and metrics',
        icon: LayoutDashboard,
        tab: 'navigation',
        shortcut: ['⌘', 'D'],
        data: { path: '/broker/dashboard' },
      },
      {
        id: 'nav-tasks',
        type: 'Icon',
        title: 'Tasks',
        subtitle: 'Manage tasks and assignments',
        icon: CheckSquare,
        tab: 'navigation',
        shortcut: ['⌘', 'T'],
        data: { path: '/broker/tasks' },
      },
      {
        id: 'nav-clients',
        type: 'Icon',
        title: 'Clients',
        subtitle: 'Manage client relationships',
        icon: Briefcase,
        tab: 'navigation',
        shortcut: ['⌘', 'C'],
        data: { path: '/broker/clients' },
      },
      {
        id: 'nav-team',
        type: 'Icon',
        title: 'Team',
        subtitle: 'Manage team members',
        icon: Users,
        tab: 'navigation',
        data: { path: '/broker/team' },
      },
      {
        id: 'nav-help',
        type: 'Icon',
        title: 'Help',
        subtitle: 'Get help and support',
        icon: LifeBuoy,
        tab: 'navigation',
        data: { path: '/broker/help' },
      }
    )

    // Actions for broker
    items.push(
      {
        id: 'action-new-client',
        type: 'Icon',
        title: 'Add Client',
        subtitle: 'Add a new client',
        icon: Plus,
        tab: 'actions',
        data: { path: '/broker/clients/new' },
      }
    )

    // Settings for broker
    items.push(
      {
        id: 'settings-profile',
        type: 'Icon',
        title: 'Profile Settings',
        subtitle: 'Edit your profile',
        icon: User,
        tab: 'settings',
        data: { path: '/broker/settings/profile' },
      },
      {
        id: 'settings-agency',
        type: 'Icon',
        title: 'Agency Settings',
        subtitle: 'Manage agency information',
        icon: Briefcase,
        tab: 'settings',
        data: { path: '/broker/settings/agency' },
      },
      {
        id: 'settings-clients',
        type: 'Icon',
        title: 'Client Settings',
        subtitle: 'Manage client settings',
        icon: Users,
        tab: 'settings',
        data: { path: '/broker/settings/clients' },
      },
      {
        id: 'settings-notifications',
        type: 'Icon',
        title: 'Notification Settings',
        subtitle: 'Manage notification preferences',
        icon: Bell,
        tab: 'settings',
        data: { path: '/broker/settings/notifications' },
      },
      {
        id: 'settings-referrals',
        type: 'Icon',
        title: 'Referrals',
        subtitle: 'Manage referral program',
        icon: Gift,
        tab: 'settings',
        data: { path: '/broker/settings/referrals' },
      }
    )
  }

  return { tabs, items }
}
