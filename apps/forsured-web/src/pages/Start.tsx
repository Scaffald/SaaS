/**
 * Start Page - Landing page with magic link login
 * Uses Supabase magic links for passwordless authentication
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextInput, Platform } from 'react-native';
import {
  Stack,
  Text,
  Button,
  Box,
  H1,
  H3,
} from '@unicornlove/beyond-ui';
import { colors, spacing, borderRadius, shadows, typography } from '@unicornlove/beyond-ui';
import { supabase } from '../lib/supabase';

/**
 * Test user credentials (seeded in database)
 * NOTE: If these don't work, run `pnpm supa db reset` to reseed the database
 * Password for all test users: ForsuredTest123!
 */
const TEST_USERS: Record<'gc' | 'contractor' | 'broker' | 'admin', { email: string; password: string }> = {
  gc: { email: 'test-gc@forsured.test', password: 'ForsuredTest123!' },
  contractor: { email: 'test-contractor@forsured.test', password: 'ForsuredTest123!' },
  broker: { email: 'test-broker@forsured.test', password: 'ForsuredTest123!' },
  admin: { email: 'test-admin@forsured.test', password: 'ForsuredTest123!' },
};

function StartPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testLoginLoading, setTestLoginLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    console.log('[StartPage] Form submitted with email:', email);
    setIsLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const redirectTo = `${window.location.protocol}//${window.location.host}/auth/callback`;

      console.log('[StartPage] Sending magic link with redirectTo:', redirectTo);

      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        },
      });

      if (error) {
        console.error('[StartPage] Error sending magic link:', error);
        setError(error.message || 'Failed to send magic link. Please try again.');
        setIsLoading(false);
        return;
      }

      console.log('[StartPage] Magic link sent - user will receive email');
      navigate(`/auth/verify?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (error) {
      console.error('[StartPage] Error initiating auth:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  /**
   * Test login using real Supabase authentication
   */
  const handleTestLogin = async (userType: 'gc' | 'contractor' | 'broker' | 'admin') => {
    const testUser = TEST_USERS[userType];
    setTestLoginLoading(userType);
    setError(null);

    console.log('[StartPage] Attempting test login for:', testUser.email);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password,
      });

      if (signInError) {
        console.error('[StartPage] Test login error:', signInError);
        if (signInError.message.includes('Invalid login credentials')) {
          setError(
            `Test user not found. Please run migrations to seed test users:\n` +
            `pnpm supabase db reset`
          );
        } else {
          setError(signInError.message);
        }
        setTestLoginLoading(null);
        return;
      }

      if (!data.session || !data.user) {
        setError('Login succeeded but no session was created');
        setTestLoginLoading(null);
        return;
      }

      console.log('[StartPage] Test login successful:', data.user.email);

      const dashboardRoutes: Record<string, string> = {
        gc: '/manager/dashboard',
        contractor: '/subcontractor/dashboard',
        broker: '/broker/dashboard',
        admin: '/admin/dashboard',
      };
      const targetRoute = dashboardRoutes[userType] || '/manager/dashboard';
      console.log('[StartPage] Navigating to:', targetRoute);
      navigate(targetRoute);
    } catch (err) {
      console.error('[StartPage] Test login unexpected error:', err);
      setError(err instanceof Error ? err.message : 'Test login failed');
      setTestLoginLoading(null);
    }
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        backgroundColor: colors.bg.light.subtle,
        padding: spacing[16],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        style={{
          maxWidth: 448,
          width: '100%',
          backgroundColor: colors.bg.light.default,
          borderRadius: borderRadius.xl,
          padding: spacing[32],
          boxShadow: shadows.md,
        }}
      >
        <Stack gap={spacing[32]} alignItems="center">
          {/* Logo and Header */}
          <Stack gap={spacing[16]} alignItems="center">
            <Box
              style={{
                width: 64,
                height: 64,
                backgroundColor: colors.primary[500],
                borderRadius: borderRadius.lg,
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: shadows.sm,
              }}
            >
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: '700',
                  color: colors.white,
                }}
              >
                F
              </Text>
            </Box>
            
            <Stack gap={spacing[4]} alignItems="center">
              <H1 style={{ textAlign: 'center', margin: 0 }}>
                Welcome to ForSured
              </H1>
              <Text color="secondary" style={{ textAlign: 'center' }}>
                Manage subcontractor compliance with confidence.
              </Text>
            </Stack>
          </Stack>

          {/* Email Form */}
          <form onSubmit={handleEmailContinue} style={{ width: '100%' }}>
            <Stack gap={spacing[16]} style={{ width: '100%' }}>
              {/* Email Input */}
              <Stack gap={spacing[4]} style={{ width: '100%' }}>
                {/* Label */}
                <Text
                  size="sm"
                  weight="medium"
                  color={error ? 'error' : 'primary'}
                >
                  Email address <Text style={{ color: colors.error[500] }}>*</Text>
                </Text>
                
                {/* Input Field */}
                <TextInput
                  type="email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError(null);
                  }}
                  placeholder="you@company.com"
                  placeholderTextColor={colors.text.light.tertiary}
                  editable={!isLoading}
                  style={{
                    width: '100%',
                    minWidth: '100%',
                    maxWidth: '100%',
                    minHeight: 44,
                    paddingHorizontal: spacing[12],
                    paddingVertical: spacing[8],
                    borderRadius: borderRadius.m,
                    backgroundColor: colors.bg.light.default,
                    borderWidth: 1,
                    borderColor: error ? colors.error[500] : colors.border.light.default,
                    ...typography.body,
                    color: colors.text.light.primary,
                    ...(Platform.OS === 'web' ? { 
                      outlineStyle: 'none',
                      boxSizing: 'border-box',
                    } : {}),
                  }}
                />
                
                {/* Error Message */}
                {error && (
                  <Text size="sm" color="error">
                    {error}
                  </Text>
                )}
              </Stack>

              <Button
                type="submit"
                color="primary"
                variant="filled"
                disabled={isLoading || !email}
                fullWidth
                loading={isLoading}
              >
                {isLoading ? 'Sending...' : 'Continue with Email'}
              </Button>
            </Stack>
          </form>

          {/* TEMPORARY: Test Login Buttons */}
          <Box
            style={{
              width: '100%',
              padding: spacing[16],
              backgroundColor: colors.warning[50],
              borderWidth: 1,
              borderColor: colors.warning[200],
              borderRadius: borderRadius.m,
            }}
          >
            <Stack gap={spacing[12]}>
              <Stack gap={spacing[4]}>
                <H3 style={{ margin: 0, color: colors.warning[700] }}>
                  Temporary Test Login
                </H3>
                <Text style={{ fontSize: 12, color: colors.warning[600] }}>
                  Real Supabase login with seeded test users. Run migrations first.
                </Text>
              </Stack>
              
              <Stack gap={spacing[8]}>
                <Button
                  onPress={() => handleTestLogin('gc')}
                  color="gray"
                  variant="light"
                  fullWidth
                  disabled={testLoginLoading !== null}
                  loading={testLoginLoading === 'gc'}
                >
                  Test as GC / Manager
                </Button>
                <Button
                  onPress={() => handleTestLogin('contractor')}
                  color="gray"
                  variant="light"
                  fullWidth
                  disabled={testLoginLoading !== null}
                  loading={testLoginLoading === 'contractor'}
                >
                  Test as Contractor / Subcontractor
                </Button>
                <Button
                  onPress={() => handleTestLogin('broker')}
                  color="gray"
                  variant="light"
                  fullWidth
                  disabled={testLoginLoading !== null}
                  loading={testLoginLoading === 'broker'}
                >
                  Test as Broker
                </Button>
                <Button
                  onPress={() => handleTestLogin('admin')}
                  color="gray"
                  variant="light"
                  fullWidth
                  disabled={testLoginLoading !== null}
                  loading={testLoginLoading === 'admin'}
                >
                  Test as Admin
                </Button>
              </Stack>
            </Stack>
          </Box>

        </Stack>
      </Box>
    </Box>
  );
}

export default StartPage;
