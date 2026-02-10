/**
 * Referral Tracking React Hooks
 *
 * Referral hooks for invitation system
 *
 * React hooks for capturing and accessing referral data in components.
 */

import { useEffect, useState } from "react";
import { captureReferral, getStoredReferral } from "./referralTracking";
import type { ReferralData } from "../invitations/types";

/**
 * Hook to capture and access referral data
 *
 * - Automatically captures referral from URL params on mount
 * - Returns the stored referral data if available
 *
 * @example
 * ```tsx
 * function LandingPage() {
 *   const referral = useReferral();
 *
 *   return (
 *     <div>
 *       {referral && <p>Referred by code: {referral.code}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useReferral(): ReferralData | null {
  const [referral, setReferral] = useState<ReferralData | null>(null);

  useEffect(() => {
    // Capture referral from URL if present
    captureReferral();

    // Get stored referral
    const stored = getStoredReferral();
    setReferral(stored);
  }, []);

  return referral;
}

/**
 * Hook to capture referral from landing page
 * Call this on your landing page or any entry point to capture referrals
 *
 * This is a side-effect-only hook that doesn't return data.
 * Use `useReferral` if you need access to the referral data.
 *
 * @example
 * ```tsx
 * function LandingPage() {
 *   useReferralCapture();
 *   return <div>Welcome!</div>;
 * }
 * ```
 */
export function useReferralCapture(): void {
  useEffect(() => {
    captureReferral();
  }, []);
}

/**
 * Hook to check if the current user was referred
 *
 * @returns boolean indicating if a referral code is stored
 *
 * @example
 * ```tsx
 * function SignupPage() {
 *   const hasReferral = useHasReferral();
 *
 *   return (
 *     <div>
 *       <h1>Sign Up</h1>
 *       {hasReferral && <p>You were invited by a friend!</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useHasReferral(): boolean {
  const [hasReferral, setHasReferral] = useState(false);

  useEffect(() => {
    const stored = getStoredReferral();
    setHasReferral(!!stored);
  }, []);

  return hasReferral;
}
