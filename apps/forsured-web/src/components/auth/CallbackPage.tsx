/**
 * OAuth Callback Page - Using Tamagui
 * REQ-126: OAuth 2.0 + RBAC Authentication System
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { YStack, XStack, Text, styled } from '@unicornlove/ui';
import { Button as CoreButton } from '@unicornlove/ui';
import { Spinner } from 'tamagui';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthError } from '../../lib/auth/types';

const PageContainer = styled(YStack, {
  name: 'CallbackPageContainer',
  minHeight: '100vh',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '$background',
});

const CardContainer = styled(YStack, {
  name: 'CallbackCardContainer',
  maxWidth: 448,
  width: '100%',
  gap: '$8',
  padding: '$10',
  backgroundColor: '$backgroundHover',
  borderRadius: '$xl',
  shadowColor: '$shadowColor',
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 10 },
  textAlign: 'center',
});

const SpinnerContainer = styled(YStack, {
  name: 'SpinnerContainer',
  position: 'relative',
  width: 64,
  height: 64,
});

export const CallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleCallback } = useAuth();
  const [error, setError] = useState<AuthError | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    processCallback();
  }, []);

  const processCallback = async () => {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code || !state) {
        throw new Error('Missing authorization code or state parameter');
      }

      await handleCallback(code, state);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Callback processing failed:', err);
      setError(err as AuthError);
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    navigate('/login', { replace: true });
  };

  if (isProcessing && !error) {
    return (
      <PageContainer>
        <CardContainer>
          {/* Loading Animation */}
          <YStack alignItems="center" gap="$6">
            <SpinnerContainer>
              <YStack
                width={64}
                height={64}
                borderRadius="$10"
                borderWidth={4}
                borderColor="$blue6"
              />
              <YStack
                position="absolute"
                top={0}
                left={0}
                width={64}
                height={64}
                borderRadius="$10"
                borderWidth={4}
                borderColor="$blue9"
                borderTopColor="transparent"
                animation="spin"
                animationDuration="1s"
                animationIterationCount="infinite"
              />
            </SpinnerContainer>
            <Text fontSize="$8" fontWeight="700" color="$color12">
              Completing Sign In
            </Text>
            <Text fontSize="$2" color="$color10">
              Please wait while we authenticate your account...
            </Text>
          </YStack>

          {/* Progress Steps */}
          <YStack gap="$3" marginTop="$8" alignItems="flex-start">
            <XStack alignItems="center" gap="$3">
              <CheckCircle size={20} color="currentColor" />
              <Text fontSize="$2" color="$color11">
                Authenticated with Scaffald
              </Text>
            </XStack>
            <XStack alignItems="center" gap="$3">
              <YStack
                width={20}
                height={20}
                borderRadius="$10"
                backgroundColor="$blue9"
                animation="pulse"
                animationDuration="2s"
                animationIterationCount="infinite"
              />
              <Text fontSize="$2" color="$color11">
                Exchanging authorization code
              </Text>
            </XStack>
            <XStack alignItems="center" gap="$3" opacity={0.5}>
              <YStack
                width={20}
                height={20}
                borderRadius="$10"
                borderWidth={2}
                borderColor="$borderColor"
              />
              <Text fontSize="$2" color="$color10">
                Creating secure session
              </Text>
            </XStack>
          </YStack>
        </CardContainer>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <CardContainer>
          {/* Error Icon */}
          <YStack alignItems="center" gap="$6">
            <YStack
              width={64}
              height={64}
              backgroundColor="$red3"
              borderRadius="$10"
              alignItems="center"
              justifyContent="center"
            >
              <AlertTriangle size={40} color="currentColor" />
            </YStack>
            <Text fontSize="$8" fontWeight="700" color="$color12">
              Authentication Failed
            </Text>
            <Text fontSize="$2" color="$color10">
              We encountered an error while signing you in
            </Text>
          </YStack>

          {/* Error Details */}
          <YStack
            backgroundColor="$red2"
            borderWidth={1}
            borderColor="$red6"
            borderRadius="$md"
            padding="$4"
            gap="$1"
          >
            <Text fontSize="$2" color="$red11">
              <Text fontWeight="600">Error:</Text> {error.message}
            </Text>
            {error.code && (
              <Text fontSize="$1" color="$red10" marginTop="$1">
                Code: {error.code}
              </Text>
            )}
          </YStack>

          {/* Actions */}
          <YStack gap="$3">
            <CoreButton
              onPress={handleRetry}
              variant="primary"
              fullWidth
            >
              Try Again
            </CoreButton>
            <CoreButton
              onPress={() => navigate('/')}
              variant="outlined"
              fullWidth
            >
              Go Home
            </CoreButton>
          </YStack>
        </CardContainer>
      </PageContainer>
    );
  }

  return null;
};
