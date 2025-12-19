/**
 * Stripe Type Definitions for Deno ESM Imports
 *
 * This file provides type definitions for Stripe when imported from esm.sh
 * in Deno Edge Functions. The ESM version uses different export patterns
 * than the npm package, so we need to augment the module to provide proper types.
 *
 * Usage in Edge Functions:
 *   import Stripe from 'https://esm.sh/stripe@14.26.0?target=deno'
 */

declare module 'stripe' {
  export default class Stripe {
    constructor(apiKey: string, options?: unknown)

    // Customers
    customers: {
      create(params?: unknown): Promise<Customer>
      retrieve(id: string, params?: unknown): Promise<Customer>
      update(id: string, params?: unknown): Promise<Customer>
      del(id: string, params?: unknown): Promise<DeletedCustomer>
      list(params?: unknown): Promise<{ data: Customer[] }>
    }

    // Payment Methods
    paymentMethods: {
      create(params?: unknown): Promise<PaymentMethod>
      retrieve(id: string, params?: unknown): Promise<PaymentMethod>
      update(id: string, params?: unknown): Promise<PaymentMethod>
      list(params?: unknown): Promise<{ data: PaymentMethod[] }>
      detach(id: string, params?: unknown): Promise<PaymentMethod>
    }

    // Payment Intents
    paymentIntents: {
      create(params?: unknown): Promise<PaymentIntent>
      retrieve(id: string, params?: unknown): Promise<PaymentIntent>
      update(id: string, params?: unknown): Promise<PaymentIntent>
      confirm(id: string, params?: unknown): Promise<PaymentIntent>
      cancel(id: string, params?: unknown): Promise<PaymentIntent>
      list(params?: unknown): Promise<{ data: PaymentIntent[] }>
    }

    // Setup Intents
    setupIntents: {
      create(params?: unknown): Promise<SetupIntent>
      retrieve(id: string, params?: unknown): Promise<SetupIntent>
      update(id: string, params?: unknown): Promise<SetupIntent>
      confirm(id: string, params?: unknown): Promise<SetupIntent>
      cancel(id: string, params?: unknown): Promise<SetupIntent>
      list(params?: unknown): Promise<{ data: SetupIntent[] }>
    }

    // Subscriptions
    subscriptions: {
      create(params?: unknown): Promise<Subscription>
      retrieve(id: string, params?: unknown): Promise<Subscription>
      update(id: string, params?: unknown): Promise<Subscription>
      del(id: string, params?: unknown): Promise<DeletedSubscription>
      list(params?: unknown): Promise<{ data: Subscription[] }>
    }

    // Prices
    prices: {
      create(params?: unknown): Promise<Price>
      retrieve(id: string, params?: unknown): Promise<Price>
      update(id: string, params?: unknown): Promise<Price>
      list(params?: unknown): Promise<{ data: Price[] }>
    }

    // Products
    products: {
      create(params?: unknown): Promise<Product>
      retrieve(id: string, params?: unknown): Promise<Product>
      update(id: string, params?: unknown): Promise<Product>
      del(id: string, params?: unknown): Promise<DeletedProduct>
      list(params?: unknown): Promise<{ data: Product[] }>
    }

    // Webhook Events
    webhooks: {
      constructEvent(body: string | Buffer, sig: string, secret: string): Event
    }

    // Charges
    charges: {
      create(params?: unknown): Promise<Charge>
      retrieve(id: string, params?: unknown): Promise<Charge>
      update(id: string, params?: unknown): Promise<Charge>
      list(params?: unknown): Promise<{ data: Charge[] }>
    }

    // Refunds
    refunds: {
      create(params?: unknown): Promise<Refund>
      retrieve(id: string, params?: unknown): Promise<Refund>
      update(id: string, params?: unknown): Promise<Refund>
      list(params?: unknown): Promise<{ data: Refund[] }>
    }

    // Disputes
    disputes: {
      retrieve(id: string, params?: unknown): Promise<Dispute>
      update(id: string, params?: unknown): Promise<Dispute>
      close(id: string, params?: unknown): Promise<Dispute>
      list(params?: unknown): Promise<{ data: Dispute[] }>
    }

