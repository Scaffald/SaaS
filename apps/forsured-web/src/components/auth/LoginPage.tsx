/**
 * Login Page Component - Using Tamagui
 * REQ-126: OAuth 2.0 + RBAC Authentication System
 * REQ-11: Authentication Flow Refinement - httpOnly cookie token storage
 */
import type React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { YStack, XStack, Text, styled } from '@unicornlove/ui'
import { Button as CoreButton } from '@unicornlove/ui'
import { Spinner } from '@unicornlove/ui'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import type { AuthError } from '../../lib/auth/types'

const PageContainer = styled(YStack, {
  name: 'LoginPageContainer',
  minHeight: '100vh',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '$background',
})

const CardContainer = styled(YStack, {
  name: 'LoginCardContainer',
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

const LogoContainer = styled(YStack, {
  name: 'LogoContainer',
  width: 64,
  height: 64,
  backgroundColor: '$blue9',
  borderRadius: '$5',
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '$shadowColor',
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
})

/**
 * Test user credentials (seeded in database via migration 248)
 * Password for all test users: ForsuredTest123!
 */
const TEST_USERS: Record<'gc' | 'contractor' | 'broker' | 'admin', { email: string; password: string }> = {
  gc: { email: 'test-gc@forsured.test', password: 'ForsuredTest123!' },
  contractor: { email: 'test-contractor@forsured.test', password: 'ForsuredTest123!' },
  broker: { email: 'test-broker@forsured.test', password: 'ForsuredTest123!' },
  admin: { email: 'test-admin@forsured.test', password: 'ForsuredTest123!' },
}

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [testLoginLoading, setTestLoginLoading] = useState<string | null>(null)
  const [error, setError] = useState<AuthError | null>(null)

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true)
      setError(null)
      await login()
    } catch (err) {
      console.error('Login failed:', err)
      setError(err as AuthError)
      setIsLoggingIn(false)
    }
  }

  /**
   * Test login using real Supabase authentication
   * Uses seeded test users from migration 248_forsured_seed_test_users.sql
   */
  const handleTestLogin = async (userType: 'gc' | 'contractor' | 'broker' | 'admin') => {
    const testUser = TEST_USERS[userType]
    setTestLoginLoading(userType)
    setError(null)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password,
      })

      if (signInError) {
        console.error('[LoginPage] Test login error:', signInError)
        if (signInError.message.includes('Invalid login credentials')) {
          setError({
            message: 'Test user not found. Run migrations to seed test users: pnpm supabase db reset',
            code: 'USER_NOT_FOUND',
          } as AuthError)
        } else {
          setError({ message: signInError.message, code: 'AUTH_ERROR' } as AuthError)
        }
        setTestLoginLoading(null)
        return
      }

      if (!data.session || !data.user) {
        setError({ message: 'Login succeeded but no session was created', code: 'NO_SESSION' } as AuthError)
        setTestLoginLoading(null)
        return
      }

      console.log('[LoginPage] Test login successful:', data.user.email)
      // Navigate to the appropriate dashboard based on user type
      const dashboardRoutes: Record<string, string> = {
        gc: '/manager/dashboard',
        contractor: '/subcontractor/dashboard',
        broker: '/broker/dashboard',
        admin: '/admin/dashboard',
      }
      const targetRoute = dashboardRoutes[userType] || '/manager/dashboard'
      console.log('[LoginPage] Navigating to:', targetRoute)
      navigate(targetRoute)
    } catch (err) {
      console.error('[LoginPage] Test login unexpected error:', err)
      setError({ message: err instanceof Error ? err.message : 'Test login failed', code: 'UNKNOWN' } as AuthError)
      setTestLoginLoading(null)
    }
  }

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
        {error && (
          <YStack
            backgroundColor="$red2"
            borderWidth={1}
            borderColor="$red6"
            borderRadius="$3"
            padding="$4"
            gap="$3"
          >
            <XStack gap="$3">
              <YStack flexShrink={0}>
                <Text fontSize="$4" color="$red9">
                  ✕
                </Text>
              </YStack>
              <YStack flex={1} gap="$1">
                <Text fontSize="$2" fontWeight="500" color="$red11">
                  Authentication Failed
                </Text>
                <Text fontSize="$2" color="$red10">
                  {error?.message || 'An unknown error occurred'}
                </Text>
              </YStack>
            </XStack>
          </YStack>
        )}

        {/* Login Button */}
        <YStack gap="$4">
          <CoreButton
            onPress={handleLogin}
            disabled={isLoggingIn || isLoading}
            variant="primary"
            fullWidth
            size="$4"
          >
            {isLoggingIn || isLoading ? (
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
            borderRadius="$3"
            padding="$4"
            gap="$3"
          >
            <XStack gap="$3">
              <YStack flexShrink={0}>
                <Text fontSize="$4" color="$blue9">
                  ℹ
                </Text>
              </YStack>
              <Text fontSize="$2" color="$blue11" flex={1}>
                You'll be redirected to Scaffald to sign in with your existing credentials.
              </Text>
            </XStack>
          </YStack>

          {/* TEMPORARY: Test Login Buttons */}
          <YStack
            mt="$4"
            padding="$4"
            backgroundColor="$yellow2"
            borderWidth={1}
            borderColor="$yellow6"
            borderRadius="$3"
            gap="$3"
          >
            <Text fontSize="$3" fontWeight="600" color="$yellow11">
              🧪 Temporary Test Login
            </Text>
            <Text fontSize="$2" color="$yellow10">
              Real Supabase login with seeded test users. Run migrations first.
            </Text>
            <YStack gap="$2" mt="$2">
              <CoreButton
                onPress={() => handleTestLogin('gc')}
                variant="secondary"
                fullWidth
                size="$3"
                disabled={testLoginLoading !== null}
              >
                {testLoginLoading === 'gc' ? (
                  <XStack gap="$2" alignItems="center">
                    <Spinner size="small" />
                    <Text>Signing in...</Text>
                  </XStack>
                ) : (
                  <Text>Test as GC / Manager</Text>
                )}
              </CoreButton>
              <CoreButton
                onPress={() => handleTestLogin('contractor')}
                variant="secondary"
                fullWidth
                size="$3"
                disabled={testLoginLoading !== null}
              >
                {testLoginLoading === 'contractor' ? (
                  <XStack gap="$2" alignItems="center">
                    <Spinner size="small" />
                    <Text>Signing in...</Text>
                  </XStack>
                ) : (
                  <Text>Test as Contractor / Subcontractor</Text>
                )}
              </CoreButton>
              <CoreButton
                onPress={() => handleTestLogin('broker')}
                variant="secondary"
                fullWidth
                size="$3"
                disabled={testLoginLoading !== null}
              >
                {testLoginLoading === 'broker' ? (
                  <XStack gap="$2" alignItems="center">
                    <Spinner size="small" />
                    <Text>Signing in...</Text>
                  </XStack>
                ) : (
                  <Text>Test as Broker</Text>
                )}
              </CoreButton>
              <CoreButton
                onPress={() => handleTestLogin('admin')}
                variant="secondary"
                fullWidth
                size="$3"
                disabled={testLoginLoading !== null}
              >
                {testLoginLoading === 'admin' ? (
                  <XStack gap="$2" alignItems="center">
                    <Spinner size="small" />
                    <Text>Signing in...</Text>
                  </XStack>
                ) : (
                  <Text>Test as Admin</Text>
                )}
              </CoreButton>
            </YStack>
          </YStack>
        </YStack>

        {/* Security Notice */}
        <YStack mt="$6">
          <Text fontSize="$1" style={{ textAlign: 'center' }} color="$color9">
            Secured with OAuth 2.0 + PKCE
          </Text>
        </YStack>
      </CardContainer>
    </PageContainer>
  )
}
