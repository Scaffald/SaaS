/**
 * SettingsNav - Settings navigation using Beyond UI
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Stack, Row, Text } from '@unicornlove/beyond-ui';
import {
  User,
  Building,
  Shield,
  Bell,
  Users,
  Plug,
  FileText,
  Briefcase,
  Gift,
  Palette,
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

const getNavItemStyle = (isActive: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 8,
  paddingBottom: 8,
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 500,
  borderLeftWidth: isActive ? 4 : 0,
  borderLeftStyle: 'solid',
  borderLeftColor: isActive ? 'var(--color-blue9)' : 'transparent',
  backgroundColor: isActive ? 'var(--color-blue3)' : 'transparent',
  color: isActive ? 'var(--color-blue11)' : 'var(--color-color10)',
  textDecoration: 'none',
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
    { path: `/${routePrefix}/settings/appearance`, label: 'Appearance', icon: Palette },
    { path: `/${routePrefix}/settings/referrals`, label: 'Referrals', icon: Gift },
  ];

  const contractorLinks: NavLinkItem[] = [
    { path: `/${routePrefix}/settings/profile`, label: 'Profile', icon: User },
    { path: `/${routePrefix}/settings/company`, label: 'Company', icon: Building },
    { path: `/${routePrefix}/settings/insurance`, label: 'Insurance Info', icon: Shield },
    { path: `/${routePrefix}/settings/notifications`, label: 'Notifications', icon: Bell },
    { path: `/${routePrefix}/settings/documents`, label: 'Documents', icon: FileText },
    { path: `/${routePrefix}/settings/referrals`, label: 'Referrals', icon: Gift },
  ];

  const brokerLinks: NavLinkItem[] = [
    { path: `/${routePrefix}/settings/profile`, label: 'Profile', icon: User },
    { path: `/${routePrefix}/settings/agency`, label: 'Agency', icon: Briefcase },
    { path: `/${routePrefix}/settings/clients`, label: 'Clients', icon: Users },
    { path: `/${routePrefix}/settings/notifications`, label: 'Notifications', icon: Bell },
    { path: `/${routePrefix}/settings/referrals`, label: 'Referrals', icon: Gift },
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
    <nav>
      <Stack style={{ gap: 4 }}>
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink key={link.path} to={link.path} style={{ textDecoration: 'none' }}>
              {({ isActive }) => (
                <Row style={getNavItemStyle(isActive)}>
                  <Icon size={18} />
                  <Text>{link.label}</Text>
                </Row>
              )}
            </NavLink>
          );
        })}
      </Stack>
    </nav>
  );
}

export default SettingsNav;
