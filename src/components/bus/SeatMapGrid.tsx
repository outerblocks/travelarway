import { useEffect, useState } from 'react';
import { ArrowUpDown, Briefcase, Coffee, DoorOpen, Droplets } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { SeatGlyph } from '@/components/shared/SeatGlyph';
import { FACILITY_CAPTION } from '@/domain/seat-cells';

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
  deck?: number;
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
  decks?: number;
}

interface SeatMapGridProps {
  layout: SeatMapLayoutView;
  cells: SeatMapCellView[];
  seats: SeatMapSeatView[];
  selectedLabels: string[];
  onToggleSeat: (seat: SeatMapSeatView) => void;
  disabled?: boolean;
  editor?: boolean;
  onPaintCell?: (row: number, col: number, deck: number) => void;
}

const CELL_ICONS: Record<string, typeof DoorOpen> = {
  door_front: DoorOpen,
  door_mid: DoorOpen,
  toilet: Droplets,
  stairs: ArrowUpDown,
  luggage: Briefcase,
  galley: Coffee,
};

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
  editor = false,
  onPaintCell,
}: SeatMapGridProps) {
  const { tp } = useI18n();
  const deckCount = Math.max(1, layout.decks ?? 1);
  const [deck, setDeck] = useState(0);
  useEffect(() => {
    if (deck >= deckCount) setDeck(0);
  }, [deck, deckCount]);

  const cellsByPosition = new Map(
    cells.filter((cell) => (cell.deck ?? 0) === deck).map((cell) => [`${cell.row}:${cell.col}`, cell]),
  );
  const seatsByPosition = new Map(
    seats.filter((seat) => (seat.deck ?? 0) === deck).map((seat) => [`${seat.row}:${seat.col}`, seat]),
  );
  const rows = Array.from({ length: layout.rows + 1 }, (_, index) => index);
  const cols = Array.from({ length: layout.cols }, (_, index) => index + 1);

  const paint = (row: number, col: number, seat?: SeatMapSeatView) => {
    if (editor && onPaintCell) onPaintCell(row, col, deck);
    else if (seat) onToggleSeat(seat);
  };

  return (
    <div className="mx-auto w-full max-w-sm">
      {deckCount > 1 ? (
        <div className="mb-2 flex gap-1">
          {Array.from({ length: deckCount }, (_, index) => (
            <button
              key={index}
              type="button"
              className={`flex-1 rounded-md px-2 py-1 text-[11px] font-semibold ${
                deck === index ? 'bg-ink text-white' : 'bg-neutral-100 text-neutral-700'
              }`}
              onClick={() => setDeck(index)}
            >
              {index === 0 ? 'Lower deck' : 'Upper deck'}
            </button>
          ))}
        </div>
      ) : null}
      <div
        className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))`, gap: '0.4rem' }}
        aria-label={`${layout.name}${deckCount > 1 ? `, ${deck === 0 ? 'lower' : 'upper'} deck` : ''}`}
      >
        {rows.map((row) =>
          cols.map((col) => {
            const key = `${row}:${col}`;
            const cell = cellsByPosition.get(key);
            const seat = seatsByPosition.get(key);

            if (seat) {
              const selected = selectedLabels.includes(seat.label);
              const unavailable = !editor && seat.status !== 'available';
              const blocked = unavailable || (!editor && disabled);

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
                  onClick={() => paint(row, col, seat)}
                  disabled={blocked && !selected}
                  aria-pressed={selected}
                  aria-label={`${tp('seatLabel')} ${seat.label}`}
                  className={`flex h-10 items-center justify-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${stateText} ${
                    blocked && !selected ? 'cursor-not-allowed' : ''
                  }`}
                >
                  <SeatGlyph label={seat.label} selected={selected} />
                </button>
              );
            }

            if (cell?.type === 'driver') {
              return editor ? (
                <button
                  key={key}
                  type="button"
                  onClick={() => paint(row, col)}
                  className="flex h-10 flex-col items-center justify-center rounded-md bg-neutral-200 text-[9px] font-semibold uppercase text-neutral-600"
                >
                  <SteeringWheel />
                </button>
              ) : (
                <span
                  key={key}
                  className="flex h-10 items-center justify-center rounded-md bg-neutral-200 text-neutral-600"
                  title="driver"
                >
                  <SteeringWheel />
                </span>
              );
            }

            const caption = cell ? FACILITY_CAPTION[cell.type] : null;
            const Icon = cell ? CELL_ICONS[cell.type] : undefined;
            if (caption) {
              const body = (
                <>
                  {Icon ? <Icon size={12} /> : null}
                  <span className="leading-none">{caption}</span>
                </>
              );
              const className = 'flex h-10 flex-col items-center justify-center gap-0.5 rounded-md bg-neutral-200 px-0.5 text-[8px] font-semibold uppercase tracking-wide text-neutral-600';
              return editor ? (
                <button key={key} type="button" onClick={() => paint(row, col)} className={className}>
                  {body}
                </button>
              ) : (
                <span key={key} className={className} title={cell?.type}>{body}</span>
              );
            }

            if (editor) {
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => paint(row, col)}
                  className="h-10 rounded-md border border-dashed border-neutral-200"
                  aria-label={`cell ${row},${col}`}
                />
              );
            }

            return <span key={key} aria-hidden="true" />;
          }),
        )}
      </div>
    </div>
  );
}
