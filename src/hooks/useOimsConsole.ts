import { useCallback, useEffect, useState } from 'react';

export interface OimsOperatorRow {
  id: string;
  name: string;
}

export function useOimsConsole(mode: 'bus' | 'ferry') {
  const [operators, setOperators] = useState<OimsOperatorRow[]>([]);
  const [operatorId, setOperatorId] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetch(`/api/oims/operators?mode=${mode}`, { credentials: 'same-origin' })
      .then(async (response) => {
        const body = await response.json() as { data?: OimsOperatorRow[] };
        if (!response.ok) throw new Error('operators_unavailable');
        if (cancelled) return;
        const rows = body.data ?? [];
        setOperators(rows);
        setOperatorId((current) => (current && rows.some((row) => row.id === current) ? current : rows[0]?.id ?? null));
        if (rows.length === 0) setStatus('ready');
      })
      .catch((caught: Error) => {
        if (!cancelled) {
          setError(caught.message);
          setStatus('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  useEffect(() => {
    if (!operatorId) return;
    let cancelled = false;
    setStatus('loading');
    void fetch('/api/oims/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ operatorId, mode }),
    }).then(async (response) => {
      if (!response.ok) throw new Error('session_unavailable');
      const body = await fetch(`/api/oims/workspace?mode=${mode}`, { credentials: 'same-origin' });
      const workspaceBody = await body.json();
      if (!body.ok) throw new Error(workspaceBody.error ?? 'workspace_unavailable');
      if (!cancelled) {
        setWorkspace(workspaceBody);
        setStatus('ready');
        setError('');
      }
    }).catch((caught: Error) => {
      if (!cancelled) {
        setError(caught.message);
        setStatus('error');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [operatorId, mode, tick]);

  const reload = useCallback(() => setTick((value) => value + 1), []);

  return { operators, operatorId, setOperatorId, workspace, status, error, reload };
}
