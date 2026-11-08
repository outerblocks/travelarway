import { useI18n } from '@/context/I18nContext';
import { FixtureGlyph, SeatGlyph, WheelchairGlyph } from '@/components/shared/SeatGlyph';
import {
  columnsOf,
  geometryFromFixtureCoach,
  toTrainSeat,
  type GeometrySeat,
} from '@/components/train/coach-geometry';
import type { TrainCoach, TrainSeat } from '@/types';

/**
 * One SGR coach at a time, drawn from its geometry.
 *
 * This used to assume four seats across with the aisle between lanes 2 and 3, because that
 * is what Business class looks like. Royal is 2+1 and the Express Economy coaches are 3+2,
 * so the old component could not render them honestly — it would have shown a 2+1 coach with
 * an empty fourth column, or mislabeled which seat is a window.
 *
 * Geometry comes in as columns plus where the aisle falls, which is the same shape
 * `/api/sgr/trips/:tripId/classes/:classCode/cars` returns. A layout the operator publishes
 * in the database renders without touching this file.
 */

interface CoachSeatMapProps {
  /** Coaches in the order the cars run. */
  coaches: TrainCoach[];
  coachNumber: number;
  onCoachChange: (coachNumber: number) => void;
  /** Seat ids already assigned to passengers on this leg, e.g. `2-14`. */
  selectedSeatIds: string[];
  onToggleSeat: (seat: TrainSeat) => void;
  disabled?: boolean;
}

