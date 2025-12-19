/**
 * Sidebar - Navigation sidebar component using Tamagui
 * REQ-4: Multi-Industry User Set Type System with Configurable Lexicon
 */
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Settings,
  Handshake,
  FileText,
  Building,
  Briefcase,
  Bell,
  LogOut,
  User,
  ClipboardCheck,
  LifeBuoy,
  CheckSquare,
  Shield,
} from 'lucide-react';
import { YStack, XStack, Text, styled } from '@unicornlove/ui';
import { User as UserType } from '../../types';
import ForsuredLogo from '../Common/ForsuredLogo';
import IconButton from '../Common/IconButton';
import { useAuth } from '../../contexts/AuthContext';
import { useLexicon } from '../../contexts/LexiconContext';

interface SidebarProps {
  userRole: 'manager' | 'subcontractor' | 'broker';
  user: UserType;
  onNotificationsClick: () => void;
  alertCount: number;
}

const SidebarContainer = styled(YStack, {
  name: 'Sidebar',
  backgroundColor: '$backgroundHover',
  color: '$color11',
  width: 224,
  minHeight: '100vh',
  shadowColor: '$shadowColor',
  shadowRadius: 10,
  shadowOffset: { width: 4, height: 0 },
  borderRightWidth: 1,
  borderRightColor: '$borderColor',
  flexDirection: 'column',
});

// NavLink wrapper component
const NavLinkWrapper = ({ to, children }: { to: string; children: (props: { isActive: boolean }) => React.ReactNode }) => {
  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <XStack
          width="100%"
          flexDirection="row"
          alignItems="center"
          gap="$2.5"
          paddingHorizontal="$3"
          paddingVertical="$2.5"
          borderRadius="$md"
          backgroundColor={isActive ? '$blue9' : 'transparent'}
          color={isActive ? '$color1' : '$color10'}
          shadowColor={isActive ? '$shadowColor' : 'transparent'}
          shadowRadius={isActive ? 8 : 0}
          shadowOffset={isActive ? { width: 0, height: 4 } : { width: 0, height: 0 }}
          hoverStyle={!isActive ? {
            backgroundColor: '$backgroundHover',
            color: '$color11',
          } : undefined}
        >
          {children({ isActive })}
        </XStack>
      )}
    </NavLink>
  );
};

export default function Sidebar({
  userRole,
  user,
  onNotificationsClick,
  alertCount,
}: SidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // REQ-4: Use lexicon for dynamic labels
  const { t, getManagerLabel, getContractorLabel } = useLexicon();

  // REQ-4: Menu items with lexicon-based labels
  const managerMenuItems = [
    { path: '/manager/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { path: '/manager/tasks', label: t('nav.tasks'), icon: CheckSquare },
    { path: '/manager/projects', label: t('nav.projects'), icon: Building },
    { path: '/manager/subcontractors', label: t('nav.contractors'), icon: Users },
    { path: '/manager/documents', label: t('nav.documents'), icon: FileText },
    {
      path: '/manager/acknowledgements',
      label: t('nav.acknowledgements'),
      icon: ClipboardCheck,
    },
    { path: '/manager/integrations', label: t('nav.integrations'), icon: Settings },
    { path: '/manager/help', label: t('nav.help'), icon: LifeBuoy },
  ];

  const subcontractorMenuItems = [
    {
      path: '/subcontractor/dashboard',
      label: t('nav.dashboard'),
      icon: LayoutDashboard,
    },
    {
      path: '/subcontractor/relationships',
      label: t('nav.managers'),
      icon: Handshake,
    },
    { path: '/subcontractor/projects', label: t('nav.projects'), icon: Building },
    { path: '/subcontractor/documents', label: t('nav.documents'), icon: FileText },
    { path: '/subcontractor/help', label: t('nav.help'), icon: LifeBuoy },
  ];

  const brokerMenuItems = [
    { path: '/broker/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { path: '/broker/tasks', label: t('nav.tasks'), icon: CheckSquare },
    { path: '/broker/clients', label: t('nav.clients'), icon: Briefcase },
    { path: '/broker/projects', label: t('nav.projects'), icon: Building },
    { path: '/broker/insurance', label: t('nav.insurance'), icon: Shield },
    { path: '/broker/team', label: t('nav.team'), icon: Users },
    { path: '/broker/documents', label: t('nav.documents'), icon: FileText },
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

  return (
    <SidebarContainer as="aside">
      <YStack padding="$4" borderBottomWidth={1} borderBottomColor="$borderColor">
        <ForsuredLogo height={24} />
      </YStack>

      <YStack flex={1} overflow="scroll" padding="$3">
        <YStack gap="$0.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLinkWrapper key={item.path} to={item.path}>
                {({ isActive }) => (
                  <>
                    <Icon size={18} />
                    <Text fontSize="$3" fontWeight="500">
                      {item.label}
                    </Text>
                  </>
                )}
              </NavLinkWrapper>
            );
          })}
        </YStack>
      </YStack>

      <YStack borderTopWidth={1} borderTopColor="$borderColor" padding="$3" gap="$2">
        <XStack alignItems="center" justifyContent="space-around" paddingHorizontal="$1">
          <IconButton
            onClick={onNotificationsClick}
            icon={Bell}
            size="md"
            variant="ghost"
            badge={alertCount > 0}
            badgeContent={alertCount}
            tooltip="Notifications"
          />

          <IconButton
            onClick={() => {
              const settingsPath = userRole === 'manager'
                ? '/manager/settings/profile'
                : userRole === 'subcontractor'
                  ? '/subcontractor/settings/profile'
                  : '/broker/settings/profile';
              navigate(settingsPath);
            }}
            icon={Settings}
            size="md"
            variant="ghost"
            tooltip="Settings"
          />

          <IconButton
            onClick={handleLogout}
            icon={LogOut}
            size="md"
            variant="ghost"
            tooltip="Sign Out"
          />
        </XStack>

        <XStack
          alignItems="center"
          gap="$2"
          paddingHorizontal="$2"
          paddingVertical="$1.5"
          borderRadius="$md"
          backgroundColor="$backgroundHover"
        >
          <XStack
            width={28}
            height={28}
            backgroundColor="$background"
            borderRadius="$10"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <User size={14} color="currentColor" />
          </XStack>
          <YStack flex={1} minWidth={0}>
            <Text fontSize="$1" fontWeight="500" color="$color11" numberOfLines={1}>
              {user.name}
            </Text>
            {/* REQ-4: Use lexicon for role display */}
            <Text fontSize="$1" color="$color10">
              {user.role === 'broker'
                ? `CMR (${t('role.broker')} View)`
                : user.role === 'manager'
                  ? `MRC (${t('role.manager_view')})`
                  : getContractorLabel()}
            </Text>
          </YStack>
        </XStack>
      </YStack>
    </SidebarContainer>
  );
}
