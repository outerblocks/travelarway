import { useEffect, useState } from 'react';
import { Panel, postJson } from '@/pages/hq/hq-ui';
import { useHqSessionContext } from '@/hooks/useHqSession';

export function HqQueuePage({ kind, title }: { kind: string; title: string }) {
  const { me } = useHqSessionContext();
  const canManage = Boolean(me?.permissions.includes('hq.cases.manage'));
  const [rows, setRows] = useState<{ id: string; title: string; priority: string; status: string }[]>([]);
  const [newTitle, setNewTitle] = useState('');

  const load = () => {
    void fetch(`/api/hims/cases?kind=${encodeURIComponent(kind)}`, { credentials: 'same-origin' })
      .then((row) => row.json())
      .then((body: { data?: typeof rows }) => setRows(body.data ?? []));
  };
  useEffect(() => { load(); }, [kind]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-neutral-500">{title} queue. First wave is intake only — no department-specific engine yet.</p>
      {canManage ? (
        <div className="flex gap-2">
          <input className="flex-1 rounded-md border px-3 py-2 text-sm" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Case title" />
          <button
            type="button"
            className="btn-primary text-xs"
            onClick={() => {
              void postJson('/api/hims/cases', { kind, priority: 'p3', title: newTitle }).then(() => { setNewTitle(''); load(); });
            }}
          >
            Open
          </button>
        </div>
      ) : null}
      <Panel title={title}>
        <ul className="divide-y divide-neutral-100 px-4">
          {rows.map((row) => (
            <li key={row.id} className="py-2 text-sm">{row.priority.toUpperCase()} · {row.title} · {row.status}</li>
          ))}
          {rows.length === 0 && <li className="py-3 text-sm text-neutral-500">Empty queue.</li>}
        </ul>
      </Panel>
    </div>
  );
}
