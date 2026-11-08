# ADR-COMMS-001 — Multi-Provider Communication Adapters and Controlled Failover

- **Status:** Accepted architectural direction; provider selection and production activation unresolved.
- **Date:** 23 October 2026
- **Owner:** Travelar / OuterBlocks Limited
- **Related:** `ADR-GDS-001-multi-provider-adapters.md`, `ADR-PAY-001-multi-PSP-adapters.md`, `10-psp-communications-and-ussd-provider-comparison.md`, `31-open-questions-and-evidence-needed-before-launch.md`.

## Context

Travelar must send transactional and operational communications across countries and channels. Examples include booking confirmations, e-tickets and secure retrieval links, payment status, changes, cancellations, refunds, schedule disruptions, operator notices, verification codes, password/account recovery, and customer support updates. Candidate vendors include Resend for email and regional SMS/messaging aggregators such as Beem and Africa's Talking, with other providers to be assessed. These are candidates, not selected or contracted providers.

Providers differ in country coverage, sender-ID registration, throughput, costs, message-size/segment rules, delivery receipts, webhook authentication, retries, accepted-versus-delivered semantics, data processing locations, commercial terms, maintenance behavior and support. For example, Resend documents email event webhooks and event replay; Amazon SES documents delivery, bounce, complaint and delayed-delivery events; Twilio documents status callbacks and warns that callback requests may not arrive in the order sent. These illustrate why Travelar must retain raw provider events and normalize them carefully rather than assuming identical event semantics.

A failover system has a specific delivery risk: when a request times out, the provider may have accepted the message even though Travelar did not receive its response. Sending again through another provider may produce duplicates. Email/SMS sending generally cannot promise end-to-end exactly-once delivery across independent vendors.

## Decision

Travelar will use a **provider-neutral communication domain and separate adapters per provider, product, channel and sending account**. Multiple contracted providers may be enabled concurrently. Provider routing and failover will be capability-, country-, consent-, sender-identity-, message-category- and health-aware. No single communications vendor is a global dependency.

This decision applies to outbound/inbound messaging providers including email and SMS, and to other channel adapters where approved and justified (push notifications, approved messaging apps, voice/IVR and USSD gateways). Interactive USSD sessions are a distinct channel integration: the gateway is adapted at the edge, but all booking, identity, pricing, inventory and payment decisions remain in Travelar's domain APIs.

## Design principles and consequences

