import type { ReactNode } from 'react';
import { AmenityIcon } from '@/components/shared/AmenityIcon';
import { isAmenityKey } from '@/domain/amenities';
import {
  stayAmenityCaption,
  stayAmenityKey,
  type StayAmenityKey,
} from '@/domain/stay-amenities';

function IconFrame({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      {children}
    </svg>
  );
}

const STAY_GLYPHS: Record<Exclude<StayAmenityKey, 'wifi' | 'aircon' | 'charging'>, ReactNode> = {
  parking: (
    <IconFrame>
      <rect x="4.2" y="4.2" width="15.6" height="15.6" rx="1.4" />
      <path d="M9 16.4V7.6h4.2c2 0 3.3 1.2 3.3 3.1S15.2 13.8 13.2 13.8H9" strokeLinecap="round" strokeLinejoin="round" />
    </IconFrame>
  ),
  pool: (
    <IconFrame>
      <path d="M4.4 16.2c1.4 0 1.4-1.4 2.8-1.4s1.4 1.4 2.8 1.4 1.4-1.4 2.8-1.4 1.4 1.4 2.8 1.4 1.4-1.4 2.8-1.4" strokeLinecap="round" />
      <path d="M4.4 19.2c1.4 0 1.4-1.4 2.8-1.4s1.4 1.4 2.8 1.4 1.4-1.4 2.8-1.4 1.4 1.4 2.8 1.4 1.4-1.4 2.8-1.4" strokeLinecap="round" />
      <path d="M7.2 13.4V8.8c0-2.2 1.8-4 4-4h.4" strokeLinecap="round" />
    </IconFrame>
  ),
  breakfast: (
    <IconFrame>
      <path d="M5.2 18.6h13.6" strokeLinecap="round" />
      <path d="M7 18.6V9.4c0-1.6 1.2-2.8 2.8-2.8h4.4c1.6 0 2.8 1.2 2.8 2.8v9.2" />
      <path d="M7 12.4h10" strokeLinecap="round" />
    </IconFrame>
  ),
};

function StayAmenityMark({ amenity }: { amenity: string }) {
  const key = stayAmenityKey(amenity);
  if (!key) return null;
  if (isAmenityKey(key)) return <AmenityIcon amenity={key} />;
  return STAY_GLYPHS[key];
}

export function StayAmenityList({
  amenities,
  lang = 'en',
  variant = 'inline',
  limit,
}: {
  amenities: string[];
  lang?: 'en' | 'sw' | 'fr';
  variant?: 'inline' | 'grid';
  limit?: number;
}) {
  const items = amenities.map((amenity) => amenity.trim()).filter(Boolean);
  const shown = limit != null ? items.slice(0, limit) : items;
  if (!shown.length) return null;

  if (variant === 'inline') {
    return (
      <ul className="stay-amenity-inline mt-3">
        {shown.map((amenity) => (
          <li key={amenity} className="stay-amenity-inline-item">
            <StayAmenityMark amenity={amenity} />
            <span>{stayAmenityCaption(amenity, lang)}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="stay-amenity-grid mt-5">
      {shown.map((amenity) => (
        <li key={amenity} className="stay-amenity-grid-item">
          <StayAmenityMark amenity={amenity} />
          <span>{stayAmenityCaption(amenity, lang)}</span>
        </li>
      ))}
    </ul>
  );
}