    // Invoices
    invoices: {
      create(params?: unknown): Promise<Invoice>
      retrieve(id: string, params?: unknown): Promise<Invoice>
      update(id: string, params?: unknown): Promise<Invoice>
      finalize(id: string, params?: unknown): Promise<Invoice>
      send(id: string, params?: unknown): Promise<Invoice>
      list(params?: unknown): Promise<{ data: Invoice[] }>
    }

    // Bank Accounts
    customers: {
      createSource(customerId: string, params?: unknown): Promise<BankAccount>
      deleteSource(customerId: string, sourceId: string, params?: unknown): Promise<DeletedBankAccount>
    }
  }

  // Core Objects
  export interface Customer {
    id: string
    object: 'customer'
    address: Address | null
    balance: number
    created: number
    currency: string | null
    default_source: string | null
    delinquent: boolean
    description: string | null
    discount: Discount | null
    email: string | null
    invoice_prefix: string
    invoice_settings: { custom_fields: unknown[] | null; default_payment_method: string | null; footer: string | null }
    livemode: boolean
    metadata: Record<string, unknown>
    name: string | null
    next_invoice_sequence: number
    phone: string | null
    preferred_locales: string[]
    shipping: Shipping | null
    tax_exempt: 'none' | 'exempt' | 'reverse'
    test_clock: string | null
  }

  export interface DeletedCustomer {
    id: string
    object: 'customer'
    deleted: true
  }

  export interface PaymentMethod {
    id: string
    object: 'payment_method'
    billing_details: BillingDetails
    card?: Card
    created: number
    customer: string | null
    livemode: boolean
    metadata: Record<string, unknown>
    type: string
  }

  export interface BillingDetails {
    address: Address | null
    email: string | null
    name: string | null
    phone: string | null
  }

  export interface Card {
    brand: string
    checks: CardChecks
    country: string | null
    exp_month: number
    exp_year: number
    fingerprint: string | null
    funding: string
    generated_from: CardGeneratedFrom | null
    last4: string
    networks: CardNetworks
    three_d_secure_usage: CardThreeDSecureUsage
    wallet: CardWallet | null
  }

  export interface CardChecks {
    address_line1_check: string | null
    address_postal_code_check: string | null
    cvc_check: string | null
  }

  export interface CardGeneratedFrom {
    charge: string | null
    payment_method_details: Record<string, unknown> | null
  }

  export interface CardNetworks {
    available: string[]
    preferred: string | null
  }

  export interface CardThreeDSecureUsage {
    supported: boolean
  }

  export interface CardWallet {
    amex_express_checkout?: Record<string, unknown>
    apple_pay?: Record<string, unknown>
    dynamic_last4: string | null
    google_pay?: Record<string, unknown>
    masterpass?: Record<string, unknown>
    samsung_pay?: Record<string, unknown>
    type: string
    visa_checkout?: Record<string, unknown>
  }

  export interface PaymentIntent {
    id: string
    object: 'payment_intent'
    amount: number
    amount_capturable: number
    amount_details: { tip: number | null }
    amount_received: number
    application: string | null
    application_fee_amount: number | null
    automatic_payment_methods: AutomaticPaymentMethods | null
    canceled_at: number | null
    cancellation_reason: string | null
    capture_method: string
    charges: { data: Charge[]; has_more: boolean; object: string; total_count: number; url: string }
    client_secret: string | null
    confirmation_method: string
    created: number
    currency: string
    customer: string | null
    description: string | null
    last_payment_error: PaymentError | null
    livemode: boolean
    metadata: Record<string, unknown>
    next_action: NextAction | null
    on_behalf_of: string | null
    payment_method: string | null
    payment_method_options: Record<string, unknown>
    payment_method_types: string[]
    processing: Processing | null
    receipt_email: string | null
    review: string | null
    setup_future_usage: string | null
    shipping: Shipping | null
    statement_descriptor: string | null
    statement_descriptor_suffix: string | null
    status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded'
    transfer_data: TransferData | null
    transfer_group: string | null
  }

  export interface SetupIntent {
    id: string
    object: 'setup_intent'
    application: string | null
    attach_to_self: boolean
    automatic_payment_methods: AutomaticPaymentMethods | null
    cancellation_reason: string | null
    client_secret: string | null
    created: number
    customer: string | null
    description: string | null
    flow_directions: string[] | null
    last_setup_error: PaymentError | null
    latest_attempt: string | null
    livemode: boolean
    mandate: string | null
    metadata: Record<string, unknown>
    next_action: NextAction | null
    on_behalf_of: string | null
    payment_method: string | null
    payment_method_options: Record<string, unknown>
    payment_method_types: string[]
    single_use_mandate: string | null
    status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'canceled' | 'succeeded'
    usage: string
  }

