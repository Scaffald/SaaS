/**
 * Login Page Component - Using Tamagui
 * REQ-126: OAuth 2.0 + RBAC Authentication System
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { YStack, XStack, Text, styled } from '@unicornlove/ui';
import { Button as CoreButton } from '@unicornlove/ui';
import { Spinner } from 'tamagui';
import { useAuth } from '../../contexts/AuthContext';
import { AuthError } from '../../lib/auth/types';
import { UserProfile } from '../../types';
import { User as ScaffaldUser } from '../../lib/scaffald/types';
import { saveTokens } from '../../lib/scaffald/auth';

const PageContainer = styled(YStack, {
  name: 'LoginPageContainer',
  minHeight: '100vh',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '$background',
});

const CardContainer = styled(YStack, {
  name: 'LoginCardContainer',
  maxWidth: 448,
  width: '100%',
  gap: '$8',
  padding: '$10',
  backgroundColor: '$backgroundHover',
  borderRadius: '$xl',
  shadowColor: '$shadowColor',
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 10 },
});

const LogoContainer = styled(YStack, {
  name: 'LogoContainer',
  width: 64,
  height: 64,
  backgroundColor: '$blue9',
  borderRadius: '$xl',
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '$shadowColor',
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
});

/**
 * Map database user types to route prefixes
 */
const USER_TYPE_TO_ROUTE: Record<string, string> = {
  gc: 'manager',
  manager: 'manager',
  contractor: 'subcontractor',
  subcontractor: 'subcontractor',
  broker: 'broker',
  admin: 'admin',
};

/**
 * Create a mock user and profile for testing
 * Note: The database stores 'gc' and 'contractor', but UserProfile type expects route types.
 * We use route types to satisfy TypeScript, matching how ProtectedRoute expects them.
 */
function createMockSession(
  userType: 'gc' | 'contractor' | 'broker' | 'admin'
): { user: ScaffaldUser; profile: UserProfile } {
  const userId = `test-${userType}-${Date.now()}`;
  const now = new Date().toISOString();

  const user: ScaffaldUser = {
    id: userId,
    email: `test-${userType}@forsured.test`,
    name: `Test ${userType === 'gc' ? 'GC' : userType === 'contractor' ? 'Contractor' : userType.charAt(0).toUpperCase() + userType.slice(1)}`,
  };

  // Map database types to route types for UserProfile interface
  // Database uses: gc, contractor, broker, admin
  // UserProfile type expects: manager, subcontractor, broker, admin
  const routeTypeMap: Record<'gc' | 'contractor' | 'broker' | 'admin', 'manager' | 'subcontractor' | 'broker' | 'admin'> = {
    gc: 'manager',
    contractor: 'subcontractor',
    broker: 'broker',
    admin: 'admin',
  };

  const profile: UserProfile = {
    id: `profile-${userId}`,
    scaffald_user_id: userId,
    user_type: routeTypeMap[userType],
    onboarding_completed: true,
    company_connected: false,
    onboarding_step: 5,
    onboarding_data: {},
    created_at: now,
    updated_at: now,
  };

  return { user, profile };
}

