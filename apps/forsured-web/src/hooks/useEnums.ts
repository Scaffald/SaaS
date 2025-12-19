// src/hooks/useEnums.ts
// REQ-126: Dynamic enum values from database
//
// Fetches enum values from the forsured.enum_values table with caching.

import { useState, useEffect, useCallback } from 'react';
import { forsured } from '../lib/supabase';

export interface EnumValue {
  id: string;
  enum_type: string;
  value: string;
  display_name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// In-memory cache for enum values
const enumCache: Record<string, EnumValue[]> = {};

/**
 * Hook to fetch enum values from the database
 *
 * @param enumType - The enum type to fetch (e.g., 'task_status', 'trade_type')
 * @returns Object containing enum data, loading state, error, and cache invalidation function
 */
export function useEnums(enumType: string) {
  const [data, setData] = useState<EnumValue[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEnums = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      if (enumCache[enumType]) {
        setData(enumCache[enumType]);
        setIsLoading(false);
        return;
      }

      const { data: enumData, error: enumError } = await forsured('enum_values')
        .select('*')
        .eq('enum_type', enumType)
        .eq('is_active', true)
        .order('sort_order');

      if (enumError) {
        throw new Error(enumError.message);
      }

      // Cache the results
      enumCache[enumType] = enumData as EnumValue[];
      setData(enumData as EnumValue[]);
    } catch (err) {
      console.error(`[useEnums] Failed to fetch ${enumType}:`, err);
      setError(err instanceof Error ? err : new Error('Failed to fetch enums'));
    } finally {
      setIsLoading(false);
    }
  }, [enumType]);

  useEffect(() => {
    fetchEnums();
  }, [fetchEnums]);

  /**
   * Invalidate the cache and refetch data
   */
  const invalidateCache = useCallback(() => {
    delete enumCache[enumType];
    fetchEnums();
  }, [enumType, fetchEnums]);

  /**
   * Get enum options formatted for Select components
   */
  const options = data?.map(item => ({
    value: item.value,
    label: item.display_name,
  })) || [];

  /**
   * Get display name for a specific value
   */
  const getDisplayName = useCallback((value: string) => {
    const item = data?.find(d => d.value === value);
    return item?.display_name || value;
  }, [data]);

  /**
   * Get metadata for a specific value
   */
  const getMetadata = useCallback((value: string) => {
    const item = data?.find(d => d.value === value);
    return item?.metadata || {};
  }, [data]);

  return {
    data,
    isLoading,
    error,
    options,
    invalidateCache,
    getDisplayName,
    getMetadata,
  };
}

/**
 * Hook to fetch all enum types (for admin panel)
 */
export function useEnumTypes() {
  const [types, setTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchTypes() {
      try {
        const { data, error: fetchError } = await forsured('enum_values')
          .select('enum_type')
          .order('enum_type');

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        // Get unique types
        const uniqueTypes = [...new Set((data || []).map((d: { enum_type: string }) => d.enum_type))];
        setTypes(uniqueTypes);
      } catch (err) {
        console.error('[useEnumTypes] Failed to fetch types:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch enum types'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchTypes();
  }, []);

  return { types, isLoading, error };
}

/**
 * Hook to fetch all enum values for a specific type (including inactive, for admin)
 */
export function useEnumsAdmin(enumType: string) {
  const [data, setData] = useState<EnumValue[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEnums = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: enumData, error: enumError } = await forsured('enum_values')
        .select('*')
        .eq('enum_type', enumType)
        .order('sort_order');

      if (enumError) {
        throw new Error(enumError.message);
      }

      setData(enumData as EnumValue[]);
    } catch (err) {
      console.error(`[useEnumsAdmin] Failed to fetch ${enumType}:`, err);
      setError(err instanceof Error ? err : new Error('Failed to fetch enums'));
    } finally {
      setIsLoading(false);
    }
  }, [enumType]);

  useEffect(() => {
    if (enumType) {
      fetchEnums();
    }
  }, [enumType, fetchEnums]);

  const refetch = useCallback(() => {
    // Clear cache for this type when admin makes changes
    delete enumCache[enumType];
    fetchEnums();
  }, [enumType, fetchEnums]);

  return { data, isLoading, error, refetch };
}

/**
 * Invalidate all enum caches (use after admin makes changes)
 */
export function invalidateAllEnumCaches() {
  Object.keys(enumCache).forEach(key => {
    delete enumCache[key];
  });
}
