/**
 * Start Page - Landing page with OAuth login
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { YStack, XStack, Text, Spinner } from '@unicornlove/ui';
import { Button as CoreButton } from '@unicornlove/ui';
import { Input as TextInput } from '@unicornlove/ui';
import { initiateOAuth } from '../lib/auth/oauth';
import { supabase } from '../lib/supabase';

const USE_OAUTH = import.meta.env.VITE_FORSURED_USE_OAUTH === 'true';


function StartPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    console.log('[StartPage] Form submitted with email:', email);
    setIsLoading(true);
    try {
      if (USE_OAUTH) {
        // OAuth mode: Use Scaffald OAuth
        initiateOAuth({ loginHint: email });
      } else {
        // Magic link mode: Use Supabase magic link (like Scaffald does)
        // This creates users in Supabase Auth, which triggers the database trigger
        // to create core.users, core.profile, etc. (same as Scaffald)
        const normalizedEmail = email.trim().toLowerCase();
        // Use full URL with protocol - Supabase needs absolute URL
        const redirectTo = `${window.location.protocol}//${window.location.host}/auth/callback`;
        
        console.log('[StartPage] Sending magic link with redirectTo:', redirectTo);
        
        // Send magic link - Supabase will handle user creation if needed
        // Setting shouldCreateUser: true is safe - Supabase won't create duplicates
        const { error } = await supabase.auth.signInWithOtp({
          email: normalizedEmail,
          options: {
            emailRedirectTo: redirectTo,
            shouldCreateUser: true, // Always allow creation - Supabase handles duplicates
          },
        });

        if (error) {
          console.error('[StartPage] Error sending magic link:', error);
          setError(error.message || 'Failed to send magic link. Please try again.');
          setIsLoading(false);
          return;
        }

        console.log('[StartPage] Magic link sent - user will receive email');
        // Navigate to verify page to show success message (like Scaffald does)
        navigate(`/auth/verify?email=${encodeURIComponent(normalizedEmail)}`);
      }
    } catch (error) {
      console.error('[StartPage] Error initiating auth:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleScaffaldContinue = () => {
    setIsLoading(true);
    initiateOAuth();
  };

  /**
   * Test login using real seeded database users
   * This allows testing logged-in functionality with actual data
   */
  const handleTestLogin = async (userType: 'gc' | 'contractor' | 'broker' | 'admin') => {
    setIsLoading(true);
    setError(null);

    try {
      // Map user types to seeded test accounts
      const testAccounts: Record<'gc' | 'contractor' | 'broker' | 'admin', { email: string; password: string }> = {
        gc: { email: 'gc-active@forsured-test.com', password: 'ForsuredTest123!' },
        contractor: { email: 'contractor-active@forsured-test.com', password: 'ForsuredTest123!' },
        broker: { email: 'broker-active@forsured-test.com', password: 'ForsuredTest123!' },
        admin: { email: 'admin@forsured-test.com', password: 'ForsuredTest123!' },
      };

      const credentials = testAccounts[userType];

      // Sign in with Supabase using real credentials
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (signInError) {
        console.error('[StartPage] Test login failed:', signInError);
        setError(`Test login failed: ${signInError.message}`);
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        setError('Test login failed: No user returned');
        setIsLoading(false);
        return;
      }

      console.log('[StartPage] Test login successful, user:', data.user.email);

      // Map database user types to route types
      const routeTypeMap: Record<'gc' | 'contractor' | 'broker' | 'admin', 'manager' | 'subcontractor' | 'broker' | 'admin'> = {
        gc: 'manager',
        contractor: 'subcontractor',
        broker: 'broker',
        admin: 'admin',
      };

      // Navigate to the appropriate dashboard
      // The AuthContext will handle fetching the real profile data
      navigate(`/${routeTypeMap[userType]}/dashboard`);
    } catch (err) {
      console.error('[StartPage] Test login error:', err);
      setError(err instanceof Error ? err.message : 'Test login failed');
      setIsLoading(false);
    }
  };

  return (
    <YStack
      minHeight="100vh"
      alignItems="center"
      justifyContent="center"
      backgroundColor="$blue2"
      padding="$4"
    >
      <YStack
        maxWidth={448}
        width="100%"
        gap="$8"
        padding="$10"
        backgroundColor="$background"
        borderRadius="$xl"
        shadowColor="$shadowColor"
        shadowRadius={20}
        shadowOffset={{ width: 0, height: 8 }}
      >
        {/* Logo and Header */}
        <YStack alignItems="center">
          <YStack
            width={64}
            height={64}
            backgroundColor="$blue9"
            borderRadius="$xl"
            alignItems="center"
            justifyContent="center"
            shadowColor="$shadowColor"
            shadowRadius={8}
            shadowOffset={{ width: 0, height: 4 }}
          >
            <Text fontSize="$10" fontWeight="700" color="$color1">
              F
            </Text>
          </YStack>
          <Text fontSize="$9" fontWeight="800" color="$color12" marginTop="$6">
            Welcome to ForSured
          </Text>
          <Text fontSize="$3" color="$color10" marginTop="$2">
            Powered by Scaffald
          </Text>
          <Text fontSize="$3" color="$color11" marginTop="$1">
            Manage subcontractor compliance with confidence.
          </Text>
        </YStack>

        {/* Email Form */}
        <form onSubmit={handleEmailContinue}>
          <YStack gap="$4">
          <YStack gap="$1.5">
            <Text as="label" htmlFor="email" fontSize="$3" fontWeight="500" color="$color11">
              Email address
            </Text>
            <TextInput
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null); // Clear error when user types
              }}
              placeholder="you@company.com"
              required
              disabled={isLoading}
            />
            {error && (
              <Text fontSize="$2" color="$red10" marginTop="$1">
                {error}
              </Text>
            )}
          </YStack>

          <CoreButton
            type="submit"
            disabled={isLoading || !email}
            variant="primary"
            fullWidth
          >
            {isLoading ? (
              <XStack gap="$2" alignItems="center">
                <Spinner size="small" color="$color1" />
                <Text>Redirecting...</Text>
              </XStack>
            ) : (
              'Continue with Email'
            )}
          </CoreButton>
          </YStack>
        </form>

        {/* Divider */}
        <YStack position="relative" alignItems="center">
          <YStack
            position="absolute"
            width="100%"
            height={1}
            backgroundColor="$borderColor"
            top="50%"
          />
          <XStack
            position="relative"
            backgroundColor="$background"
            paddingHorizontal="$4"
          >
            <Text fontSize="$2" color="$color10">
              or
            </Text>
          </XStack>
        </YStack>

        {/* Direct Scaffald Login */}
        <YStack gap="$4">
          <CoreButton
            onClick={handleScaffaldContinue}
            disabled={isLoading}
            variant="outlined"
            fullWidth
          >
            <XStack gap="$2" alignItems="center">
              <svg
                width={20}
                height={20}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <Text>Continue with Scaffald Account</Text>
            </XStack>
          </CoreButton>

          <Text fontSize="$1" textAlign="center" color="$color10">
            Already have a Scaffald account? Sign in directly above.
          </Text>
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
              onClick={() => handleTestLogin('gc')}
              variant="secondary"
              fullWidth
              size="$3"
            >
              <Text>Test as GC / Manager</Text>
            </CoreButton>
            <CoreButton
              onClick={() => handleTestLogin('contractor')}
              variant="secondary"
              fullWidth
              size="$3"
            >
              <Text>Test as Contractor / Subcontractor</Text>
            </CoreButton>
            <CoreButton
              onClick={() => handleTestLogin('broker')}
              variant="secondary"
              fullWidth
              size="$3"
            >
              <Text>Test as Broker</Text>
            </CoreButton>
            <CoreButton
              onClick={() => handleTestLogin('admin')}
              variant="secondary"
              fullWidth
              size="$3"
            >
              <Text>Test as Admin</Text>
            </CoreButton>
          </YStack>
        </YStack>

        {/* Security Notice */}
        <YStack marginTop="$6">
          <Text fontSize="$1" textAlign="center" color="$color10">
            Secured with OAuth 2.0 + PKCE
          </Text>
        </YStack>

        {/* Design System Link */}
        <YStack
          paddingTop="$4"
          borderTopWidth={1}
          borderTopColor="$borderColor"
        >
          <Text
            as={Link}
            to="/design-system"
            fontSize="$1"
            textAlign="center"
            color="$color9"
            hoverStyle={{ color: '$blue9' }}
            textDecorationLine="underline"
          >
            View Design System
          </Text>
        </YStack>
      </YStack>
    </YStack>
  );
}

export default StartPage;
