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
