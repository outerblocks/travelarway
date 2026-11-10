import { useEffect, useState } from 'react';
import { HqConfirm, Panel, postJson } from '@/pages/hq/hq-ui';
import { useHqSessionContext } from '@/hooks/useHqSession';

export function HqWorkPage() {
  const { me } = useHqSessionContext();
  const canDecide = Boolean(me?.permissions.includes('hq.approvals.decide'));
  const [approvals, setApprovals] = useState<{ id: string; kind: string; objectId: string; maker: string; reason: string | null; createdAt: string }[]>([]);
  const [cases, setCases] = useState<{ id: string; kind: string; priority: string; title: string; slaDueAt: string | null; status: string; pnr?: string }[]>([]);
  const [pending, setPending] = useState<{ id: string } | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    void Promise.all([
      canDecide
        ? fetch('/api/hims/approvals', { credentials: 'same-origin' }).then((row) => row.ok ? row.json() : { data: [] })
        : Promise.resolve({ data: [] }),
      fetch('/api/hims/cases', { credentials: 'same-origin' }).then((row) => row.ok ? row.json() : { data: [] }),
    ]).then(([approvalBody, caseBody]) => {
      setApprovals((approvalBody as { data?: typeof approvals }).data ?? []);
      setCases((caseBody as { data?: typeof cases }).data ?? []);
    });
  };

  useEffect(() => {
    load();
  }, [canDecide]);

  return (
    <div className="space-y-6">
      <p className="text-xs text-neutral-500">Approvals, cases and SLA breaches. The same person cannot approve their own item.</p>
      {error ? <p className="text-sm text-error-600">{error}</p> : null}
      {canDecide ? (
        <Panel title="Approvals inbox">
          <ul className="divide-y divide-neutral-100 px-4">
            {approvals.map((row) => (
              <li key={row.id} className="flex items-center justify-between py-2 text-sm">
                <span>{row.kind} · {row.objectId} · {row.maker}{row.reason ? ` · ${row.reason}` : ''}</span>
                <button type="button" className="text-xs font-semibold text-brand-700" onClick={() => setPending({ id: row.id })}>Decide</button>
              </li>
            ))}
            {approvals.length === 0 && <li className="py-3 text-sm text-neutral-500">No open approvals.</li>}
          </ul>
        </Panel>
      ) : null}
      <Panel title="Cases">
        <ul className="divide-y divide-neutral-100 px-4">
          {cases.map((row) => (
            <li key={row.id} className="flex justify-between py-2 text-sm">
              <span>{row.priority.toUpperCase()} · {row.kind} · {row.title}{row.pnr ? ` · ${row.pnr}` : ''}</span>
              <span className="text-neutral-500">{row.status}{row.slaDueAt ? ` · due ${row.slaDueAt}` : ''}</span>
            </li>
          ))}
          {cases.length === 0 && <li className="py-3 text-sm text-neutral-500">No cases.</li>}
        </ul>
      </Panel>
      {pending ? (
        <HqConfirm
          title="Decide approval"
          consequence="This records the checker, reason and outcome. It cannot be undone from this inbox."
          verb="Approve"
          requireReason
          onClose={() => setPending(null)}
          onConfirm={(reason) => {
            setError('');
            void postJson('/api/hims/approvals', { id: pending.id, decision: 'approved', reason })
              .then(() => { setPending(null); load(); })
              .catch((caught: Error) => setError(caught.message));
          }}
        />
      ) : null}
    </div>
  );
}