  export interface Subscription {
    id: string
    object: 'subscription'
    application: string | null
    application_fee_percent: number | null
    automatic_tax: { enabled: boolean }
    billing_cycle_anchor: number
    billing_thresholds: BillingThresholds | null
    cancel_at: number | null
    cancel_at_period_end: boolean
    canceled_at: number | null
    collection_method: string
    created: number
    currency: string
    current_period_end: number
    current_period_start: number
    customer: string | Customer
    days_until_due: number | null
    default_payment_method: string | PaymentMethod | null
    default_source: string | null
    default_tax_rates: TaxRate[]
    description: string | null
    discount: Discount | null
    discounts: Discount[]
    ended_at: number | null
    items: SubscriptionItem[]
    latest_invoice: string | Invoice | null
    livemode: boolean
    metadata: Record<string, unknown>
    next_pending_invoice_item_invoice: number | null
    on_behalf_of: string | null
    pause_collection: PauseCollection | null
    payment_settings: PaymentSettings | null
    pending_invoice_item_interval: PendingInvoiceItemInterval | null
    pending_setup_intent: string | SetupIntent | null
    pending_update: SubscriptionPendingUpdate | null
    schedule: string | null
    start_date: number
    status: 'trialing' | 'active' | 'no_payment_required' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired'
    test_clock: string | null
    transfer_data: TransferData | null
    trial_end: number | null
    trial_settings: TrialSettings | null
    trial_start: number | null
  }

  export interface DeletedSubscription {
    id: string
    object: 'subscription'
    deleted: true
  }

  export interface Price {
    id: string
    object: 'price'
    active: boolean
    billing_scheme: string
    created: number
    currency: string
    custom_unit_amount: CustomUnitAmount | null
    livemode: boolean
    lookup_key: string | null
    metadata: Record<string, unknown>
    nickname: string | null
    product: string | Product
    recurring: Recurring | null
    tax_behavior: string
    tiers_mode: string | null
    transform_quantity: TransformQuantity | null
    type: string
    unit_amount: number | null
    unit_amount_decimal: string | null
  }

  export interface Product {
    id: string
    object: 'product'
    active: boolean
    attributes: string[]
    caption: string | null
    created: number
    deactivate_on: string[] | null
    description: string | null
    images: string[]
    livemode: boolean
    metadata: Record<string, unknown>
    name: string
    package_dimensions: PackageDimensions | null
    shippable: boolean | null
    statement_descriptor: string | null
    tax_code: string | null
    type: string
    unit_label: string | null
    updated: number
    url: string | null
  }

  export interface DeletedProduct {
    id: string
    object: 'product'
    deleted: true
  }

  export interface Charge {
    id: string
    object: 'charge'
    amount: number
    amount_captured: number
    amount_refunded: number
    application: string | null
    application_fee: string | null
    application_fee_amount: number | null
    balance_transaction: string | null
    billing_details: BillingDetails
    card: Card | null
    captured: boolean
    created: number
    currency: string
    customer: string | null
    description: string | null
    destination: string | null
    dispute: string | null
    disputed: boolean
    failure_balance_transaction: string | null
    failure_code: string | null
    failure_message: string | null
    fraud_details: FraudDetails | null
    invoice: string | null
    livemode: boolean
    metadata: Record<string, unknown>
    on_behalf_of: string | null
    order: string | null
    outcome: Outcome | null
    paid: boolean
    payment_intent: string | null
    payment_method: string | null
    payment_method_details: Record<string, unknown>
    receipt_email: string | null
    receipt_number: string | null
    receipt_url: string | null
    refunded: boolean
    refunds: { data: Refund[]; has_more: boolean; object: string; total_count: number; url: string }
    review: string | null
    shipping: Shipping | null
    source_transfer: string | null
    statement_descriptor: string | null
    statement_descriptor_suffix: string | null
    status: string
    transfer: string | null
    transfer_data: TransferData | null
    transfer_group: string | null
  }

