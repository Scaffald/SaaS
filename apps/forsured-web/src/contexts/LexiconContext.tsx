/**
 * Lexicon Context Provider
 * REQ-4: Multi-Industry User Set Type System with Configurable Lexicon
 * TASK-5: Create LexiconContext provider and useLexicon hook
 *
 * Provides:
 * - Lexicon loading from user's user set type
 * - t() function for lexicon lookups with fallback support
 * - User set type information
 * - Organization-specific lexicon switching for brokers (TASK-14)
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
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
 *
 * @example
 * ```tsx
 * <LexiconProvider>
 *   <App />
 * </LexiconProvider>
 * ```
 */
export function LexiconProvider({ children }: LexiconProviderProps) {
  // Fetch user's lexicon using tRPC
  const {
    data,
    isLoading,
    isError,
    refetch,
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

  // Merge user lexicon with defaults (user values override defaults)
  const lexicon = useMemo(() => {
    if (!data?.lexicon) {
      return DEFAULT_LEXICON;
    }
    return { ...DEFAULT_LEXICON, ...data.lexicon };
  }, [data?.lexicon]);

  // Translation function
  const t = useMemo(() => {
    return (key: string, fallback?: string): string => {
      // First check user's lexicon
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
      if (data?.userSetType) {
        return plural
          ? data.userSetType.managerLabelPlural
          : data.userSetType.managerLabelSingular;
      }
      return plural ? 'General Contractors' : 'General Contractor';
    };
  }, [data?.userSetType]);

  const getContractorLabel = useMemo(() => {
    return (plural = false): string => {
      if (data?.userSetType) {
        return plural
          ? data.userSetType.contractorLabelPlural
          : data.userSetType.contractorLabelSingular;
      }
      return plural ? 'Subcontractors' : 'Subcontractor';
    };
  }, [data?.userSetType]);

  const value = useMemo(
    () => ({
      t,
      lexicon,
      userSetType: data?.userSetType ?? null,
      isLoading,
      isError,
      getManagerLabel,
      getContractorLabel,
      refetch,
    }),
    [t, lexicon, data?.userSetType, isLoading, isError, getManagerLabel, getContractorLabel, refetch]
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
