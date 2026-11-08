/**
 * Travelar provider-neutral integration contract reference.
 *
 * DESIGN REFERENCE ONLY — not production-ready code. Reconcile with the actual
 * repository, vendor OpenAPI schemas, account contracts, runtime, and approved
 * ADRs before implementing. Keep provider raw payloads private and redacted.
 */

export type IntegrationEnvironment =
  | 'mock'
  | 'sandbox'
  | 'certification'
  | 'production';

export type CapabilityState =
  | 'supported'
  | 'unsupported'
  | 'conditional'
  | 'unknown';

export interface ProviderCapabilityEvidence {
  providerId: string;
  productId: string;
  environment: IntegrationEnvironment;
  marketCode: string;
  travelMode: 'bus' | 'ferry' | 'flights' | 'stays' | 'train' | 'experiences' | 'payments';
  capabilityKey: string;
  state: CapabilityState;
  apiVersion?: string;
  documentationUrl: string;
  documentationCheckedAt: string;
  entitlementEvidenceId?: string;
  contractEvidenceId?: string;
  testEvidenceId?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  approvedBy?: string;
  notes?: string;
}

export type OperationOutcome =
  | 'success'
  | 'pending'
  | 'rejected'
  | 'retryable_failure'
  | 'unknown_requires_reconciliation';

export interface ProviderOperationMeta {
  providerId: string;
  providerProductId: string;
  environment: IntegrationEnvironment;
  providerRequestId?: string;
  providerTraceId?: string;
  providerRawStatus?: string;
  occurredAt?: string;
  completedAt?: string;
  retryAfterSeconds?: number;
  correlationId: string;
  idempotencyKey: string;
  evidenceSnapshotId: string;
}

export interface AdapterResult<T> {
  outcome: OperationOutcome;
  data?: T;
  meta: ProviderOperationMeta;
  /** Safe, normalized domain-facing error code. */
  errorCode?: string;
  /** Safe text only; never pass provider stack traces or secrets to the UI. */
  safeMessage?: string;
  /** Identifier for restricted, redacted evidence storage. */
  evidenceArtifactId?: string;
}

export interface MoneyAmount {
  /** Integer in minor units, or exact decimal under an explicitly documented rule. */
  amountMinor: bigint;
  currency: string;
}

export interface AirSearchRequest {
  originCode: string;
  destinationCode: string;
  departureDate: string;
  returnDate?: string;
  segments?: Array<{
    originCode: string;
    destinationCode: string;
    departureDate: string;
  }>;
  travelers: Array<{
    type: 'adult' | 'child' | 'infant';
    age?: number;
  }>;
  cabinPreference?: string;
  pointOfSaleCountry: string;
  currency: string;
  locale: string;
  includeSources?: string[];
}

export interface CanonicalAirOffer {
  travelarOfferId: string;
  sourceProviderId: string;
  sourceProductId: string;
  providerOfferReference: string;
  currency: string;
  totalAmountMinor: bigint;
  fareComponents?: Array<{
    kind: 'base' | 'tax' | 'fee' | 'ancillary' | 'discount' | 'unknown';
    amountMinor: bigint;
    currency: string;
    displayLabel?: string;
  }>;
  itinerary: Array<{
    marketingCarrier?: string;
    operatingCarrier?: string;
    flightNumber?: string;
    originCode: string;
    destinationCode: string;
    departureAt: string;
    arrivalAt: string;
    timeZoneOrigin?: string;
    timeZoneDestination?: string;
    durationMinutes?: number;
    stops?: number;
  }>;
  conditionsReference?: string;
  baggageSummary?: string;
  offerSnapshotId: string;
  quotedAt: string;
  expiresAt?: string;
  capabilitySnapshotId: string;
}

export interface AirRevalidationResult {
  available: boolean;
  changed: boolean;
  previousOfferSnapshotId: string;
  refreshedOffer?: CanonicalAirOffer;
  materialChanges: Array<{
    field: string;
    before?: string;
    after?: string;
  }>;
  explicitCustomerConsentRequired: boolean;
}

export interface AirSupplierAdapter {
  readonly providerId: string;
  readonly productId: string;

  search(request: AirSearchRequest, meta: ProviderOperationMeta): Promise<AdapterResult<CanonicalAirOffer[]>>;
  revalidate(offer: CanonicalAirOffer, meta: ProviderOperationMeta): Promise<AdapterResult<AirRevalidationResult>>;
  createReservation(input: {
    offer: CanonicalAirOffer;
    travelers: Array<Record<string, unknown>>;
    agencyContextId: string;
    commercialRouteId: string;
    /** Provider route may require payment before/during/after reservation; explicit policy ID only. */
    bookingPaymentPolicyId: string;
  }, meta: ProviderOperationMeta): Promise<AdapterResult<{ reservationId: string; status: string; expiresAt?: string }>>;
  fulfill(input: { reservationId: string; fulfillmentPolicyId: string }, meta: ProviderOperationMeta): Promise<AdapterResult<{ status: string; ticketReferences?: string[] }>>;
  retrieve(input: { reservationId?: string; providerLocator?: string }, meta: ProviderOperationMeta): Promise<AdapterResult<{ status: string; ticketReferences?: string[]; expiresAt?: string }>>;
}

