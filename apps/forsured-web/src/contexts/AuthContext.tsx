// src/contexts/AuthContext.tsx
// OAuth 2.0 + RBAC Authentication System
// Authentication Flow Refinement - httpOnly cookie token storage
//
// Authentication context provider for managing user sessions
// Uses httpOnly cookies for secure token storage (XSS protection)

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import {
  getSession,
  refreshSessionTokens,
  logout as authLogout,
  clearMemoryTokens,
  getMemoryTokens,
  isTokenExpired,
} from '../lib/scaffald/auth';
import { User as ScaffaldUser } from '../lib/scaffald/types';
import { UserProfile } from '../types';
import { initiateOAuth } from '../lib/auth/oauth';
import { getProfile, updateProfileByScaffaldId } from '../services/userProfileService';
import { supabase } from '../lib/supabase';

interface AuthContextValue {
  user: ScaffaldUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (options?: { user?: ScaffaldUser; profile?: UserProfile }) => void;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ScaffaldUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load user and profile from session on mount/refresh
   */
  const loadUserAndProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const session = await getSession();

      if (session.valid && session.user) {
        const scaffaldUser: ScaffaldUser = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          avatar_url: session.user.avatar_url || null,
        };
        setUser(scaffaldUser);

        // Load ForSured profile
        try {
          const userProfile = await getProfile(scaffaldUser.id);
          setProfile(userProfile);
        } catch (profileErr) {
          console.warn('[AuthContext] Could not load profile:', profileErr);
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      console.error('[AuthContext] Failed to load user session:', err);
      clearMemoryTokens();
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load session on mount
  useEffect(() => {
    loadUserAndProfile();
  }, [loadUserAndProfile]);

  // Listen for Supabase auth state changes (e.g., test login switching users)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // User signed in (or switched) - update user immediately, profile will load via separate effect
        const scaffaldUser: ScaffaldUser = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email || '',
          avatar_url: session.user.user_metadata?.avatar_url || null,
        };
        // CRITICAL: Set isLoading FIRST to prevent ProtectedRoute from redirecting
        // while profile is being fetched. This prevents the race condition where
        // profile=null and isLoading=false momentarily.
        setIsLoading(true);
        setUser(scaffaldUser);
        // Set profile to null to trigger re-fetch - don't call getProfile here to avoid deadlock
        setProfile(null);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch profile when user changes (deferred from auth state change)
  useEffect(() => {
    if (user && !profile) {
      getProfile(user.id)
        .then((userProfile) => {
          setProfile(userProfile);
          setIsLoading(false);
        })
        .catch((err) => {
          console.warn('[AuthContext] Could not load profile:', err);
          setProfile(null);
          setIsLoading(false);
        });
    }
  }, [user, profile]);

  // Set up proactive token refresh
  useEffect(() => {
    const interval = setInterval(async () => {
      const memTokens = getMemoryTokens();
      if (memTokens && isTokenExpired(memTokens)) {
        const success = await refreshSessionTokens();
        if (!success) {
          setUser(null);
          setProfile(null);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, []);

  /**
   * Login - called from Callback page after OAuth success
   * Sets user and profile data directly
   */
  const login = useCallback((data?: { user?: ScaffaldUser; profile?: UserProfile }) => {
    if (data?.user) {
      setUser(data.user);
    }
    if (data?.profile) {
      setProfile(data.profile);
    }
    // If login is called without data, initiate OAuth redirect
    if (!data) {
      initiateOAuth();
    }
  }, []);

  /**
   * Logout - clear all auth state
   */
  const logout = useCallback(async () => {
    await authLogout();
    setUser(null);
    setProfile(null);
  }, []);

  /**
   * Update profile - update ForSured profile in Supabase
   */
  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!user) {
      throw new Error('Cannot update profile: no user logged in');
    }

    const updatedProfile = await updateProfileByScaffaldId(user.id, data);
    setProfile(updatedProfile);
  }, [user]);

  /**
   * Refresh profile - reload profile from database
   */
  const refreshProfile = useCallback(async () => {
    if (!user) return;

    const freshProfile = await getProfile(user.id);
    setProfile(freshProfile);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated: !!user && !!profile,
        login,
        logout,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
