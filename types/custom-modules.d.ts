declare module '@sentry/deno' {
  export function init(options: Record<string, unknown>): void
  export function captureException(error: unknown): void
  export function withScope(
    callback: (scope: Record<string, unknown>) => void,
  ): void
  export function configureScope(
    callback: (scope: Record<string, unknown>) => void,
  ): void
}

declare module '@vitejs/plugin-react' {
  import type { PluginOption } from 'vite'
  const pluginReact: (options?: Record<string, unknown>) => PluginOption
  export default pluginReact
}

declare module 'vite-tsconfig-paths' {
  import type { PluginOption } from 'vite'
  interface TsconfigPathsOptions {
    projects?: string[]
  }
  const tsconfigPaths: (options?: TsconfigPathsOptions) => PluginOption
  export default tsconfigPaths
}

declare module 'expo-web-browser' {
  export * from 'expo-web-browser/build/WebBrowser'
}

