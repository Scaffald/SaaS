declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string
      NODE_ENV: 'development' | 'production' | 'test'
      SUPABASE_AUTH_JWT_SECRET: string

      EXPO_PUBLIC_URL: string
      NEXT_PUBLIC_URL: string

      EXPO_PUBLIC_GOOGLE_SIGN_IN_WEB_CLIENT_ID: string
      EXPO_PUBLIC_GOOGLE_URL_SCHEME: string

      EXPO_PUBLIC_SUPABASE_URL: string
      NEXT_PUBLIC_SUPABASE_URL: string

      EXPO_PUBLIC_SUPABASE_ANON_KEY: string
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string

      JOOBLE_API_KEY: string
      JOOBLE_SEARCH_KEYWORDS?: string
      JOOBLE_SEARCH_LOCATION?: string
      JOOBLE_SEARCH_RADIUS?: string
    }
  }
}

export {}
