import { useState, type ReactNode } from 'react';

export const nf = (value: number, currency: string) =>
  currency === 'TZS' ? `TSh ${Math.round(value).toLocaleString()}` : `${currency} ${Math.round(value).toLocaleString()}`;

export async function postJson(url: string, body: unknown) {
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

export function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
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

export function HqConfirm({
  title,
  consequence,
  verb,
  requireReason,
  onConfirm,
  onClose,
}: {
  title: string;
  consequence: string;
  verb: string;
  requireReason?: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
        <h3 className="text-base font-bold text-neutral-900">{title}</h3>
        <p className="mt-2 text-sm text-neutral-600">{consequence}</p>
        {requireReason ? (
          <textarea
            className="mt-3 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-md px-3 py-1.5 text-sm text-neutral-600" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn-primary text-xs"
            disabled={Boolean(requireReason && !reason.trim())}
            onClick={() => onConfirm(reason.trim())}
          >
            {verb}
          </button>
        </div>
      </div>
    </div>
  );
}
