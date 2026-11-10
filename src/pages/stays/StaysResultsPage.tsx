import { Link } from '@/router';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { useDatabaseOffers, type PublicStayOffer } from '@/hooks/useDatabaseOffers';
import { EmptyResults, LoadingState, QueryFeedback } from '@/components/shared/States';
import { StayAmenityList } from '@/components/stays/StayAmenityList';
import { StayGallery } from '@/components/stays/StayGallery';
import { StayStars } from '@/components/stays/StayStars';
import { formatMoney } from '@/domain/money';
import { formatDate, nightsBetween } from '@/utils/format';

export function StaysResultsPage() {
  const { tp, lang } = useI18n();
  const { setSelectedServiceId } = useApp();
  const { status, retry, params, stayOffers } = useDatabaseOffers('stays');
  const nights = params.date && params.extras?.checkOut ? nightsBetween(params.date, params.extras.checkOut) : 1;
  const nightLabel = tp('nightCount').replace('{count}', String(nights)).replace('{plural}', nights === 1 ? '' : 's');
  const place = params.origin || tp('allDestinations');
  const stayDates = [
    params.date ? formatDate(params.date) : '',
    params.extras?.checkOut ? formatDate(params.extras.checkOut) : '',
  ].filter(Boolean).join(' – ');

  return (
    <QueryFeedback
      status={status}
      onRetry={retry}
      errorMessage={tp('unableLoadStays')}
      loading={<LoadingState message={tp('searchingAccommodations')} />}
    >
      <div className="section-container py-6">
        <h1 className="text-page font-bold text-neutral-900">{place}</h1>
        <p className="mt-1 mb-6 text-body text-neutral-500">
          {[
            stayDates,
            nightLabel,
            tp('adultCount').replace('{count}', String(params.adults)).replace('{plural}', params.adults === 1 ? '' : 's'),
            tp('propertyCount').replace('{count}', String(stayOffers.length)),
          ].filter(Boolean).join(' · ')}
        </p>
        {stayOffers.length === 0 ? (
          <EmptyResults message={tp('noPropertiesFound')} subMessage={tp('tryDifferentDestinationDate')} />
        ) : (
          <ul className="offer-sheet">
            {stayOffers.map((offer) => (
              <StayOfferCard
                key={offer.id}
                offer={offer}
                nights={nights}
                nightLabel={nightLabel}
                lang={lang}
                onOpen={() => setSelectedServiceId(offer.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </QueryFeedback>
  );
}

function StayOfferCard({
  offer,
  nights,
  nightLabel,
  lang,
  onOpen,
}: {
  offer: PublicStayOffer;
  nights: number;
  nightLabel: string;
  lang: 'en' | 'sw' | 'fr';
  onOpen: () => void;
}) {
  const { tp } = useI18n();
  const perNight = offer.totalPrice != null && nights > 0 ? offer.totalPrice / nights : null;

  return (
    <li className="offer-row">
      <article className="stay-offer">
        <div className="stay-offer-photo">
          <StayGallery urls={offer.photoUrls} name={offer.name} layout="card" />
        </div>
        <div className="flex min-w-0 flex-col justify-between gap-5 px-5 py-5 sm:pl-6">
          <div className="min-w-0">
            <h2 className="text-listing font-semibold text-neutral-900">{offer.name}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              {offer.starRating != null ? <StayStars rating={offer.starRating} label={tp('starRated').replace('{count}', String(offer.starRating))} /> : null}
              <p className="text-meta text-neutral-600">{offer.address || offer.location}</p>
            </div>
            {offer.distance ? (
              <p className="mt-1 text-meta text-neutral-500">{tp('distanceFromSearch').replace('{distance}', offer.distance)}</p>
            ) : null}
            <StayAmenityList amenities={offer.amenities} lang={lang} variant="inline" limit={5} />
          </div>
          <div className="flex shrink-0 items-end justify-between gap-4">
            {offer.totalPrice != null && offer.currency ? (
              <div>
                <p className="text-listing font-semibold tabular-nums text-neutral-900">{formatMoney(offer.totalPrice, offer.currency)}</p>
                {perNight != null ? (
                  <p className="mt-0.5 text-meta tabular-nums text-neutral-600">
                    {formatMoney(perNight, offer.currency)} {tp('perNight')}
                  </p>
                ) : (
                  <p className="mt-0.5 text-meta text-neutral-600">{nightLabel}</p>
                )}
              </div>
            ) : (
              <p className="text-meta text-neutral-500">{nightLabel}</p>
            )}
            <Link
              to={`/stays/detail?offer=${encodeURIComponent(offer.id)}`}
              onClick={onOpen}
              className="btn-primary px-4 py-2 text-label"
            >
              {tp('viewStay')}
            </Link>
          </div>
        </div>
      </article>
    </li>
  );
}
