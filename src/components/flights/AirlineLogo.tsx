import { useEffect, useState } from 'react';
import { airlineLogoCandidates } from '@/domain/airline-logos';

export function AirlineLogo({
  code,
  fallbackCode,
  name,
  size = 'md',
}: {
  code: string;
  fallbackCode?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const candidates = airlineLogoCandidates(code, fallbackCode);
  const [skip, setSkip] = useState(0);
  const src = candidates[skip] ?? null;
  const box = size === 'lg' ? 'h-14 w-[4.75rem]' : size === 'sm' ? 'h-9 w-9' : 'h-11 w-11';
  const mark = (code || fallbackCode || '?').slice(0, 2).toUpperCase();

  useEffect(() => {
    setSkip(0);
  }, [code, fallbackCode]);

  if (!src) {
    return (
      <span className={`flex ${box} shrink-0 items-center justify-center rounded-xl bg-ink text-body font-semibold text-white`}>
        {mark}
      </span>
    );
  }

  return (
    <span className={`flex ${box} shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-white p-1`}>
      <img
        src={src}
        alt={name || mark}
        className="max-h-full max-w-full object-contain"
        onError={() => setSkip((current) => current + 1)}
      />
    </span>
  );
}
