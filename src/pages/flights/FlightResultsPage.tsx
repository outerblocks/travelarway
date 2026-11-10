import { Link } from '@/router';
import { AirlineLogo } from '@/components/flights/AirlineLogo';
import { FlightFareFacts } from '@/components/flights/FlightFareFacts';
import { FlightItineraryList } from '@/components/flights/FlightItineraryList';
import { useI18n } from '@/context/I18nContext';
import {
  airportShort,
  arrivesNextDayOf,
  cabinLine,
  displayAirline,
  flightNumbers,
  iataFromPlace,
  journeyDurationOf,
  marketingLabel,
  splitRoundTrip,
  viaAirportsOf,
} from '@/domain/flight-results';
import type { PublicAirLeg, PublicAirOffer } from '@/domain/air-offer';
import { useDatabaseOffers } from '@/hooks/useDatabaseOffers';
import { EmptyResults, LoadingState, QueryFeedback } from '@/components/shared/States';
import { formatMoney } from '@/domain/money';
import { formatClock, formatDate } from '@/utils/format';

export function FlightResultsPage() {
  const { tp } = useI18n();
  const { status, retry, params, flightOffers } = useDatabaseOffers('flights');
  const dates = [
    params.date ? formatDate(params.date) : '',
    params.returnDate ? formatDate(params.returnDate) : '',
  ].filter(Boolean).join(' · ');
  const origin = params.origin || tp('departure');
  const destination = params.destination || tp('destination');

  return (
    <QueryFeedback
      status={status}
      onRetry={retry}
      errorMessage={tp('unableLoadFlights')}
      loading={<LoadingState count={4} message={tp('searchingFlights')} />}
    >
      <div className="section-container py-6">
        <h1 className="text-page font-bold text-neutral-900">
          {origin} <span className="text-ink">→</span> {destination}
          {params.returnDate ? ` · ${tp('flightRoundTrip')}` : ''}
        </h1>
        <p className="mt-1 mb-6 text-body text-neutral-500">
          {[
            dates,
            tp('adultCount').replace('{count}', String(params.adults)).replace('{plural}', params.adults === 1 ? '' : 's'),
            tp('flightCount').replace('{count}', String(flightOffers.length)),
          ].filter(Boolean).join(' · ')}
        </p>
        {flightOffers.length === 0 ? (
          <EmptyResults message={tp('noFlightsFound')} subMessage={tp('tryDifferentDateRoute')} />
        ) : (
          <ul className="flight-offer-sheet">
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
  const cabin = cabinLine(offer);
  const airline = marketingLabel(offer);
  const brand = first ? displayAirline(first) : { code: '', name: airline };
  const meta = [flightNumbers(offer), cabin].filter(Boolean).join(' · ');
  const baggage = offer.baggageInfo?.trim() || tp('baggageNotOnOffer');

  return (
    <li className="flight-offer">
      <div className="flex flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:gap-8">
        <div className="flex min-w-0 items-center gap-3 lg:w-[13.5rem] lg:shrink-0">
          <AirlineLogo
            code={brand.code}
            fallbackCode={first?.carrier}
            name={airline}
            size="lg"
          />
          <div className="min-w-0">
            <p className="truncate text-body font-semibold text-neutral-900">{airline}</p>
            {meta ? <p className="truncate text-meta text-neutral-500">{meta}</p> : null}
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-5">
          <DirectionStrip label={inbound.length ? tp('flightOutbound') : null} legs={outbound} viaLabel={viaLabel} />
          {inbound.length ? (
            <DirectionStrip label={tp('flightReturn')} legs={inbound} viaLabel={viaLabel} />
          ) : null}
        </div>

        <div className="flex items-end justify-between gap-4 lg:w-40 lg:shrink-0 lg:flex-col lg:items-end lg:border-l lg:border-neutral-200 lg:pl-6">
          <p className="whitespace-nowrap text-[1.65rem] font-bold tabular-nums leading-none tracking-tight text-ink">
            {formatMoney(offer.totalPrice, offer.currency)}
          </p>
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

      <p className="flight-offer-baggage">
        <span className="flight-offer-baggage-mark" aria-hidden="true">i</span>
        {baggage}
      </p>
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
  const duration = journeyDurationOf(legs);
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
      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-4">
        <div>
          <p className="text-[1.75rem] font-semibold leading-none tabular-nums tracking-tight text-neutral-900">
            {formatClock(first.departure)}
          </p>
          <p className="mt-1 max-w-[11rem] text-meta leading-snug text-neutral-500">
            {airportShort(first.origin, first.originName)}
          </p>
        </div>
        <div className="flex min-w-0 flex-col items-center pt-1 text-center">
          {duration ? (
            <p className="mb-1 text-[11px] tabular-nums text-neutral-500">{duration}</p>
          ) : null}
          <div className="relative flex w-full items-center">
            <span className="flight-schedule-dot" />
            <span className="flight-schedule-rule" />
            <span className="flight-schedule-dot" />
            <span className="flight-schedule-pill">{connection}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[1.75rem] font-semibold leading-none tabular-nums tracking-tight text-neutral-900">
            {formatClock(last.arrival)}
            {arrivesNextDayOf(legs) ? <sup className="ml-0.5 text-[10px] font-semibold text-neutral-500">+1</sup> : null}
          </p>
          <p className="mt-1 max-w-[11rem] text-meta leading-snug text-neutral-500">
            {airportShort(last.destination, last.destinationName)}
          </p>
        </div>
      </div>
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
    <details className="border-t border-neutral-100 px-5">
      <summary className="cursor-pointer list-none py-2.5 text-label font-medium text-brand-700 marker:content-none [&::-webkit-details-marker]:hidden">
        {tp('flightDetails')}
      </summary>
      <div className="pb-4">
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
