import { describe, expect, it } from 'vitest';
import { presentStayOffers } from '@/server/providers/stay-present';
import type { CanonicalStayOffer } from '@/server/providers/types';

function stay(partial: Partial<CanonicalStayOffer> & { travelarOfferId: string; propertyName: string }): CanonicalStayOffer {
  return {
    sourceProviderId: 'travelport',
    sourceProductId: 'stays-v11',
    providerPropertyReference: partial.providerPropertyReference ?? partial.travelarOfferId,
    locationLabel: 'Dar es Salaam',
    ...partial,
  };
}

describe('presentStayOffers', () => {
  it('keeps the cheaper rate for the same property', () => {
    const listed = presentStayOffers([
      stay({ travelarOfferId: 'dear', propertyName: 'Harbour View', providerPropertyReference: 'HH:1', totalAmount: 220 }),
      stay({ travelarOfferId: 'cheap', propertyName: 'Harbour View', providerPropertyReference: 'HH:1', totalAmount: 180 }),
    ]);
    expect(listed).toHaveLength(1);
    expect(listed[0]?.travelarOfferId).toBe('cheap');
  });

  it('sorts priced properties before those without a rate', () => {
    const listed = presentStayOffers([
      stay({ travelarOfferId: 'b', propertyName: 'Beta', providerPropertyReference: 'B', totalAmount: 90 }),
      stay({ travelarOfferId: 'a', propertyName: 'Alpha', providerPropertyReference: 'A' }),
    ]);
    expect(listed.map((row) => row.travelarOfferId)).toEqual(['b', 'a']);
  });
});
