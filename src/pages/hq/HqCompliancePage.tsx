import { useEffect, useState } from 'react';
import { Panel, postJson } from '@/pages/hq/hq-ui';
import { useHqSessionContext } from '@/hooks/useHqSession';

export function HqCompliancePage() {
  const { me } = useHqSessionContext();
  const canCase = Boolean(me?.permissions.includes('hq.cases.manage'));
  const [rows, setRows] = useState<{
    id: string;
    name: string;
    mode: string;
    pipelineStatus: string;
    licenceHealth: string;
    licenceValidTo: string | null;
    latraLicenceNumber: string | null;
    tasacLicenceNumber: string | null;
  }[]>([]);
  const [pos, setPos] = useState<{
    markets: { countryCode: string; name: string; status: string; currency: string }[];
    merchants: { countryCode: string; providerCode: string; status: string; currency: string; note: string }[];
  }>({ markets: [], merchants: [] });

  useEffect(() => {
    void fetch('/api/hims/compliance', { credentials: 'same-origin' })
      .then((row) => row.json())
      .then((body: { data?: typeof rows; pos?: typeof pos }) => {
        setRows(body.data ?? []);
        if (body.pos) setPos(body.pos);
      });
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-xs text-neutral-500">
        Licence and document expiry queue. These are operator records, not a LATRA or PDPC approval claim.
      </p>
      <Panel title="Point of sale licences">
        <ul className="divide-y divide-neutral-100 px-4">
          {pos.markets.map((market) => (
            <li key={market.countryCode} className="py-2 text-sm">
              {market.name} · {market.countryCode} · {market.currency} · {market.status}
            </li>
          ))}
        </ul>
        <ul className="divide-y divide-neutral-100 border-t border-neutral-100 px-4">
          {pos.merchants.map((merchant) => (
            <li key={`${merchant.countryCode}-${merchant.providerCode}-${merchant.currency}`} className="py-2 text-sm">
              {merchant.countryCode} · {merchant.providerCode} · {merchant.currency} · {merchant.status}
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Expiry queue">
        <ul className="divide-y divide-neutral-100 px-4">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                {row.name} · {row.mode} · {row.licenceHealth}
                {row.licenceValidTo ? ` · ${row.licenceValidTo}` : ' · no date'}
              </span>
              {canCase && row.licenceHealth !== 'current' ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-brand-700"
                  onClick={() => {
                    void postJson('/api/hims/cases', {
                      kind: 'compliance',
                      priority: row.licenceHealth === 'expired' ? 'p1' : 'p3',
                      title: `Licence ${row.licenceHealth} ${row.name}`,
                      operatorId: row.id,
                    });
                  }}
                >
                  Open DSAR/compliance case
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
