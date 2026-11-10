import { useEffect, useMemo, useState } from 'react';
import { HqConfirm, Panel, postJson, nf } from '@/pages/hq/hq-ui';

const inputClass =
  'w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-brand-500 focus:outline-none';

export function OimsOtcSection({
  mode,
  trips,
  routes,
  vessels,
  onSold,
}: {
  mode: 'bus' | 'ferry';
  trips: { id: string; serviceDate: string; routeId?: string; routeName?: string; vesselId?: string | null }[];
  routes: { id: string; name: string; stops: { id: string; locationName: string }[] }[];
  vessels: { id: string; classes?: { id: string; name: string }[] }[];
  onSold: () => void;
}) {
  const [tripId, setTripId] = useState(trips[0]?.id ?? '');
  const trip = trips.find((row) => row.id === tripId) ?? trips[0];
  const route = routes.find((row) => row.id === trip?.routeId) ?? routes[0];
  const [fromStopId, setFromStopId] = useState(route?.stops[0]?.id ?? '');
  const [toStopId, setToStopId] = useState(route?.stops[1]?.id ?? '');
  const classes = useMemo(
    () => vessels.find((row) => row.id === trip?.vesselId)?.classes ?? vessels[0]?.classes ?? [],
    [trip?.vesselId, vessels],
  );
  const [vesselClassId, setVesselClassId] = useState(classes[0]?.id ?? '');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [seats, setSeats] = useState('');
  const [quoted, setQuoted] = useState<{ grossMinor: number; currency: string } | null>(null);
  const [pnr, setPnr] = useState('');
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    setFromStopId(route?.stops[0]?.id ?? '');
    setToStopId(route?.stops[1]?.id ?? '');
    setVesselClassId(classes[0]?.id ?? '');
    setQuoted(null);
  }, [tripId, route?.id, classes[0]?.id]);

  const passengers = mode === 'bus'
    ? seats.split(',').map((seat) => seat.trim().toUpperCase()).filter(Boolean).map((seat) => ({ fullName: name, category: 'adult' as const, seatNo: seat }))
    : [{ fullName: name, category: 'adult' as const }];

  return (
    <div className="space-y-4">
      <p className="text-xs text-neutral-500">
        Walk-in cash sale for this operator’s {mode} trips only. The amount is quoted from published fares. It cannot be typed.
      </p>
      {error ? <p className="text-sm text-error-600">{error}</p> : null}
      {pnr ? <p className="text-sm font-semibold text-neutral-900">Issued PNR {pnr}. Collect cash. Reprint from bookings with a reason.</p> : null}
      <Panel title="Counter sale">
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <select className={inputClass} value={tripId} onChange={(event) => setTripId(event.target.value)}>
            {trips.map((row) => <option key={row.id} value={row.id}>{row.serviceDate} · {row.routeName ?? row.id}</option>)}
          </select>
          {mode === 'bus' ? (
            <>
              <select className={inputClass} value={fromStopId} onChange={(event) => setFromStopId(event.target.value)}>
                {(route?.stops ?? []).map((stop) => <option key={stop.id} value={stop.id}>{stop.locationName}</option>)}
              </select>
              <select className={inputClass} value={toStopId} onChange={(event) => setToStopId(event.target.value)}>
                {(route?.stops ?? []).map((stop) => <option key={stop.id} value={stop.id}>{stop.locationName}</option>)}
              </select>
              <input className={inputClass} placeholder="Seats 1A, 1B" value={seats} onChange={(event) => setSeats(event.target.value)} />
            </>
          ) : (
            <select className={inputClass} value={vesselClassId} onChange={(event) => setVesselClassId(event.target.value)}>
              {classes.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
            </select>
          )}
          <input className={inputClass} placeholder="Customer name" value={name} onChange={(event) => setName(event.target.value)} />
          <input className={inputClass} placeholder="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
        </div>
        <div className="flex items-center gap-3 px-4 pb-4">
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={() => {
              setError('');
              void postJson('/api/oims/otc', {
                action: 'quote',
                mode,
                tripId,
                fromStopId: mode === 'bus' ? fromStopId : undefined,
                toStopId: mode === 'bus' ? toStopId : undefined,
                vesselClassId: mode === 'ferry' ? vesselClassId : undefined,
                adults: passengers.length,
                children: 0,
              }).then((payload) => setQuoted(payload as { grossMinor: number; currency: string }))
                .catch((caught: Error) => setError(caught.message));
            }}
          >
            Quote
          </button>
          {quoted ? <span className="text-sm font-semibold">{nf(quoted.grossMinor, quoted.currency)}</span> : <span className="text-xs text-neutral-500">Quote before selling.</span>}
          <button type="button" className="btn-primary text-xs" disabled={!quoted} onClick={() => setConfirm(true)}>Sell cash</button>
        </div>
      </Panel>
      {confirm && quoted ? (
        <HqConfirm
          title="Issue walk-in ticket"
          consequence={`Collect ${nf(quoted.grossMinor, quoted.currency)} in cash. Travelar does not debit a PSP. A different person must approve any void.`}
          verb="Issue ticket"
          onClose={() => setConfirm(false)}
          onConfirm={() => {
            setError('');
            void postJson('/api/oims/otc', {
              mode,
              tripId,
              fromStopId: mode === 'bus' ? fromStopId : undefined,
              toStopId: mode === 'bus' ? toStopId : undefined,
              vesselClassId: mode === 'ferry' ? vesselClassId : undefined,
              seats: mode === 'bus' ? passengers.map((row) => row.seatNo) : undefined,
              customerName: name,
              customerPhone: phone,
              passengers,
            }).then((payload) => {
              setPnr(String((payload as { pnr?: string }).pnr ?? ''));
              setConfirm(false);
              setQuoted(null);
              onSold();
            }).catch((caught: Error) => setError(caught.message));
          }}
        />
      ) : null}
    </div>
  );
}

