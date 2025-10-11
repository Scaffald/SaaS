import { useCallback, useEffect, useRef, useState } from "react";
import type { University } from "../components/university/UniversityAutocomplete";

export interface UseUniversitySearchOptions {
  debounceMs?: number;
  minLength?: number;
  maxResults?: number;
  defaultCountry?: string;
}

export interface UseUniversitySearchResult {
  results: University[];
  loading: boolean;
  error: string | undefined;
  search: (query: string) => void;
  clearResults: () => void;
}

/**
 * Hook for searching universities with debouncing
 * Uses tRPC endpoint to search university catalog
 *
 * @param searchFn - Function to call for searching (typically from tRPC)
 * @param options - Configuration options
 * @returns Search results and control functions
 */
export function useUniversitySearch(
  searchFn: (params: {
    query: string;
    country?: string;
    limit: number;
  }) => Promise<{ universities: University[] }>,
  options: UseUniversitySearchOptions = {},
): UseUniversitySearchResult {
  const {
    debounceMs = 300,
    minLength = 3,
    maxResults = 5,
    defaultCountry = "United States",
  } = options;

  const [results, setResults] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clear results
  const clearResults = useCallback(() => {
    setResults([]);
    setError(undefined);
    setLoading(false);
  }, []);

  // Search function with debouncing
  const search = useCallback(
    (query: string) => {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Clear previous search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Validate query length
      if (query.trim().length < minLength) {
        clearResults();
        return;
      }

      // Set loading state immediately
      setLoading(true);
      setError(undefined);

      // Debounce the actual search
      debounceTimerRef.current = setTimeout(async () => {
        try {
          // Create abort controller for this search
          abortControllerRef.current = new AbortController();

          // Execute search
          const result = await searchFn({
            query: query.trim(),
            country: defaultCountry,
            limit: maxResults,
          });

          // Update results if not aborted
          if (!abortControllerRef.current.signal.aborted) {
            setResults(result.universities);
            setLoading(false);
          }
        } catch (err) {
          // Only update error if not aborted
          if (!abortControllerRef.current?.signal.aborted) {
            setError(err instanceof Error ? err.message : "Search failed");
            setResults([]);
            setLoading(false);
          }
        }
      }, debounceMs);
    },
    [searchFn, minLength, maxResults, defaultCountry, debounceMs, clearResults],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clearResults,
  };
}
