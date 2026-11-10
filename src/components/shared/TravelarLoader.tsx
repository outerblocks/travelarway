import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouterState } from '@tanstack/react-router';
import travelarLogo from '@/assets/logo/travelar-logo.png';

const HOLD_MS = 1800;

const RouteWaitContext = createContext<{
  hosted: boolean;
  setHold: (id: string, on: boolean) => void;
} | null>(null);

/**
 * Corridor wait: a coach runs a timetable line. The overlay never translates
 * the page. Nodes light as the coach reaches them.
 */
export function TravelarLoader({
  message = 'Preparing your journey',
}: {
  message?: string;
}) {
  return (
    <div
      className="relative flex h-full min-h-dvh w-full items-center justify-center bg-ink"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      <div className="travelar-loader-rail" aria-hidden="true" />
      <div className="flex w-full max-w-sm flex-col items-center px-6 py-10 text-center">
        <img
          src={travelarLogo}
          alt=""
          aria-hidden="true"
          className="travelar-loader-mark h-11 w-auto object-contain brightness-0 invert"
        />
        <p className="mt-3 font-display text-2xl font-bold tracking-tight text-white">Travelar</p>

        <div className="travelar-line mt-12 w-full" aria-hidden="true">
          <span className="travelar-line-stop" />
          <span className="travelar-line-stop" />
          <span className="travelar-line-stop" />
          <span className="travelar-line-stop" />
          <span className="travelar-line-coach" />
        </div>

        <p className="mt-8 text-sm font-medium text-white">{message}</p>
      </div>
    </div>
  );
}

export function RouteWaitProvider({ children }: { children: ReactNode }) {
  const href = useRouterState({ select: (state) => state.location.href });
  const pending = useRouterState({ select: (state) => state.status === 'pending' });
  const [gate, setGate] = useState(true);
  const [holds, setHolds] = useState<Record<string, true>>({});

  const setHold = useCallback((id: string, on: boolean) => {
    setHolds((current) => {
      if (on) {
        if (current[id]) return current;
        return { ...current, [id]: true };
      }
      if (!current[id]) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  }, []);

  useEffect(() => {
    setGate(true);
    const id = window.setTimeout(() => setGate(false), HOLD_MS);
    return () => window.clearTimeout(id);
  }, [href]);

  const visible = gate || pending || Object.keys(holds).length > 0;
  const value = useMemo(() => ({ hosted: true, setHold }), [setHold]);

  useEffect(() => {
    if (!visible) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [visible]);

  return (
    <RouteWaitContext.Provider value={value}>
      {children}
      {visible ? (
        <div className="fixed inset-0 z-[70]" aria-hidden={false}>
          <TravelarLoader key={href} />
        </div>
      ) : null}
    </RouteWaitContext.Provider>
  );
}

export function useRouteWaitHold(active = true): boolean {
  const ctx = useContext(RouteWaitContext);
  const id = useId();
  useEffect(() => {
    if (!ctx) return;
    ctx.setHold(id, active);
    return () => ctx.setHold(id, false);
  }, [active, ctx, id]);
  return Boolean(ctx);
}
