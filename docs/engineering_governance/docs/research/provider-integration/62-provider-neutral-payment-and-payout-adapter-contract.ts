/**
 * Travelar provider-neutral payment/payout adapter contract (design proposal, v0.2).
 *
 * This is a domain boundary sketch, not production implementation. The actual provider
 * adapter must be tested against current OpenAPI specs, contract terms, and authorized
 * low-value live tests. Do not import ClickPesa-specific enums into core domain code.
 */

export type CapabilityStatus = "supported" | "unsupported" | "unknown";

export interface CapabilityEvidence {
  status: CapabilityStatus;
  /** URL or contract reference supporting this specific capability. */
  evidence?: string;
  checkedAt: string; // ISO-8601 date/time
  notes?: string;
}

export interface Money {
  /** Decimal string; never use JS floating-point for monetary arithmetic. */
  amount: string;
  currency: string; // ISO 4217-style code, subject to market/currency registry
}

export type CollectionMethod =
  | "mobile_money_push"
  | "billpay_control_number"
  | "hosted_card_checkout"
  | "merchant_qr_or_lipa_namba"
  | "bank_collection"
  | "other";

export type NormalizedCollectionStatus =
  | "created"
  | "pending_customer_action"
  | "processing"
  | "payment_received_unsettled"
  | "merchant_balance_settled"
  | "on_hold"
  | "failed"
  | "refunded_pre_settlement"
  | "reversed_post_settlement"
  | "closed"
  | "unknown";

export type NormalizedPayoutStatus =
  | "created"
  | "accepted"
  | "processing"
  | "provider_reported_success"
  | "recipient_credit_confirmed"
  | "refunded"
  | "reversed"
  | "failed"
  | "unknown";

export interface CollectionCapabilities {
  mobileMoneyPush: CapabilityEvidence;
  billPayOrderReference: CapabilityEvidence;
  exactAmountCollection: CapabilityEvidence;
  nativeExpiry: CapabilityEvidence;
  deactivateReference: CapabilityEvidence;
  hostedCardCheckout: CapabilityEvidence;
  dynamicAmountSpecificQr: CapabilityEvidence;
  queryStatusByReference: CapabilityEvidence;
  signedWebhooks: CapabilityEvidence;
  refundToOriginalTender: CapabilityEvidence;
  /** Max provider reference length, if confirmed per method. */
  referenceLength?: Record<CollectionMethod, number | undefined>;
}

export interface PayoutCapabilities {
  mobileMoney: CapabilityEvidence;
  bank: CapabilityEvidence;
  merchantQrOrLipaNamba: CapabilityEvidence;
  bulkApi: CapabilityEvidence;
  perMerchantRateLimit: CapabilityEvidence;
  beneficiaryNameLookup: CapabilityEvidence;
  recipientCreditConfirmation: CapabilityEvidence;
  /** Only populate after the provider confirms exact finality semantics. */
  finalityDefinition?: string;
}

export interface ProviderCapabilities {
  providerId: string;
  collection: CollectionCapabilities;
  payout: PayoutCapabilities;
  acceptedCurrencies: string[];
  productionOnly: CapabilityEvidence;
  marketplaceSplitSettlement: CapabilityEvidence;
  directOperatorMerchantCollection: CapabilityEvidence;
  version: string;
  effectiveAt: string;
}

export interface CustomerPaymentDetails {
  /** Minimize PII; include only fields required by chosen rail. */
  name?: string;
  email?: string;
  phoneNumber?: string;
}

export interface CreateCollectionInput {
  tenantId: string;
  internalPaymentAttemptId: string;
  internalBookingId: string;
  /** Idempotency is enforced by Travelar even if provider-side support is unknown. */
  idempotencyKey: string;
  /** Provider-compatible opaque reference; unique in the provider account. */
  providerOrderReference: string;
  expectedAmount: Money;
  method: CollectionMethod;
  exactAmountRequired: boolean;
  /** Travelar policy deadline. Provider-native expiry may not be supported. */
  localExpiresAt?: string;
  customer?: CustomerPaymentDetails;
  description?: string;
  metadata?: Record<string, string>;
}

export type CustomerAction =
  | { type: "billpay_control_number"; value: string; instructions?: string }
  | { type: "ussd_push"; phoneNumberMasked?: string; instructions?: string }
  | { type: "hosted_checkout_url"; url: string; expiresAt?: string }
  | { type: "qr_or_lipa_namba"; value: string; instructions?: string }
  | { type: "none" };

export interface FeeQuote {
  amount?: Money;
  chargedTo?: "customer" | "merchant" | "operator" | "third_party" | "unknown";
  source: "provider_preview" | "public_tariff" | "contract_tariff" | "unknown";
  tariffVersion?: string;
  taxIncluded?: boolean;
  note?: string;
}

export interface CollectionInstruction {
  providerId: string;
  internalPaymentAttemptId: string;
  providerTransactionId?: string;
  providerOrderReference: string;
  method: CollectionMethod;
  status: NormalizedCollectionStatus;
  rawProviderStatus?: string;
  requestedAmount: Money;
  feeQuote?: FeeQuote;
  action: CustomerAction;
  providerCreatedAt?: string;
  providerExpiresAt?: string;
  localExpiresAt?: string;
  /** Indicates native expiry is not the same as Travelar's deadline. */
  requiresLocalExpiryEnforcement: boolean;
  safeToRetryCreate: boolean;
}

