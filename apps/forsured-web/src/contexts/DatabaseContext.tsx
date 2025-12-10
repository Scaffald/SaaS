/**
 * Database Context Provider
 * REQ-212: Code Updates for Shared Database Architecture
 *
 * Provides database access through Supabase client with forsured.* schema support.
 * Falls back to MockDatabase for development when VITE_USE_MOCK_DATA is true.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase, forsured, core } from '../lib/supabase';
import MockDatabase from '../utils/mockDataStore';
import { initializeMockData } from '../utils/initializeMockData';
import { useUser } from './UserContext';
import type { RBACUser } from '../utils/mockDatabase.rbac';

// Feature flag for mock data (default to Supabase in production)
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

interface DatabaseContextType {
  // Supabase client for real database
  supabase: SupabaseClient;
  // Mock database for development
  mockDatabase: typeof MockDatabase;
  // Schema-aware query builders
  forsured: typeof forsured;
  core: typeof core;
  // Initialization state
  isInitialized: boolean;
  // Mode flag
  useMockData: boolean;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { currentUser } = useUser();

  // Initialize database on mount
  useEffect(() => {
    try {
      if (USE_MOCK_DATA) {
        // Initialize mock database for development
        initializeMockData();
        console.log('[DatabaseContext] MockDatabase initialized successfully');
      } else {
        // Real Supabase - no initialization needed, client is ready
        console.log('[DatabaseContext] Supabase client ready');
      }
      setIsInitialized(true);
    } catch (error) {
      console.error('[DatabaseContext] Failed to initialize database:', error);
      throw error;
    }
  }, []);

  // Sync current user to mock database for RBAC filtering
  useEffect(() => {
    if (isInitialized && USE_MOCK_DATA && currentUser) {
      const rbacUser: RBACUser = {
        id: currentUser.id,
        role: currentUser.role,
        organization_id: currentUser.organization_id,
      };
      MockDatabase.setCurrentUser(rbacUser);
      console.log('[DatabaseContext] Mock RBAC user synced:', rbacUser);
    } else if (isInitialized && USE_MOCK_DATA && !currentUser) {
      MockDatabase.setCurrentUser(null);
      console.log('[DatabaseContext] Mock RBAC user cleared');
    }
  }, [currentUser, isInitialized]);

  const value: DatabaseContextType = {
    supabase,
    mockDatabase: MockDatabase,
    forsured,
    core,
    isInitialized,
    useMockData: USE_MOCK_DATA,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};

/**
 * Hook to access database client
 * Returns Supabase client or MockDatabase based on configuration
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
 * Hook to access MockDatabase instance from context (backward compatibility)
 * @deprecated Use useDatabase() instead
 * @throws Error if used outside DatabaseProvider
 */
export const useMockDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useMockDatabase must be used within a DatabaseProvider');
  }
  if (!context.isInitialized) {
    console.warn('[useMockDatabase] Database not yet initialized');
  }
  return context.mockDatabase;
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