export const LoginPage: React.FC = () => {
  const { login, state } = useAuth();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setError(null);
      await login();
    } catch (err) {
      console.error('Login failed:', err);
      setError(err as AuthError);
      setIsLoggingIn(false);
    }
  };

  /**
   * Temporary test function to bypass login and set a session for a specific user type
   * This allows testing logged-in functionality without OAuth
   */
  const handleTestLogin = (userType: 'gc' | 'contractor' | 'broker' | 'admin') => {
    try {
      const { user, profile } = createMockSession(userType);

      // Save mock Scaffald tokens to localStorage
      saveTokens({
        access_token: `mock-test-token-${user.id}`,
        refresh_token: `mock-test-refresh-${user.id}`,
        expires_in: 3600,
        token_type: 'Bearer',
        created_at: Math.floor(Date.now() / 1000),
      });

      // Save mock Supabase session to localStorage
      localStorage.setItem('sb-auth-token', JSON.stringify({
        access_token: `mock-supabase-token-${user.id}`,
        refresh_token: `mock-supabase-refresh-${user.id}`,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: user.id,
          email: user.email,
          aud: 'authenticated',
          role: 'authenticated',
          app_metadata: {},
          user_metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }));

      // CRITICAL FIX: Save mock user for Scaffald client to retrieve
      // The mock Scaffald client checks this key when getUser() is called
      localStorage.setItem('mock_scaffald_current_user', JSON.stringify(user));

      // CRITICAL FIX: Save mock profile for AuthContext to retrieve
      // This ensures profile persists across navigation
      localStorage.setItem('mock_forsured_profile', JSON.stringify(profile));

      login({ user, profile });

      // profile.user_type is already a route type (manager, subcontractor, broker, admin)
      // Use it directly as the route prefix
      navigate(`/${profile.user_type}/dashboard`);
    } catch (err) {
      console.error('Test login failed:', err);
      setError(err as AuthError);
    }
  };

  return (
    <PageContainer>
      <CardContainer>
        {/* Logo and Header */}
        <YStack alignItems="center" gap="$6">
          <LogoContainer>
            <Text fontSize="$10" fontWeight="700" color="$color1">
              F
            </Text>
          </LogoContainer>
          <Text fontSize="$9" fontWeight="700" color="$color12">
            Welcome to ForSured
          </Text>
          <Text fontSize="$2" color="$color10">
            Construction compliance made simple
          </Text>
        </YStack>

        {/* Error Message */}
        {(error || state.error) && (
          <YStack
            backgroundColor="$red2"
            borderWidth={1}
            borderColor="$red6"
            borderRadius="$md"
            padding="$4"
            gap="$3"
          >
            <XStack gap="$3">
              <YStack flexShrink={0}>
                <Text fontSize="$4" color="$red9">✕</Text>
              </YStack>
              <YStack flex={1} gap="$1">
                <Text fontSize="$2" fontWeight="500" color="$red11">
                  Authentication Failed
                </Text>
                <Text fontSize="$2" color="$red10">
                  {(error || state.error)?.message || 'An unknown error occurred'}
                </Text>
              </YStack>
            </XStack>
          </YStack>
        )}

        {/* Login Button */}
        <YStack gap="$4">
          <CoreButton
            onPress={handleLogin}
            disabled={isLoggingIn || state.isLoading}
            variant="primary"
            fullWidth
            size="$4"
          >
            {isLoggingIn || state.isLoading ? (
              <XStack alignItems="center" gap="$2">
                <Spinner size="small" color="$color1" />
                <Text>Signing in...</Text>
              </XStack>
            ) : (
              <XStack alignItems="center" gap="$2">
                <Text>→</Text>
                <Text>Sign in with Scaffald</Text>
              </XStack>
            )}
          </CoreButton>

          {/* Information */}
          <YStack
            backgroundColor="$blue2"
            borderWidth={1}
            borderColor="$blue6"
            borderRadius="$md"
            padding="$4"
            gap="$3"
          >
            <XStack gap="$3">
              <YStack flexShrink={0}>
                <Text fontSize="$4" color="$blue9">ℹ</Text>
              </YStack>
              <Text fontSize="$2" color="$blue11" flex={1}>
                You'll be redirected to Scaffald to sign in with your existing credentials.
              </Text>
            </XStack>
          </YStack>

          {/* TEMPORARY: Test Login Buttons */}
          <YStack
            marginTop="$4"
            padding="$4"
            backgroundColor="$yellow2"
            borderWidth={1}
            borderColor="$yellow6"
            borderRadius="$md"
            gap="$3"
          >
            <Text fontSize="$3" fontWeight="600" color="$yellow11">
              🧪 Temporary Test Login
            </Text>
            <Text fontSize="$2" color="$yellow10">
              Bypass OAuth for testing. These buttons will be removed once OAuth is complete.
            </Text>
            <YStack gap="$2" marginTop="$2">
              <CoreButton
                onPress={() => handleTestLogin('gc')}
                variant="secondary"
                fullWidth
                size="$3"
              >
                <Text>Test as GC / Manager</Text>
              </CoreButton>
              <CoreButton
                onPress={() => handleTestLogin('contractor')}
                variant="secondary"
                fullWidth
                size="$3"
              >
                <Text>Test as Contractor / Subcontractor</Text>
              </CoreButton>
              <CoreButton
                onPress={() => handleTestLogin('broker')}
                variant="secondary"
                fullWidth
                size="$3"
              >
                <Text>Test as Broker</Text>
              </CoreButton>
              <CoreButton
                onPress={() => handleTestLogin('admin')}
                variant="secondary"
                fullWidth
                size="$3"
              >
                <Text>Test as Admin</Text>
              </CoreButton>
            </YStack>
          </YStack>
        </YStack>

        {/* Security Notice */}
        <YStack marginTop="$6">
          <Text fontSize="$1" textAlign="center" color="$color9">
            Secured with OAuth 2.0 + PKCE
          </Text>
        </YStack>
      </CardContainer>
    </PageContainer>
  );
};
