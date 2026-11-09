import { useI18n } from '@/context/I18nContext';
import type { PublicAirOffer } from '@/domain/air-offer';
import { formatMoney } from '@/domain/money';

export function FlightFareFacts({ offer, compact = false }: { offer: PublicAirOffer; compact?: boolean }) {
  const { tp } = useI18n();
  const rows = [
    offer.fareBrand ? [tp('fareBrandLabel'), offer.fareBrand] : null,
    offer.cabinClass ? [tp('cabinLabel'), offer.cabinClass] : null,
    [tp('includedBaggage'), offer.baggageInfo?.trim() || tp('baggageNotOnOffer')],
    offer.refundInfo ? [tp('refundLabel'), offer.refundInfo] : null,
    offer.changeInfo ? [tp('changeLabel'), offer.changeInfo] : null,
    offer.basePrice != null ? [tp('searchFareBase'), formatMoney(offer.basePrice, offer.currency)] : null,
    offer.taxPrice != null ? [tp('taxesAndFees'), formatMoney(offer.taxPrice, offer.currency)] : null,
    [tp('checkoutTotal'), formatMoney(offer.totalPrice, offer.currency)],
  ].filter((row): row is [string, string] => Boolean(row));

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <dl className="space-y-1.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 text-meta text-neutral-700">
            <dt>{label}</dt>
            <dd className="text-right font-medium tabular-nums text-neutral-900">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-meta leading-relaxed text-neutral-600">{tp('flightCatalogNote')}</p>
      <p className="text-meta leading-relaxed text-neutral-600">{tp('flightSeatMapUnavailable')}</p>
      <p className="text-meta leading-relaxed text-neutral-600">{tp('flightAncillariesUnavailable')}</p>
    </div>
  );
}
