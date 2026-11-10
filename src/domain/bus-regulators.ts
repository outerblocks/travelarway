/**
 * PSV licensing overlay for bus routes. One coach that crosses a border needs a
 * licence in every state it drives — not a single home-country row.
 *
 * TZ: LATRA (PSV 2020; electronic ticketing r.4).
 * KE: NTSA PSV (LN 23/2014).
 * UG: Transport Licensing Board (Traffic and Road Safety Act 1998 Part V).
 * RW: RURA passenger road transport, including cross-border class (regs 007/2015).
 * MW: DRTSS operator certificate + Road Service Permit Type A.
 * Other ISO codes fail closed until the regulator is researched.
 */

export const BUS_REGULATOR = {
  TZ: { code: 'LATRA', block: 'latra_licence_required' },
  KE: { code: 'NTSA', block: 'ntsa_licence_required' },
  UG: { code: 'UG_TLB', block: 'ug_tlb_licence_required' },
  RW: { code: 'RURA', block: 'rura_licence_required' },
  MW: { code: 'DRTSS', block: 'drtss_licence_required' },
} as const;

export type BusRegulatorCountry = keyof typeof BUS_REGULATOR;

export function uniqueCountryCodes(codes: readonly string[]): string[] {
  return [...new Set(codes.map((code) => code.trim().toUpperCase()).filter(Boolean))].sort();
}

export function isCrossBorder(stopCountryCodes: readonly string[]): boolean {
  return uniqueCountryCodes(stopCountryCodes).length > 1;
}
