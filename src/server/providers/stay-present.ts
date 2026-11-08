import type { CanonicalStayOffer } from '@/server/providers/types';

/**
 * Public stay search lists one row per property (cheapest observed rate) and cheapest-first.
 * Properties without a rate stay listed after priced rows — the adapter does not invent a price.
 */
export function presentStayOffers(offers: CanonicalStayOffer[]): CanonicalStayOffer[] {
  const winners = new Map<string, CanonicalStayOffer>();
  for (const offer of offers) {
    const key = offer.providerPropertyReference || offer.travelarOfferId;
    if (!key || !offer.propertyName) continue;
    const current = winners.get(key);
    if (!current) {
      winners.set(key, offer);
      continue;
    }
    const nextPrice = offer.totalAmount;
    const currentPrice = current.totalAmount;
    if (nextPrice != null && (currentPrice == null || nextPrice < currentPrice)) {
      winners.set(key, offer);
    }
  }
  return [...winners.values()].sort((a, b) => {
    if (a.totalAmount == null && b.totalAmount == null) {
      return a.propertyName.localeCompare(b.propertyName);
    }
    if (a.totalAmount == null) return 1;
    if (b.totalAmount == null) return -1;
    if (a.totalAmount !== b.totalAmount) return a.totalAmount - b.totalAmount;
    return a.propertyName.localeCompare(b.propertyName);
  });
}
