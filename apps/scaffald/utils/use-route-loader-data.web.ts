import { useLoaderData } from 'expo-router'

/**
 * Typed wrapper over expo-router's useLoaderData. Returns the data the route's
 * `loader` produced on the server (and the copy hydrated into the client).
 */
export function useRouteLoaderData<T>(): T | undefined {
  return useLoaderData<() => T>()
}
