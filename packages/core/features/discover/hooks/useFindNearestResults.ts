import { useState, useCallback } from "react";
import { api } from "@app/core/utils/api";

interface NearestResult {
  location: { lat: number; lng: number };
  label: string;
  distance: number;
  counts: {
    workers: number;
    jobs: number;
    employers: number;
  };
}

interface UseFindNearestResultsOptions {
  coordinates: { lat: number; lng: number } | null;
  initialRadius?: number;
  maxAttempts?: number;
}

/**
 * Hook to find nearest location with results
 * Used for no-results scenarios to suggest nearby locations
 */
export function useFindNearestResults({
  coordinates,
  initialRadius = 50,
  maxAttempts = 3,
}: UseFindNearestResultsOptions) {
  const [currentRadius, setCurrentRadius] = useState(initialRadius);
  const [attempts, setAttempts] = useState(0);

  // Query for nearest results
  const query = api.map.findNearestResults.useQuery(
    {
      coordinates: coordinates || { lat: 0, lng: 0 },
      radius: currentRadius,
    },
    {
      enabled: !!coordinates && attempts < maxAttempts,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  );

  // Expand radius by 50 miles
  const expandRadius = useCallback(() => {
    if (attempts < maxAttempts) {
      setCurrentRadius((prev) => prev + 50);
      setAttempts((prev) => prev + 1);
    }
  }, [attempts, maxAttempts]);

  // Reset to initial state
  const reset = useCallback(() => {
    setCurrentRadius(initialRadius);
    setAttempts(0);
  }, [initialRadius]);

  return {
    nearestResult: query.data as NearestResult | null | undefined,
    isLoading: query.isLoading,
    error: query.error,
    currentRadius,
    attempts,
    maxAttempts,
    canExpand: attempts < maxAttempts,
    expandRadius,
    reset,
  };
}

