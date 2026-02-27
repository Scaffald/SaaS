import { Resource } from './base.js'
import type {
  PaymentAnalytics,
  TransactionsListParams,
  TransactionsListResponse,
  TransactionExportResponse,
  PaymentMethod,
  SetupIntentResponse,
  SavePaymentMethodParams,
  TransactionReceipt,
  AccountCredits,
  DepositCreditsParams,
  DepositCreditsResponse,
  CreditLedgerResponse,
} from '../types/payments.js'

export class Payments extends Resource {
  async getAnalytics(): Promise<PaymentAnalytics> {
    return this.get<PaymentAnalytics>('/v1/payments/analytics')
  }

  async listTransactions(params?: TransactionsListParams): Promise<TransactionsListResponse> {
    const query: Record<string, string> = {}
    if (params?.limit) query.limit = String(params.limit)
    if (params?.offset) query.offset = String(params.offset)
    if (params?.status) query.status = params.status
    if (params?.transactionType) query.transactionType = params.transactionType
    if (params?.organizationId) query.organizationId = params.organizationId
    if (params?.startDate) query.startDate = params.startDate
    if (params?.endDate) query.endDate = params.endDate
    return this.get<TransactionsListResponse>('/v1/payments/transactions', query)
  }

  async exportTransactions(params?: TransactionsListParams & { format?: 'csv' | 'json' }): Promise<TransactionExportResponse> {
    const query: Record<string, string> = {}
    if (params?.format) query.format = params.format
    if (params?.organizationId) query.organizationId = params.organizationId
    if (params?.status) query.status = params.status
    if (params?.transactionType) query.transactionType = params.transactionType
    if (params?.startDate) query.startDate = params.startDate
    if (params?.endDate) query.endDate = params.endDate
    return this.get<TransactionExportResponse>('/v1/payments/transactions/export', query)
  }

  async getPaymentMethod(organizationId: string): Promise<PaymentMethod | null> {
    return this.get<PaymentMethod | null>('/v1/payments/payment-methods', { organizationId })
  }

  async deletePaymentMethod(methodId: string): Promise<{ ok: boolean }> {
    return this.del<{ ok: boolean }>(`/v1/payments/payment-methods/${methodId}`)
  }

  async createSetupIntent(organizationId: string): Promise<SetupIntentResponse> {
    return this.post<SetupIntentResponse>('/v1/payments/setup-intent', { organizationId })
  }

  async savePaymentMethod(params: SavePaymentMethodParams): Promise<PaymentMethod> {
    return this.post<PaymentMethod>('/v1/payments/save-payment-method', params)
  }

  async generateReceipt(transactionId: string): Promise<TransactionReceipt> {
    return this.get<TransactionReceipt>(`/v1/payments/receipts/${transactionId}`)
  }

  async getAccountCredits(organizationId: string): Promise<AccountCredits> {
    return this.get<AccountCredits>('/v1/payments/credits', { organizationId })
  }

  async depositCredits(params: DepositCreditsParams): Promise<DepositCreditsResponse> {
    return this.post<DepositCreditsResponse>('/v1/payments/credits/deposit', params)
  }

  async getCreditLedger(params: { organizationId: string; limit?: number; offset?: number; transactionType?: string }): Promise<CreditLedgerResponse> {
    const query: Record<string, string> = { organizationId: params.organizationId }
    if (params.limit) query.limit = String(params.limit)
    if (params.offset) query.offset = String(params.offset)
    if (params.transactionType) query.transactionType = params.transactionType
    return this.get<CreditLedgerResponse>('/v1/payments/credits/ledger', query)
  }
}
