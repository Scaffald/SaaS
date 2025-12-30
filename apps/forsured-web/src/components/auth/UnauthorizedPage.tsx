/**
 * Unauthorized Page - Using Tamagui
 * REQ-126: OAuth 2.0 + RBAC Authentication System
 */
import type React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { YStack, XStack, Text, styled } from '@unicornlove/ui'
import { Button as CoreButton } from '@unicornlove/ui'
import { Lock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'

const PageContainer = styled(YStack, {
  name: 'UnauthorizedPageContainer',
  minHeight: '100vh',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '$background',
})

const CardContainer = styled(YStack, {
  name: 'UnauthorizedCardContainer',
  maxWidth: 448,
  width: '100%',
  gap: '$8',
  padding: '$10',
  backgroundColor: '$backgroundHover',
  borderRadius: '$5',
  shadowColor: '$shadowColor',
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 10 },
})

const IconContainer = styled(YStack, {
  name: 'IconContainer',
  width: 64,
  height: 64,
  backgroundColor: '$yellow3',
  borderRadius: '$10',
  alignItems: 'center',
  justifyContent: 'center',
})

const SupportLink = styled(Text, {
  name: 'SupportLink',
  tag: 'a',
  color: '$blue9',
  cursor: 'pointer',
  hoverStyle: {
    color: '$blue11',
    textDecorationLine: 'underline',
  },
})

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, logout } = useAuth()
  const { currentRole } = usePermissions()

  const reason = (location.state as any)?.reason || 'insufficient_permissions'
  const from = (location.state as any)?.from?.pathname || '/'

  const handleGoBack = () => {
    navigate(-1)
  }

  const handleGoToDashboard = () => {
    navigate('/dashboard')
  }

  const handleSwitchAccount = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <PageContainer>
      <CardContainer>
        {/* Icon */}
        <YStack alignItems="center" gap="$6">
          <IconContainer>
            <Lock size={40} color="currentColor" />
          </IconContainer>
          <Text fontSize="$9" fontWeight="700" color="$color12">
            Access Denied
          </Text>
          <Text fontSize="$2" color="$color10" style={{ textAlign: 'center' }}>
            {reason === 'insufficient_role'
              ? "You don't have the required role to access this page"
              : "You don't have permission to access this resource"}
          </Text>
        </YStack>

        {/* User Info */}
        {user && (
          <YStack
            backgroundColor="$blue2"
            borderWidth={1}
            borderColor="$blue6"
            borderRadius="$3"
            padding="$4"
            gap="$3"
          >
            <XStack gap="$3">
              <YStack flexShrink={0}>
                <Text fontSize="$4" color="$blue9">
                  👤
                </Text>
              </YStack>
              <YStack flex={1} gap="$1">
                <Text fontSize="$2" color="$blue11">
                  <Text fontWeight="600">Current User:</Text> {user.email}
                </Text>
                <Text fontSize="$2" color="$blue11" mt="$1">
                  <Text fontWeight="600">Role:</Text>{' '}
                  <Text textTransform="capitalize">{currentRole || profile?.user_type || 'Unknown'}</Text>
                </Text>
              </YStack>
            </XStack>
          </YStack>
        )}

        {/* Attempted Path */}
        {from && from !== '/' && (
          <YStack backgroundColor="$backgroundHover" borderRadius="$3" padding="$4" gap="$1">
            <Text fontSize="$1" color="$color9">
              Attempted to access:
            </Text>
            <Text
              fontSize="$2"
              color="$color11"
              fontFamily="$mono"
              mt="$1"
              numberOfLines={3}
            >
              {from}
            </Text>
          </YStack>
        )}

        {/* Actions */}
        <YStack gap="$3">
          <CoreButton onPress={handleGoToDashboard} variant="primary" fullWidth>
            Go to Dashboard
          </CoreButton>
          <CoreButton onPress={handleGoBack} variant="outlined" fullWidth>
            Go Back
          </CoreButton>
          <CoreButton onPress={handleSwitchAccount} variant="outlined" fullWidth>
            Switch Account
          </CoreButton>
        </YStack>

        {/* Contact Support */}
        <YStack mt="$6" alignItems="center">
          <Text fontSize="$1" color="$color9" style={{ textAlign: 'center' }}>
            If you believe this is an error, please{' '}
            <SupportLink href="mailto:support@forsured.com">
              contact support
            </SupportLink>
          </Text>
        </YStack>
      </CardContainer>
    </PageContainer>
  )
}
