import { useCallback, useEffect, useState } from 'react';
import type { FinanceMode } from '@/domain/finance-modes';

export function useHimsConsole(mode: FinanceMode, desk: 'finance' | 'admin') {
  const [overview, setOverview] = useState<{ modes: { mode: string; operators: number }[] } | null>(null);
  const [finance, setFinance] = useState<Record<string, unknown> | null>(null);
  const [movements, setMovements] = useState<unknown[]>([]);
  const [operators, setOperators] = useState<unknown[]>([]);
  const [audit, setAudit] = useState<unknown[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    void fetch('/api/hims/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ desk }),
    }).then(async (session) => {
      if (!session.ok) throw new Error('session_unavailable');
      const [overviewRes, financeRes, moveRes, opsRes, auditRes] = await Promise.all([
        fetch('/api/hims/overview', { credentials: 'same-origin' }),
        fetch(`/api/hims/finance?mode=${mode}`, { credentials: 'same-origin' }),
        fetch(`/api/hims/finance?mode=${mode}&view=movements`, { credentials: 'same-origin' }),
        fetch('/api/hims/operators', { credentials: 'same-origin' }),
        fetch(`/api/hims/audit?mode=${mode}`, { credentials: 'same-origin' }),
      ]);
      if (![overviewRes, financeRes, moveRes, opsRes, auditRes].every((row) => row.ok)) {
        throw new Error('workspace_unavailable');
      }
      const overviewBody = await overviewRes.json();
      const financeBody = await financeRes.json();
      const moveBody = await moveRes.json();
      const opsBody = await opsRes.json();
      const auditBody = await auditRes.json();
      if (cancelled) return;
      setOverview(overviewBody);
      setFinance(financeBody);
      setMovements(moveBody.data ?? []);
      setOperators(opsBody.data ?? []);
      setAudit(auditBody.data ?? []);
      setStatus('ready');
      setError('');
    }).catch((caught: Error) => {
      if (!cancelled) {
        setError(caught.message);
        setStatus('error');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [mode, desk, tick]);

  return { overview, finance, movements, operators, audit, status, error, reload };
}
