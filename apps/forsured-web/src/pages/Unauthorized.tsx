/**
 * Unauthorized Page - Access denied page using Tamagui
 */
import { useNavigate } from 'react-router-dom';
import { YStack, XStack, Text } from '@unicornlove/ui';
import { Button as CoreButton } from '@unicornlove/ui';
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
    <YStack
      minHeight="100vh"
      backgroundColor="$gray2"
      alignItems="center"
      justifyContent="center"
      padding="$4"
    >
      <YStack
        maxWidth={448}
        width="100%"
        textAlign="center"
        backgroundColor="$background"
        borderRadius="$xl"
        shadowColor="$shadowColor"
        shadowRadius={20}
        shadowOffset={{ width: 0, height: 8 }}
        padding="$8"
        gap="$6"
      >
        <XStack
          width={64}
          height={64}
          backgroundColor="$red3"
          borderRadius="$10"
          alignItems="center"
          justifyContent="center"
          alignSelf="center"
        >
          <ShieldX size={32} color="currentColor" />
        </XStack>

        <YStack gap="$2">
          <Text fontSize="$8" fontWeight="700" color="$color12">
            Access Denied
          </Text>
          <Text fontSize="$4" color="$color11">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </Text>
        </YStack>

        <CoreButton
          onClick={handleGoBack}
          variant="primary"
          fullWidth
        >
          Go to My Dashboard
        </CoreButton>
      </YStack>
    </YStack>
  );
}

export default UnauthorizedPage;
