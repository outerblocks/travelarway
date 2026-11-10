import { useEffect, useState } from 'react';
import { Panel } from '@/pages/hq/hq-ui';

export function HqDashboardPage() {
  const [overview, setOverview] = useState<{ modes: { mode: string; operators: number }[] } | null>(null);
  const [cases, setCases] = useState<{ id: string; kind: string; priority: string; title: string; slaDueAt: string | null }[]>([]);
  const [decisions, setDecisions] = useState<{ code: string; title: string; status: string; owner: string }[]>([]);

  useEffect(() => {
    void Promise.all([
      fetch('/api/hims/overview', { credentials: 'same-origin' }).then((row) => row.ok ? row.json() : null),
      fetch('/api/hims/cases?kind=support', { credentials: 'same-origin' }).then((row) => row.ok ? row.json() : { data: [] }),
      fetch('/api/hims/org', { credentials: 'same-origin' }).then((row) => row.ok ? row.json() : { data: [] }),
    ]).then(([overviewBody, casesBody, decisionsBody]) => {
      setOverview(overviewBody);
      setCases((casesBody as { data?: typeof cases }).data ?? []);
      setDecisions((decisionsBody as { data?: typeof decisions }).data ?? []);
    });
  }, []);

  const p1 = cases.filter((row) => row.priority === 'p1');

  return (
    <div className="space-y-6">
      <p className="text-xs text-neutral-500">
        Read-only company view. Fulfilment and GBV live in mode ledgers; this page does not edit production data.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(overview?.modes ?? []).map((row) => (
          <div key={row.mode} className="rounded-lg border border-neutral-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{row.mode}</p>
            <p className="mt-2 text-2xl font-bold text-neutral-900">{row.operators}</p>
            <p className="text-xs text-neutral-500">operators in this subledger. Money is never blended across modes.</p>
          </div>
        ))}
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Open P1</p>
          <p className="mt-2 text-2xl font-bold text-neutral-900">{p1.length}</p>
          <p className="text-xs text-neutral-500">from the work queue. Alerts only — production is not auto-paused.</p>
        </div>
      </div>
      <Panel title="Decision register" subtitle="Records, not resolved legal facts">
        <ul className="divide-y divide-neutral-100 px-4">
          {decisions.map((row) => (
            <li key={row.code} className="py-2 text-sm">
              <span className="font-mono text-xs">{row.code}</span> · {row.title} · {row.status} · {row.owner}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
