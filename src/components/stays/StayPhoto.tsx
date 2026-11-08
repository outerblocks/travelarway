import { useState } from 'react';
import { useI18n } from '@/context/I18nContext';

export function StayPhoto({
  urls,
  name,
  className = '',
}: {
  urls: string[];
  name: string;
  className?: string;
}) {
  const { tp } = useI18n();
  const [index, setIndex] = useState(0);
  const https = urls.filter((url) => url.startsWith('https://'));
  const src = https[index] ?? null;
  const initial = (name.trim()[0] || 'T').toUpperCase();

  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-ink text-3xl font-semibold text-white ${className}`} aria-hidden="true">
        {initial}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`${name} ${tp('propertyPhoto')}`}
      className={`object-cover ${className}`}
      onError={() => setIndex((current) => current + 1)}
    />
  );
}