  export interface Refund {
    id: string
    object: 'refund'
    amount: number
    balance_transaction: string | null
    charge: string | null
    created: number
    currency: string
    metadata: Record<string, unknown>
    reason: string | null
    receipt_number: string | null
    source_transfer_reversal: string | null
    status: string | null
    transfer_reversal: string | null
  }

  export interface Dispute {
    id: string
    object: 'dispute'
    amount: number
    balance_transactions: BalanceTransaction[]
    charge: string | null
    created: number
    currency: string
    evidence: Evidence | null
    evidence_details: EvidenceDetails
    is_charge_refundable: boolean
    network_reason_code: string
    object: 'dispute'
    payment_intent: string | null
    payment_method_details: Record<string, unknown>
    reason: string
    status: 'warning_needs_response' | 'warning_under_review' | 'warning_closed' | 'needs_response' | 'under_review' | 'charge_refunded' | 'won' | 'lost' | 'warning_evidence_submitted'
    status_transitions: {
      evidence_submission_closed_at: number | null
      evidence_submitted_at: number | null
      under_review_at: number | null
      won_at: number | null
      lost_at: number | null
    }
    transaction_id: string | null
  }

  export interface Invoice {
    id: string
    object: 'invoice'
    account_country: string | null
    account_name: string | null
    account_tax_id: string | null
    amount_due: number
    amount_paid: number
    amount_remaining: number
    application: string | null
    application_fee_amount: number | null
    attempt_count: number
    attempted: boolean
    auto_advance: boolean
    automatic_tax: { enabled: boolean; status: string | null }
    billing_reason: string | null
    charge: string | null
    collection_method: string
    created: number
    currency: string
    custom_fields: CustomField[] | null
    customer: string | null
    date: number
    default_payment_method: string | null
    default_source: string | null
    default_tax_rates: TaxRate[]
    description: string | null
    discounts: Discount[]
    due_date: number | null
    effective_at: number | null
    email: string | null
    ending_balance: number | null
    footer: string | null
    from_invoice: string | null
    hosted_invoice_url: string | null
    invoice_pdf: string | null
    last_finalization_attempt: number | null
    latest_revision: string | null
    lines: {
      data: LineItem[]
      has_more: boolean
      object: string
      total_count: number
      url: string
    }
    livemode: boolean
    metadata: Record<string, unknown>
    next_payment_attempt: number | null
    number: string | null
    on_behalf_of: string | null
    paid: boolean
    paid_out_of_band: boolean
    payment_intent: string | null
    payment_settings: {
      payment_method_options: Record<string, unknown> | null
      payment_method_types: string[] | null
      default_mandate: string | null
      save_default_payment_method: 'off' | 'on_subscription' | null
    }
    period_end: number
    period_start: number
    post_payment_actions: PostPaymentActions | null
    previous_payment_error: PaymentError | null
    quote: string | null
    receipt_number: string | null
    rendering: InvoiceRendering | null
    rendering_options: RenderingOptions | null
    resume_at: number | null
    scheduled_finalize_at: number | null
    source_invoice: string | null
    starting_balance: number | null
    statement_descriptor: string | null
    status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'
    status_transitions: {
      finalized_at: number | null
      marked_uncollectible_at: number | null
      paid_at: number | null
      voided_at: number | null
    }
    subscription: string | null
    subtotal: number
    subtotal_excluding_tax: number | null
    tax: number | null
    test_clock: string | null
    threshold_reason: ThresholdReason | null
    total: number
    total_discount_amounts: DiscountAmount[] | null
    total_excluding_tax: number | null
    total_tax_amounts: TaxAmount[] | null
    transfer_data: TransferData | null
    webhooks_delivered_at: number | null
  }

  export interface BankAccount {
    id: string
    object: 'bank_account'
    account_holder_name: string | null
    account_holder_type: string | null
    account_type: string | null
    bank_name: string | null
    country: string | null
    currency: string | null
    fingerprint: string | null
    last4: string | null
    routing_number: string | null
    status: string | null
  }

  export interface DeletedBankAccount {
    id: string
    object: 'bank_account'
    deleted: true
  }

  // Supporting Types
  export interface Address {
    city: string | null
    country: string | null
    line1: string | null
    line2: string | null
    postal_code: string | null
    state: string | null
  }

