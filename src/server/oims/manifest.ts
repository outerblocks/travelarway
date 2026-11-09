/**
 * LATRA Fourth Schedule passenger manifest fields (GN 76 of 2020).
 * TASAC facilitation passenger list uses overlapping identity fields plus vessel/master.
 * Blank cells stay blank: we do not invent citizenship or next-of-kin.
 */

export interface ManifestPassenger {
  fullName: string;
  citizenship: string | null;
  phone: string | null;
  nextOfKinPhone: string | null;
  originStop: string | null;
  destinationStop: string | null;
  seatOrClass: string | null;
  fareMinor: number;
  currency: string;
}

export interface ManifestDocument {
  regulation: 'LATRA_PSV_2020_R33' | 'TASAC_PASSENGER_LIST';
  copiesRequired: string[];
  retentionYears: number;
  operatorName: string;
  licenceNumber: string | null;
  vehicleOrVessel: string | null;
  routeName: string;
  serviceDate: string;
  departureTime: string;
  crew: { role: string; fullName: string; licenceNumber: string | null; phone: string | null }[];
  passengers: ManifestPassenger[];
  passengerTotal: number;
  issuedAt: string | null;
}

export function latraCopies(): string[] {
  return ['police_station', 'licensee_office', 'vehicle'];
}

export function tasacCopies(): string[] {
  return ['master', 'office', 'maritime_authorities'];
}

export function buildManifest(input: Omit<ManifestDocument, 'passengerTotal' | 'copiesRequired' | 'retentionYears'>): ManifestDocument {
  return {
    ...input,
    copiesRequired: input.regulation === 'LATRA_PSV_2020_R33' ? latraCopies() : tasacCopies(),
    retentionYears: 5,
    passengerTotal: input.passengers.length,
  };
}
