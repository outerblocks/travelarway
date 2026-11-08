/**
 * What a payment *attempt* is allowed to record before confirmation.
 *
 * A collection request can come back marked `SUCCESS` the moment ClickPesa accepts it. That
 * says the request was accepted, not that money reached us — and writing `paid` at that
 * point was a real defect: the payment row looked settled before the booking was issued, so
 * the genuine webhook was then treated as a replay and the customer never got a ticket.
 *
 * Rule: an attempt is only ever `pending` or `failed`. `paid` is written by
 * `confirmPayment`, from provider-confirmed evidence, and by nothing else.
 */
import type { CollectionStatus } from './clickpesa';

export function attemptStatusFor(status: CollectionStatus): 'pending' | 'failed' {
  return status === 'failed' || status === 'voided' || status === 'refunded'
    ? 'failed'
    : 'pending';
}
