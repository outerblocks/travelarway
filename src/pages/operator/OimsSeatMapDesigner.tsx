import { useEffect, useState } from 'react';
import { CELL_TYPES, LAYOUT_PATTERNS, type CellType, type LayoutPatternId } from '@/domain/seat-cells';
import { SeatMapGrid, type SeatMapCellView, type SeatMapSeatView } from '@/components/bus/SeatMapGrid';

const inputClass =
  'w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-brand-500 focus:outline-none';

type LayoutRow = {
  id: string;
  familyId: string;
  version: number;
  name: string;
  status: string;
  visibility: string;
  rows: number;
  cols: number;
  decks?: number;
  seatCount: number;
  operatorId: string | null;
};

const TOOLS: { id: CellType; label: string }[] = CELL_TYPES.map((id) => ({
  id,
  label: id.replace('_', ' '),
}));

const PATTERNS = Object.entries(LAYOUT_PATTERNS) as [LayoutPatternId, (typeof LAYOUT_PATTERNS)[LayoutPatternId]][];

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((payload as { error?: string }).error ?? 'request_failed');
  return payload;
}

function cellKey(deck: number, row: number, col: number) {
  return `${deck}:${row}:${col}`;
}

function nextLabel(seats: SeatMapSeatView[], deck: number): string {
  const used = new Set(seats.filter((seat) => (seat.deck ?? 0) === deck).map((seat) => seat.label));
  for (let index = 1; index <= 200; index += 1) {
    const label = String(index).padStart(2, '0');
    if (!used.has(label)) return label;
  }
  return String(seats.length + 1);
}