1. **Notification intent precedes provider dispatch.** Create one durable `notification_intent_id` for the business event and a delivery-attempt record for each provider attempt. Use a transactional outbox or equivalent durable queue so notifications are not lost between committing a booking event and publishing a message.
2. **One business event, controlled copies.** Deduplicate by intent, recipient, channel and semantic purpose. Persist provider message IDs. Retries of a webhook/event are idempotent. Resending an intentionally requested copy is recorded as a new delivery intent linked to the original.
3. **Never assume cross-provider exactly-once delivery.** Adapter-level idempotency is used only when the vendor documents and enables it. For ambiguous timeouts, first query provider status or reconcile by client reference if supported. Do not blindly send through another provider while the original state is unknown.
4. **Failover is policy-driven, not a universal automatic retry.** A failover can proceed when rejection/non-acceptance is known, the provider reports a terminal failure, or a message-category-specific policy explicitly accepts duplicate risk after a defined wait/reconciliation attempt. Every exception is logged with its policy version and reason.
5. **Do not silently change channel.** Email failure does not automatically imply SMS, WhatsApp or voice fallback. Cross-channel fallback requires a documented notification policy plus user preference/consent, legal basis, suitable privacy content, approved sender and configured cost controls. Authentication OTP and security alerts follow stricter policies.
6. **Use the same verification challenge across OTP retries.** Do not create multiple simultaneously-valid codes because of provider failover. Enforce expiry, attempt limits, resend cooldowns, phone/email ownership and anti-abuse controls. Avoid exposing full sensitive data in message content.
7. **Capabilities are per provider account and destination.** The capability registry records channel, country, destination restrictions, sender IDs, message category, template support, status reports, rate limits, maximum lengths, Unicode/segment behavior, data location, allowed times, cost and contract status. A provider is eligible only if all mandatory dimensions match.
8. **Keep provider raw status and normalized status.** A normalized state must not erase the raw provider event, provider timestamps, references, error code or evidence. Provider status events may be duplicated or out of order; apply monotonic/event-time rules where justified and retain the event history.
9. **Message acceptance is not recipient receipt.** `accepted` means the provider accepted the request, not that a recipient saw it. Email delivery generally indicates acceptance by the recipient mail server; SMS delivery reports depend on downstream network support. Read/open tracking is neither guaranteed nor proof that the person understood the message.
10. **Health-aware routing with guardrails.** Use per-provider/account/channel circuit breakers, error and latency thresholds, quota/balance monitoring, maintenance windows, alerting and manual disable/enable. Do not oscillate rapidly between providers. A health signal must not override destination, consent, sender-ID or content eligibility.
11. **Privacy and sovereignty apply to message vendors.** Minimize personal data in payloads and logs, assess controller/processor/subprocessor terms, retention and cross-border transfer permissions, and avoid putting ID numbers, payment details or full manifests in email/SMS. Prefer short-lived authenticated links for sensitive tickets or booking details.
12. **Audit, reconcile and measure.** Persist the intent, template/version, recipient reference, selected adapter, provider/account, sender identity, attempts, provider references, normalized and raw states, costs (where available), timestamps, retry/failover reason and final outcome. Restrict content visibility because messages may contain personal data.
13. **Template governance remains centralized.** Business services emit semantic events and data, not provider-specific bodies. Template rendering, language, localization, accessibility, links, consent checks and category policies belong to a Travelar-controlled layer; adapters translate into provider-specific requests.
14. **Communication does not control commercial state.** Sending/acceptance/delivery of a ticket message does not change booking, payment, refund or settlement state. Ticket issuance and booking confirmation are committed by authoritative domain workflows; messages only communicate them.

## Suggested normalized delivery states

Use an explicit state machine such as:

- `CREATED` — intent persisted.
- `QUEUED` — waiting for dispatch.
- `SUBMITTING` — outbound request in progress.
- `ACCEPTED_BY_PROVIDER` — provider accepted or queued the request.
- `SENT_TO_NETWORK` — provider says it was handed onward, where supported.
- `DELIVERED_REPORTED` — provider/channel reports delivery under its own definition.
- `FAILED_TERMINAL` — verified non-recoverable failure.
- `REJECTED` — request not accepted (e.g., credentials, sender ID, validation or account restriction).
- `BOUNCED` — email recipient domain/mailbox rejected, where the provider distinguishes it.
- `SUPPRESSED` — blocked by consent, suppression list, policy or duplicate guard.
- `UNKNOWN` — outcome ambiguous; reconcile before retry/failover unless policy explicitly permits duplicate risk.
- `EXPIRED` — no longer useful or retry window closed.

Not all channels expose every state. Preserve `provider_raw_status` and map only states supported by evidence; never infer delivery from a generic successful HTTP response.

## Failover policy by notification category

| Category | Suggested behavior | Duplicate/cross-channel policy |
|---|---|---|
| Booking/ticket confirmation | Attempt primary eligible channel; reconcile ambiguous provider results. Offer secure retrieval path through the booking-management flow. | Do not send a second provider copy on an ambiguous result without category policy. A resend is logged and clearly labeled as a copy. Never alter ticket validity due to message status. |
| Payment status / refund update | Durable notification, retry transient errors, provide support/self-service lookup if delayed. | Never infer payment/refund state from delivery. Cross-channel fallback only where permitted and privacy-appropriate. |
| OTP / password recovery | One active challenge per intended transaction; strict rate limits, expiry, abuse detection and same-code resend rules where safe. | Do not generate concurrent active OTPs. Cross-channel fallback requires an explicit approved security policy. |
| Delay / cancellation / urgent disruption | Prioritize eligible channel(s) with measured high delivery performance, perhaps use a separately governed multi-channel notification fan-out when urgency warrants it. | Fan-out is an explicit policy, not blind failover; suppress redundant messages after newer state supersedes the message. |
| Marketing / promotions | Consent- and preference-aware campaign path, separate from transactional queues and credentials. | Respect opt-outs and local law; never fail over around unsubscribe or suppression. |
| Staff / operator alerts | Route by severity, duty roster and approved fallback channels; monitor acknowledgement separately from delivery. | Escalation is an explicit incident policy; delivery is not acknowledgement. |

