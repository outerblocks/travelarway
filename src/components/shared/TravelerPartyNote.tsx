import { useI18n } from '@/context/I18nContext';

export function TravelerPartyNote({
  adults,
  children,
  infants = 0,
}: {
  adults: number;
  children: number;
  infants?: number;
}) {
  const { tp } = useI18n();
  const total = adults + children + infants;
  const parts = [
    adults ? `${adults} ${tp(adults === 1 ? 'adult' : 'adults')}` : null,
    children ? `${children} ${tp(children === 1 ? 'child' : 'children')}` : null,
    infants ? `${infants} ${tp(infants === 1 ? 'infant' : 'infants')}` : null,
  ].filter(Boolean);

  return (
    <p className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-body text-neutral-700">
      {tp('partyFormsForSearch')
        .replace('{count}', String(Math.max(total, 0)))
        .replace('{mix}', parts.join(', ') || tp('travelerSingular'))}
    </p>
  );
}
