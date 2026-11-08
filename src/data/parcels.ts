import { normalizePnr } from '@/data/operations';

/**
 * A parcel travelling on a scheduled departure. Operators manifest parcels against a
 * movement; nothing here invents one.
 */
export interface ParcelMovement {
  pnr: string;
  operatorName: string;
  routeLabel: string;
  date: string;
  status: 'in_transit' | 'at_terminal' | 'delivered';
}

/**
 * Parcel movements are recorded by the operator physically carrying the parcel. No
 * operator has manifested a parcel into this dataset yet, so the list is empty and
 * lookups report that honestly instead of showing a fabricated shipment. The API
 * replaces this array; the lookup shape stays the same.
 */
const parcelMovements: ParcelMovement[] = [];

/** Case, spacing and prefix insensitive, exactly like the booking lookup. */
export function findParcelByPnr(input: string): ParcelMovement | null {
  const wanted = normalizePnr(input);
  if (!wanted) return null;
  return parcelMovements.find((movement) => movement.pnr === wanted) ?? null;
}