  export interface Discount {
    id: string
    object: 'discount'
    coupon: Coupon
    customer: string | null
    end: number | null
    invoice: string | null
    invoice_item: string | null
    start: number
    subscription: string | null
  }

  export interface Coupon {
    id: string
    object: 'coupon'
    amount_off: number | null
    created: number
    currency: string | null
    duration: string
    duration_in_months: number | null
    livemode: boolean
    max_redemptions: number | null
    metadata: Record<string, unknown>
    name: string | null
    percent_off: number | null
    redeem_by: number | null
    times_redeemed: number
    valid: boolean
  }

  export interface Shipping {
    address: Address
    carrier: string | null
    name: string | null
    phone: string | null
    tracking_number: string | null
  }

  export interface AutomaticPaymentMethods {
    allow_redirects: 'always' | 'never'
    enabled: boolean
  }

  export interface PaymentError {
    action_required: string | null
    charge: string | null
    code: string | null
    decline_code: string | null
    doc_url: string | null
    message: string | null
    param: string | null
    payment_intent: PaymentIntent | null
    payment_method: PaymentMethod | null
    payment_method_type: string | null
    setup_intent: SetupIntent | null
    source: Card | null
    type: string
  }

  export interface NextAction {
    redirect_to_url: { return_url: string; url: string } | null
    type: string
    use_stripe_sdk: Record<string, unknown> | null
  }

  export interface Processing {
    card: { request_three_d_secure: 'if_required' | 'optional' } | null
    type: string
  }

  export interface TransferData {
    amount: number | null
    destination: string
  }

  export interface BillingThresholds {
    amount_gte: number | null
    reset_billing_cycle_anchor: boolean | null
  }

  export interface TaxRate {
    id: string
    object: 'tax_rate'
    active: boolean
    country: string | null
    created: number
    description: string | null
    display_name: string | null
    inclusive: boolean
    jurisdiction: string | null
    livemode: boolean
    metadata: Record<string, unknown>
    percentage: number
    state: string | null
    tax_type: string | null
  }

  export interface SubscriptionItem {
    id: string
    object: 'subscription_item'
    billing_thresholds: BillingThresholds | null
    created: number
    metadata: Record<string, unknown>
    price: Price
    quantity: number | null
    subscription: string
    tax_rates: TaxRate[]
  }

  export interface PauseCollection {
    behavior: 'keep_as_draft' | 'mark_uncollectible' | 'void'
    resumes_at: number | null
  }

  export interface PaymentSettings {
    payment_method_options: Record<string, unknown> | null
    payment_method_types: string[] | null
    default_mandate: string | null
    save_default_payment_method: 'off' | 'on_subscription' | null
  }

  export interface PendingInvoiceItemInterval {
    interval: string
    interval_count: number
  }

  export interface SubscriptionPendingUpdate {
    billing_cycle_anchor: number | null
    expires_at: number
    subscription_items: SubscriptionItem[] | null
    trial_end: number | null
    trial_from_plan: boolean | null
  }

  export interface TrialSettings {
    end_on: number | null
  }

  export interface CustomUnitAmount {
    maximum: number | null
    minimum: number | null
    preset: number | null
  }

  export interface Recurring {
    aggregate_usage: string | null
    interval: string
    interval_count: number
    meter: string | null
    trial_period_days: number | null
    usage_type: string
  }

  export interface TransformQuantity {
    divide_by: number
    round: 'down' | 'up'
  }

  export interface PackageDimensions {
    height: number | null
    length: number | null
    weight: number | null
    width: number | null
  }

  export interface FraudDetails {
    report: 'fraudulent' | 'safe' | null
    user_report: 'fraudulent' | 'safe' | null
  }

  export interface Outcome {
    network_status: string
    reason: string | null
    risk_level: string
    risk_score: number | null
    seller_message: string
    type: string
  }

  export interface Event {
    id: string
    object: 'event'
    api_version: string | null
    created: number
    data: EventData
    livemode: boolean
    pending_webhooks: number
    request: EventRequest | null
    type: string
  }

  export interface EventData {
    object: Record<string, unknown>
    previous_attributes?: Record<string, unknown>
  }

  export interface EventRequest {
    id: string | null
    idempotency_key: string | null
  }

