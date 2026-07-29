/**
 * Route loaders only run under web static/server rendering. On native there is
 * no loader data, so screens fall back to their client-side query.
 */
export function useRouteLoaderData<T>(): T | undefined {
  return undefined
}