export function CoachSeatMap({
  coaches,
  coachNumber,
  onCoachChange,
  selectedSeatIds,
  onToggleSeat,
  disabled = false,
}: CoachSeatMapProps) {
  const { tp } = useI18n();
  const coach = coaches.find((candidate) => candidate.number === coachNumber) ?? coaches[0];
  if (!coach) return null;

  const geometry = geometryFromFixtureCoach(coach);
  const columns = columnsOf(geometry);
  const seatAt = (row: number, col: number | 'aisle') =>
    col === 'aisle' ? undefined : geometry.seats.find((seat) => seat.row === row && seat.col === col);
  const fixtureAt = (row: number, col: number | 'aisle') =>
    col === 'aisle' ? undefined : geometry.fixtures.find((fixture) => fixture.row === row && fixture.col === col);

  const freeCount = (candidate: TrainCoach) => candidate.seats.filter((seat) => !seat.taken).length;

  const stateClasses = (seat: GeometrySeat, selected: boolean): string => {
    if (selected) return 'text-ink';
    switch (seat.state) {
      case 'SOLD':
      case 'BLOCKED':
        return 'text-error-500/70';
      case 'HELD':
        return 'text-warning-600/80';
      case 'NOT_SELLABLE':
        return 'text-neutral-300';
      default:
        return disabled ? 'text-neutral-300' : 'text-neutral-500 hover:text-ink';
    }
  };

  const stateWord = (seat: GeometrySeat, selected: boolean): string => {
    if (selected) return tp('seatSelected');
    switch (seat.state) {
      case 'SOLD':
        return tp('seatTaken');
      case 'BLOCKED':
        return tp('seatBlocked');
      case 'HELD':
        return tp('seatHeldByOther');
      case 'NOT_SELLABLE':
        return tp('seatNotSellable');
      default:
        return tp('seatAvailable');
    }
  };

  return (
    <div className="space-y-4">
      {/* Coach strip — one slide per coach, as the operator presents it. */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label={tp('trainCoaches')}>
        {coaches.map((candidate) => {
          const isActive = candidate.number === coach.number;
          return (
            <button
              key={candidate.number}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onCoachChange(candidate.number)}
              className={`min-w-[7.5rem] shrink-0 rounded-lg border px-3 py-2 text-left transition-colors ${
                isActive
                  ? 'border-ink bg-ink text-white'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
              }`}
            >
              <span className="block text-meta font-bold">
                {tp('trainCoachLabel').replace('{number}', String(candidate.number))}
              </span>
              <span className={`block text-[11px] ${isActive ? 'text-white/70' : 'text-neutral-500'}`}>
                {candidate.className} · {freeCount(candidate)} {tp('seatsAvailableShort')}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <div className="mb-3 flex items-center justify-between gap-3 text-meta">
          <span className="font-semibold text-neutral-700">
            {tp('trainCoachLabel').replace('{number}', String(coach.number))} · {coach.className}
          </span>
          <span className="text-neutral-500">{coach.capacity} {tp('seatsLabel').toLowerCase()}</span>
        </div>

        <div className="mx-auto w-full max-w-[24rem]">
          <div
            className="grid gap-y-1.5"
            style={{
              gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${geometry.gridRows + 1}, minmax(0, 1fr))`,
              gap: '0.35rem',
            }}
            role="group"
            aria-label={`${tp('trainCoachLabel').replace('{number}', String(coach.number))} ${tp('trainSeatsAriaLabel')}`}
          >
            {/* Row 0 is the vestibule: the two WCs that face each other at the carriage end. */}
            {columns.map((column, index) => {
              const fixture = fixtureAt(0, column);
              if (fixture) {
                return (
                  <span key={`f-${index}`} className="flex items-center justify-center text-neutral-400" aria-hidden="true">
                    <FixtureGlyph kind={fixture.kind} />
                  </span>
                );
              }
              return <span key={`f-${index}`} aria-hidden="true" />;
            })}

            {Array.from({ length: geometry.gridRows }, (_, rowIndex) => rowIndex + 1).map((row) =>
              columns.map((column, colIndex) => {
                if (column === 'aisle') {
                  // Keyed by column index too: a layout with two aisles (3+2 with a centre
                  // walkway) would otherwise give React two siblings with the same key.
                  return <span key={`${row}-a-${colIndex}`} aria-hidden="true" />;
                }
                const seat = seatAt(row, column);
                if (!seat) {
                  // A position the layout does not fill. Kept as space rather than painted
                  // as a seat, so a 2+1 coach does not look like it has a fourth seat.
                  return <span key={`${row}-${colIndex}`} aria-hidden="true" />;
                }

                const selected = selectedSeatIds.includes(seat.seatId);
                const takeable = seat.state === 'AVAILABLE' || selected;

                return (
                  <button
                    key={seat.seatId}
                    type="button"
                    onClick={() => onToggleSeat(toTrainSeat(coach, seat))}
                    disabled={!takeable || disabled}
                    aria-pressed={selected}
                    aria-label={`${tp('trainSeatLabel')} ${seat.seatLabel} · ${stateWord(seat, selected)}`}
                    className={`flex aspect-square items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${stateClasses(seat, selected)} ${
                      takeable && !disabled ? '' : 'cursor-not-allowed'
                    }`}
                  >
                    {seat.wheelchair ? (
                      <WheelchairGlyph label={seat.seatLabel} selected={selected} />
                    ) : (
                      <SeatGlyph label={seat.seatLabel} selected={selected} />
                    )}
                  </button>
                );
              }),
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-meta text-neutral-600">
          <span className="flex items-center gap-1.5 text-neutral-500">
            <span className="inline-block h-3 w-3 rounded-sm bg-current" /> {tp('seatAvailable')}
          </span>
          <span className="flex items-center gap-1.5 text-ink">
            <span className="inline-block h-3 w-3 rounded-sm bg-current" /> {tp('seatYours')}
          </span>
          <span className="flex items-center gap-1.5 text-error-500/70">
            <span className="inline-block h-3 w-3 rounded-sm bg-current" /> {tp('seatTaken')}
          </span>
          <span className="flex items-center gap-1.5 text-warning-600/80">
            <span className="inline-block h-3 w-3 rounded-sm bg-current" /> {tp('seatHeldByOther')}
          </span>
          <span className="flex items-center gap-1.5 text-neutral-300">
            <span className="inline-block h-3 w-3 rounded-sm bg-current" /> {tp('seatNotSellable')}
          </span>
        </div>
      </div>
    </div>
  );
}
