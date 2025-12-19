/**
 * Lexicon Context Provider
 * REQ-4: Multi-Industry User Set Type System with Configurable Lexicon
 * TASK-5: Create LexiconContext provider and useLexicon hook
 * TASK-14: Organization-specific lexicon switching for brokers
 *
 * Provides:
 * - Lexicon loading from user's user set type
 * - t() function for lexicon lookups with fallback support
 * - User set type information
 * - Organization-specific lexicon switching for brokers
 */

import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from 'react';
import { trpc } from '../lib/trpc';

/**
 * Default lexicon values (Construction type as fallback)
 */
const DEFAULT_LEXICON: Record<string, string> = {
  // Navigation
  'nav.dashboard': 'Dashboard',
  'nav.tasks': 'Tasks',
  'nav.projects': 'Projects',
  'nav.contractors': 'Subs',
  'nav.documents': 'Documents',
  'nav.acknowledgements': 'Acknowledgements',
  'nav.integrations': 'Integrations',
  'nav.help': 'Help',
  'nav.relationships': 'Relationships',
  'nav.managers': 'GCs',
  'nav.clients': 'Clients',
  'nav.insurance': 'Insurance',
  'nav.team': 'Team',
  // Onboarding
  'onboarding.welcome_manager': 'Welcome, General Contractor',
  'onboarding.welcome_contractor': 'Welcome, Subcontractor',
  'onboarding.company_name': 'Company Name',
  'onboarding.company_size': 'Company Size',
  'onboarding.primary_location': 'Primary Location',
  // Role Display
  'role.manager_view': 'GC View',
  'role.contractor': 'Subcontractor',
  'role.broker': 'Broker',
};

/**
 * User set type information
 */
interface UserSetType {
  id: string;
  name: string;
  slug: string;
  managerLabelSingular: string;
  managerLabelPlural: string;
  contractorLabelSingular: string;
  contractorLabelPlural: string;
  description: string | null;
  isActive: boolean;
}

/**
 * Lexicon context value
 */
interface LexiconContextValue {
  /**
   * Translate function - looks up a lexicon key and returns the value
   * @param key - The lexicon key (e.g., 'nav.contractors')
   * @param fallback - Optional fallback value if key not found
   * @returns The translated value or fallback
   */
  t: (key: string, fallback?: string) => string;

  /**
   * The full lexicon object
   */
  lexicon: Record<string, string>;

  /**
   * The user's user set type (null for brokers/admins)
   */
  userSetType: UserSetType | null;

  /**
   * Whether the lexicon is currently loading
   */
  isLoading: boolean;

  /**
   * Whether there was an error loading the lexicon
   */
  isError: boolean;

  /**
   * Get the manager role label (singular or plural)
   * @param plural - Whether to get the plural form
   */
  getManagerLabel: (plural?: boolean) => string;

  /**
   * Get the contractor role label (singular or plural)
   * @param plural - Whether to get the plural form
   */
  getContractorLabel: (plural?: boolean) => string;

  /**
   * Force refresh the lexicon from the server
   */
  refetch: () => void;

  /**
   * TASK-14: Set an override user set type for broker context switching
   * When set, uses the specified user set type's lexicon instead of the user's default
   * @param userSetTypeId - The ID of the user set type to switch to, or null to clear the override
   */
  setOverrideUserSetType: (userSetTypeId: string | null) => void;

  /**
   * TASK-14: The currently overridden user set type ID (null if using user's default)
   */
  overrideUserSetTypeId: string | null;

  /**
   * TASK-14: Whether the context is using an override user set type
   */
  isUsingOverride: boolean;
}

const LexiconContext = createContext<LexiconContextValue | undefined>(undefined);

interface LexiconProviderProps {
  children: ReactNode;
}

/**
 * LexiconProvider component
 *
 * Wraps the application to provide lexicon context.
 * Loads the user's lexicon from their user set type on mount.
 * TASK-14: Supports override user set type for broker context switching.
 *
 * @example
 * ```tsx
 * <LexiconProvider>
 *   <App />
 * </LexiconProvider>
 * ```
 */
