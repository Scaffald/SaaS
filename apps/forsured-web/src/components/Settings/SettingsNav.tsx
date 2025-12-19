/**
 * SettingsNav - Settings navigation using Tamagui
 */
import { NavLink } from 'react-router-dom';
import { YStack, XStack, Text, styled } from '@unicornlove/ui';
import {
  User,
  Building,
  Shield,
  Bell,
  Users,
  Plug,
  FileText,
  Briefcase,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface SettingsNavProps {
  userType: 'gc' | 'contractor' | 'broker' | 'admin';
}

interface NavLinkItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

const routePrefixMap: Record<string, string> = {
  gc: 'manager',
  contractor: 'subcontractor',
  broker: 'broker',
  admin: 'admin',
};

const NavItem = styled(XStack, {
  name: 'SettingsNavItem',
  alignItems: 'center',
  gap: '$3',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  borderRadius: '$md',
  fontSize: '$2',
  fontWeight: '500',
  borderLeftWidth: 0,
  
  variants: {
    active: {
      true: {
        backgroundColor: '$blue3',
        color: '$blue11',
        borderLeftWidth: 4,
        borderLeftColor: '$blue9',
      },
      false: {
        color: '$color10',
        hoverStyle: {
          backgroundColor: '$backgroundHover',
          color: '$color11',
        },
      },
    },
  } as const,
});

function SettingsNav({ userType }: SettingsNavProps) {
  const routePrefix = routePrefixMap[userType] || userType;

  const gcLinks: NavLinkItem[] = [
    { path: `/${routePrefix}/settings/profile`, label: 'Profile', icon: User },
    { path: `/${routePrefix}/settings/company`, label: 'Company', icon: Building },
    { path: `/${routePrefix}/settings/insurance`, label: 'Insurance Requirements', icon: Shield },
    { path: `/${routePrefix}/settings/notifications`, label: 'Notifications', icon: Bell },
    { path: `/${routePrefix}/settings/team`, label: 'Team', icon: Users },
    { path: `/${routePrefix}/settings/integrations`, label: 'Integrations', icon: Plug },
  ];

  const contractorLinks: NavLinkItem[] = [
    { path: `/${routePrefix}/settings/profile`, label: 'Profile', icon: User },
    { path: `/${routePrefix}/settings/company`, label: 'Company', icon: Building },
    { path: `/${routePrefix}/settings/insurance`, label: 'Insurance Info', icon: Shield },
    { path: `/${routePrefix}/settings/notifications`, label: 'Notifications', icon: Bell },
    { path: `/${routePrefix}/settings/documents`, label: 'Documents', icon: FileText },
  ];

  const brokerLinks: NavLinkItem[] = [
    { path: `/${routePrefix}/settings/profile`, label: 'Profile', icon: User },
    { path: `/${routePrefix}/settings/agency`, label: 'Agency', icon: Briefcase },
    { path: `/${routePrefix}/settings/clients`, label: 'Clients', icon: Users },
    { path: `/${routePrefix}/settings/notifications`, label: 'Notifications', icon: Bell },
  ];

  const adminLinks: NavLinkItem[] = [
    { path: `/${routePrefix}/settings/profile`, label: 'Profile', icon: User },
  ];

  let navLinks: NavLinkItem[] = [];

  switch (userType) {
    case 'gc':
      navLinks = gcLinks;
      break;
    case 'contractor':
      navLinks = contractorLinks;
      break;
    case 'broker':
      navLinks = brokerLinks;
      break;
    case 'admin':
      navLinks = adminLinks;
      break;
    default:
      navLinks = [];
  }

  return (
    <YStack as="nav" gap="$1">
      {navLinks.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink key={link.path} to={link.path}>
            {({ isActive }) => (
              <NavItem active={isActive}>
                <Icon size={18} />
                <Text>{link.label}</Text>
              </NavItem>
            )}
          </NavLink>
        );
      })}
    </YStack>
  );
}

export default SettingsNav;
