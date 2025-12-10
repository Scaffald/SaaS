// src/contexts/AuthContext.tsx
// REQ-126: OAuth 2.0 + RBAC Authentication System
//
// Authentication context provider for managing user sessions

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { scaffaldClient } from '../lib/scaffald/client';
import { getTokens, isTokenExpired, refreshAccessToken, clearTokens } from '../lib/scaffald/auth';
import { User as ScaffaldUser } from '../lib/scaffald/types';
import { UserProfile } from '../types';
import { initiateOAuth } from '../lib/auth/oauth';
import { getProfile, updateProfileByScaffaldId } from '../services/userProfileService';

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
   * Load user and profile from stored tokens on mount/refresh
   */
  const loadUserAndProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      let tokens = getTokens();
      if (tokens) {
        // Refresh token if expired
        if (isTokenExpired(tokens)) {
          console.log('[AuthContext] Token expired, refreshing...');
          tokens = await refreshAccessToken();
          if (!tokens) {
            console.log('[AuthContext] Token refresh failed, clearing session');
            clearTokens();
            setUser(null);
            setProfile(null);
            return;
          }
        }

        // Get user info from Scaffald
        const scaffaldUser = await scaffaldClient.auth.getUser();
        if (scaffaldUser) {
          setUser(scaffaldUser);

          // Load ForSured profile from Supabase
          // Profile fetch errors are non-fatal - user may be new without a profile yet
          try {
            const userProfile = await getProfile(scaffaldUser.id);
            setProfile(userProfile);
            console.log('[AuthContext] Session restored:', scaffaldUser.email, userProfile?.user_type);
          } catch (profileErr) {
            console.warn('[AuthContext] Could not load profile (may be new user):', profileErr);
            setProfile(null);
          }
        }
      } else {
        console.log('[AuthContext] No stored tokens');
      }
    } catch (err) {
      console.error('[AuthContext] Failed to load user session:', err);
      clearTokens();
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

  // Set up proactive token refresh
  useEffect(() => {
    const interval = setInterval(async () => {
      const tokens = getTokens();
      if (tokens && isTokenExpired(tokens)) {
        console.log('[AuthContext] Proactive token refresh');
        const newTokens = await refreshAccessToken();
        if (!newTokens) {
          // Token refresh failed - log the user out
          console.log('[AuthContext] Proactive refresh failed, logging out');
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
      console.log('[AuthContext] User set:', data.user.email);
    }
    if (data?.profile) {
      setProfile(data.profile);
      console.log('[AuthContext] Profile set:', data.profile.user_type);
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
    console.log('[AuthContext] Logging out');
    await scaffaldClient.auth.signOut();
    clearTokens();
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

    console.log('[AuthContext] Updating profile:', Object.keys(data));
    const updatedProfile = await updateProfileByScaffaldId(user.id, data);
    setProfile(updatedProfile);
  }, [user]);

  /**
   * Refresh profile - reload profile from database
   */
  const refreshProfile = useCallback(async () => {
    if (!user) return;

    console.log('[AuthContext] Refreshing profile');
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