  export interface BalanceTransaction {
    id: string
    object: 'balance_transaction'
    amount: number
    available_on: number
    created: number
    currency: string
    description: string | null
    exchange_rate: number | null
    fee: number
    fee_details: FeeDetail[]
    net: number
    reporting_category: string
    source: string
    status: string
    type: string
  }

  export interface FeeDetail {
    amount: number
    application: string | null
    currency: string
    description: string | null
    type: string
  }

  export interface Evidence {
    access_activity_log: AccessActivityLog | null
    billing_address: string | null
    cancellation_policy: CancellationPolicy | null
    cancellation_policy_disclosure: CancellationPolicyDisclosure | null
    cancellation_rebuttal: CancellationRebuttal | null
    customer_communication: string | null
    customer_email_address: string | null
    customer_name: string | null
    customer_purchase_ip: string | null
    duplicate_charge_documentation: string | null
    duplicate_charge_explanation: string | null
    duplicate_charge_id: string | null
    product_description: string | null
    receipt: string | null
    refund_policy: RefundPolicy | null
    refund_policy_disclosure: RefundPolicyDisclosure | null
    refund_refusal_explanation: string | null
    service_date: number | null
    service_documentation: string | null
    shipping_address: string | null
    shipping_carrier: string | null
    shipping_date: number | null
    shipping_documentation: string | null
    shipping_tracking_number: string | null
    uncategorized_file: string | null
    uncategorized_text: string | null
  }

  export interface AccessActivityLog {
    type: 'activity_log_only' | 'ip_log_only' | 'combined_log_only'
  }

  export interface CancellationPolicy {
    type: 'cancellation_policy'
  }

  export interface CancellationPolicyDisclosure {
    type: 'cancellation_policy_disclosure'
  }

  export interface CancellationRebuttal {
    type: 'cancellation_rebuttal'
  }

  export interface RefundPolicy {
    type: 'refund_policy'
  }

  export interface RefundPolicyDisclosure {
    type: 'refund_policy_disclosure'
  }

  export interface EvidenceDetails {
    access_activity_log: AccessActivityLogDates | null
    billing_address: null
    cancellation_policy: CancellationPolicyDates | null
    cancellation_policy_disclosure: CancellationPolicyDisclosureDates | null
    cancellation_rebuttal: CancellationRebuttalDates | null
    customer_communication: null
    customer_email_address: null
    customer_name: null
    customer_purchase_ip: null
    dispute_specific_evidence_due_by: number | null
    duplicate_charge_documentation: null
    duplicate_charge_explanation: null
    duplicate_charge_id: null
    evidence_due_by: number | null
    general_evidence_due_by: number | null
    net_evidence_due_by: number | null
    product_description: null
    receipt: null
    refund_policy: RefundPolicyDates | null
    refund_policy_disclosure: RefundPolicyDisclosureDates | null
    refund_refusal_explanation: null
    service_date: null
    service_documentation: null
    shipping_address: null
    shipping_carrier: null
    shipping_date: null
    shipping_documentation: null
    shipping_tracking_number: null
    uncategorized_file: null
    uncategorized_text: null
  }

  export interface AccessActivityLogDates {
    due_by: number | null
    submitted_at: number | null
  }

  export interface CancellationPolicyDates {
    due_by: number | null
    submitted_at: number | null
  }

  export interface CancellationPolicyDisclosureDates {
    due_by: number | null
    submitted_at: number | null
  }

  export interface CancellationRebuttalDates {
    due_by: number | null
    submitted_at: number | null
  }

  export interface RefundPolicyDates {
    due_by: number | null
    submitted_at: number | null
  }

  export interface RefundPolicyDisclosureDates {
    due_by: number | null
    submitted_at: number | null
  }

  export interface CustomField {
    name: string | null
    value: string | null
  }

  export interface LineItem {
    id: string
    object: 'line_item'
    amount: number
    amount_excluding_tax: number | null
    currency: string
    description: string | null
    discount_amounts: DiscountAmount[]
    discountable: boolean
    discounts: Discount[]
    invoice_item: string
    livemode: boolean
    metadata: Record<string, unknown>
    period: Period
    plan: Plan | null
    price: Price | null
    proration: boolean
    proration_details: ProrationDetails | null
    quantity: number | null
    subscription: string | null
    subscription_item: string | null
    tax_amounts: TaxAmount[] | null
    test_clock: string | null
    type: string
    unit_amount_excluding_tax: number | null
  }

