// Re-export types from npm packages for Deno compatibility
// Note: With npm: specifiers in import_map.json, types are resolved from node_modules

// Expo Push Notification types
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

  type ExpoPushReceipt =
    | { status: 'ok' }
    | { status: 'error'; message?: string; details?: { error?: string } }

  type ExpoPushReceiptId = string

  export class Expo {
    constructor(options?: { accessToken?: string })
    static isExpoPushToken(token: string): boolean
    sendPushNotificationsAsync(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]>
    getPushNotificationReceiptsAsync(
      receiptIds: ExpoPushReceiptId[]
    ): Promise<Record<string, ExpoPushReceipt>>
  }
}


// @hono/zod-openapi re-exports Zod's z
declare module '@hono/zod-openapi' {
  export { z } from 'zod'
  export * from 'zod'
}

// unpdf - PDF text extraction library
declare module 'unpdf' {
  export function extractText(
    data: Uint8Array,
    options?: { mergePages?: boolean }
  ): Promise<{ text: string[]; totalPages: number }>
}

// JSZip - ZIP file manipulation
declare module 'jszip' {
  // biome-ignore lint/suspicious/noExplicitAny: Minimal declaration for Deno compatibility
  class JSZip {
    // biome-ignore lint/suspicious/noExplicitAny: Minimal declaration
    file(name: string, data?: any, options?: any): this
    // biome-ignore lint/suspicious/noExplicitAny: Minimal declaration
    folder(name: string): JSZip | null
    // biome-ignore lint/suspicious/noExplicitAny: Minimal declaration
    generateAsync(options: Record<string, any>): Promise<any>
    // biome-ignore lint/suspicious/noExplicitAny: Minimal declaration
    loadAsync(data: any, options?: Record<string, any>): Promise<JSZip>
    // biome-ignore lint/suspicious/noExplicitAny: Minimal declaration
    files: Record<string, any>
  }
  export default JSZip
}

// openai - OpenAI SDK
declare module 'openai' {
  // biome-ignore lint/suspicious/noExplicitAny: Minimal declaration for Deno compatibility
  class OpenAI {
    // biome-ignore lint/suspicious/noExplicitAny: Minimal declaration
    constructor(options?: Record<string, any>)
    // biome-ignore lint/suspicious/noExplicitAny: Minimal declaration
    chat: { completions: { create: (...args: any[]) => Promise<any> } }
    // biome-ignore lint/suspicious/noExplicitAny: Minimal declaration
    [key: string]: any
  }
  export default OpenAI
}

// mammoth - DOCX to HTML/text conversion
declare module 'mammoth' {
  // biome-ignore lint/suspicious/noExplicitAny: Minimal declaration for Deno compatibility
  export function extractRawText(options: Record<string, any>): Promise<{ value: string; messages: any[] }>
  // biome-ignore lint/suspicious/noExplicitAny: Minimal declaration
  export function convertToHtml(options: Record<string, any>): Promise<{ value: string; messages: any[] }>
}
