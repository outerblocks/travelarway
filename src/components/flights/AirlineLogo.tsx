import { useState } from 'react';
import { airlineLogoSrc } from '@/domain/airline-logos';

export function AirlineLogo({
  code,
  name,
  size = 'md',
}: {
  code: string;
  name?: string | null;
  size?: 'sm' | 'md';
}) {
  const [failed, setFailed] = useState(false);
  const src = airlineLogoSrc(code);
  const box = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const mark = (code || '?').slice(0, 2).toUpperCase();

  if (!src || failed) {
    return (
      <span className={`flex ${box} shrink-0 items-center justify-center bg-ink text-body font-semibold text-white`}>
        {mark}
      </span>
    );
  }

  return (
    <span className={`flex ${box} shrink-0 items-center justify-center bg-white p-1 ring-1 ring-neutral-300`}>
      <img
        src={src}
        alt={name || mark}
        className="max-h-full max-w-full object-contain"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
