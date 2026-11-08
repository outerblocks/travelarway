/**
 * Authoritative quoting.
 *
 * The customer's price is computed here, from database rows, and nowhere else. The browser
 * may show a number, but a booking never accepts one: `createBooking` calls this and stores
 * what it returns. That closes the gap where a tampered request could book a TZS 29,000
 * seat for 1 and the ledger would believe it.
 */
import { query } from '@/server/db';

export interface QuoteLine {
  kind: 'adult' | 'child';
  unitMinor: number;
  quantity: number;
  amountMinor: number;
}

export interface SegmentQuote {
  currency: string;
  grossMinor: number;
  adultUnitMinor: number;
  childUnitMinor: number;
  lines: QuoteLine[];
}

export class QuoteUnavailableError extends Error {
  constructor(public readonly reason: 'no_such_segment' | 'invalid_segment') {
    super(`quote_unavailable:${reason}`);
  }
}

/**
 * Prices one travelled segment of one dated trip.
 *
 * The stop pair is validated against the route's own stop ordering, so a request cannot
 * invent a cheaper journey by pairing stops that do not exist on this route or that run
 * backwards.
 */
export async function quoteBusSegment(input: {
  tripId: string;
  fromStopId: string;
  toStopId: string;
  adults: number;
  children: number;
}): Promise<SegmentQuote> {
  const { rows } = await query<{
    fare_minor: string;
    currency: string;
    child_ratio: string;
  }>(
    `select sf.fare_minor::text, sf.currency::text, sf.child_ratio::text
       from app.segment_fare sf
       join app.trip t on t.route_id = sf.route_id
       join app.route_stop fs on fs.id = sf.from_stop_id and fs.route_id = t.route_id
       join app.route_stop ts on ts.id = sf.to_stop_id and ts.route_id = t.route_id
      where t.id = $1
        and sf.from_stop_id = $2
        and sf.to_stop_id = $3
        and fs.sequence < ts.sequence
      limit 1`,
    [input.tripId, input.fromStopId, input.toStopId],
  );

  if (rows.length === 0) {
    throw new QuoteUnavailableError('no_such_segment');
  }

  const adultUnit = Number(rows[0].fare_minor);
  const childUnit = Math.round(adultUnit * Number(rows[0].child_ratio));
  const adults = Math.max(0, Math.trunc(input.adults));
  const children = Math.max(0, Math.trunc(input.children));

  if (adults + children === 0) {
    throw new QuoteUnavailableError('invalid_segment');
  }

  const lines: QuoteLine[] = [
    { kind: 'adult', unitMinor: adultUnit, quantity: adults, amountMinor: adultUnit * adults },
  ];
  if (children > 0) {
    lines.push({ kind: 'child', unitMinor: childUnit, quantity: children, amountMinor: childUnit * children });
  }

  return {
    currency: rows[0].currency,
    grossMinor: lines.reduce((sum, line) => sum + line.amountMinor, 0),
    adultUnitMinor: adultUnit,
    childUnitMinor: childUnit,
    lines,
  };
}