  export interface DiscountAmount {
    amount: number
    discount: Discount
  }

  export interface Period {
    end: number
    start: number
  }

  export interface Plan {
    id: string
    object: 'plan'
    active: boolean
    aggregate_usage: string | null
    amount: number | null
    amount_decimal: string | null
    billing_scheme: string
    created: number
    currency: string | null
    custom_unit_amount: CustomUnitAmount | null
    interval: string
    interval_count: number
    livemode: boolean
    lookup_key: string | null
    metadata: Record<string, unknown>
    meter: string | null
    nickname: string | null
    product: string
    tiers_mode: string | null
    transform_quantity: TransformQuantity | null
    trial_period_days: number | null
    usage_type: string
  }

  export interface ProrationDetails {
    credited_items: ProrationCreditedItem[] | null
  }

  export interface ProrationCreditedItem {
    invoice_line_item_id: string | null
  }

  export interface TaxAmount {
    amount: number
    inclusive: boolean
    tax_rate: TaxRate | string
  }

  export interface PostPaymentActions {
    invoices_to_void: string[] | null
    scheduled_cancellation: ScheduledCancellation | null
  }

  export interface ScheduledCancellation {
    cancels_at: number
  }

  export interface InvoiceRendering {
    amount_due_in_words: string | null
    pdf: PdfRendering | null
  }

  export interface PdfRendering {
    page_size: string | null
  }

  export interface RenderingOptions {
    amount_due_in_words: AmountDueInWords | null
    pdf: PdfRenderingOptions | null
  }

  export interface AmountDueInWords {
    enabled: boolean
  }

  export interface PdfRenderingOptions {
    page_size: 'a4' | 'letter' | null
  }

  export interface ThresholdReason {
    amount_gte: number | null
    item_reasons: ItemReason[] | null
  }

  export interface ItemReason {
    line_item_id: string
    usage_gte: number
  }

  // Create params types
  export interface CustomerCreateParams {
    address?: Address
    balance?: number
    coupon?: string
    description?: string
    email?: string
    expand?: string[]
    invoice_prefix?: string
    invoice_settings?: {
      custom_fields?: CustomField[] | null
      default_payment_method?: string
      footer?: string | null
    }
    metadata?: Record<string, unknown>
    name?: string
    next_invoice_sequence?: number
    payment_method?: string
    phone?: string
    preferred_locales?: string[]
    promotion_code?: string
    shipping?: Shipping
    tax_exempt?: 'none' | 'exempt' | 'reverse'
    test_clock?: string
  }

  export interface PaymentMethodCreateParams {
    type: string
    billing_details?: BillingDetails
    card?: CardData
    expand?: string[]
    metadata?: Record<string, unknown>
  }

  export interface CardData {
    number: string
    exp_month: number
    exp_year: number
    cvc?: string
  }

  export interface PaymentIntentCreateParams {
    amount: number
    currency: string
    automatic_payment_methods?: { allow_redirects?: 'always' | 'never'; enabled?: boolean }
    capture_method?: 'automatic' | 'manual'
    client_secret?: string
    confirmation_token?: string
    confirm?: boolean
    customer?: string
    description?: string
    expand?: string[]
    mandate?: string
    mandate_data?: {
      customer_acceptance: { accepted_at?: number; online?: { ip_address: string; user_agent: string } | { accepted_at?: number } }
      period_of_use?: { end_date?: number; start_date?: number }
      type: 'india'
    }
    metadata?: Record<string, unknown>
    off_session?: boolean
    on_behalf_of?: string
    payment_method?: string
    payment_method_data?: PaymentMethodData
    payment_method_options?: Record<string, unknown>
    payment_method_types?: string[]
    receipt_email?: string
    return_url?: string
    setup_future_usage?: 'on_session' | 'off_session'
    shipping?: Shipping
    statement_descriptor?: string
    statement_descriptor_suffix?: string
    transfer_data?: TransferDataParams
    transfer_group?: string
  }

  export interface PaymentMethodData {
    type: string
    billing_details?: BillingDetails
    card?: CardData
  }

  export interface TransferDataParams {
    amount?: number
    destination: string
  }

