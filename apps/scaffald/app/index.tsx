import { LandingScreen } from '@scf/core/features/marketing'
import { continueOAuthFlowIfPending } from '@scf/core/features/oauth/utils/passthrough'
import { supabase } from '@scf/core/utils/supabase/client'
import { usePrerequisitesCheck } from '@scf/core/utils/prerequisites-sdk-hooks'
import { useUser } from '@scf/core/utils/useUser'
import { useLocalSearchParams, useRouter, useSegments } from 'expo-router'
import type { GenerateMetadataFunction } from 'expo-server'
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { Text, Stack } from '@scaffald/ui'
import { SITE_ORIGIN } from '../utils/public-content-loader'
import { OG_IMAGE } from '../utils/og'
import { resolveRootRoute, shouldRenderLanding, type RootRouteInput } from '../utils/root-route'
import { MarketingJsonLd } from '../components/MarketingJsonLd'

const TITLE = 'Scaffald — Hiring built for the skilled trades'
const DESCRIPTION =
  'Scaffald connects skilled trade workers with great employers. Skills-based search, verified certifications, shareable worker profiles, and two-way reviews.'

// `/` is the marketing landing page for logged-out visitors, so it carries the
// site-level metadata.
export const generateMetadata: GenerateMetadataFunction = () => ({
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: SITE_ORIGIN },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_ORIGIN,
    siteName: 'Scaffald',
    type: 'website',
    images: OG_IMAGE,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: OG_IMAGE.url,
  },
})

export default function RootIndex() {
  const { user, isPending } = useUser()
  const router = useRouter()
  const segments = useSegments()

  const params = useLocalSearchParams<{
    token?: string
    type?: string
    redirect_to?: string
  }>()

  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [hasNavigated, setHasNavigated] = useState(false)
  const [isRouterReady, setIsRouterReady] = useState(false)

  // Check prerequisites status for authenticated users
  const { data: prereqStatus, isLoading: isCheckingPrereqs } = usePrerequisitesCheck({
    enabled: !!user && !isVerifying, // Only check when user is authenticated and not verifying
  })

  // Every `/` routing decision runs through this one pure input; see
  // utils/root-route.ts and tests/root-route.test.ts.
  const routeInput: RootRouteInput = {
    platform: Platform.OS === 'web' ? 'web' : (Platform.OS as 'ios' | 'android'),
    isServerRender: typeof window === 'undefined',
    isPending,
    hasUser: !!user,
    // When the query settles without data (error), fall back to the onboarding
    // redirect — same failure mode as the old `!!prereqStatus?.isComplete`
    // coercion; the onboarding layout has its own retry UX.
    prereqs: isCheckingPrereqs
      ? undefined
      : {
          needsOnboarding: prereqStatus ? prereqStatus.needsOnboarding : true,
          needsLegalAcceptance: prereqStatus ? prereqStatus.needsLegalAcceptance : false,
        },
  }

  // Check if router is ready
  useEffect(() => {
    // On web, router is ready immediately
    if (Platform.OS === 'web') {
      setIsRouterReady(true)
      return
    }

    // On native, wait for segments to be available or use a timeout
    const checkRouter = () => {
      if (segments.length > 0) {
        setIsRouterReady(true)
      }
    }

    checkRouter()

    // Fallback timeout to ensure we don't wait forever
    const timeout = setTimeout(() => {
      setIsRouterReady(true)
    }, 100)

    return () => clearTimeout(timeout)
  }, [segments])

  // Handle magic link verification
  useEffect(() => {
    const handleMagicLinkVerification = async () => {
      if (params.token && params.type) {
        console.log('Handling magic link verification:', { token: params.token, type: params.type })
        setIsVerifying(true)
        setVerificationError(null)

        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: params.token,
            type: params.type as unknown as 'email',
          })

          if (error) {
            console.error('Magic link verification error:', error)
            setVerificationError(error.message)
          } else {
            console.log('Magic link verification successful:', data)
            // Session will be automatically set by Supabase
          }
        } catch (err) {
          console.error('Unexpected error during verification:', err)
          setVerificationError(err instanceof Error ? err.message : 'Verification failed')
        } finally {
          setIsVerifying(false)
        }
      }
    }

    handleMagicLinkVerification()
  }, [params.token, params.type])

  // Handle navigation after everything is ready
  // biome-ignore lint/correctness/useExhaustiveDependencies: router is a stable expo-router ref; including it would cause re-runs on every route change
  useEffect(() => {
    // Don't navigate if we're still loading, verifying, router isn't ready, or have already navigated
    if (isPending || isVerifying || !isRouterReady || hasNavigated || verificationError) {
      return
    }

    // If user is authenticated, wait for prerequisite check to complete
    if (user && isCheckingPrereqs) {
      return
    }

    const performNavigation = async () => {
      try {
        if (user) {
          // Check for pending OAuth authorization (OAuth passthrough)
          const continuedOAuth = await continueOAuthFlowIfPending()
          if (continuedOAuth) {
            // OAuth flow will handle redirect
            return
          }
        }

        const decision = resolveRootRoute(routeInput)
        if (decision.type === 'redirect') {
          router.replace(decision.path)
        }
        // 'landing' stays put (web, logged out); 'wait' re-evaluates on the
        // next render once auth or prerequisites resolve.
        setHasNavigated(true)
      } catch (error) {
        console.error('Navigation error:', error)
        // Don't retry automatically to avoid infinite loops
      }
    }

    // Use different timing strategies based on platform
    if (Platform.OS === 'web') {
      // On web, navigate immediately
      performNavigation()
    } else {
      // On native, use a small delay to ensure the router is fully ready
      setTimeout(performNavigation, 50)
    }
  }, [
    user,
    isPending,
    isVerifying,
    isRouterReady,
    hasNavigated,
    verificationError,
    isCheckingPrereqs,
    prereqStatus,
  ])

  // Show loading state while verifying magic link
  if (isVerifying) {
    return (
      <Stack justify="center" align="center">
        <Text>Verifying your email...</Text>
      </Stack>
    )
  }

  // Show error if verification failed
  if (verificationError) {
    return (
      <Stack justify="center" align="center" padding={16}>
        <Text color="red">Verification failed: {verificationError}</Text>
        <Text>Please try requesting a new magic link.</Text>
      </Stack>
    )
  }

  // Web + logged out (including every server render, which is anonymous by
  // definition) renders the marketing landing in place. Native redirects to
  // the welcome/login flow instead — see resolveRootRoute.
  if (shouldRenderLanding(routeInput)) {
    return (
      <>
        <MarketingJsonLd />
        <LandingScreen />
      </>
    )
  }

  // Show loading state while checking auth, prerequisites, or waiting for navigation
  if (isPending || !isRouterReady || !hasNavigated || (user && isCheckingPrereqs)) {
    return (
      <Stack justify="center" align="center">
        <Text>Loading...</Text>
      </Stack>
    )
  }

  // This should rarely be reached, but provides a fallback
  return (
    <Stack justify="center" align="center">
      <Text>Initializing...</Text>
    </Stack>
  )
}
