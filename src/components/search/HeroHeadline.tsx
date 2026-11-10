import { useEffect, useState } from 'react';
import { useI18n, type PublicTranslationKey } from '@/context/I18nContext';

const LINES: { key: PublicTranslationKey; motion: string }[] = [
  { key: 'whereToNext', motion: 'hero-motion-rise' },
  { key: 'heroLineBus', motion: 'hero-motion-slide-right' },
  { key: 'heroLineFerry', motion: 'hero-motion-float' },
  { key: 'heroLineFlight', motion: 'hero-motion-lift' },
  { key: 'heroLineTrain', motion: 'hero-motion-slide-left' },
  { key: 'heroLineStay', motion: 'hero-motion-fade' },
  { key: 'heroLineExperience', motion: 'hero-motion-pop' },
];

export function HeroHeadline() {
  const { tp } = useI18n();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % LINES.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, []);

  const line = LINES[index] ?? LINES[0];

  return (
    <h1
      aria-live="polite"
      className="hero-heading max-w-full text-[1.75rem] font-medium leading-none tracking-[-0.02em] text-white sm:text-[2rem] lg:text-[2.25rem]"
    >
      <span key={`${line.key}-${index}`} className={`hero-line ${line.motion}`}>
        {tp(line.key)}
      </span>
    </h1>
  );
}
