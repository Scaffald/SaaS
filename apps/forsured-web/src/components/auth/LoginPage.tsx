/**
 * Login Page Component - Using Beyond UI
 * OAuth 2.0 + RBAC Authentication System
 * Authentication Flow Refinement - httpOnly cookie token storage
 */
import type React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stack, Row, Text, Button } from '@scaffald/ui'
import { colors, spacing, fontSize, borderRadius, shadows } from '@scaffald/ui'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import type { AuthError } from '../../lib/auth/types'

const pageContainerStyle: React.CSSProperties = {
  minHeight: '100vh',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.bg.light.default,
}

const cardContainerStyle: React.CSSProperties = {
  maxWidth: '448px',
  width: '100%',
  gap: spacing[32],
  padding: spacing[40],
  backgroundColor: colors.bg.light.hover,
  borderRadius: borderRadius.l,
  boxShadow: shadows.l.boxShadow,
}

const logoContainerStyle: React.CSSProperties = {
  width: 64,
  height: 64,
  backgroundColor: colors.primary[500],
  borderRadius: borderRadius.l,
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: shadows.m.boxShadow,
}

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
    <Stack style={pageContainerStyle}>
      <Stack style={cardContainerStyle}>
        {/* Logo and Header */}
        <Stack style={{ alignItems: 'center', gap: spacing[24] }}>
          <Stack style={logoContainerStyle}>
            <Text style={{ fontSize: fontSize.h4, fontWeight: 700, color: colors.bg.light.default }}>
              F
            </Text>
          </Stack>
          <Text style={{ fontSize: fontSize.h4, fontWeight: 700, color: colors.text.light.primary }}>
            Welcome to ForSured
          </Text>
          <Text style={{ fontSize: fontSize.xs, color: colors.text.light.tertiary }}>
            Construction compliance made simple
          </Text>
        </Stack>

        {/* Error Message */}
        {error && (
          <Stack
            style={{
              backgroundColor: colors.error[50],
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: colors.error[300],
              borderRadius: borderRadius.s,
              padding: spacing[16],
              gap: spacing[12],
            }}
          >
            <Row style={{ gap: spacing[12] }}>
              <Stack style={{ flexShrink: 0 }}>
                <Text style={{ fontSize: fontSize.md, color: colors.error[500] }}>
                  ✕
                </Text>
              </Stack>
              <Stack style={{ flex: 1, gap: spacing[4] }}>
                <Text style={{ fontSize: fontSize.xs, fontWeight: 500, color: colors.error[700] }}>
                  Authentication Failed
                </Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.error[600] }}>
                  {error?.message || 'An unknown error occurred'}
                </Text>
              </Stack>
            </Row>
          </Stack>
        )}

        {/* Login Button */}
        <Stack style={{ gap: spacing[16] }}>
          <Button
            onPress={handleLogin}
            disabled={isLoggingIn || isLoading}
            variant="filled"
            color="primary"
            fullWidth
            size="lg"
          >
            {isLoggingIn || isLoading ? (
              <Row style={{ alignItems: 'center', gap: spacing[8] }}>
                <Loader2 className="animate-spin" size={16} color={colors.bg.light.default} />
                <Text>Signing in...</Text>
              </Row>
            ) : (
              <Row style={{ alignItems: 'center', gap: spacing[8] }}>
                <Text>→</Text>
                <Text>Sign in with Scaffald</Text>
              </Row>
            )}
          </Button>

          {/* Information */}
          <Stack
            style={{
              backgroundColor: colors.primary[50],
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: colors.primary[300],
              borderRadius: borderRadius.s,
              padding: spacing[16],
              gap: spacing[12],
            }}
          >
            <Row style={{ gap: spacing[12] }}>
              <Stack style={{ flexShrink: 0 }}>
                <Text style={{ fontSize: fontSize.md, color: colors.primary[500] }}>
                  ℹ
                </Text>
              </Stack>
              <Text style={{ fontSize: fontSize.xs, color: colors.primary[700], flex: 1 }}>
                You'll be redirected to Scaffald to sign in with your existing credentials.
              </Text>
            </Row>
          </Stack>

          {/* TEMPORARY: Test Login Buttons */}
          <Stack
            style={{
              marginTop: spacing[16],
              padding: spacing[16],
              backgroundColor: colors.warning[50],
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: colors.warning[300],
              borderRadius: borderRadius.s,
              gap: spacing[12],
            }}
          >
            <Text style={{ fontSize: fontSize.sm, fontWeight: 600, color: colors.warning[700] }}>
              🧪 Temporary Test Login
            </Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.warning[600] }}>
              Real Supabase login with seeded test users. Run migrations first.
            </Text>
            <Stack style={{ gap: spacing[8], marginTop: spacing[8] }}>
              <Button
                onPress={() => handleTestLogin('gc')}
                variant="outline"
                color="gray"
                fullWidth
                size="md"
                disabled={testLoginLoading !== null}
              >
                {testLoginLoading === 'gc' ? (
                  <Row style={{ gap: spacing[8], alignItems: 'center' }}>
                    <Loader2 className="animate-spin" size={16} />
                    <Text>Signing in...</Text>
                  </Row>
                ) : (
                  <Text>Test as GC / Manager</Text>
                )}
              </Button>
              <Button
                onPress={() => handleTestLogin('contractor')}
                variant="outline"
                color="gray"
                fullWidth
                size="md"
                disabled={testLoginLoading !== null}
              >
                {testLoginLoading === 'contractor' ? (
                  <Row style={{ gap: spacing[8], alignItems: 'center' }}>
                    <Loader2 className="animate-spin" size={16} />
                    <Text>Signing in...</Text>
                  </Row>
                ) : (
                  <Text>Test as Contractor / Subcontractor</Text>
                )}
              </Button>
              <Button
                onPress={() => handleTestLogin('broker')}
                variant="outline"
                color="gray"
                fullWidth
                size="md"
                disabled={testLoginLoading !== null}
              >
                {testLoginLoading === 'broker' ? (
                  <Row style={{ gap: spacing[8], alignItems: 'center' }}>
                    <Loader2 className="animate-spin" size={16} />
                    <Text>Signing in...</Text>
                  </Row>
                ) : (
                  <Text>Test as Broker</Text>
                )}
              </Button>
              <Button
                onPress={() => handleTestLogin('admin')}
                variant="outline"
                color="gray"
                fullWidth
                size="md"
                disabled={testLoginLoading !== null}
              >
                {testLoginLoading === 'admin' ? (
                  <Row style={{ gap: spacing[8], alignItems: 'center' }}>
                    <Loader2 className="animate-spin" size={16} />
                    <Text>Signing in...</Text>
                  </Row>
                ) : (
                  <Text>Test as Admin</Text>
                )}
              </Button>
            </Stack>
          </Stack>
        </Stack>

        {/* Security Notice */}
        <Stack style={{ marginTop: spacing[24] }}>
          <Text style={{ fontSize: fontSize.xs, textAlign: 'center', color: colors.text.light.tertiary }}>
            Secured with OAuth 2.0 + PKCE
          </Text>
        </Stack>
      </Stack>
    </Stack>
  )
}
