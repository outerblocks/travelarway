import { Link } from '@/router';
import { ArrowLeft } from 'lucide-react';
import { AirlineLogo } from '@/components/flights/AirlineLogo';
import { FlightFareFacts } from '@/components/flights/FlightFareFacts';
import { FlightItineraryList } from '@/components/flights/FlightItineraryList';
import { ScheduleStrip } from '@/components/results/ScheduleStrip';
import { useI18n } from '@/context/I18nContext';
import {
  airportShort,
  arrivesNextDayOf,
  flightNumbers,
  iataFromPlace,
  journeyDurationOf,
  marketingLabel,
  splitRoundTrip,
  viaAirportsOf,
} from '@/domain/flight-results';
import type { PublicAirLeg, PublicAirOffer } from '@/domain/air-offer';
import { useDatabaseOffers } from '@/hooks/useDatabaseOffers';
import { EmptyResults, LoadingState, QueryFeedback, SearchSummaryBar } from '@/components/shared/States';
import { formatMoney } from '@/domain/money';
import { formatClock, formatDate } from '@/utils/format';

export function FlightResultsPage() {
  const { tp } = useI18n();
  const { status, retry, params, flightOffers } = useDatabaseOffers('flights');
  const dates = [
    params.date ? formatDate(params.date) : '',
    params.returnDate ? formatDate(params.returnDate) : '',
  ].filter(Boolean).join(' · ');

  return (
    <QueryFeedback
      status={status}
      onRetry={retry}
      errorMessage={tp('unableLoadFlights')}
      loading={(
        <>
          <SearchSummaryBar>
            <Link to="/" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('modifySearch')}</Link>
            <span className="text-body font-medium text-neutral-900">{tp('flightSearch')}</span>
          </SearchSummaryBar>
          <LoadingState count={4} message={tp('searchingFlights')} />
        </>
      )}
    >
    <>
      <SearchSummaryBar>
        <Link to="/" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('modifySearch')}</Link>
        <span className="text-body font-medium text-neutral-900">
          {params.origin || tp('departure')} → {params.destination || tp('destination')}
          {params.returnDate ? ` · ${tp('flightRoundTrip')}` : ''}
        </span>
        <span className="text-body text-neutral-500">
          {dates} · {tp('adultCount').replace('{count}', String(params.adults)).replace('{plural}', params.adults === 1 ? '' : 's')}
        </span>
      </SearchSummaryBar>

      <div className="section-container py-6">
        <h1 className="text-page font-bold text-neutral-900 mb-6">
          {tp('flightCount').replace('{count}', String(flightOffers.length))}
        </h1>
        {flightOffers.length === 0 ? (
          <EmptyResults message={tp('noFlightsFound')} subMessage={tp('tryDifferentDateRoute')} />
        ) : (
          <ul className="offer-sheet">
            {flightOffers.map((offer) => (
              <FlightOfferCard
                key={offer.id}
                offer={offer}
                destinationCode={iataFromPlace(params.destination)}
                viaLabel={tp('via')}
              />
            ))}
          </ul>
        )}
      </div>
    </>
    </QueryFeedback>
  );
}

