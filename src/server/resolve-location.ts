/**
 * Turn a search-card token (row id, code, or display name) into one `app.location` row.
 *
 * The picker stores the id; shareable URLs and typed API calls may send a code or a name.
 * Matching is exact (case-insensitive for code/name), never a prefix, so "Dar" cannot
 * silently become "Dar es Salaam".
 */
import { query } from '@/server/db';

export interface ResolvedLocation {
  id: string;
  name: string;
  code: string;
  kind: string;
  countryCode: string;
}

export async function resolveLocation(
  token: string,
  options: { kinds?: string[]; country?: string } = {},
): Promise<ResolvedLocation | null> {
  const value = token.trim();
  if (!value) return null;

  const { rows } = await query<ResolvedLocation>(
    `select l.id::text as id, l.name, l.code, l.kind, l.country_code as "countryCode"
       from app.location l
      where l.is_active
        and (
          l.id::text = $1
          or lower(l.code) = lower($1)
          or lower(trim(l.name)) = lower($1)
        )
        and ($2::text[] is null or l.kind = any($2))
        and ($3::char(2) is null or l.country_code = $3)
      order by
        (l.id::text = $1) desc,
        (lower(l.code) = lower($1)) desc,
        (l.kind = 'city') desc,
        (l.kind = 'town') desc,
        (l.kind = 'station') desc,
        l.name
      limit 1`,
    [value, options.kinds?.length ? options.kinds : null, options.country ?? null],
  );

  return rows[0] ?? null;
}

/** IATA / city code the GDS shopping APIs accept. Never invented from a display name. */
export function iataCodeOf(location: ResolvedLocation): string | null {
  const code = location.code.trim().toUpperCase();
  if (/^[A-Z]{3}$/.test(code)) return code;
  const fromName = /\(([A-Z]{3})\)/.exec(location.name);
  return fromName?.[1] ?? null;
}
