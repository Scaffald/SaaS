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

// Stripe types (Deno edge functions use npm: specifier)
declare module 'stripe' {
  // Stripe namespace for type aliases used across routers
  namespace Stripe {
    interface PaymentIntent {
      id: string
      amount: number
      currency: string
      client_secret: string | null
      // biome-ignore lint/suspicious/noExplicitAny: Stripe type
      metadata: Record<string, any>
      status: string
      created: number
      object: 'payment_intent'
      // biome-ignore lint/suspicious/noExplicitAny: Stripe type
      [key: string]: any
    }
    interface PaymentIntentCreateParams {
      amount?: number
      currency?: string
      // biome-ignore lint/suspicious/noExplicitAny: Stripe type
      metadata?: Record<string, any>
      // biome-ignore lint/suspicious/noExplicitAny: Stripe type
      [key: string]: any
    }
    interface PaymentMethod {
      id: string
      type: string
      // biome-ignore lint/suspicious/noExplicitAny: Stripe type
      [key: string]: any
    }
    interface PaymentMethodAttachParams {
      customer: string
      // biome-ignore lint/suspicious/noExplicitAny: Stripe type
      [key: string]: any
    }
    interface Customer {
      id: string
      name?: string | null
      email?: string | null
      // biome-ignore lint/suspicious/noExplicitAny: Stripe type
      [key: string]: any
    }
    interface CustomerCreateParams {
      name?: string
      email?: string
      // biome-ignore lint/suspicious/noExplicitAny: Stripe type
      [key: string]: any
    }
    interface SetupIntent {
      id: string
      client_secret: string | null
      status: string
      // biome-ignore lint/suspicious/noExplicitAny: Stripe type
      [key: string]: any
    }
    interface SetupIntentCreateParams {
      // biome-ignore lint/suspicious/noExplicitAny: Stripe type
      [key: string]: any
    }
  }

  class Stripe {
    // biome-ignore lint/suspicious/noExplicitAny: Minimal declaration for Deno compatibility
    constructor(apiKey: string, config?: Record<string, any>)
    paymentIntents: {
      // biome-ignore lint/suspicious/noExplicitAny: Stripe type
      create(params: Stripe.PaymentIntentCreateParams): Promise<Stripe.PaymentIntent>
      retrieve(id: string): Promise<Stripe.PaymentIntent>
      // biome-ignore lint/suspicious/noExplicitAny: Stripe type
      confirm(id: string, params?: any): Promise<Stripe.PaymentIntent>
    }
    paymentMethods: {
      // biome-ignore lint/suspicious/noExplicitAny: Stripe type
      list(params?: any): Promise<{ data: Stripe.PaymentMethod[] }>
      detach(id: string): Promise<Stripe.PaymentMethod>
      // biome-ignore lint/suspicious/noExplicitAny: Stripe type
      attach(id: string, params: Stripe.PaymentMethodAttachParams): Promise<Stripe.PaymentMethod>
    }
    customers: {
      create(params: Stripe.CustomerCreateParams): Promise<Stripe.Customer>
      // biome-ignore lint/suspicious/noExplicitAny: Stripe type
      del(id: string): Promise<any>
      // biome-ignore lint/suspicious/noExplicitAny: Stripe type
      list(params?: any): Promise<{ data: Stripe.Customer[] }>
      retrieve(id: string): Promise<Stripe.Customer>
    }
    setupIntents: {
      create(params?: Stripe.SetupIntentCreateParams): Promise<Stripe.SetupIntent>
      retrieve(id: string): Promise<Stripe.SetupIntent>
      // biome-ignore lint/suspicious/noExplicitAny: Stripe type
      confirm(id: string, params?: any): Promise<Stripe.SetupIntent>
      // biome-ignore lint/suspicious/noExplicitAny: Stripe type
      [key: string]: any
    }
    // biome-ignore lint/suspicious/noExplicitAny: Minimal declaration
    identity: Record<string, Record<string, (...args: any[]) => Promise<any>>>
    // biome-ignore lint/suspicious/noExplicitAny: Minimal declaration
    subscriptions: Record<string, (...args: any[]) => Promise<any>>
    // biome-ignore lint/suspicious/noExplicitAny: Minimal declaration
    static createFetchHttpClient(): any
  }

  export = Stripe
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
