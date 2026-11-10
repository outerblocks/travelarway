/**
 * Regulatory gates before a schedule may create sellable trip instances.
 * Evidence: LATRA PSV Regulations 2020 r.4 (licence + electronic ticketing) and r.33
 * (manifest). TASAC Small Ships r.7 (certificate passenger cap). Ferries Act s.6 (licence).
 * Cross-border bus: NTSA LN 23/2014, Uganda TLB, RURA 007/2015, Malawi DRTSS.
 */

import { BUS_REGULATOR, uniqueCountryCodes } from '@/domain/bus-regulators';

export interface OperatorLicence {
  countryCode: string;
  regulatorCode: string;
  licenceNumber: string;
  validTo: string | null;
}

export interface OperatorReadiness {
  mode: 'bus' | 'ferry';
  latraLicenceNumber: string | null;
  tasacLicenceNumber: string | null;
  electronicTicketingRegistered: boolean;
  licenceValidTo: string | null;
  passengerCertificateMax: number | null;
  licences?: OperatorLicence[];
}

export interface ScheduleReadinessInput {
  operator: OperatorReadiness;
  stopCount: number;
  fareCount: number;
  vesselClassCapacityTotal: number | null;
  /** ISO 3166-1 alpha-2 of every stop. Omitted means Tanzania-only (legacy callers). */
  stopCountryCodes?: string[];
}

function hasRegulatorLicence(operator: OperatorReadiness, countryCode: string, regulatorCode: string): boolean {
  const fromTable = operator.licences?.some(
    (row) =>
      row.countryCode === countryCode
      && row.regulatorCode === regulatorCode
      && row.licenceNumber.trim().length > 0,
  );
  if (fromTable) return true;
  if (regulatorCode === 'LATRA' && countryCode === 'TZ') return Boolean(operator.latraLicenceNumber?.trim());
  return false;
}

export function publicationBlocks(input: ScheduleReadinessInput): string[] {
  const blocks: string[] = [];
  const today = new Date().toISOString().slice(0, 10);
  if (input.stopCount < 2) blocks.push('route_needs_two_stops');
  if (input.fareCount < 1) blocks.push('route_needs_segment_fare');

  if (input.operator.mode === 'bus') {
    const countries = uniqueCountryCodes(input.stopCountryCodes ?? ['TZ']);
    for (const country of countries) {
      const required = BUS_REGULATOR[country as keyof typeof BUS_REGULATOR];
      if (!required) {
        blocks.push(`bus_regulator_unmapped:${country}`);
        continue;
      }
      if (!hasRegulatorLicence(input.operator, country, required.code)) {
        blocks.push(required.block);
      }
    }
    if (countries.includes('TZ') && !input.operator.electronicTicketingRegistered) {
      blocks.push('electronic_ticketing_required');
    }
  }
  if (input.operator.mode === 'ferry') {
    if (!input.operator.tasacLicenceNumber?.trim() && !input.operator.latraLicenceNumber?.trim()) {
      blocks.push('ferry_licence_required');
    }
    const cap = input.operator.passengerCertificateMax;
    const classes = input.vesselClassCapacityTotal;
    if (cap == null) blocks.push('passenger_certificate_required');
    else if (classes != null && classes > cap) blocks.push('class_capacity_exceeds_certificate');
  }
  if (input.operator.licenceValidTo && input.operator.licenceValidTo < today) {
    blocks.push('licence_expired');
  }
  const expiredForeign = input.operator.licences?.some(
    (row) => row.validTo && row.validTo < today,
  );
  if (expiredForeign) blocks.push('licence_expired');
  return [...new Set(blocks)];
}
