/**
 * HelpCenterLayout - Help center layout using Tamagui
 */
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { XStack, YStack, Text } from '@unicornlove/ui';

interface HelpCenterLayoutProps {
  userType: 'gc' | 'contractor' | 'broker' | 'admin';
}

function HelpCenterLayout({ userType }: HelpCenterLayoutProps) {
  const location = useLocation();
  
  const helpLinks = [
    { path: `/${userType}/help/getting-started`, label: 'Getting Started' },
    { path: `/${userType}/help/dashboard`, label: 'Dashboard Overview' },
    // Add more links based on userType specific documentation
  ];

  return (
    <XStack minH="100vh" backgroundColor="$gray1">
      <YStack
        width={280}
        backgroundColor="$gray2"
        borderRightWidth={1}
        borderRightColor="$gray4"
        padding="$6"
        gap="$6"
      >
        <YStack gap="$1">
          <Text fontSize="$7" fontWeight="700" color="$gray12">
            Help Center
          </Text>
          <Text fontSize="$3" color="$gray10">
            Find answers and guides
          </Text>
        </YStack>
        <YStack gap="$1">
          {helpLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  borderRadius: 8,
                  backgroundColor: isActive ? 'hsla(191, 55%, 89%, 1)' : 'transparent',
                  color: isActive ? 'hsla(191, 82%, 22%, 1)' : 'hsla(30, 9%, 24%, 1)',
                  fontWeight: isActive ? 600 : 400,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  borderLeft: isActive ? '3px solid hsla(191, 72%, 35%, 1)' : '3px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'hsla(38, 14%, 94%, 1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {link.label}
              </NavLink>
            );
          })}
        </YStack>
      </YStack>
      <YStack 
        flex={1} 
        padding="$8"
        paddingHorizontal="$10"
        maxWidth={1200}
        width="100%"
      >
        <Outlet />
      </YStack>
    </XStack>
  );
}

export default HelpCenterLayout;
