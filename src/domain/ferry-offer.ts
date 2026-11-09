import type { FerrySailing, FerryVesselClass } from '@/types';

export function asPublicFerrySailing(row: unknown): FerrySailing | null {
  if (!row || typeof row !== 'object') return null;
  const candidate = row as Record<string, unknown>;
  if (typeof candidate.id !== 'string' || typeof candidate.operatorName !== 'string') return null;
  const classes = Array.isArray(candidate.classes)
    ? candidate.classes.flatMap((item) => {
      const fareClass = asPublicFerryClass(item);
      return fareClass ? [fareClass] : [];
    })
    : [];
  return {
    id: candidate.id,
    operatorId: String(candidate.operatorId ?? ''),
    operatorName: candidate.operatorName,
    operatorLogo: typeof candidate.operatorLogo === 'string' ? candidate.operatorLogo : '',
    vesselName: String(candidate.vesselName ?? ''),
    departurePort: String(candidate.departurePort ?? ''),
    arrivalPort: String(candidate.arrivalPort ?? ''),
    departureTime: String(candidate.departureTime ?? ''),
    arrivalTime: String(candidate.arrivalTime ?? ''),
    departureDate: String(candidate.departureDate ?? ''),
    arrivalDate: String(candidate.arrivalDate ?? ''),
    duration: String(candidate.duration ?? ''),
    classes,
  };
}

function asPublicFerryClass(row: unknown): FerryVesselClass | null {
  if (!row || typeof row !== 'object') return null;
  const candidate = row as Record<string, unknown>;
  if (typeof candidate.id !== 'string' || typeof candidate.name !== 'string') return null;
  return {
    id: candidate.id,
    name: candidate.name,
    adultFare: Number(candidate.adultFare ?? 0),
    childFare: Number(candidate.childFare ?? 0),
    residentAdultFare: Number(candidate.residentAdultFare ?? 0),
    residentChildFare: Number(candidate.residentChildFare ?? 0),
    capacity: Number(candidate.capacity ?? 0),
    availableCapacity: Number(candidate.availableCapacity ?? 0),
    currency: String(candidate.currency ?? 'USD'),
    description: typeof candidate.description === 'string' ? candidate.description : '',
    hasResidentFare: candidate.hasResidentFare === true,
  };
}
