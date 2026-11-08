import { Link } from '@/router';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { useDatabaseOffers, type PublicStayOffer } from '@/hooks/useDatabaseOffers';
import { EmptyResults, QueryFeedback, SearchSummaryBar } from '@/components/shared/States';
import { StayGallery } from '@/components/stays/StayGallery';
import { StayStars } from '@/components/stays/StayStars';
import { formatMoney } from '@/domain/money';
import { formatDate, nightsBetween } from '@/utils/format';

export function StaysResultsPage() {
  const { tp } = useI18n();
  const { setSelectedServiceId } = useApp();
  const { status, retry, params, stayOffers } = useDatabaseOffers('stays');
  const nights = params.date && params.extras?.checkOut ? nightsBetween(params.date, params.extras.checkOut) : 1;
  const nightLabel = tp('nightCount').replace('{count}', String(nights)).replace('{plural}', nights === 1 ? '' : 's');

  return (
    <QueryFeedback
      status={status}
      onRetry={retry}
      errorMessage={tp('unableLoadStays')}
      loading={(
        <>
          <SearchSummaryBar>
            <Link to="/" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('modifySearch')}</Link>
          </SearchSummaryBar>
          <StayResultsSkeleton message={tp('searchingAccommodations')} />
        </>
      )}
    >
    <>
      <SearchSummaryBar>
        <Link to="/" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('modifySearch')}</Link>
        <span className="text-body font-medium text-neutral-900">{params.origin || tp('allDestinations')}</span>
        <span className="text-body text-neutral-500">
          {params.date ? formatDate(params.date) : ''}
          {params.extras?.checkOut ? ` – ${formatDate(params.extras.checkOut)}` : ''}
          {' · '}
          {nightLabel}
          {' · '}
          {tp('adultCount').replace('{count}', String(params.adults)).replace('{plural}', params.adults === 1 ? '' : 's')}
        </span>
      </SearchSummaryBar>

      <div className="section-container py-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-page font-bold text-neutral-900">
            {tp('propertyCount').replace('{count}', String(stayOffers.length))}
          </h1>
          <p className="max-w-xl text-meta text-neutral-600">{tp('stayRatesFromSearch')}</p>
        </div>
        {stayOffers.length === 0 ? (
          <EmptyResults message={tp('noPropertiesFound')} subMessage={tp('tryDifferentDestinationDate')} />
        ) : (
          <ul className="flex flex-col gap-4">
            {stayOffers.map((offer) => (
              <StayOfferCard
                key={offer.id}
                offer={offer}
                nights={nights}
                nightLabel={nightLabel}
                onOpen={() => setSelectedServiceId(offer.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </>
    </QueryFeedback>
  );
}

function StayOfferCard({
  offer,
  nights,
  nightLabel,
  onOpen,
}: {
  offer: PublicStayOffer;
  nights: number;
  nightLabel: string;
  onOpen: () => void;
}) {
  const { tp } = useI18n();
  const perNight = offer.totalPrice != null && nights > 0 ? offer.totalPrice / nights : null;

  return (
    <li className="overflow-hidden border border-neutral-300 bg-white" style={{ borderLeft: '3px solid var(--ink)' }}>
      <article className="grid grid-cols-1 sm:grid-cols-[16rem_minmax(0,1fr)]">
        <StayGallery urls={offer.photoUrls} name={offer.name} layout="card" />
        <div className="flex min-w-0 flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:justify-between sm:p-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-listing font-semibold text-neutral-900">{offer.name}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              {offer.starRating != null ? <StayStars rating={offer.starRating} label={tp('starRated').replace('{count}', String(offer.starRating))} /> : null}
              <p className="text-meta text-neutral-600">{offer.address || offer.location}</p>
            </div>
            {offer.distance ? (
              <p className="mt-1 text-meta text-neutral-500">{tp('distanceFromSearch').replace('{distance}', offer.distance)}</p>
            ) : null}
            {offer.amenities.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {offer.amenities.map((amenity) => (
                  <li key={amenity} className="rounded-md bg-neutral-100 px-2 py-0.5 text-meta text-neutral-700">
                    {amenity}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-start justify-between gap-3 sm:items-end sm:text-right">
            {offer.totalPrice != null && offer.currency ? (
              <div>
                <p className="text-meta text-neutral-500">{tp('fromPrice')}</p>
                <p className="text-listing font-semibold tabular-nums text-brand-800">{formatMoney(offer.totalPrice, offer.currency)}</p>
                <p className="text-meta text-neutral-500">{tp('forThisStay')}</p>
                {perNight != null ? (
                  <p className="mt-1 text-meta tabular-nums text-neutral-600">
                    {formatMoney(perNight, offer.currency)} {tp('perNight')}
                  </p>
                ) : (
                  <p className="mt-1 text-meta text-neutral-600">{nightLabel}</p>
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

function StayResultsSkeleton({ message }: { message: string }) {
  return (
    <div className="section-container py-12" role="status" aria-live="polite">
      <div className="space-y-4">
        <div className="skeleton h-8 w-56" />
        {Array.from({ length: 4 }, (_, row) => (
          <div key={row} className="grid grid-cols-1 overflow-hidden border border-neutral-200 bg-white sm:grid-cols-[16rem_minmax(0,1fr)]">
            <div className="skeleton h-52 w-full rounded-none sm:h-full sm:min-h-[12.5rem]" />
            <div className="space-y-3 p-5">
              <div className="skeleton h-5 w-2/3" />
              <div className="skeleton h-3 w-1/3" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          </div>
        ))}
        <p className="pt-1 text-center text-meta text-neutral-500">{message}</p>
      </div>
    </div>
  );
}
