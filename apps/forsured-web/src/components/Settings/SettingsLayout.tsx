/**
 * SettingsLayout - Settings layout using Tamagui
 */
import { Outlet } from 'react-router-dom';
import { XStack, YStack, Text } from '@unicornlove/ui';
import { Settings } from 'lucide-react';
import SettingsNav from './SettingsNav';

interface SettingsLayoutProps {
  userType: 'gc' | 'contractor' | 'broker' | 'admin';
}

const userTypeLabels: Record<string, string> = {
  gc: 'General Contractor',
  contractor: 'Contractor',
  broker: 'Broker',
  admin: 'Admin',
};

function SettingsLayout({ userType }: SettingsLayoutProps) {
  return (
    <XStack minHeight="calc(100vh - 4rem)">
      {/* Settings Sidebar */}
      <YStack
        as="aside"
        width={256}
        backgroundColor="$backgroundHover"
        borderRightWidth={1}
        borderRightColor="$borderColor"
        padding="$6"
        gap="$6"
      >
        <XStack alignItems="center" gap="$2" mb="$6">
          <Settings size={24} color="currentColor" />
          <YStack>
            <Text fontSize="$5" fontWeight="600" color="$color11">
              Settings
            </Text>
            <Text fontSize="$1" color="$color10">
              {userTypeLabels[userType]}
            </Text>
          </YStack>
        </XStack>
        <SettingsNav userType={userType} />
      </YStack>

      {/* Settings Content */}
      <YStack as="main" flex={1} padding="$6" backgroundColor="$background">
        <Outlet />
      </YStack>
    </XStack>
  );
}

export default SettingsLayout;
