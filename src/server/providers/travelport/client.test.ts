import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetCircuits } from '@/server/circuit-breaker';

vi.mock('@/server/providers/travelport/auth', () => ({
  getTravelportToken: async () => 'token',
}));

vi.mock('@/server/travelport/config', () => ({
  readTravelportConfig: () => ({
    environment: 'PREPROD',
    flightsBaseUrl: 'https://api.pp.travelport.net/11/air',
    staysV11BaseUrl: 'https://api.pp.travelport.net/11/hotel',
    accessGroup: 'ag',
    pcc: 'PCC',
  }),
  assertRequestReady: () => undefined,
}));

beforeEach(() => {
  resetCircuits();
});

afterEach(() => {
  resetCircuits();
});

describe('travelportRequest', () => {
  it('returns circuit_open without calling fetch after consecutive failures', async () => {
    const { travelportJson } = await import('@/server/providers/travelport/client');
    const fetchImpl = vi.fn(async () => {
      throw new Error('network');
    }) as unknown as typeof fetch;

    for (let i = 0; i < 5; i += 1) {
      const result = await travelportJson('air', 'catalog/search/catalogproductofferings', {}, fetchImpl);
      expect(result.errors[0]?.sourceCode).toBe('timeout');
    }
    const blocked = await travelportJson('air', 'catalog/search/catalogproductofferings', {}, fetchImpl);
    expect(blocked.httpStatus).toBe(503);
    expect(blocked.errors[0]?.sourceCode).toBe('circuit_open');
    expect(fetchImpl).toHaveBeenCalledTimes(5);
  });
});
