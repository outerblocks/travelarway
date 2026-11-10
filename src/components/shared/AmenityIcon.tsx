import type { ReactNode } from 'react';
import { isAmenityKey, type AmenityKey } from '@/domain/amenities';

/**
 * Coach amenity marks. Drawn as small equipment glyphs, not generic weather or bolt icons.
 */
function IconFrame({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      {children}
    </svg>
  );
}

const GLYPHS: Record<AmenityKey, ReactNode> = {
  wifi: (
    <IconFrame>
      <path d="M7.2 14.4a6.4 6.4 0 0 1 9.6 0" strokeLinecap="round" />
      <path d="M4.4 11.2a10.4 10.4 0 0 1 15.2 0" strokeLinecap="round" />
      <path d="M9.8 17.2a3.2 3.2 0 0 1 4.4 0" strokeLinecap="round" />
      <circle cx="12" cy="20" r="1.05" fill="currentColor" stroke="none" />
    </IconFrame>
  ),
  aircon: (
    <IconFrame>
      <rect x="3.5" y="6.5" width="17" height="11" rx="1.6" />
      <path d="M6.5 10.2h11M6.5 13.1h11M6.5 16h7" strokeLinecap="round" />
      <path d="M8 6.5V5.2M12 6.5V4.6M16 6.5V5.2" strokeLinecap="round" />
    </IconFrame>
  ),
  charging: (
    <IconFrame>
      <rect x="8.2" y="3.8" width="7.6" height="11.2" rx="1.2" />
      <path d="M10.2 3.8V2.4M13.8 3.8V2.4" strokeLinecap="round" />
      <path d="M12 15v3.4M9.6 20.2h4.8" strokeLinecap="round" />
    </IconFrame>
  ),
  toilet: (
    <IconFrame>
      <circle cx="12" cy="6.2" r="2.4" />
      <path d="M12 8.8v3.4M8.4 21.2 10.6 12.2h2.8l2.2 9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.8 15.4h6.4" strokeLinecap="round" />
    </IconFrame>
  ),
  reclining: (
    <IconFrame>
      <path d="M7.2 20.2V10.4c0-1.2.9-2.2 2.1-2.2h.4" strokeLinecap="round" />
      <path d="M9.3 13.4 16.8 8.6c.7-.4 1.6.1 1.6 1v7.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.2 20.2h12.8" strokeLinecap="round" />
      <circle cx="9.4" cy="6.2" r="1.5" />
    </IconFrame>
  ),
  reading_light: (
    <IconFrame>
      <path d="M12 4.2v2.2" strokeLinecap="round" />
      <path d="M8.4 9.6c0-2 1.6-3.6 3.6-3.6s3.6 1.6 3.6 3.6c0 1.5-.9 2.8-2.2 3.3v2.1H10.6v-2.1A3.6 3.6 0 0 1 8.4 9.6Z" />
      <path d="M10.6 18.4h2.8M9.4 20.4h5.2" strokeLinecap="round" />
    </IconFrame>
  ),
  snacks: (
    <IconFrame>
      <path d="M7.4 8.8c0-1.8 2-3.2 4.6-3.2s4.6 1.4 4.6 3.2v8.4c0 .9-.8 1.6-1.8 1.6H9.2c-1 0-1.8-.7-1.8-1.6Z" />
      <path d="M7.4 11.2h9.2M12 5.6V4.2" strokeLinecap="round" />
    </IconFrame>
  ),
  blanket: (
    <IconFrame>
      <path d="M5.2 8.2h9.4c2.2 0 4 1.8 4 4v5.6H9.2c-2.2 0-4-1.8-4-4Z" />
      <path d="M5.2 12.6h9.2" strokeLinecap="round" />
    </IconFrame>
  ),
};

export function AmenityIcon({ amenity }: { amenity: string; title?: string }) {
  const key = isAmenityKey(amenity) ? amenity : null;
  if (!key) return null;
  return GLYPHS[key];
}
