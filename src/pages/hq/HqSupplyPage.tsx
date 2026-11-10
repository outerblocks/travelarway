import { useEffect, useState } from 'react';
import { FINANCE_MODES, type FinanceMode } from '@/domain/finance-modes';
import { HqConfirm, Panel, postJson } from '@/pages/hq/hq-ui';
import { useHqSessionContext } from '@/hooks/useHqSession';

type OperatorRow = {
  id: string;
  name: string;
  mode: string;
  status: string;
  pipelineStatus: string;
  currency: string;
};

export function HqSupplyPage() {
  const { me } = useHqSessionContext();
  const canManage = Boolean(me?.permissions.includes('hq.operators.manage'));
  const canDecide = Boolean(me?.permissions.includes('hq.supply.decide'));
  const canInvite = Boolean(me?.permissions.includes('hq.operators.invite'));
  const [operators, setOperators] = useState<OperatorRow[]>([]);
  const [name, setName] = useState('');
  const [mode, setMode] = useState<FinanceMode>('bus');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [inviteOperatorId, setInviteOperatorId] = useState('');
  const [acceptPath, setAcceptPath] = useState('');
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<{ operatorId: string; pipeline: 'activate' | 'suspend' } | null>(null);
  const [dossierId, setDossierId] = useState('');
  const [dossier, setDossier] = useState<Record<string, unknown> | null>(null);

  const load = () => {
    void fetch('/api/hims/operators', { credentials: 'same-origin' })
      .then((row) => row.json())
      .then((body: { data?: OperatorRow[] }) => setOperators(body.data ?? []));
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <p className="text-xs text-neutral-500">
        Operators start as Lead. They cannot jump to Active. Invite the first OIMS admin only after Active.
      </p>
      {error ? <p className="text-sm text-error-600">{error}</p> : null}
      <Panel title="Create lead">
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          <input className="rounded-md border px-3 py-2 text-sm" placeholder="Operator legal name" value={name} onChange={(event) => setName(event.target.value)} />
          <select className="rounded-md border px-3 py-2 text-sm" value={mode} onChange={(event) => setMode(event.target.value as FinanceMode)}>
            {FINANCE_MODES.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <button
            type="button"
            className="btn-primary text-xs"
            disabled={!canManage}
            onClick={() => {
              setError('');
              void postJson('/api/hims/operators', { name, mode, countryCode: 'TZ', currency: 'TZS' })
                .then(() => { setName(''); load(); })
                .catch((caught: Error) => setError(caught.message));
            }}
          >
            Create lead
          </button>
        </div>
      </Panel>
      <Panel title="Pipeline">
        <ul className="divide-y divide-neutral-100 px-4">
          {operators.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <button type="button" className="text-left" onClick={() => {
                setDossierId(row.id);
                void fetch(`/api/hims/operators/${row.id}`, { credentials: 'same-origin' })
                  .then((response) => response.json())
                  .then((body) => setDossier(body as Record<string, unknown>));
              }}>{row.name} · {row.mode} · {row.pipelineStatus}</button>
              <span className="flex gap-2">
                {canDecide && row.pipelineStatus !== 'active' && row.pipelineStatus !== 'terminated' && row.pipelineStatus !== 'suspended' ? (
                  <button type="button" className="text-xs font-semibold text-brand-700" onClick={() => {
                    setError('');
                    void postJson('/api/hims/operators', { action: 'pipeline', pipeline: 'advance', operatorId: row.id })
                      .then(load)
                      .catch((caught: Error) => setError(caught.message));
                  }}>Advance</button>
                ) : null}
                {canDecide && (row.pipelineStatus === 'approved' || row.pipelineStatus === 'pilot') ? (
                  <button type="button" className="text-xs font-semibold text-brand-700" onClick={() => setConfirm({ operatorId: row.id, pipeline: 'activate' })}>Request activate</button>
                ) : null}
                {canDecide && row.pipelineStatus === 'active' ? (
                  <button type="button" className="text-xs font-semibold text-brand-700" onClick={() => setConfirm({ operatorId: row.id, pipeline: 'suspend' })}>Request suspend</button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
      {dossier && dossierId ? (
        <Panel title="Operator dossier (this tenant only)">
          <div className="space-y-2 p-4 text-sm">
            <p>Staff {String((dossier as { staffActive?: number }).staffActive ?? 0)} · routes {String((dossier as { routes?: number }).routes ?? 0)} · vehicles {String((dossier as { vehicles?: number }).vehicles ?? 0)} · vessels {String((dossier as { vessels?: number }).vessels ?? 0)} · published maps {String((dossier as { publishedLayouts?: number }).publishedLayouts ?? 0)}</p>
            <p>Open cases {String((dossier as { openCases?: number }).openCases ?? 0)} · last manifest {String((dossier as { lastManifestIssuedAt?: string | null }).lastManifestIssuedAt ?? 'none')}</p>
            <p>Channel mix: {((dossier as { channels?: { channel: string; count: number }[] }).channels ?? []).map((row) => `${row.channel} ${row.count}`).join(', ') || 'none'}</p>
            <ul className="text-xs text-neutral-600">
              {((dossier as { trips?: { id: string; serviceDate: string; routeName: string; booked: number; capacity: number }[] }).trips ?? []).map((trip) => (
                <li key={trip.id}>{trip.serviceDate} · {trip.routeName} · {trip.booked}/{trip.capacity}</li>
              ))}
            </ul>
          </div>
        </Panel>
      ) : null}
      <Panel title="Invite OIMS admin (Active operators only)">
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <select className="rounded-md border px-3 py-2 text-sm" value={inviteOperatorId} onChange={(event) => setInviteOperatorId(event.target.value)}>
            <option value="">Select active operator</option>
            {operators.filter((row) => row.pipelineStatus === 'active').map((row) => (
              <option key={row.id} value={row.id}>{row.name} ({row.mode})</option>
            ))}
          </select>
          <input className="rounded-md border px-3 py-2 text-sm" placeholder="Admin full name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          <input className="rounded-md border px-3 py-2 text-sm" placeholder="Admin email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <button
            type="button"
            className="btn-primary text-xs"
            disabled={!canInvite}
            onClick={() => {
              const selected = operators.find((row) => row.id === inviteOperatorId);
              setError('');
              setAcceptPath('');
              void postJson('/api/hims/invites', {
                operatorId: inviteOperatorId,
                displayName,
                email,
                mode: selected?.mode ?? '',
                countryCode: 'TZ',
                currency: selected?.currency ?? 'TZS',
              }).then((payload) => {
                setAcceptPath(String((payload as { acceptPath?: string }).acceptPath ?? ''));
                load();
              }).catch((caught: Error) => setError(caught.message));
            }}
          >
            Invite
          </button>
        </div>
        {acceptPath ? <p className="px-4 pb-3 text-sm">Accept link (copy now): <code className="break-all text-xs">{acceptPath}</code></p> : null}
      </Panel>
      {confirm ? (
        <HqConfirm
          title={confirm.pipeline === 'activate' ? 'Request activation' : 'Request suspension'}
          consequence="A different person must approve this in My work. Lead cannot become Active in one step."
          verb="Submit"
          requireReason
          onClose={() => setConfirm(null)}
          onConfirm={(reason) => {
            setError('');
            void postJson('/api/hims/operators', { action: 'pipeline', pipeline: confirm.pipeline, operatorId: confirm.operatorId, reason })
              .then(() => { setConfirm(null); load(); })
              .catch((caught: Error) => setError(caught.message));
          }}
        />
      ) : null}
    </div>
  );
}