function FlightOfferCard({
  offer,
  destinationCode,
  viaLabel,
}: {
  offer: PublicAirOffer;
  destinationCode?: string;
  viaLabel: string;
}) {
  const { tp } = useI18n();
  const { outbound, inbound } = splitRoundTrip(offer.itinerary, destinationCode);
  const first = outbound[0] ?? offer.itinerary[0];
  const cabin = [offer.cabinClass, offer.fareBrand].filter(Boolean).join(', ');
  const airline = marketingLabel(offer);

  return (
    <li className="offer-row">
      <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-start lg:gap-8 lg:px-5">
        <div className="flex min-w-0 items-center gap-3 lg:w-[16rem] lg:shrink-0">
          <AirlineLogo code={first?.carrier || ''} name={first?.carrierName || airline} />
          <div className="min-w-0">
            <p className="truncate text-body font-semibold text-neutral-900">{airline}</p>
            <p className="truncate text-meta text-neutral-600">{flightNumbers(offer)}</p>
            {cabin ? <p className="truncate text-meta text-neutral-600">{cabin}</p> : null}
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <DirectionStrip label={inbound.length ? tp('flightOutbound') : null} legs={outbound} viaLabel={viaLabel} />
          {inbound.length ? (
            <DirectionStrip label={tp('flightReturn')} legs={inbound} viaLabel={viaLabel} />
          ) : null}
        </div>

        <div className="flex items-end justify-between gap-4 border-t border-neutral-200 pt-3 lg:w-44 lg:shrink-0 lg:flex-col lg:items-end lg:border-t-0 lg:pt-0">
          <div className="text-right">
            <p className="whitespace-nowrap text-listing font-semibold tabular-nums text-brand-800">
              {formatMoney(offer.totalPrice, offer.currency)}
            </p>
            <p className="mt-1 text-meta text-neutral-600">
              {offer.baggageInfo?.trim() || tp('baggageNotOnOffer')}
            </p>
          </div>
          <Link to={`/flights/booking?offer=${encodeURIComponent(offer.id)}`} className="btn-primary px-4 py-2 text-label">
            {tp('selectFlight')}
          </Link>
        </div>
      </div>

      <FlightItineraryDetails
        offer={offer}
        outbound={outbound}
        inbound={inbound}
      />
    </li>
  );
}

function DirectionStrip({
  label,
  legs,
  viaLabel,
}: {
  label: string | null;
  legs: PublicAirLeg[];
  viaLabel: string;
}) {
  const { tp } = useI18n();
  const first = legs[0];
  const last = legs[legs.length - 1] ?? first;
  if (!first || !last) return null;
  const via = viaAirportsOf(legs);
  const stopsLabel = legs.length <= 1
    ? tp('flightDirect')
    : tp('flightStops')
      .replace('{count}', String(legs.length - 1))
      .replace('{plural}', legs.length === 2 ? '' : 's');
  const connection = via.length
    ? `${stopsLabel} ${viaLabel.toLowerCase()} ${via.join(', ')}`
    : stopsLabel;

  return (
    <div>
      {label ? <p className="mb-1.5 text-meta font-medium text-neutral-500">{label}</p> : null}
      <ScheduleStrip
        startTime={formatClock(first.departure)}
        startPlace={airportShort(first.origin, first.originName)}
        endTime={formatClock(last.arrival)}
        endPlace={airportShort(last.destination, last.destinationName)}
        duration={journeyDurationOf(legs)}
        connection={connection}
        nextDay={arrivesNextDayOf(legs)}
      />
    </div>
  );
}

function FlightItineraryDetails({
  offer,
  outbound,
  inbound,
}: {
  offer: PublicAirOffer;
  outbound: PublicAirLeg[];
  inbound: PublicAirLeg[];
}) {
  const { tp } = useI18n();

  return (
    <details className="border-t border-neutral-200">
      <summary className="cursor-pointer list-none px-4 py-2.5 text-label font-medium text-brand-700 marker:content-none [&::-webkit-details-marker]:hidden">
        {tp('flightDetails')}
      </summary>
      <div className="px-4 pb-5">
        {inbound.length ? <p className="pt-1 text-meta font-medium text-neutral-500">{tp('flightOutbound')}</p> : null}
        <FlightItineraryList offer={offer} legs={outbound} />
        {inbound.length ? (
          <>
            <p className="mt-4 text-meta font-medium text-neutral-500">{tp('flightReturn')}</p>
            <FlightItineraryList offer={offer} legs={inbound} />
          </>
        ) : null}
        <div className="mt-4 border-t border-neutral-100 pt-4">
          <FlightFareFacts offer={offer} />
        </div>
      </div>
    </details>
  );
}
