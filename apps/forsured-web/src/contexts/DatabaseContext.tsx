/**
 * Database Context Provider
 * REQ-212: Code Updates for Shared Database Architecture
 *
 * Provides database access through Supabase client with forsured.* schema support.
 * Always uses real Supabase - MockDatabase has been removed per testing policy.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase, forsured, core } from '../lib/supabase';

interface DatabaseContextType {
  // Supabase client for real database
  supabase: SupabaseClient;
  // Schema-aware query builders
  forsured: typeof forsured;
  core: typeof core;
  // Initialization state
  isInitialized: boolean;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Real Supabase - client is ready immediately, no async initialization needed
  // Initialize to true immediately to avoid race condition warnings
  const [isInitialized] = useState(true);

  // Verify Supabase client is available (development/debugging only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      try {
        if (!supabase) {
          console.error('[DatabaseContext] Supabase client is not available');
        } else {
          console.log('[DatabaseContext] Supabase client ready');
        }
      } catch (error) {
        console.error('[DatabaseContext] Failed to verify database:', error);
      }
    }
  }, []);

  const value: DatabaseContextType = {
    supabase,
    forsured,
    core,
    isInitialized,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};

/**
 * Hook to access database client
 * Returns Supabase client and schema-aware query builders
 * @throws Error if used outside DatabaseProvider
 */
export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  if (!context.isInitialized) {
    console.warn('[useDatabase] Database not yet initialized');
  }
  return context;
};

/**
 * Hook to access Supabase client directly
 * @throws Error if used outside DatabaseProvider
 */
export const useSupabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a DatabaseProvider');
  }
  return context.supabase;
};

/**
 * Hook to check if database is initialized
 */
export const useDatabaseInitialized = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabaseInitialized must be used within a DatabaseProvider');
  }
  return context.isInitialized;
};
