/**
 * Callback Page - OAuth callback handler using Tamagui
 */
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { YStack, Text, Button } from '@unicornlove/ui';
import { Button as CoreButton } from '@unicornlove/ui';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { scaffaldClient } from '../lib/scaffald/client';
import { useAuth } from '../contexts/AuthContext';
import { getProfile, createProfile } from '../services/userProfileService';
import { saveTokens, clearTokens } from '../lib/scaffald/auth';

/**
 * Map profile user_type to router path prefix
 * Profile uses: gc, contractor, broker, admin
 * Router uses: manager, subcontractor, broker, admin
 */
const USER_TYPE_TO_ROUTE: Record<string, string> = {
  gc: 'manager',
  contractor: 'subcontractor',
  broker: 'broker',
  admin: 'admin',
};

function CallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const isProcessing = useRef(false);

  useEffect(() => {
    // Guard against React Strict Mode double-invocation
    if (isProcessing.current) return;
    isProcessing.current = true;

    handleCallback();
  }, []);

  async function handleCallback() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      if (!code || !state) {
        throw new Error('Missing OAuth code or state parameter.');
      }

      // Verify state for CSRF protection
      const storedState = sessionStorage.getItem('oauth_state');
      if (state !== storedState) {
        throw new Error('Invalid state parameter. Possible CSRF attack.');
      }
      // Clear state after successful verification
      sessionStorage.removeItem('oauth_state');

      // Exchange code for tokens
      const tokens = await scaffaldClient.auth.exchangeCodeForTokens(code);
      saveTokens(tokens);

      // Get user info from Scaffald using the obtained access token
      const scaffaldUser = await scaffaldClient.auth.getUser();

      let forsuredProfile = await getProfile(scaffaldUser.id);

      if (!forsuredProfile) {
        // New user - create a basic profile and redirect to signup for type selection
        forsuredProfile = await createProfile({
          scaffald_user_id: scaffaldUser.id,
          user_type: 'gc', // Default to GC, will be changed in signup
          onboarding_completed: false,
          onboarding_step: 1,
          onboarding_data: {},
          company_connected: false,
        });
      }

      // Set user and profile in AuthContext
      login({ user: scaffaldUser, profile: forsuredProfile });

      // Map user_type to route prefix
      const routePrefix = USER_TYPE_TO_ROUTE[forsuredProfile.user_type] || forsuredProfile.user_type;

      if (!forsuredProfile.onboarding_completed) {
        // Profile exists but onboarding not complete
        console.log(`[Callback] Redirecting to onboarding: /${routePrefix}/onboarding`);
        navigate(`/${routePrefix}/onboarding`);
        return;
      }

      // Fully set up user - go to dashboard
      console.log(`[Callback] Redirecting to dashboard: /${routePrefix}/dashboard`);
      navigate(`/${routePrefix}/dashboard`);

    } catch (err: any) {
      console.error('Auth callback error:', err);
      clearTokens();
      setError(err.message || 'Authentication failed. Please try again.');
      navigate('/start', { state: { error: err.message || 'Authentication failed.' } });
    }
  }

  if (error) {
    return (
      <YStack
        minHeight="100vh"
        alignItems="center"
        justifyContent="center"
        padding="$4"
        gap="$4"
      >
        <YStack gap="$4" alignItems="center">
          <Text fontSize="$8" fontWeight="700" color="$color12">
            Authentication Error
          </Text>
          <Text fontSize="$4" color="$color11">
            {error}
          </Text>
          <CoreButton onClick={() => navigate('/start')}>
            Try Again
          </CoreButton>
        </YStack>
      </YStack>
    );
  }

  return <LoadingSpinner />;
}

export default CallbackPage;
