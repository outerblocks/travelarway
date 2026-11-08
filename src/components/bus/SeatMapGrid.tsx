import { DoorOpen, Droplets } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { SeatGlyph } from '@/components/shared/SeatGlyph';

/**
 * Renders a seat map from the database, not from a generated pattern.
 *
 * Geometry comes from `rows`/`cols` plus explicit cells: a toilet, a middle door or a
 * blocked space occupies a position instead of a seat. Front of the bus is the top row,
 * and column order is left to right as the operator configured it.
 *
 * Seats currently carry their label; state comes from the trip, never from the template.
 */

export interface SeatMapCellView {
  deck: number;
  row: number;
  col: number;
  type: string;
}

export interface SeatMapSeatView {
  id: string;
  row: number;
  col: number;
  label: string;
  status: 'available' | 'held' | 'booked';
  seatClass: string | null;
}

export interface SeatMapLayoutView {
  name: string;
  rows: number;
  cols: number;
}

interface SeatMapGridProps {
  layout: SeatMapLayoutView;
  cells: SeatMapCellView[];
  seats: SeatMapSeatView[];
  selectedLabels: string[];
  onToggleSeat: (seat: SeatMapSeatView) => void;
  disabled?: boolean;
}

const CELL_ICONS: Record<string, typeof DoorOpen> = {
  door_front: DoorOpen,
  door_mid: DoorOpen,
  toilet: Droplets,
};

/** A real steering wheel, not a bus icon: rim, hub and spokes. */
function SteeringWheel() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="2.2" />
      <path d="M3.7 10.4c5.4-1.9 11.2-1.9 16.6 0" strokeLinecap="round" />
      <path d="M12 14.2V20.5" strokeLinecap="round" />
    </svg>
  );
}

export function SeatMapGrid({
  layout,
  cells,
  seats,
  selectedLabels,
  onToggleSeat,
  disabled = false,
}: SeatMapGridProps) {
  const { tp } = useI18n();

  const cellsByPosition = new Map(cells.map((cell) => [`${cell.row}:${cell.col}`, cell]));
  const seatsByPosition = new Map(seats.map((seat) => [`${seat.row}:${seat.col}`, seat]));
  const rows = Array.from({ length: layout.rows + 1 }, (_, index) => index);
  const cols = Array.from({ length: layout.cols }, (_, index) => index + 1);

  return (
    <div
      className="mx-auto w-full max-w-sm rounded-2xl border border-neutral-200 bg-neutral-50 p-3"
      style={{ display: 'grid', gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))`, gap: '0.4rem' }}
      aria-label={layout.name}
    >
      {rows.map((row) =>
        cols.map((col) => {
          const key = `${row}:${col}`;
          const cell = cellsByPosition.get(key);
          const seat = seatsByPosition.get(key);

          if (seat) {
            const selected = selectedLabels.includes(seat.label);
            const unavailable = seat.status !== 'available';
            const blocked = unavailable || disabled;

            const stateText = selected
              ? 'bg-ink text-white'
              : seat.status === 'booked'
                ? 'text-error-600'
                : seat.status === 'held'
                  ? 'text-warning-700'
                  : 'text-neutral-700 hover:bg-brand-50';

            return (
              <button
                key={key}
                type="button"
                onClick={() => onToggleSeat(seat)}
                disabled={blocked && !selected}
                aria-pressed={selected}
                aria-label={`${tp('seatLabel')} ${seat.label} ${
                  seat.status === 'booked'
                    ? tp('seatOccupied')
                    : seat.status === 'held'
                      ? tp('seatTaken')
                      : selected
                        ? tp('seatSelected')
                        : tp('seatAvailable')
                }`}
                className={`flex h-10 items-center justify-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${stateText} ${
                  blocked && !selected ? 'cursor-not-allowed' : ''
                }`}
              >
                <SeatGlyph label={seat.label} selected={selected} />
              </button>
            );
          }

          if (cell?.type === 'driver') {
            return (
              <span
                key={key}
                className="flex h-10 items-center justify-center rounded-md bg-neutral-200 text-neutral-600"
                title="driver"
                aria-hidden="true"
              >
                <SteeringWheel />
              </span>
            );
          }

          if (cell) {
            const Icon = CELL_ICONS[cell.type];
            if (Icon) {
              return (
                <span
                  key={key}
                  className="flex h-10 items-center justify-center rounded-md bg-neutral-200 text-neutral-500"
                  title={cell.type}
                  aria-hidden="true"
                >
                  <Icon size={14} />
                </span>
              );
            }
          }

          // Aisle, empty and anything unconfigured occupy space without rendering content.
          return <span key={key} aria-hidden="true" />;
        }),
      )}
    </div>
  );
}
