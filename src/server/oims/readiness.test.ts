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

  it('does not require LATRA on a Kenya-only route', () => {
    expect(publicationBlocks({
      operator: {
        ...bus,
        latraLicenceNumber: null,
        electronicTicketingRegistered: false,
        licences: [{ countryCode: 'KE', regulatorCode: 'NTSA', licenceNumber: 'NTSA-1', validTo: '2027-01-01' }],
      },
      stopCount: 2,
      fareCount: 1,
      vesselClassCapacityTotal: null,
      stopCountryCodes: ['KE'],
    })).toEqual([]);
  });

  it('requires NTSA and LATRA on Nairobi–Dar', () => {
    const blocks = publicationBlocks({
      operator: bus,
      stopCount: 2,
      fareCount: 1,
      vesselClassCapacityTotal: null,
      stopCountryCodes: ['KE', 'TZ'],
    });
    expect(blocks).toContain('ntsa_licence_required');
    expect(blocks).not.toContain('latra_licence_required');
  });

  it('refuses Ethiopia until the regulator is mapped', () => {
    expect(publicationBlocks({
      operator: bus,
      stopCount: 2,
      fareCount: 1,
      vesselClassCapacityTotal: null,
      stopCountryCodes: ['ET'],
    })).toContain('bus_regulator_unmapped:ET');
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
