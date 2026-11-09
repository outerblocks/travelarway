import { useState } from 'react';
import { Navigate } from '@/router';
import { Pause } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { RoutePending } from '@/components/shared/RouteStates';
import { FINANCE_MODES, type FinanceMode } from '@/domain/finance-modes';
import { useHimsConsole } from '@/hooks/useHimsConsole';

const nf = (value: number, currency: string) =>
  currency === 'TZS' ? `TSh ${Math.round(value).toLocaleString()}` : `${currency} ${Math.round(value).toLocaleString()}`;

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

export function HqDashboardPage() {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<FinanceMode>('bus');
  const [desk, setDesk] = useState<'finance' | 'admin'>('finance');
  const [section, setSection] = useState<'overview' | 'finance' | 'commission' | 'payouts' | 'audit'>('overview');
  const hims = useHimsConsole(mode, desk);

  if (loading || hims.status === 'loading') return <RoutePending />;
  if (!user) return <Navigate to="/operator/hims-signin" replace />;
  if (hims.status === 'error') {
    return <div className="p-12 text-center text-sm text-error-600">{hims.error || 'HIMS finance unavailable.'}</div>;
  }

  const finance = hims.finance as {
    commercial?: { currency: string; grossMinor: number; travelarMinor: number; operatorNetMinor: number; sales: number }[];
    payments?: { status: string; currency: string; amountMinor: number; count: number }[];
    operatorPayables?: { operatorId: string; operatorName: string; currency: string; payableMinor: number }[];
    unallocated?: { currency: string; amountMinor: number }[];
    commissionRates?: { id: string; operatorId: string; operatorName: string; rate: number; approvalStatus: string; effectiveFrom: string }[];
    payouts?: { id: string; status: string; amountMinor: number; currency: string; operatorName: string; holdReason: string | null }[];
    clickpesaPayout?: string;
  } | null;
  const operators = hims.operators as { id: string; name: string; mode: string; status: string; currency: string }[];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-600">HIMS · finance control</p>
            <h1 className="text-xl font-bold text-neutral-900">Mode-isolated ledgers</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm" value={mode} onChange={(event) => setMode(event.target.value as FinanceMode)}>
              {FINANCE_MODES.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <select className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm" value={desk} onChange={(event) => setDesk(event.target.value as typeof desk)}>
              <option value="finance">Finance desk</option>
              <option value="admin">Admin desk (checker)</option>
            </select>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-4 px-6 pb-3 text-sm">
          {(['overview', 'finance', 'commission', 'payouts', 'audit'] as const).map((item) => (
            <button key={item} type="button" className={section === item ? 'font-semibold text-brand-700' : 'text-neutral-500'} onClick={() => setSection(item)}>
              {item}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        {section === 'overview' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(hims.overview?.modes ?? []).map((row) => (
              <button key={row.mode} type="button" className="rounded-lg border border-neutral-200 bg-white p-4 text-left" onClick={() => { setMode(row.mode as FinanceMode); setSection('finance'); }}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{row.mode}</p>
                <p className="mt-2 text-2xl font-bold text-neutral-900">{row.operators}</p>
                <p className="text-xs text-neutral-500">operators in this subledger. Open the mode to see money — totals are never blended.</p>
              </button>
            ))}
          </div>
        )}

        {section === 'finance' && (
          <div className="space-y-6">
            <p className="text-xs text-neutral-500">
              Subledger <strong>{mode}</strong> only. Gross is customer collections; Travelar revenue is the contracted commission; operator net is payable. ClickPesa payouts are not dispatched from this console.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {(finance?.commercial ?? []).map((row) => (
                <div key={row.currency} className="rounded-lg border border-neutral-200 bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase text-neutral-500">{row.currency} · {row.sales} sales</p>
                  <p className="mt-2 text-sm">Gross {nf(row.grossMinor, row.currency)}</p>
                  <p className="text-sm">Travelar {nf(row.travelarMinor, row.currency)}</p>
                  <p className="text-sm">Operator net {nf(row.operatorNetMinor, row.currency)}</p>
                </div>
              ))}
              {(finance?.commercial ?? []).length === 0 && (
                <p className="text-sm text-neutral-500">No recognised sales in this mode yet.</p>
              )}
            </div>
            <Panel title="Payments by status">
              <ul className="divide-y divide-neutral-100 px-4">
                {(finance?.payments ?? []).map((row) => (
                  <li key={`${row.status}-${row.currency}`} className="flex justify-between py-2 text-sm">
                    <span>{row.status} · {row.count}</span>
                    <span>{nf(row.amountMinor, row.currency)}</span>
                  </li>
                ))}
                {(finance?.payments ?? []).length === 0 && <li className="py-3 text-sm text-neutral-500">No payment attempts.</li>}
              </ul>
            </Panel>
            <Panel title="Unallocated collections">
              <ul className="px-4 py-3 text-sm">
                {(finance?.unallocated ?? []).map((row) => (
                  <li key={row.currency}>{nf(row.amountMinor, row.currency)} held until refunded</li>
                ))}
                {(finance?.unallocated ?? []).length === 0 && <li className="text-neutral-500">None.</li>}
              </ul>
            </Panel>
            <Panel title="Sale snapshots">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase text-neutral-500">
                      <th className="px-4 py-2">PNR</th>
                      <th className="px-4 py-2">Operator</th>
                      <th className="px-4 py-2">Gross</th>
                      <th className="px-4 py-2">Commission</th>
                      <th className="px-4 py-2">Operator net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(hims.movements as { pnr: string; operatorName: string; currency: string; grossMinor: number; travelarMinor: number; operatorNetMinor: number; rate: number }[]).map((row) => (
                      <tr key={row.pnr} className="border-b border-neutral-100">
                        <td className="px-4 py-2 font-mono text-xs">{row.pnr}</td>
                        <td className="px-4 py-2">{row.operatorName}</td>
                        <td className="px-4 py-2">{nf(row.grossMinor, row.currency)}</td>
                        <td className="px-4 py-2">{nf(row.travelarMinor, row.currency)} ({Math.round(Number(row.rate) * 10000) / 100}%)</td>
                        <td className="px-4 py-2">{nf(row.operatorNetMinor, row.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        )}

        {section === 'commission' && (
          <CommissionPanel mode={mode} desk={desk} operators={operators} rates={finance?.commissionRates ?? []} onSaved={hims.reload} />
        )}

        {section === 'payouts' && (
          <PayoutPanel mode={mode} desk={desk} payables={finance?.operatorPayables ?? []} payouts={finance?.payouts ?? []} onSaved={hims.reload} />
        )}

        {section === 'audit' && (
          <Panel title="HQ audit" subtitle="Immutable. Not the ledger.">
            <ul className="divide-y divide-neutral-100 px-4">
              {(hims.audit as { at: string; actor: string; action: string; objectType: string; mode: string | null }[]).map((row, index) => (
                <li key={`${row.at}-${index}`} className="py-2 text-sm">
                  <span className="font-mono text-xs text-neutral-500">{row.at}</span>
                  {' · '}{row.actor} {row.action} {row.objectType} {row.mode ?? ''}
                </li>
              ))}
              {(hims.audit as unknown[]).length === 0 && <li className="py-3 text-sm text-neutral-500">No HQ finance actions recorded.</li>}
            </ul>
          </Panel>
        )}
      </main>
    </div>
  );
}

function CommissionPanel({
  mode, desk, operators, rates, onSaved,
}: {
  mode: FinanceMode;
  desk: 'finance' | 'admin';
  operators: { id: string; name: string; mode: string }[];
  rates: { id: string; operatorName: string; rate: number; approvalStatus: string; effectiveFrom: string }[];
  onSaved: () => void;
}) {
  const partners = operators.filter((operator) => operator.mode === mode);
  const [operatorId, setOperatorId] = useState(partners[0]?.id ?? '');
  const [rate, setRate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  return (
    <div className="space-y-4">
      <p className="text-xs text-neutral-500">
        Bus and ferry commission is the rate agreed with that operator. Propose on the finance desk; approve on the admin desk. Existing bookings keep their snapshot.
      </p>
      <Panel title="Propose rate">
        <div className="grid gap-3 p-4 sm:grid-cols-4">
          <select className="rounded-md border px-3 py-2 text-sm" value={operatorId} onChange={(event) => setOperatorId(event.target.value)}>
            {partners.map((operator) => <option key={operator.id} value={operator.id}>{operator.name}</option>)}
          </select>
          <input className="rounded-md border px-3 py-2 text-sm" value={rate} onChange={(event) => setRate(event.target.value)} placeholder="Agreed share 0–1" />
          <input className="rounded-md border px-3 py-2 text-sm" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason" />
          <button
            type="button"
            className="btn-primary text-xs"
            disabled={desk !== 'finance'}
            onClick={() => {
              setError('');
              void postJson('/api/hims/commission', {
                operatorId, mode, rate: Number(rate), effectiveFrom: new Date().toISOString(), reason,
              }).then(onSaved).catch((caught: Error) => setError(caught.message));
            }}
          >
            Propose
          </button>
        </div>
        {error ? <p className="px-4 pb-3 text-sm text-error-600">{error}</p> : null}
      </Panel>
      <Panel title="Agreements">
        <ul className="divide-y divide-neutral-100 px-4">
          {rates.map((row) => (
            <li key={row.id} className="flex items-center justify-between py-2 text-sm">
              <span>{row.operatorName} · {Math.round(row.rate * 10000) / 100}% · {row.approvalStatus}</span>
              {row.approvalStatus === 'draft' && desk === 'admin' ? (
                <button type="button" className="text-xs font-semibold text-brand-700" onClick={() => { void postJson('/api/hims/commission', { action: 'approve', rateId: row.id }).then(onSaved); }}>Approve</button>
              ) : null}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function PayoutPanel({
  mode, desk, payables, payouts, onSaved,
}: {
  mode: FinanceMode;
  desk: 'finance' | 'admin';
  payables: { operatorId: string; operatorName: string; currency: string; payableMinor: number }[];
  payouts: { id: string; status: string; amountMinor: number; currency: string; operatorName: string; holdReason: string | null }[];
  onSaved: () => void;
}) {
  const [error, setError] = useState('');
  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2 text-xs text-neutral-500">
        <Pause size={14} /> Intent records the instruction. It does not call ClickPesa. Accepted is not completed.
      </p>
      <Panel title="Operator payables">
        <ul className="divide-y divide-neutral-100 px-4">
          {payables.map((row) => (
            <li key={`${row.operatorId}-${row.currency}`} className="flex items-center justify-between py-2 text-sm">
              <span>{row.operatorName} · {nf(row.payableMinor, row.currency)}</span>
              <button
                type="button"
                className="text-xs font-semibold text-brand-700"
                disabled={desk !== 'finance'}
                onClick={() => {
                  setError('');
                  void postJson('/api/hims/payouts', { mode, operatorId: row.operatorId, currency: row.currency })
                    .then(onSaved)
                    .catch((caught: Error) => setError(caught.message));
                }}
              >
                Prepare
              </button>
            </li>
          ))}
          {payables.length === 0 && <li className="py-3 text-sm text-neutral-500">No payable balance in this mode.</li>}
        </ul>
        {error ? <p className="px-4 pb-3 text-sm text-error-600">{error}</p> : null}
      </Panel>
      <Panel title="Payout batches">
        <ul className="divide-y divide-neutral-100 px-4">
          {payouts.map((row) => (
            <li key={row.id} className="flex items-center justify-between py-2 text-sm">
              <span>{row.operatorName} · {nf(row.amountMinor, row.currency)} · {row.status}{row.holdReason ? ` (${row.holdReason})` : ''}</span>
              <span className="flex gap-2">
                {row.status === 'prepared' && desk === 'admin' ? (
                  <button type="button" className="text-xs font-semibold text-brand-700" onClick={() => { void postJson('/api/hims/payouts', { action: 'approve', payoutId: row.id }).then(onSaved); }}>Approve</button>
                ) : null}
                {row.status === 'approved' ? (
                  <button type="button" className="text-xs font-semibold text-brand-700" onClick={() => { void postJson('/api/hims/payouts', { action: 'intent', payoutId: row.id }).then(onSaved); }}>Record intent</button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <h2 className="text-sm font-bold text-neutral-900">{title}</h2>
        {subtitle && <span className="text-xs text-neutral-400">{subtitle}</span>}
      </div>
      {children}
    </section>
  );
}