export interface StaySearchRequest {
  destinationId: string;
  checkInDate: string;
  checkOutDate: string;
  rooms: Array<{
    adults: number;
    childAges?: number[];
  }>;
  pointOfSaleCountry: string;
  currency: string;
  locale: string;
}

export interface CanonicalStayOffer {
  travelarOfferId: string;
  sourceProviderId: string;
  providerPropertyReference: string;
  providerRateReference: string;
  propertyName: string;
  locationLabel: string;
  roomDescription?: string;
  boardPlan?: string;
  currency: string;
  totalAmountMinor: bigint;
  taxesAndFeesIncluded?: boolean;
  cancellationSummary?: string;
  cancelBy?: string;
  contentRightsEvidenceId?: string;
  quoteSnapshotId: string;
  quotedAt: string;
  expiresAt?: string;
}

export interface StaySupplierAdapter {
  readonly providerId: string;
  readonly productId: string;
  search(request: StaySearchRequest, meta: ProviderOperationMeta): Promise<AdapterResult<CanonicalStayOffer[]>>;
  priceCheck(offer: CanonicalStayOffer, meta: ProviderOperationMeta): Promise<AdapterResult<{ available: boolean; refreshedOffer?: CanonicalStayOffer; materialChanges: string[] }>>;
  createBooking(input: { offer: CanonicalStayOffer; guests: Array<Record<string, unknown>>; paymentRouteId: string }, meta: ProviderOperationMeta): Promise<AdapterResult<{ providerBookingReference: string; status: string; cancellationDeadline?: string }>>;
  retrieveBooking(input: { providerBookingReference: string }, meta: ProviderOperationMeta): Promise<AdapterResult<{ status: string; providerConfirmation?: string }>>;
}

export interface CollectionRequest {
  travelarPaymentAttemptId: string;
  amount: MoneyAmount;
  method: 'billpay_exact' | 'billpay_partial' | 'ussd_push' | 'card' | 'tanqr' | 'crdb_direct_debit' | 'other';
  customerReference: string;
  bookingReference: string;
  expiresAt?: string;
  idempotencyKey: string;
}

export interface CollectionResult {
  providerPaymentReference: string;
  customerInstructions?: {
    controlNumber?: string;
    checkoutUrl?: string;
    displayReference?: string;
    expiresAt?: string;
  };
  normalizedPaymentState: 'pending' | 'received' | 'settled_to_merchant' | 'failed' | 'unknown';
  providerRawStatus: string;
  amount: MoneyAmount;
}

export interface PayoutPreview {
  destinationVerified: boolean;
  beneficiaryDisplayName?: string;
  amount: MoneyAmount;
  fee?: MoneyAmount;
  merchantBalanceAfterPreview?: MoneyAmount;
  exchangeRate?: string;
  previewReference?: string;
  warnings: string[];
}

export interface PayoutResult {
  providerPayoutReference: string;
  normalizedState: 'accepted' | 'processing' | 'completed' | 'failed_returned' | 'reversed' | 'unknown';
  providerRawStatus: string;
  amount: MoneyAmount;
  destinationCurrency?: string;
}

export interface PaymentPayoutAdapter {
  readonly providerId: string;
  previewCollection(request: CollectionRequest, meta: ProviderOperationMeta): Promise<AdapterResult<Record<string, unknown>>>;
  createCollection(request: CollectionRequest, meta: ProviderOperationMeta): Promise<AdapterResult<CollectionResult>>;
  queryCollection(input: { providerPaymentReference: string }, meta: ProviderOperationMeta): Promise<AdapterResult<CollectionResult>>;
  deactivateCollectionReference?(input: { providerReference: string }, meta: ProviderOperationMeta): Promise<AdapterResult<{ state: string }>>;
  previewPayout(input: { beneficiary: Record<string, unknown>; amount: MoneyAmount }, meta: ProviderOperationMeta): Promise<AdapterResult<PayoutPreview>>;
  createPayout(input: { preview: PayoutPreview; approvedPayoutId: string }, meta: ProviderOperationMeta): Promise<AdapterResult<PayoutResult>>;
  queryPayout(input: { providerPayoutReference: string }, meta: ProviderOperationMeta): Promise<AdapterResult<PayoutResult>>;
  verifyAndNormalizeWebhook(input: { headers: Record<string, string | undefined>; body: unknown }, meta: ProviderOperationMeta): Promise<AdapterResult<{ eventId: string; eventType: string; rawStatus: string; paymentOrPayoutReference: string }>>;
}

/** Required implementation safeguards (these are not runtime enforcement by this file):
 * - Never make a create/commit/fulfill/payout/refund retry after timeout until the prior
 *   operation has been queried/reconciled or a provider idempotency contract is verified.
 * - Preserve raw provider status in restricted audit/evidence, but return normalized state
 *   for Travelar domain logic.
 * - Enforce capability, environment, account and market gates before every operation.
 * - Use integer/exact decimal money. Never use JavaScript floating point for accounting.
 * - Payment received, settlement to merchant, supplier reservation, ticket issue and operator
 *   payout are independent states.
 * - ClickPesa has no public sandbox; tests must mock network calls, unless a named human
 *   approves an isolated live-money test with explicit bounds and reconciliation.
 */