## Alternatives considered

- **One email/SMS provider embedded in application modules:** simple initially but creates vendor lock-in and outage coupling. Rejected as the target architecture.
- **Automatic send to all providers at once:** may improve chance of delivery but creates duplicates, extra cost and privacy exposure. Rejected as default; retained only as explicit fan-out for appropriate urgent notification categories.
- **Blind failover on timeout:** can send duplicate confirmations/OTPs when the primary accepted the request. Rejected.
- **Cross-channel fallback by default:** risks violating preferences/consent, exposing sensitive information or surprising customers with charges. Rejected.
- **Provider-neutral adapter with capability registry, outbox, event ledger and policy-driven fallback:** accepted.

## Evidence and references

- Resend webhooks and event visibility: https://resend.com/features/webhooks ; https://resend.com/changelog/webhook-event-visibility ; https://resend.com/changelog/managing-webhooks-via-api
- Amazon SES message event / delivery monitoring: https://docs.aws.amazon.com/ses/latest/dg/monitor-sending-activity.html ; https://docs.aws.amazon.com/ses/latest/dg/setting-up-event-notifications.html
- Twilio outbound message status callbacks, delivery states and callback ordering caveat: https://www.twilio.com/docs/messaging/guides/track-outbound-message-status ; https://www.twilio.com/docs/messaging/guides/outbound-message-status-in-status-callbacks
- Regional messaging vendors (candidate research; not endorsement or evidence of Travelar access): Beem, Africa's Talking, plus other local aggregators require a current account-specific coverage, sender-ID and delivery-report review before selection.

Official vendor documentation supports the existence of provider-specific events and status semantics, not Travelar's commercial eligibility, country coverage, exact delivery SLA or sender-ID approval.

## Acceptance criteria before production activation

- A country/channel/message-category provider registry exists with explicit eligible and ineligible reasons.
- Each active adapter has documented authentication, secret rotation, request idempotency support (or lack thereof), retry behavior, status lookup, webhook signature validation and delivery-state mapping.
- A durable outbox and idempotent event ingestion prevent losing business events and double-processing webhooks.
- Timeout-after-acceptance, duplicate event, out-of-order callback, delayed receipt, provider outage and partial outage tests pass.
- Failover tests show no uncontrolled duplicate ticket/OTP communications and honour category policy.
- Consent, suppression, sender-ID approvals, short code/number approvals and local-country restrictions are tested.
- Customer-facing delivery status distinguishes accepted, provider-reported delivered, failed and unknown; UI copy does not promise that an accepted message was received.
- A provider can be disabled or placed in maintenance mode without breaking booking/payment state or losing status inquiry access for its prior messages.
- Dashboards track accepted, delivered-reported, failure, unknown, duplicate, cost, latency and fallback rates by channel/provider/country; alerts have owners and runbooks.
- Data-processing terms, retention, cross-border transfers and access controls are approved for each vendor before production use.

## Open conditions

- Select the first primary and fallback email/SMS vendors after official pricing, Tanzania/Kenya coverage, account eligibility, sender ID, status receipts, data terms and support SLA are verified.
- Determine whether multiple vendors can use equivalent approved sender identities per country and what reputation/warmup requirements apply.
- Validate channel-specific legal bases, consent/opt-out and record-retention requirements per country and message category.
- Finish official Beem, Africa's Talking and other aggregator pricing/coverage research; do not treat old SDK snippets or third-party mirrors as current vendor terms.
- Define thresholds for automatic failover by message category after operational pilot data exists.
