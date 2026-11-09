/**
 * Regulatory gates before a schedule may create sellable trip instances.
 * Evidence: LATRA PSV Regulations 2020 r.4 (licence + electronic ticketing) and r.33
 * (manifest). TASAC Small Ships r.7 (certificate passenger cap). Ferries Act s.6 (licence).
 */

export interface OperatorReadiness {
  mode: 'bus' | 'ferry';
  latraLicenceNumber: string | null;
  tasacLicenceNumber: string | null;
  electronicTicketingRegistered: boolean;
  licenceValidTo: string | null;
  passengerCertificateMax: number | null;
}

export interface ScheduleReadinessInput {
  operator: OperatorReadiness;
  stopCount: number;
  fareCount: number;
  vesselClassCapacityTotal: number | null;
}

export function publicationBlocks(input: ScheduleReadinessInput): string[] {
  const blocks: string[] = [];
  const today = new Date().toISOString().slice(0, 10);
  if (input.stopCount < 2) blocks.push('route_needs_two_stops');
  if (input.fareCount < 1) blocks.push('route_needs_segment_fare');

  if (input.operator.mode === 'bus') {
    if (!input.operator.latraLicenceNumber?.trim()) blocks.push('latra_licence_required');
    if (!input.operator.electronicTicketingRegistered) blocks.push('electronic_ticketing_required');
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
  return blocks;
}
