/**
 * Callback Page - OAuth callback handler using Beyond UI
 * REQ-11: Authentication Flow Refinement - httpOnly cookie token storage
 */
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stack, Text, Button, H2 } from '@unicornlove/beyond-ui';
import { colors, spacing, fontSize } from '@unicornlove/beyond-ui';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { getProfile, createProfile } from '../services/userProfileService';
import { exchangeCodeForTokens, clearMemoryTokens } from '../lib/scaffald/auth';
import { supabase } from '../lib/supabase';

const USE_OAUTH = import.meta.env.VITE_FORSURED_USE_OAUTH === 'true';

/**
 * Map profile user_type to router path prefix
 * Profile uses: gc, contractor, broker, admin
 * Router uses: manager, subcontractor, broker, admin
 */
const USER_TYPE_TO_ROUTE: Record<string, string> = {
  gc: 'manager',
  manager: 'manager', // Alias for gc
  contractor: 'subcontractor',
  subcontractor: 'subcontractor', // Alias for contractor
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
      if (USE_OAUTH) {
        // OAuth mode: Handle OAuth callback via edge function
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

        // Exchange code for tokens via edge function (httpOnly cookie mode)
        console.log('[Callback] Exchanging code for tokens via edge function');
        const codeVerifier = sessionStorage.getItem('oauth_code_verifier') || undefined;
        sessionStorage.removeItem('oauth_code_verifier');

        const result = await exchangeCodeForTokens(
          code,
          `${window.location.origin}/callback`,
          codeVerifier
        );

        if (!result.success || !result.user) {
          throw new Error(result.error || 'Token exchange failed');
        }

        const scaffaldUser = result.user;
        console.log('[Callback] Token exchange successful:', scaffaldUser.email);

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
          // Profile exists but onboarding not complete - redirect to signup
          console.log(`[Callback] Redirecting to signup: /signup`);
          navigate('/signup');
          return;
        }

        // Fully set up user - go to dashboard
        console.log(`[Callback] Redirecting to dashboard: /${routePrefix}/dashboard`);
        navigate(`/${routePrefix}/dashboard`);
      } else {
        // Magic link mode: Handle magic link callback (Supabase auth)
        // Supabase magic links redirect to /auth/callback with hash fragments (#access_token=...&type=magiclink)
        // The Supabase client automatically processes these hash fragments and sets the session
        // We need to wait for Supabase to process the hash fragments before getting the session

        // Check if we have hash fragments (magic link callback)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hasMagicLinkHash = hashParams.has('access_token') || hashParams.has('type');

        // Also check query params (some Supabase configs use query params)
        const queryParams = new URLSearchParams(window.location.search);
        const hasQueryToken = queryParams.has('token') || queryParams.has('type');

        if (!hasMagicLinkHash && !hasQueryToken) {
          // No auth parameters - check if we already have a session
          const { data: existingSession } = await supabase.auth.getSession();
          if (existingSession?.session?.user) {
            console.log('[Callback] Already authenticated, using existing session');
            // Continue with existing session
          } else {
            throw new Error('No authentication parameters found. Please request a new magic link.');
          }
        }

        if (hasMagicLinkHash || hasQueryToken) {
          console.log('[Callback] Magic link detected, waiting for Supabase to process...');
          // Wait for Supabase to process the hash fragments
          // Supabase client processes hash fragments automatically on page load
          // We need to wait a bit for the session to be established
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        // Try to get session - Supabase should have processed the hash fragments by now
        let session = null;
        let sessionError = null;

        // Retry getting session a few times in case Supabase is still processing
        for (let i = 0; i < 5; i++) {
          const result = await supabase.auth.getSession();
          session = result.data?.session;
          sessionError = result.error;

          if (session?.user) {
            console.log('[Callback] Session established successfully');
            break;
          }

          // Wait a bit before retrying
          if (i < 4) {
            console.log(`[Callback] Waiting for session... (attempt ${i + 1}/5)`);
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }

        if (sessionError || !session?.user) {
          console.error('[Callback] Session error:', sessionError);
          console.error('[Callback] Session data:', session);
          console.error('[Callback] Hash params:', hashParams.toString());
          console.error('[Callback] Query params:', queryParams.toString());
          throw new Error('Failed to get session from magic link. Please try again.');
        }

        const supabaseUser = session.user;
        console.log('[Callback] Magic link authenticated user:', supabaseUser.email);

        // Use Supabase user ID as scaffald_user_id (in non-OAuth mode, they're the same)
        // The database trigger has already created core.users, core.profile, etc.
        let forsuredProfile = await getProfile(supabaseUser.id);

        if (!forsuredProfile) {
          // New user - create a basic profile and redirect to signup for type selection
          forsuredProfile = await createProfile({
            scaffald_user_id: supabaseUser.id,
            user_type: 'gc', // Default to GC, will be changed in signup
            onboarding_completed: false,
            onboarding_step: 1,
            onboarding_data: {},
            company_connected: false,
          });
        }

        // Create ScaffaldUser-like object from Supabase user
        const scaffaldUser = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.name || supabaseUser.email || '',
        };

        // Set user and profile in AuthContext
        login({ user: scaffaldUser, profile: forsuredProfile });

        // Map user_type to route prefix
        const routePrefix = USER_TYPE_TO_ROUTE[forsuredProfile.user_type] || forsuredProfile.user_type;

        if (!forsuredProfile.onboarding_completed) {
          // Profile exists but onboarding not complete - redirect to signup
          console.log(`[Callback] Redirecting to signup: /signup`);
          navigate('/signup');
          return;
        }

        // Fully set up user - go to dashboard
        console.log(`[Callback] Redirecting to dashboard: /${routePrefix}/dashboard`);
        navigate(`/${routePrefix}/dashboard`);
      }

    } catch (err: any) {
      console.error('Auth callback error:', err);
      clearMemoryTokens();
      setError(err.message || 'Authentication failed. Please try again.');
      navigate('/', { state: { error: err.message || 'Authentication failed.' } });
    }
  }

  if (error) {
    return (
      <Stack
        style={{
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing[16],
          gap: spacing[16],
        }}
      >
        <Stack style={{ gap: spacing[16], alignItems: 'center' }}>
          <H2
            style={{
              fontSize: fontSize.h4,
              fontWeight: 700,
              color: colors.text.light.primary,
            }}
          >
            Authentication Error
          </H2>
          <Text
            style={{
              fontSize: fontSize.lg,
              color: colors.text.light.secondary,
            }}
          >
            {error}
          </Text>
          <Button onPress={() => navigate('/')}>
            Try Again
          </Button>
        </Stack>
      </Stack>
    );
  }

  return <LoadingSpinner />;
}

export default CallbackPage;
