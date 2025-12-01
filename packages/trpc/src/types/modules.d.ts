// Ambient type declarations for external modules used in edge functions
// These allow TypeScript to understand module types without importing runtime code

declare module '@supabase/supabase-js' {
  export * from '@supabase/supabase-js'
}

declare module 'expo-server-sdk' {
  type ExpoPushMessage = {
    to: string
    data?: Record<string, unknown>
    title?: string
    subtitle?: string
    body?: string
    sound?: string | null
    ttl?: number
    expiration?: number
    priority?: 'default' | 'normal' | 'high'
    badge?: number
    channelId?: string
  }

  type ExpoPushTicket =
    | { status: 'ok'; id?: string }
    | { status: 'error'; message?: string; details?: { error?: string } }

  export class Expo {
    constructor(options?: { accessToken?: string })
    static isExpoPushToken(token: string): boolean
    sendPushNotificationsAsync(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]>
  }
}

declare module 'stripe' {
  export * from 'stripe'
}

declare module 'openai' {
  export * from 'openai'
}

declare module 'pdf-lib' {
  export * from 'pdf-lib'
}

declare module 'posthog-node' {
  export * from 'posthog-node'
}

declare module 'unpdf' {
  interface ExtractTextOptions {
    mergePages?: boolean
  }

  interface ExtractTextResult {
    text: string[]
    totalPages: number
  }

  export function extractText(
    fileBytes: Uint8Array,
    options?: ExtractTextOptions
  ): Promise<ExtractTextResult>
}

declare module 'mammoth' {
  export * from 'mammoth'
}

declare module 'jszip' {
  export * from 'jszip'
}