export interface ProviderCollectionStatus {
  providerId: string;
  internalPaymentAttemptId?: string;
  providerTransactionId?: string;
  providerPaymentReference?: string;
  providerOrderReference: string;
  normalizedStatus: NormalizedCollectionStatus;
  rawProviderStatus: string;
  amount?: Money;
  fee?: Money;
  payerPhoneNumber?: string;
  channel?: string;
  createdAt?: string;
  updatedAt?: string;
  providerSettledAt?: string;
  rawPayloadReference: string; // pointer to protected event/response store, not a raw PII blob
}

export interface VerifiedWebhook {
  providerId: string;
  validSignature: boolean;
  eventType: string;
  /** Present only when provider contract/field supplies an immutable event id. */
  providerEventId?: string;
  providerTransactionId?: string;
  providerOrderReference?: string;
  providerPaymentReference?: string;
  rawProviderStatus?: string;
  normalizedStatus?: NormalizedCollectionStatus | NormalizedPayoutStatus;
  occurredAt?: string;
  receivedAt: string;
  idempotencyFingerprint: string;
  rawPayloadReference: string;
}

export interface CollectionReconciliationWindow {
  from: string;
  to: string;
  cursor?: string;
}

export interface ReconciliationPage<T> {
  items: T[];
  nextCursor?: string;
  complete: boolean;
  source: "provider_api" | "provider_statement";
}

export interface CollectionAdapter {
  capabilities(): Promise<CollectionCapabilities>;
  createCollection(input: CreateCollectionInput): Promise<CollectionInstruction>;
  queryCollection(providerOrderReference: string): Promise<ProviderCollectionStatus>;
  /** Supported only if the provider offers a confirmed safe close/deactivate operation. */
  deactivateCollection?(providerOrderReference: string, reason: string): Promise<{ confirmed: boolean; rawStatus?: string }>;
  verifyAndNormalizeWebhook(rawBody: Uint8Array, headers: Record<string, string | undefined>): Promise<VerifiedWebhook>;
  reconcileCollections(window: CollectionReconciliationWindow): Promise<ReconciliationPage<ProviderCollectionStatus>>;
}

export interface CreatePayoutInput {
  tenantId: string;
  internalPayoutId: string;
  /** Must be stable for timeout recovery and must be persisted before network call. */
  providerOrderReference: string;
  idempotencyKey: string;
  amount: Money;
  rail: "mobile_money" | "bank" | "merchant_qr_or_lipa_namba";
  beneficiary: {
    operatorId: string;
    verifiedName: string;
    phoneNumber?: string;
    bankCode?: string;
    bankAccountNumber?: string;
    lipaNamba?: string;
    providerCode?: string;
    qrCode?: string;
  };
  notes?: string;
}

export interface PayoutPreview {
  providerId: string;
  internalPayoutId: string;
  amount: Money;
  fee: Money;
  totalDebit: Money;
  estimatedArrival?: string;
  beneficiaryNameLookup: "resolved" | "unavailable" | "not_supported" | "unknown";
  appliedRail?: string;
  rawPayloadReference: string;
}

export interface ProviderPayoutStatus {
  providerId: string;
  internalPayoutId?: string;
  providerTransactionId?: string;
  providerOrderReference: string;
  normalizedStatus: NormalizedPayoutStatus;
  rawProviderStatus: string;
  amount?: Money;
  fee?: Money;
  currency?: string;
  appliedRail?: string;
  providerReportedRecipientCredit?: boolean;
  recipientCreditEvidenceReference?: string;
  updatedAt?: string;
  rawPayloadReference: string;
}

export interface PayoutAdapter {
  capabilities(): Promise<PayoutCapabilities>;
  previewPayout(input: CreatePayoutInput): Promise<PayoutPreview>;
  createPayout(input: CreatePayoutInput): Promise<ProviderPayoutStatus>;
  queryPayout(providerOrderReference: string): Promise<ProviderPayoutStatus>;
  verifyAndNormalizeWebhook(rawBody: Uint8Array, headers: Record<string, string | undefined>): Promise<VerifiedWebhook>;
  reconcilePayouts(window: CollectionReconciliationWindow): Promise<ReconciliationPage<ProviderPayoutStatus>>;
}

/**
 * Orchestrator invariants (enforced in core API/database, not just in this interface):
 * - Persist attempt + unique provider reference before sending any money-moving request.
 * - On timeout/ambiguous 5xx, query existing reference before attempting create again.
 * - Verify webhook signature/checksum, amount, currency, merchant/application and references.
 * - Do not let duplicate/out-of-order callbacks regress terminal states or double-post the ledger.
 * - Keep payment receipt, merchant balance settlement, ticket issuance, fiscal receipt and
 *   operator payout as separate state machines.
 * - Do not mark payout complete merely because create returned an accepted/in-process status.
 * - Never allow a provider-specific capability marked `unknown` to drive a production route.
 */
