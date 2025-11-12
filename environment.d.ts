declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string
      NODE_ENV: 'development' | 'production' | 'staging' | 'test'
      APP_ENV?: 'development' | 'staging' | 'production'
      SUPABASE_AUTH_JWT_SECRET: string

      EXPO_PUBLIC_URL: string

      EXPO_PUBLIC_GOOGLE_SIGN_IN_WEB_CLIENT_ID: string
      EXPO_PUBLIC_GOOGLE_URL_SCHEME: string

      EXPO_PUBLIC_SUPABASE_URL: string
      EXPO_PUBLIC_SUPABASE_ANON_KEY: string

      EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN: string

      POSTHOG_HOST?: string
      POSTHOG_KEY?: string
      POSTHOG_KEY_DEV?: string
      POSTHOG_KEY_STAGING?: string
      POSTHOG_KEY_PROD?: string
      POSTHOG_KEY_SERVER?: string
      EXPO_PUBLIC_POSTHOG_API_KEY?: string
      EXPO_PUBLIC_POSTHOG_HOST?: string
      EXPO_PUBLIC_POSTHOG_PROJECT?: string
    }
  }
}

export {}
