import {
  confirmHold,
  holdSeats as holdSeatsInInventory,
  releaseHold,
  type SeatRequest,
} from '@/server/sgr/inventory';
import { getCarSeatState, getClassAvailability } from '@/server/sgr/read-models';

/**
 * The seam between Travelar and whoever actually owns the seats.
 *
 * Today that is us: TRC has not yet agreed to push inventory or answer live checks, so
 * Travelar sells from an allocated block and is authoritative for it. Tomorrow it may not
 * be, and the booking flow must not have to change when that happens. So nothing above this
 * layer knows which arrangement a trip is under — it asks for a provider and gets one.
 *
 * Two rules the implementations have to keep:
 *
 *   - **The UI depends on capabilities, never on the provider's name.** A source that can
 *     give class counts but not per-seat state must not be handed a seat map with empty
 *     cars; it gets `seatSelection: 'AUTO_ASSIGN'` and seats are named after payment.
 *   - **When an external system says a seat is gone, it is gone.** A held seat reported
 *     taken invalidates the in-flight hold and the passenger re-picks. Silently keeping a
 *     claim we no longer have is how two people arrive at the platform with the same seat.
 */

export type InventoryMode = 'ALLOCATED_BLOCK' | 'PUSH_SYNC' | 'LIVE_VERIFY';

export interface ProviderCapabilities {
  /** Can supply per-seat state, so a seat map can be drawn. */
  seatMap: boolean;
  /** Can hold a named seat. Otherwise the hold is class-level and seats are assigned later. */
  perSeatHold: boolean;
  /** Whether class counts are computed from seat state or handed over by the source. */
  classCounts: 'DERIVED' | 'PROVIDED';
}

export interface HoldRequest {
  tripId: string;
  holdKey: string;
  seats: SeatRequest[];
  fromSeq: number;
  toSeq: number;
  ttlSeconds: number;
  createdBy?: string;
}

export interface HoldResult {
  holdId: string;
  seats: SeatRequest[];
  reused: boolean;
}

export interface SgrInventoryProvider {
  readonly mode: InventoryMode;
  readonly capabilities: ProviderCapabilities;
  getClassAvailability(input: { tripId: string; fromSeq: number; toSeq: number }): ReturnType<typeof getClassAvailability>;
  getCarSeatState(input: {
    tripId: string;
    seatClassCode: string;
    fromSeq: number;
    toSeq: number;
    holdId?: string;
  }): ReturnType<typeof getCarSeatState>;
  holdSeats(request: HoldRequest): Promise<HoldResult>;
  confirmSeats(input: { holdId: string; bookingItemId: string }): Promise<{ seats: number }>;
  releaseSeats(holdId: string): Promise<{ released: number }>;
}

/**
 * Travelar holds an allocated block and is authoritative for it.
 *
 * Every capability is true because the seats are in our own tables: we can draw the map,
 * hold a named seat, and count from state rather than trusting a number someone sent us.
 */
class AllocatedBlockProvider implements SgrInventoryProvider {
  readonly mode: InventoryMode = 'ALLOCATED_BLOCK';
  readonly capabilities: ProviderCapabilities = { seatMap: true, perSeatHold: true, classCounts: 'DERIVED' };

  getClassAvailability = getClassAvailability;
  getCarSeatState = getCarSeatState;

  async holdSeats(request: HoldRequest): Promise<HoldResult> {
    // Aliased import: calling a function with the same name as the method it sits in reads as
    // recursion, and the reader should not have to know scoping rules to check that.
    const { holdId, seats, reused } = await holdSeatsInInventory(request);
    return { holdId, seats, reused };
  }

  confirmSeats = confirmHold;
  releaseSeats = releaseHold;
}

const allocatedBlock = new AllocatedBlockProvider();

/**
 * Picks the provider from the trip's recorded mode.
 *
 * Unknown modes throw rather than falling back to the allocated-block provider: selling
 * against the wrong assumption about who owns the seat is worse than refusing the request.
 */
export async function resolveProvider(tripId: string): Promise<SgrInventoryProvider> {
  const { query } = await import('@/server/db');
  const row = await query<{ inventory_mode: string }>(
    `select inventory_mode from app.sgr_trips where id = $1`,
    [tripId],
  );
  const mode = row.rows[0]?.inventory_mode;
  if (mode === undefined) throw new Error(`trip_not_found:${tripId}`);
  if (mode !== 'ALLOCATED_BLOCK') throw new Error(`inventory_mode_not_supported:${mode}`);
  return allocatedBlock;
}

export const sgrProvider = allocatedBlock;
