import { useEffect, useState } from 'react';
import { Panel, postJson } from '@/pages/hq/hq-ui';
import { useHqSessionContext } from '@/hooks/useHqSession';

export function HqOperationsPage() {
  const { me } = useHqSessionContext();
  const canCase = Boolean(me?.permissions.includes('hq.cases.manage'));
  const canView = Boolean(me?.permissions.includes('hq.operators.view'));
  const [trips, setTrips] = useState<{
    id: string; serviceDate: string; status: string; operatorName: string; mode: string; routeName: string;
    manifestIssued: boolean; booked?: number; capacity?: number; otcIssued?: number; onlineIssued?: number; operatorId?: string;
  }[]>([]);
  const [error, setError] = useState('');
  const [dossier, setDossier] = useState<{ operator?: { name: string }; staffActive?: number; openCases?: number } | null>(null);

  useEffect(() => {
    void fetch('/api/hims/tower', { credentials: 'same-origin' })
      .then((row) => row.json())
      .then((body: { data?: typeof trips }) => setTrips(body.data ?? []));
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-xs text-neutral-500">
        Today and next-day departures across operators. Inventory edits stay in OIMS. Pause-sale is an approval, not a silent write.
      </p>
      {error ? <p className="text-sm text-error-600">{error}</p> : null}
      {dossier?.operator ? (
        <Panel title={`Dossier · ${dossier.operator.name}`}>
          <p className="px-4 py-3 text-sm">Staff {dossier.staffActive ?? 0} · open cases {dossier.openCases ?? 0}. Full file is on Supply.</p>
        </Panel>
      ) : null}
      <Panel title="Control tower">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs uppercase text-neutral-500">
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Operator</th>
                <th className="px-4 py-2">Route</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Load</th>
                <th className="px-4 py-2">Channel</th>
                <th className="px-4 py-2">Manifest</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {trips.map((row) => (
                <tr key={row.id} className="border-b border-neutral-100">
                  <td className="px-4 py-2">{row.serviceDate}</td>
                  <td className="px-4 py-2">
                    {canView && row.operatorId ? (
                      <button
                        type="button"
                        className="text-left font-semibold text-brand-700"
                        onClick={() => {
                          void fetch(`/api/hims/operators/${row.operatorId}`, { credentials: 'same-origin' })
                            .then((response) => response.json())
                            .then((body) => setDossier(body as typeof dossier));
                        }}
                      >
                        {row.operatorName} · {row.mode}
                      </button>
                    ) : (
                      <>{row.operatorName} · {row.mode}</>
                    )}
                  </td>
                  <td className="px-4 py-2">{row.routeName}</td>
                  <td className="px-4 py-2">{row.status}</td>
                  <td className="px-4 py-2">{row.booked ?? 0}/{row.capacity ?? 0}</td>
                  <td className="px-4 py-2">otc {row.otcIssued ?? 0} · online {row.onlineIssued ?? 0}</td>
                  <td className="px-4 py-2">{row.manifestIssued ? 'issued' : 'missing'}</td>
                  <td className="px-4 py-2">
                    {canCase && !row.manifestIssued ? (
                      <button
                        type="button"
                        className="text-xs font-semibold text-brand-700"
                        onClick={() => {
                          setError('');
                          void postJson('/api/hims/cases', {
                            kind: 'disruption',
                            priority: 'p2',
                            title: `Manifest missing ${row.routeName} ${row.serviceDate}`,
                          }).catch((caught: Error) => setError(caught.message));
                        }}
                      >
                        Open incident
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
              {trips.length === 0 && (
                <tr><td className="px-4 py-3 text-neutral-500" colSpan={8}>No trips in the next two service days.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
