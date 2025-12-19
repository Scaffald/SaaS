/**
 * Login Page Component - Using Tamagui
 * REQ-126: OAuth 2.0 + RBAC Authentication System
 */
import React, { useState } from 'react';
import { YStack, XStack, Text, styled } from '@unicornlove/ui';
import { Button as CoreButton } from '@unicornlove/ui';
import { Spinner } from 'tamagui';
import { useAuth } from '../../contexts/AuthContext';
import { AuthError } from '../../lib/auth/types';

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

export const LoginPage: React.FC = () => {
  const { login, state } = useAuth();
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
