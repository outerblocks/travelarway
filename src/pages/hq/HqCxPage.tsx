import { useEffect, useState } from 'react';
import { HqConfirm, Panel, nf, postJson } from '@/pages/hq/hq-ui';
import { useHqSessionContext } from '@/hooks/useHqSession';

export function HqCxPage() {
  const { me } = useHqSessionContext();
  const canManage = Boolean(me?.permissions.includes('hq.cases.manage'));
  const canRefund = Boolean(me?.permissions.includes('hq.finance.view') && me?.permissions.includes('hq.cases.manage'));
  const canEscalate = Boolean(me?.permissions.includes('hq.cases.escalate'));
  const [pnr, setPnr] = useState('');
  const [booking, setBooking] = useState<{ id: string; pnr: string; status: string; totalMinor: number; currency: string; operatorName: string } | null>(null);
  const [cases, setCases] = useState<{ id: string; title: string; priority: string; status: string; pnr?: string }[]>([]);
  const [error, setError] = useState('');
  const [refundOpen, setRefundOpen] = useState(false);

  const load = () => {
    void fetch('/api/hims/cases?kind=support', { credentials: 'same-origin' })
      .then((row) => row.json())
      .then((body: { data?: typeof cases }) => setCases(body.data ?? []));
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <p className="text-xs text-neutral-500">
        Lookup a booking by PNR. L1 opens a case. L2 submits a refund approval using the quoted total — the amount is never typed.
      </p>
      {error ? <p className="text-sm text-error-600">{error}</p> : null}
      <Panel title="Booking lookup">
        <div className="flex flex-wrap gap-2 p-4">
          <input className="rounded-md border px-3 py-2 text-sm" placeholder="PNR" value={pnr} onChange={(event) => setPnr(event.target.value)} />
          <button
            type="button"
            className="btn-primary text-xs"
            onClick={() => {
              setError('');
              void fetch(`/api/hims/booking?pnr=${encodeURIComponent(pnr)}`, { credentials: 'same-origin' })
                .then(async (response) => {
                  if (!response.ok) throw new Error('not_found');
                  setBooking(await response.json());
                })
                .catch((caught: Error) => setError(caught.message));
            }}
          >
            Lookup
          </button>
        </div>
        {booking ? (
          <div className="space-y-2 px-4 pb-4 text-sm">
            <p>{booking.pnr} · {booking.operatorName} · {booking.status} · {nf(booking.totalMinor, booking.currency)}</p>
            <div className="flex gap-2">
              {canManage ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-brand-700"
                  onClick={() => {
                    void postJson('/api/hims/cases', {
                      kind: 'support',
                      priority: 'p3',
                      title: `CX ${booking.pnr}`,
                      bookingId: booking.id,
                    }).then(load).catch((caught: Error) => setError(caught.message));
                  }}
                >
                  Open case
                </button>
              ) : null}
              {canRefund ? (
                <button type="button" className="text-xs font-semibold text-brand-700" onClick={() => setRefundOpen(true)}>
                  Request refund (quoted)
                </button>
              ) : (
                <span className="text-xs text-neutral-400">Ticket and price are read-only on L1.</span>
              )}
            </div>
          </div>
        ) : null}
      </Panel>
      <Panel title="CX queue">
        <ul className="divide-y divide-neutral-100 px-4">
          {cases.map((row) => (
            <li key={row.id} className="flex justify-between py-2 text-sm">
              <span>{row.priority.toUpperCase()} · {row.title}</span>
              {canEscalate ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-brand-700"
                  onClick={() => {
                    void postJson('/api/hims/cases', { action: 'escalate', caseId: row.id, severity: 'p1' }).then(load);
                  }}
                >
                  Escalate
                </button>
              ) : null}
            </li>
          ))}
          {cases.length === 0 && <li className="py-3 text-sm text-neutral-500">No CX cases.</li>}
        </ul>
      </Panel>
      {refundOpen && booking ? (
        <HqConfirm
          title="Submit refund approval"
          consequence={`Quoted amount ${nf(booking.totalMinor, booking.currency)} from the booking. You cannot type a different amount, and you cannot approve this yourself.`}
          verb="Submit"
          requireReason
          onClose={() => setRefundOpen(false)}
          onConfirm={(reason) => {
            setError('');
            void postJson('/api/hims/cases', { action: 'refund', bookingId: booking.id, reason })
              .then(() => { setRefundOpen(false); load(); })
              .catch((caught: Error) => setError(caught.message));
          }}
        />
      ) : null}
    </div>
  );
}
