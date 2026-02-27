/**
 * Payments types for the Scaffald SDK
 */

export interface PaymentAnalyticsKpis {
  totalRevenue: number
  totalTransactions: number
  succeededTransactions: number
  failedTransactions: number
  pendingTransactions: number
  successRate: number
}

export interface FailedTransactionRow {
  id: string
  transactionType: string | null
  amountCents: number | null
  failureReason: string | null
  createdAt: string
  failedAt: string | null
  organizationId: string
  userId: string | null
}

export interface PaymentAnalytics {
  kpis: PaymentAnalyticsKpis
  breakdowns: {
    byType: Record<string, { count: number; revenue: number; succeeded: number; failed: number }>
    byStatus: Record<string, number>
  }
  timeSeries: {
    dailyRevenue: Record<string, number>
  }
  failedQueue: FailedTransactionRow[]
}

export interface PaymentTransaction {
  id: string
  organizationId: string
  organizationName: string | null
  userId: string | null
  userName: string | null
  amountCents: number
  currency: string
  transactionType: string
  status: string
  failureReason: string | null
  stripePaymentIntentId: string | null
  createdAt: string
  succeededAt: string | null
  failedAt: string | null
  refundedAt: string | null
  metadata: Record<string, unknown>
}

export interface TransactionsListResponse {
  items: PaymentTransaction[]
  totalCount: number
}

export interface TransactionsListParams {
  limit?: number
  offset?: number
  status?: string
  transactionType?: string
  organizationId?: string
  startDate?: string
  endDate?: string
}

export interface TransactionExportResponse {
  format: 'csv' | 'json'
  data: string
  contentType: string
}

export interface PaymentMethod {
  id: string
  brand: string | null
  last4: string | null
  expMonth: number | null
  expYear: number | null
  billingName: string | null
  billingEmail: string | null
  isDefault: boolean
  createdAt: string
}

export interface SetupIntentResponse {
  clientSecret: string | null
  setupIntentId: string
}

export interface SavePaymentMethodParams {
  organizationId: string
  paymentMethodId: string
}

export interface TransactionReceipt {
  transactionId: string
  receiptNumber: string
  date: string
  organizationName: string
  organizationAddress: unknown
  amount: string
  amountCents: number
  currency: string
  transactionType: string
  status: string
  stripePaymentIntentId: string | null
  metadata: Record<string, unknown>
}

export interface AccountCredits {
  id: string | null
  organizationId: string
  balanceCents: number
  currency: string
  createdAt: string
  updatedAt: string
}

export interface DepositCreditsParams {
  organizationId: string
  amountCents: number
  paymentMethodId?: string
}

export interface DepositCreditsResponse {
  transactionId: string
  status: string
  clientSecret: string | null
  stripePaymentIntentId: string
}

export interface CreditLedgerEntry {
  id: string
  accountCreditId: string
  organizationId: string
  amountCents: number | null
  currency: string | null
  transactionType: string | null
  direction: string | null
  description: string | null
  paymentTransactionId: string | null
  successFeeId: string | null
  backgroundCheckId: string | null
  idVerificationId: string | null
  metadata: Record<string, unknown>
  createdBy: string | null
  createdAt: string
}

export interface CreditLedgerResponse {
  items: CreditLedgerEntry[]
  totalCount: number
}