export function OimsSeatMapDesigner({
  vehicles,
  onChanged,
}: {
  vehicles: { id: string; registration: string; seatLayoutId?: string | null }[];
  onChanged: () => void;
}) {
  const [layouts, setLayouts] = useState<LayoutRow[]>([]);
  const [layoutId, setLayoutId] = useState('');
  const [name, setName] = useState('Coach');
  const [rows, setRows] = useState(11);
  const [cols, setCols] = useState(5);
  const [decks, setDecks] = useState(1);
  const [cells, setCells] = useState<SeatMapCellView[]>([]);
  const [seats, setSeats] = useState<SeatMapSeatView[]>([]);
  const [tool, setTool] = useState<CellType>('seat');
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? '');
  const [status, setStatus] = useState('draft');
  const [error, setError] = useState('');
  const [blankName, setBlankName] = useState('Coach 2+2');
  const [pattern, setPattern] = useState<LayoutPatternId>('2+2');

  const loadList = () => {
    void fetch('/api/oims/layouts', { credentials: 'same-origin' })
      .then((row) => row.json())
      .then((body: { data?: LayoutRow[] }) => {
        setLayouts(body.data ?? []);
        setLayoutId((current) => current || body.data?.[0]?.id || '');
      });
  };

  useEffect(() => { loadList(); }, []);

  useEffect(() => {
    if (!layoutId) return;
    void fetch(`/api/oims/layouts?layoutId=${encodeURIComponent(layoutId)}`, { credentials: 'same-origin' })
      .then((row) => row.json())
      .then((body: { data?: { layout: { name: string; rows: number; cols: number; decks?: number }; cells: SeatMapCellView[]; seats: SeatMapSeatView[] } }) => {
        const map = body.data;
        if (!map) return;
        setName(map.layout.name);
        setRows(map.layout.rows);
        setCols(map.layout.cols);
        setDecks(Math.max(1, map.layout.decks ?? 1));
        setCells(map.cells);
        setSeats(map.seats.map((seat) => ({ ...seat, status: 'available' as const })));
        const meta = layouts.find((row) => row.id === layoutId);
        setStatus(meta?.status ?? 'draft');
      });
  }, [layoutId]);

  const paint = (row: number, col: number, deck: number) => {
    const key = cellKey(deck, row, col);
    setCells((current) => {
      const without = current.filter((cell) => cellKey(cell.deck ?? 0, cell.row, cell.col) !== key);
      return [...without, { deck, row, col, type: tool }];
    });
    setSeats((current) => {
      const without = current.filter((seat) => cellKey(seat.deck ?? 0, seat.row, seat.col) !== key);
      if (tool !== 'seat') return without;
      const existing = current.find((seat) => cellKey(seat.deck ?? 0, seat.row, seat.col) === key);
      if (existing) {
        const label = window.prompt('Seat label', existing.label)?.trim().toUpperCase();
        if (!label) return current;
        return current.map((seat) => (seat === existing ? { ...seat, label } : seat));
      }
      return [...without, {
        id: `draft-${key}`,
        deck,
        row,
        col,
        label: nextLabel(without, deck),
        status: 'available' as const,
        seatClass: null,
      }];
    });
  };

  return (
    <div className="mt-8 space-y-4 border-t border-neutral-100 pt-6">
      <h3 className="text-sm font-bold text-neutral-900">Seat maps</h3>
      <p className="text-xs text-neutral-500">
        Clone a library template or paint the live map. Cell types are allow-listed. HQ cannot edit this map.
      </p>
      {error ? <p className="text-sm text-error-600">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <select className={inputClass} value={layoutId} onChange={(event) => setLayoutId(event.target.value)}>
          {layouts.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name} · v{row.version} · {row.status}{row.operatorId ? '' : ' · library'}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          <input className={inputClass} value={blankName} onChange={(event) => setBlankName(event.target.value)} />
          <select className={inputClass} value={pattern} onChange={(event) => setPattern(event.target.value as LayoutPatternId)}>
            {PATTERNS.map(([id, item]) => (
              <option key={id} value={id}>{item.label}</option>
            ))}
          </select>
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={() => {
              setError('');
              void postJson('/api/oims/layouts', { action: 'blank', name: blankName, pattern })
                .then((payload) => {
                  loadList();
                  setLayoutId(String((payload as { id?: string }).id ?? ''));
                })
                .catch((caught: Error) => setError(caught.message));
            }}
          >
            Blank
          </button>
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={() => {
              setError('');
              void postJson('/api/oims/layouts', { action: 'clone', layoutId })
                .then((payload) => {
                  loadList();
                  setLayoutId(String((payload as { id?: string }).id ?? ''));
                })
                .catch((caught: Error) => setError(caught.message));
            }}
          >
            Clone
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {TOOLS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`rounded-md px-2 py-1 text-[11px] font-semibold ${tool === item.id ? 'bg-ink text-white' : 'bg-neutral-100 text-neutral-700'}`}
            onClick={() => setTool(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <SeatMapGrid
        layout={{ name, rows, cols, decks }}
        cells={cells}
        seats={seats}
        selectedLabels={[]}
        onToggleSeat={() => {}}
        editor
        onPaintCell={paint}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-secondary text-xs"
          disabled={status !== 'draft'}
          onClick={() => {
            setError('');
            const occupied = new Set(seats.map((seat) => cellKey(seat.deck ?? 0, seat.row, seat.col)));
            void postJson('/api/oims/layouts', {
              action: 'save',
              layoutId,
              name,
              rows,
              cols,
              decks,
              cells: [
                ...cells
                  .filter((cell) => cell.type !== 'seat' && !occupied.has(cellKey(cell.deck ?? 0, cell.row, cell.col)))
                  .map((cell) => ({ row: cell.row, col: cell.col, type: cell.type, deck: cell.deck })),
                ...seats.map((seat) => ({
                  row: seat.row,
                  col: seat.col,
                  type: 'seat',
                  deck: seat.deck ?? 0,
                })),
              ],
              seats: seats.map((seat) => ({ row: seat.row, col: seat.col, label: seat.label, deck: seat.deck ?? 0 })),
            }).then(loadList).catch((caught: Error) => setError(caught.message));
          }}
        >
          Save draft
        </button>
        <button
          type="button"
          className="btn-primary text-xs"
          onClick={() => {
            setError('');
            void postJson('/api/oims/layouts', { action: 'publish', layoutId })
              .then((payload) => {
                const next = String((payload as { id?: string }).id ?? layoutId);
                loadList();
                setLayoutId(next);
              })
              .catch((caught: Error) => setError(caught.message));
          }}
        >
          Publish
        </button>
        <select className={`${inputClass} max-w-xs`} value={vehicleId} onChange={(event) => setVehicleId(event.target.value)}>
          {vehicles.map((row) => <option key={row.id} value={row.id}>{row.registration}</option>)}
        </select>
        <button
          type="button"
          className="btn-secondary text-xs"
          onClick={() => {
            setError('');
            void postJson('/api/oims/layouts', { action: 'assign', vehicleId, layoutId })
              .then(onChanged)
              .catch((caught: Error) => setError(caught.message));
          }}
        >
          Assign to vehicle
        </button>
      </div>
    </div>
  );
}
