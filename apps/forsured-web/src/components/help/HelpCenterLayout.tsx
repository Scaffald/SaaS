/**
 * HelpCenterLayout - Help center layout using Beyond UI
 */
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Row, Stack, Text } from '@scaffald/ui';

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
    <Row minHeight="100vh" backgroundColor="var(--color-gray-1)">
      <Stack
        width={280}
        backgroundColor="var(--color-gray-2)"
        padding={24}
        gap={24}
        style={{
          borderRightWidth: 1,
          borderRightStyle: 'solid',
          borderRightColor: 'var(--color-gray-4)',
        }}
      >
        <Stack gap={4}>
          <Text size="xl" weight="bold" color="primary">
            Help Center
          </Text>
          <Text size="sm" color="secondary">
            Find answers and guides
          </Text>
        </Stack>
        <Stack gap={4}>
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
        </Stack>
      </Stack>
      <Stack
        flex={1}
        padding={32}
        paddingHorizontal={40}
        maxWidth={1200}
        width="100%"
      >
        <Outlet />
      </Stack>
    </Row>
  );
}

export default HelpCenterLayout;
