// src/contexts/AuthContext.tsx
// REQ-126: OAuth 2.0 + RBAC Authentication System
// REQ-11: Authentication Flow Refinement - httpOnly cookie token storage
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
      console.log('[AuthContext] Loading session from httpOnly cookie');
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
          console.log('[AuthContext] Session restored:', scaffaldUser.email, userProfile?.user_type);
        } catch (profileErr) {
          console.warn('[AuthContext] Could not load profile:', profileErr);
          setProfile(null);
        }
      } else {
        console.log('[AuthContext] No valid session');
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

  // Set up proactive token refresh
  useEffect(() => {
    const interval = setInterval(async () => {
      const memTokens = getMemoryTokens();
      if (memTokens && isTokenExpired(memTokens)) {
        console.log('[AuthContext] Proactive session refresh');
        const success = await refreshSessionTokens();
        if (!success) {
          console.log('[AuthContext] Session refresh failed, logging out');
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
