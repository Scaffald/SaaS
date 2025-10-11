import { useMemo } from "react";
import type {
  GeocodingProvider,
  ProviderConfig,
  UseGeocodingProviderReturn,
} from "../types";
import { createFromEnvironment, createProvider } from "../providers";

/**
 * Hook to create and manage a geocoding provider instance
 *
 * @param config - Provider configuration
 * @returns Provider instance, ready state, and error
 */
export function useGeocodingProvider(
  config: ProviderConfig,
): UseGeocodingProviderReturn {
  const provider = useMemo(() => {
    try {
      return createProvider(config);
    } catch (error) {
      console.error("Failed to create geocoding provider:", error);
      return null;
    }
  }, [config.provider, config.apiKey, config.defaultCountry, config.language]);

  return {
    provider: provider || null,
    isReady: provider !== null,
    error: provider === null ? "Failed to initialize geocoding provider" : null,
  };
}

/**
 * Hook to create a provider with environment-based configuration
 *
 * @returns Provider instance, ready state, and error
 */
export function useGeocodingProviderFromEnv(): UseGeocodingProviderReturn {
  const provider = useMemo(() => {
    try {
      return createFromEnvironment();
    } catch (error) {
      console.error(
        "Failed to create geocoding provider from environment:",
        error,
      );
      return null;
    }
  }, []);

  return {
    provider: provider || null,
    isReady: provider !== null,
    error: provider === null
      ? "Failed to initialize geocoding provider from environment"
      : null,
  };
}
