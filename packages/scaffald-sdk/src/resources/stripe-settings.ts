import { Resource } from './base.js'

export interface StripeSettings {
  publishableKey: string
  hasApiKey: boolean
  hasWebhookSecret: boolean
  testMode: boolean
  webhookEndpointUrl: string
  lastTestedAt: string | null
  lastTestedStatus: 'succeeded' | 'failed' | null
  lastTestedError: string | null
  updatedAt: string | null
  updatedBy: string | null
}

export interface UpdatePublishableKeyParams {
  publishableKey: string
}

export interface UpdateTestModeParams {
  testMode: boolean
}

export interface UpdateStripeApiKeyParams {
  secret: string
}

export interface UpdateWebhookSecretParams {
  secret: string
}

// biome-ignore lint/suspicious/noUnsafeDeclarationMerging: return type matches class name by design
export class StripeSettings extends Resource {
  async getSettings(): Promise<StripeSettings> {
    return this.get<StripeSettings>('/v1/stripe-settings')
  }

  async updatePublishableKey(
    params: UpdatePublishableKeyParams
  ): Promise<{ publishableKey: string }> {
    return this.put<{ publishableKey: string }>('/v1/stripe-settings/publishable-key', params)
  }

  async updateTestMode(params: UpdateTestModeParams): Promise<{ testMode: boolean }> {
    return this.put<{ testMode: boolean }>('/v1/stripe-settings/test-mode', params)
  }

  async updateApiKey(params: UpdateStripeApiKeyParams): Promise<{ hasApiKey: boolean }> {
    return this.put<{ hasApiKey: boolean }>('/v1/stripe-settings/api-key', params)
  }

  async updateWebhookSecret(
    params: UpdateWebhookSecretParams
  ): Promise<{ hasWebhookSecret: boolean }> {
    return this.put<{ hasWebhookSecret: boolean }>('/v1/stripe-settings/webhook-secret', params)
  }

  async testConnection(): Promise<{ ok: true }> {
    return this.post<{ ok: true }>('/v1/stripe-settings/test-connection', {})
  }
}