export function LexiconProvider({ children }: LexiconProviderProps) {
  // TASK-14: State for override user set type (used by brokers)
  const [overrideUserSetTypeId, setOverrideUserSetTypeIdState] = useState<string | null>(null);

  // Fetch user's lexicon using tRPC
  const {
    data: userData,
    isLoading: userLoading,
    isError: userError,
    refetch: userRefetch,
  } = trpc.userSetTypes.getUserLexicon.useQuery(undefined, {
    // Don't refetch on window focus (lexicon rarely changes)
    refetchOnWindowFocus: false,
    // Stale time of 5 minutes
    staleTime: 5 * 60 * 1000,
    // Cache for 30 minutes
    gcTime: 30 * 60 * 1000,
    // Retry once on failure
    retry: 1,
  });

  // TASK-14: Fetch override lexicon when an override is set
  const {
    data: overrideData,
    isLoading: overrideLoading,
    isError: overrideError,
    refetch: overrideRefetch,
  } = trpc.userSetTypes.getByIdWithLexicon.useQuery(
    { id: overrideUserSetTypeId! },
    {
      // Only fetch when we have an override ID
      enabled: !!overrideUserSetTypeId,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
    }
  );

  // TASK-14: Determine which data to use (override takes precedence)
  const isUsingOverride = !!overrideUserSetTypeId && !!overrideData;
  const activeData = isUsingOverride ? overrideData : userData;

  // Combined loading/error states
  const isLoading = userLoading || (!!overrideUserSetTypeId && overrideLoading);
  const isError = userError || (!!overrideUserSetTypeId && overrideError);

  // Combined refetch
  const refetch = useCallback(() => {
    userRefetch();
    if (overrideUserSetTypeId) {
      overrideRefetch();
    }
  }, [userRefetch, overrideRefetch, overrideUserSetTypeId]);

  // TASK-14: Function to set/clear the override user set type
  const setOverrideUserSetType = useCallback((userSetTypeId: string | null) => {
    setOverrideUserSetTypeIdState(userSetTypeId);
  }, []);

  // Merge user lexicon with defaults (user values override defaults)
  const lexicon = useMemo(() => {
    if (!activeData?.lexicon) {
      return DEFAULT_LEXICON;
    }
    return { ...DEFAULT_LEXICON, ...activeData.lexicon };
  }, [activeData?.lexicon]);

  // Translation function
  const t = useMemo(() => {
    return (key: string, fallback?: string): string => {
      // First check active lexicon
      if (lexicon[key]) {
        return lexicon[key];
      }
      // Then check defaults
      if (DEFAULT_LEXICON[key]) {
        return DEFAULT_LEXICON[key];
      }
      // Finally use provided fallback or the key itself
      return fallback ?? key;
    };
  }, [lexicon]);

  // Helper functions for role labels
  const getManagerLabel = useMemo(() => {
    return (plural = false): string => {
      if (activeData?.userSetType) {
        return plural
          ? activeData.userSetType.managerLabelPlural
          : activeData.userSetType.managerLabelSingular;
      }
      return plural ? 'General Contractors' : 'General Contractor';
    };
  }, [activeData?.userSetType]);

  const getContractorLabel = useMemo(() => {
    return (plural = false): string => {
      if (activeData?.userSetType) {
        return plural
          ? activeData.userSetType.contractorLabelPlural
          : activeData.userSetType.contractorLabelSingular;
      }
      return plural ? 'Subcontractors' : 'Subcontractor';
    };
  }, [activeData?.userSetType]);

  const value = useMemo(
    () => ({
      t,
      lexicon,
      userSetType: activeData?.userSetType ?? null,
      isLoading,
      isError,
      getManagerLabel,
      getContractorLabel,
      refetch,
      // TASK-14: New broker context switching props
      setOverrideUserSetType,
      overrideUserSetTypeId,
      isUsingOverride,
    }),
    [
      t,
      lexicon,
      activeData?.userSetType,
      isLoading,
      isError,
      getManagerLabel,
      getContractorLabel,
      refetch,
      setOverrideUserSetType,
      overrideUserSetTypeId,
      isUsingOverride,
    ]
  );

  return (
    <LexiconContext.Provider value={value}>
      {children}
    </LexiconContext.Provider>
  );
}

/**
 * useLexicon hook
 *
 * Access the lexicon context from any component within the provider.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { t, getContractorLabel } = useLexicon();
 *
 *   return (
 *     <div>
 *       <h1>{t('nav.contractors')}</h1>
 *       <p>Add a new {getContractorLabel()}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useLexicon(): LexiconContextValue {
  const context = useContext(LexiconContext);

  if (context === undefined) {
    throw new Error('useLexicon must be used within a LexiconProvider');
  }

  return context;
}

/**
 * Export default lexicon for testing and fallback scenarios
 */
export { DEFAULT_LEXICON };
