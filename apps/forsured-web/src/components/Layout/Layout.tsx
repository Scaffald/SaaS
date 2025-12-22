/**
 * Layout - Main application layout using Tamagui
 */
import { Outlet, useNavigate, Navigate } from 'react-router-dom';
import { XStack, YStack, Text } from '@unicornlove/ui';
import Sidebar from './Sidebar';
import ClientsDropdown from './ClientsDropdown';
import { useAuth } from '../../contexts/AuthContext';
import { useApprovals } from '../../hooks/useApprovals';
import LoadingSpinner from '../Common/LoadingSpinner';

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
    <XStack height="100vh" backgroundColor="$backgroundHover">
      <Sidebar
        userRole={uiUserType}
        user={profile}
        onNotificationsClick={() => navigate(getNotificationsPath())}
        alertCount={pendingApprovalsCount}
      />

      <YStack flex={1} flexDirection="column" overflow="hidden">
        {/* Header Bar for Broker - shows Clients dropdown */}
        {uiUserType === 'broker' && (
          <XStack
            as="header"
            backgroundColor="$backgroundHover"
            borderBottomWidth={1}
            borderBottomColor="$borderColor"
            paddingHorizontal="$6"
            paddingVertical="$3"
            alignItems="center"
            justifyContent="space-between"
          >
            <ClientsDropdown />
            <Text fontSize="$2" color="$color10">
              Quick Jump to Client
            </Text>
          </XStack>
        )}
        <YStack
          as="main"
          flex={1}
          overflowX="hidden"
          overflowY="scroll"
          padding="$6"
        >
          <Outlet />
        </YStack>
      </YStack>
    </XStack>
  );
}
