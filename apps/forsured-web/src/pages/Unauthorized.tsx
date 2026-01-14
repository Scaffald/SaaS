/**
 * Unauthorized Page - Access denied page using Beyond UI
 */
import { useNavigate } from 'react-router-dom';
import { Stack, Row, Text, Button, H2, Box } from '@unicornlove/beyond-ui';
import { colors, spacing, fontSize, borderRadius, shadows } from '@unicornlove/beyond-ui';
import { ShieldX } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function UnauthorizedPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const handleGoBack = () => {
    // Navigate to user's correct dashboard based on role
    if (profile?.user_type) {
      navigate(`/${profile.user_type}/dashboard`);
    } else {
      navigate('/');
    }
  };

  return (
    <Stack
      style={{
        minHeight: '100vh',
        backgroundColor: colors.gray[50],
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing[16],
      }}
    >
      <Stack
        style={{
          maxWidth: 448,
          width: '100%',
          textAlign: 'center',
          backgroundColor: colors.bg.light.default,
          borderRadius: borderRadius.l,
          boxShadow: shadows.l.boxShadow,
          padding: spacing[32],
          gap: spacing[24],
        }}
      >
        <Row
          style={{
            width: 64,
            height: 64,
            backgroundColor: colors.error[100],
            borderRadius: borderRadius.max,
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
          }}
        >
          <ShieldX size={32} color={colors.error[600]} />
        </Row>

        <Stack style={{ gap: spacing[8] }}>
          <H2
            style={{
              fontSize: fontSize.h4,
              fontWeight: 700,
              color: colors.text.light.primary,
            }}
          >
            Access Denied
          </H2>
          <Text
            style={{
              fontSize: fontSize.lg,
              color: colors.text.light.secondary,
            }}
          >
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </Text>
        </Stack>

        <Button
          onPress={handleGoBack}
          variant="filled"
          color="primary"
          style={{ width: '100%' }}
        >
          Go to My Dashboard
        </Button>
      </Stack>
    </Stack>
  );
}

export default UnauthorizedPage;
