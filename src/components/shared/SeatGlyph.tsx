/**
 * The seat itself, shared by every map on the site.
 *
 * Bus, ferry and train all draw the same armchair so that "selected" and "taken" mean the
 * same thing screen to screen. It was duplicated per page once already and the copies
 * drifted — the train map rendered numbered boxes while the bus rendered this — so there is
 * now one file to change.
 *
 * Orientation contract: the front of the vehicle is the TOP of the grid, so a seated
 * passenger faces up and the backrest is drawn at the BOTTOM. Putting the backrest at the
 * top makes every passenger in the map sit facing backwards.
 *
 * Colour comes from the parent's `currentColor`, so state styling stays with the button and
 * the glyph stays themeable.
 */

interface SeatGlyphProps {
  label: string;
  selected: boolean;
}

export function SeatGlyph({ label, selected }: SeatGlyphProps) {
  return (
    <svg viewBox="0 0 32 32" className="h-9 w-9" aria-hidden="true">
      <g
        fill="currentColor"
        fillOpacity={selected ? 1 : 0.14}
        stroke="currentColor"
        strokeOpacity={selected ? 1 : 0.55}
        strokeWidth="1.2"
        strokeLinejoin="round"
      >
        {/* Backrest, at the rear of the occupant. */}
        <rect x="7" y="21.5" width="18" height="8" rx="3.5" />
        {/* Armrests. */}
        <rect x="2.5" y="10" width="4.5" height="12" rx="2.2" />
        <rect x="25" y="10" width="4.5" height="12" rx="2.2" />
        {/* Cushion: flat at the backrest, rounded at the front edge. */}
        <path d="M7 20h18v-7.5a4.5 4.5 0 0 0-4.5-4.5h-9A4.5 4.5 0 0 0 7 12.5z" />
      </g>
      <text
        x="16"
        y="27.6"
        textAnchor="middle"
        fontSize="6.5"
        fontWeight="700"
        fill={selected ? '#ffffff' : 'currentColor'}
      >
        {label}
      </text>
    </svg>
  );
}

/**
 * A wheelchair space: the space itself rather than a chair in it.
 *
 * Drawn differently on purpose. A passenger who needs one is checking whether the space is
 * there, and an armchair icon with a number beside it reads like an ordinary seat.
 */
export function WheelchairGlyph({ label, selected }: SeatGlyphProps) {
  return (
    <svg viewBox="0 0 32 32" className="h-9 w-9" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="13" cy="20.5" r="6.5" strokeOpacity={selected ? 1 : 0.7} />
        <circle cx="17.5" cy="6.5" r="2.4" fill="currentColor" stroke="none" />
        <path d="M17.5 10.5v6.5h5.5" fill="none" />
        <path d="M23 17l2.5 6" fill="none" />
      </g>
      <text
        x="16"
        y="31"
        textAnchor="middle"
        fontSize="5.5"
        fontWeight="700"
        fill="currentColor"
      >
        {label}
      </text>
    </svg>
  );
}

/** Something that occupies a seat position but is not a seat. */
export function FixtureGlyph({ kind }: { kind: 'wc' | 'door' | 'luggage' | 'table' }) {
  if (kind === 'door') {
    return (
      <svg viewBox="0 0 32 32" className="h-9 w-9" aria-hidden="true">
        <rect x="5" y="6" width="22" height="20" rx="2" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.2" />
        <path d="M16 6v20" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.2" />
        <path d="M12.5 14v4M19.5 14v4" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === 'luggage') {
    return (
      <svg viewBox="0 0 32 32" className="h-9 w-9" aria-hidden="true">
        <rect x="7" y="11" width="18" height="14" rx="2" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.2" />
        <path d="M13 11V8h6v3" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.2" />
      </svg>
    );
  }

  if (kind === 'table') {
    return (
      <svg viewBox="0 0 32 32" className="h-9 w-9" aria-hidden="true">
        <rect x="8" y="12" width="16" height="10" rx="1.5" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" className="h-9 w-9" aria-hidden="true">
      <rect x="8" y="8" width="16" height="16" rx="3" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.2" />
      <text x="16" y="19" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor" fillOpacity="0.8">
        WC
      </text>
    </svg>
  );
}
