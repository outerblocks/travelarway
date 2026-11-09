import { describe, expect, it } from 'vitest';
import { publicationBlocks } from '@/server/oims/readiness';

const bus = {
  mode: 'bus' as const,
  latraLicenceNumber: 'LATRA-1',
  tasacLicenceNumber: null,
  electronicTicketingRegistered: true,
  licenceValidTo: '2027-01-01',
  passengerCertificateMax: null,
};

describe('publicationBlocks', () => {
  it('blocks bus publication without electronic ticketing', () => {
    expect(publicationBlocks({
      operator: { ...bus, electronicTicketingRegistered: false },
      stopCount: 3,
      fareCount: 2,
      vesselClassCapacityTotal: null,
    })).toContain('electronic_ticketing_required');
  });

  it('blocks ferry classes above the seaworthiness certificate', () => {
    expect(publicationBlocks({
      operator: {
        mode: 'ferry',
        latraLicenceNumber: null,
        tasacLicenceNumber: 'TASAC-9',
        electronicTicketingRegistered: false,
        licenceValidTo: null,
        passengerCertificateMax: 80,
      },
      stopCount: 2,
      fareCount: 1,
      vesselClassCapacityTotal: 120,
    })).toContain('class_capacity_exceeds_certificate');
  });

  it('allows a ready bus corridor', () => {
    expect(publicationBlocks({
      operator: bus,
      stopCount: 2,
      fareCount: 1,
      vesselClassCapacityTotal: null,
    })).toEqual([]);
  });

  it('blocks an expired licence', () => {
    expect(publicationBlocks({
      operator: { ...bus, licenceValidTo: '2020-01-01' },
      stopCount: 2,
      fareCount: 1,
      vesselClassCapacityTotal: null,
    })).toContain('licence_expired');
  });
});