export function OimsFinanceSection({ mode }: { mode: 'bus' | 'ferry' }) {
  const [data, setData] = useState<{
    commercial: { currency: string; grossMinor: number; travelarMinor: number; operatorNetMinor: number; sales: number }[];
    channels: { channel: string; count: number; amountMinor: number }[];
    payables: { currency: string; payableMinor: number }[];
  } | null>(null);
  useEffect(() => {
    void fetch('/api/oims/finance', { credentials: 'same-origin' })
      .then((row) => row.json())
      .then(setData);
  }, [mode]);
  return (
    <div className="space-y-4">
      <p className="text-xs text-neutral-500">This operator, this mode only. Payouts are decided in HIMS.</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {(data?.commercial ?? []).map((row) => (
          <div key={row.currency} className="rounded-lg border bg-white p-4 text-sm">
            <p className="text-xs uppercase text-neutral-500">{row.currency} · {row.sales} sales</p>
            <p>Gross {nf(row.grossMinor, row.currency)}</p>
            <p>Travelar {nf(row.travelarMinor, row.currency)}</p>
            <p>Operator net {nf(row.operatorNetMinor, row.currency)}</p>
          </div>
        ))}
      </div>
      <Panel title="Channel mix">
        <ul className="divide-y px-4 text-sm">
          {(data?.channels ?? []).map((row) => (
            <li key={row.channel} className="py-2">{row.channel} · {row.count}</li>
          ))}
        </ul>
      </Panel>
      <Panel title="Payable (HQ statement)">
        <ul className="divide-y px-4 text-sm">
          {(data?.payables ?? []).map((row) => (
            <li key={row.currency} className="py-2">{nf(row.payableMinor, row.currency)}</li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

export function OimsStaffSection() {
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [invites, setInvites] = useState<{ id: string; email: string; acceptedAt: string | null }[]>([]);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [roleId, setRoleId] = useState('');
  const [acceptPath, setAcceptPath] = useState('');
  const [error, setError] = useState('');
  const load = () => {
    void fetch('/api/oims/staff', { credentials: 'same-origin' })
      .then((row) => row.json())
      .then((body: { roles?: typeof roles; invites?: typeof invites }) => {
        setRoles(body.roles ?? []);
        setInvites(body.invites ?? []);
        setRoleId((current) => current || body.roles?.[0]?.id || '');
      });
  };
  useEffect(() => { load(); }, []);
  return (
    <div className="space-y-4">
      <p className="text-xs text-neutral-500">Invite staff for this operator only. They set their own password. HQ roles cannot be assigned here.</p>
      {error ? <p className="text-sm text-error-600">{error}</p> : null}
      <Panel title="Invite">
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <input className={inputClass} placeholder="Full name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          <input className={inputClass} placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <select className={inputClass} value={roleId} onChange={(event) => setRoleId(event.target.value)}>
            {roles.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>
          <button
            type="button"
            className="btn-primary text-xs"
            onClick={() => {
              setError('');
              void postJson('/api/oims/staff', { email, displayName, roleId })
                .then((payload) => {
                  setAcceptPath(String((payload as { acceptPath?: string }).acceptPath ?? ''));
                  load();
                })
                .catch((caught: Error) => setError(caught.message));
            }}
          >
            Invite
          </button>
        </div>
        {acceptPath ? <p className="px-4 pb-3 text-sm">Accept link: <code className="break-all text-xs">{acceptPath}</code></p> : null}
      </Panel>
      <Panel title="Invites">
        <ul className="divide-y px-4 text-sm">
          {invites.map((row) => (
            <li key={row.id} className="py-2">{row.email} · {row.acceptedAt ? 'accepted' : 'pending'}</li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
