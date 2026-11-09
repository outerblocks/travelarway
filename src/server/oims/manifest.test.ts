import { describe, expect, it } from 'vitest';
import { buildManifest, latraCopies, tasacCopies } from '@/server/oims/manifest';

describe('manifest copies', () => {
  it('issues LATRA r.33 triplicate copies and keeps blank identity fields blank', () => {
    const document = buildManifest({
      regulation: 'LATRA_PSV_2020_R33',
      operatorName: 'Kilimanjaro Express',
      licenceNumber: 'LATRA/BUS/TZ/000123',
      vehicleOrVessel: 'T 123 ABC',
      routeName: 'Dar es Salaam — Arusha',
      serviceDate: '2026-11-09',
      departureTime: '06:00',
      crew: [],
      passengers: [{
        fullName: 'Amina N.',
        citizenship: null,
        phone: null,
        nextOfKinPhone: null,
        originStop: 'Dar es Salaam',
        destinationStop: 'Arusha',
        seatOrClass: '12',
        fareMinor: 29000,
        currency: 'TZS',
      }],
      issuedAt: null,
    });
    expect(document.copiesRequired).toEqual(latraCopies());
    expect(document.retentionYears).toBe(5);
    expect(document.passengers[0]?.citizenship).toBeNull();
    expect(document.passengers[0]?.nextOfKinPhone).toBeNull();
  });

  it('does not treat a TASAC list as a Maritime Single Window filing', () => {
    const document = buildManifest({
      regulation: 'TASAC_PASSENGER_LIST',
      operatorName: 'Travelar Ferry Console',
      licenceNumber: null,
      vehicleOrVessel: null,
      routeName: 'Dar es Salaam — Zanzibar',
      serviceDate: '2026-11-09',
      departureTime: '08:00',
      crew: [],
      passengers: [],
      issuedAt: null,
    });
    expect(document.copiesRequired).toEqual(tasacCopies());
    expect(document.passengerTotal).toBe(0);
  });
});