  export interface SetupIntentCreateParams {
    automatic_payment_methods?: { allow_redirects?: 'always' | 'never'; enabled?: boolean }
    confirm?: boolean
    customer?: string
    description?: string
    expand?: string[]
    flow_directions?: string[]
    mandate_data?: {
      customer_acceptance: { accepted_at?: number; online?: { ip_address: string; user_agent: string } | { accepted_at?: number } }
    }
    metadata?: Record<string, unknown>
    on_behalf_of?: string
    payment_method?: string
    payment_method_data?: PaymentMethodData
    payment_method_options?: Record<string, unknown>
    payment_method_types?: string[]
    return_url?: string
    single_use?: boolean
    usage?: 'off_session' | 'on_session'
  }

  export interface SubscriptionCreateParams {
    customer: string
    items?: SubscriptionItemParams[]
    automatic_tax?: { enabled: boolean }
    billing_cycle_anchor?: number
    billing_thresholds?: BillingThresholds
    collection_method?: 'charge_automatically' | 'send_invoice'
    coupon?: string
    currency?: string
    custom_fields?: CustomField[] | null
    days_until_due?: number
    default_payment_method?: string
    default_source?: string
    default_tax_rates?: string[]
    description?: string
    expand?: string[]
    from_plan?: string
    metadata?: Record<string, unknown>
    off_session?: boolean
    on_behalf_of?: string
    payment_behavior?: 'allow_incomplete' | 'default' | 'error_if_incomplete' | 'pending_if_incomplete'
    payment_settings?: PaymentSettings
    pause_collection?: PauseCollection
    pending_invoice_item_interval?: PendingInvoiceItemInterval
    promotion_code?: string
    proration_behavior?: 'always_invoice' | 'create_prorations' | 'none'
    test_clock?: string
    transfer_data?: TransferData
    trial_end?: number
    trial_period_days?: number
    trial_settings?: { end_on?: number }
  }

  export interface SubscriptionItemParams {
    price?: string
    plan?: string
    quantity?: number
    tax_rates?: string[]
    billing_thresholds?: BillingThresholds
    metadata?: Record<string, unknown>
  }

  export interface PriceCreateParams {
    currency: string
    product: string
    active?: boolean
    billing_scheme?: 'per_unit' | 'tiered'
    custom_unit_amount?: CustomUnitAmount
    expand?: string[]
    lookup_key?: string
    metadata?: Record<string, unknown>
    nickname?: string
    recurring?: Recurring
    tax_behavior?: 'exclusive' | 'inclusive' | 'unspecified'
    tiers?: PriceTier[]
    tiers_mode?: 'graduated' | 'volume'
    transfer_lookup_key?: boolean
    transform_quantity?: TransformQuantity
    type?: 'one_time' | 'recurring'
    unit_amount?: number
    unit_amount_decimal?: string
  }

  export interface PriceTier {
    flat_amount?: number
    flat_amount_decimal?: string
    unit_amount?: number
    unit_amount_decimal?: string
    up_to?: number | 'inf'
  }

  export interface ProductCreateParams {
    active?: boolean
    attributes?: string[]
    caption?: string
    deactivate_on?: string[]
    description?: string
    expand?: string[]
    id?: string
    images?: string[]
    livemode?: boolean
    metadata?: Record<string, unknown>
    name: string
    package_dimensions?: PackageDimensions
    shippable?: boolean
    statement_descriptor?: string
    tax_code?: string
    type?: 'good' | 'service'
    unit_label?: string
    url?: string
  }
}

// Export namespace for convenience
declare namespace Stripe {
  export interface Customer extends globalThis.Stripe.Customer {}
  export interface PaymentMethod extends globalThis.Stripe.PaymentMethod {}
  export interface PaymentIntent extends globalThis.Stripe.PaymentIntent {}
  export interface SetupIntent extends globalThis.Stripe.SetupIntent {}
  export interface Subscription extends globalThis.Stripe.Subscription {}
  export interface Price extends globalThis.Stripe.Price {}
  export interface Product extends globalThis.Stripe.Product {}
  export interface Charge extends globalThis.Stripe.Charge {}
  export interface Refund extends globalThis.Stripe.Refund {}
  export interface Dispute extends globalThis.Stripe.Dispute {}
  export interface Invoice extends globalThis.Stripe.Invoice {}
  export interface Event extends globalThis.Stripe.Event {}
}

// Export both as default and as named export to support both import styles
export default Stripe
export = Stripe
