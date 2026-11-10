import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from '@/router';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { amenityCaption, normalizeAmenityKey } from '@/domain/amenities';
import { AmenityIcon } from '@/components/shared/AmenityIcon';
import { ScheduleStrip } from '@/components/results/ScheduleStrip';
import { EmptyResults, ErrorState, LoadingState, OfflineState } from '@/components/shared/States';
import { isAbortError, queryFailureStatus, stayReadyDuringRefetch, type QueryStatus } from '@/hooks/query-status';
import { useOnlineRetry } from '@/hooks/useOnlineRetry';
import { originToken, destinationToken } from '@/domain/search-tokens';
import { useHydrateSearchFromUrl } from '@/hooks/useHydrateSearchFromUrl';
import { formatCurrency, formatDate, todayISO } from '@/utils/format';
import { rememberSearchIntent } from '@/utils/search-intent';

/**
 * Client contract for /api/bus/results.
 *
 * Declared locally rather than imported from the server module so the server query code
 * never reaches the browser bundle. If the two drift, the response fails to type-check
 * at the call site below.
 */
interface BusResult {
  id: string;
  operatorName: string;
  operatorInitials: string;
  operatorSource: 'reference' | 'operator_contract' | 'fixture';
  seatLayoutName: string | null;
  classLabel: string | null;
  /** LATRA Regulation 22 category: ordinary | semi_luxury | luxury. */
  serviceClass: string | null;
  supportPhone: string | null;
  vehicleModel: string | null;
  registrationNumber: string | null;
  departureTime: string;
  arrivalTime: string;
  arrivalNextDay: boolean;
  durationLabel: string;
  passengerOrigin: string;
  passengerDestination: string;
  departureTerminal: string;
  arrivalTerminal: string;
  intermediateStops: { name: string; terminal: string }[];
  segmentFare: number;
  currency: string;
  /** Seats the vehicle carries, so "left" can be shown against the total. */
  capacity: number;
  availableSeats: number;
  amenities: string[];
}


/**
 * The regulated category, spelled for a traveller rather than for a database.
 * Keys are the LATRA Regulation 22 values; anything else renders nothing rather
 * than inventing a class the operator was never licensed for.
 */
const SERVICE_CLASS_LABELS: Record<string, string> = {
  ordinary: 'Ordinary class',
  semi_luxury: 'Semi-luxury class',
  luxury: 'Luxury class',
};

export function BusResultsPage() {
  const navigate = useNavigate();
  const { bookingState, setSelectedServiceId, setSearchParams } = useApp();
  const { tp, lang } = useI18n();
  const params = bookingState.searchParams;
  useHydrateSearchFromUrl();
  const from = originToken(params);
  const to = destinationToken(params);

  const [status, setStatus] = useState<QueryStatus>('loading');
  const [trips, setTrips] = useState<BusResult[]>([]);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Nothing to search without a route; an empty state is honest, a fabricated list is not.
    if (!from || !to) {
      setTrips([]);
      setStatus('ready');
      return;
    }

    const controller = new AbortController();
    setStatus((current) => stayReadyDuringRefetch(current, 'loading', 'ready', trips.length > 0));

    const search = new URLSearchParams({
      from,
      to,
      // Local calendar day, never toISOString(): Dar es Salaam is UTC+3, so the UTC date
      // rolls over three hours before midnight and silently searches yesterday.
      date: params.date || todayISO(),
    });

    fetch(`/api/bus/results?${search.toString()}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`search failed: ${response.status}`);
        return response.json() as Promise<{ data: BusResult[]; searchIntent?: string }>;
      })
      .then((body) => {
        rememberSearchIntent(body.searchIntent);
        setTrips(body.data ?? []);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        setStatus(queryFailureStatus(error));
      });

    return () => controller.abort();
  }, [from, to, params.date, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  useOnlineRetry(retry);

  const handleBook = (trip: BusResult) => {
    setSelectedServiceId(trip.id);
    setSearchParams({
      ...params,
      extras: { ...params.extras, tripId: trip.id },
    });
    navigate('/bus/booking');
  };

  const originName = params.origin || trips[0]?.passengerOrigin || tp('departure');
  const destName = params.destination || trips[0]?.passengerDestination || tp('destination');
  const passengerCount = params.adults + params.children;

  if (status === 'offline') {
    return <OfflineState onRetry={retry} />;
  }

  if (status === 'error') {
    return (
      <ErrorState
        message={tp('unableLoadSearchResults')}
        subMessage={tp('bookingServiceTryAgain')}
        onRetry={retry}
      />
    );
  }

  return (
    <>
      <main className="section-container py-7">
        <div className="mb-5">
          <h1 className="text-page font-bold tracking-tight text-neutral-900">
            {originName} <span className="text-brand-600">→</span> {destName}
          </h1>
          <p className="mt-1 text-body text-neutral-500">
            {params.date ? formatDate(params.date) : tp('selectTravelDate')}
            {params.returnDate ? ` · ${tp('return')} ${formatDate(params.returnDate)}` : ''}
            {' · '}{tp('passengerCount').replace('{count}', String(passengerCount)).replace('{plural}', passengerCount === 1 ? '' : 's')}
            {status === 'ready' && ` · ${tp('busCount').replace('{count}', String(trips.length))}`}
          </p>
        </div>

        {status === 'loading' ? (
          <LoadingState inset />
        ) : trips.length === 0 ? (
          <EmptyResults
            message={tp('noTripsForRoute')}
            subMessage={tp('tryDifferentDateRouteBus')}
          />
        ) : (
          <div className="offer-sheet">
            {trips.map((trip) => {
              const viaStops = trip.intermediateStops.filter(
                (stop) => stop.name !== trip.passengerDestination,
              );
              const isFixture = trip.operatorSource === 'fixture';
              const connection = [
                viaStops.length ? `${tp('via')} ${viaStops.map((stop) => stop.name).join(', ')}` : null,
                isFixture ? tp('fixtureInventory') : null,
              ].filter(Boolean).join(' · ');

              return (
                <article key={trip.id} className="offer-row">
                  <div className="flex flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:gap-10">
                    <div className="flex min-w-0 items-start gap-3 lg:w-[17.5rem] lg:shrink-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-ink text-body font-semibold text-white">
                        {trip.operatorInitials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-body font-semibold text-neutral-900">{trip.operatorName}</p>
                        {trip.classLabel ? (
                          <p className="text-meta text-neutral-700">{trip.classLabel}</p>
                        ) : SERVICE_CLASS_LABELS[trip.serviceClass ?? ''] ? (
                          <p className="text-meta text-neutral-700">{SERVICE_CLASS_LABELS[trip.serviceClass ?? '']}</p>
                        ) : null}
                        {trip.vehicleModel ? (
                          <p className="text-meta text-neutral-600">
                            <span className="text-neutral-500">{tp('busModel')} </span>
                            {trip.vehicleModel}
                          </p>
                        ) : null}
                        {trip.registrationNumber ? (
                          <p className="text-meta tabular-nums text-neutral-600">
                            <span className="text-neutral-500">{tp('registrationNo')} </span>
                            {trip.registrationNumber}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <ScheduleStrip
                      startTime={trip.departureTime}
                      startPlace={`${trip.passengerOrigin}, ${trip.departureTerminal}`}
                      endTime={trip.arrivalTime}
                      endPlace={`${trip.passengerDestination}, ${trip.arrivalTerminal}`}
                      duration={trip.durationLabel}
                      connection={connection || null}
                      nextDay={trip.arrivalNextDay}
                    />

                    <div className="offer-fare flex items-center justify-between gap-4 lg:w-44 lg:shrink-0 lg:flex-col lg:items-end">
                      <div className="lg:text-right">
                        <p className="whitespace-nowrap text-listing font-semibold tabular-nums text-neutral-900">
                          {formatCurrency(trip.segmentFare, trip.currency, 'TSh')}
                        </p>
                        <p className="text-meta text-neutral-500">{tp('perSeat')}</p>
                        <p className="text-meta text-neutral-500">
                          {trip.capacity > 0
                            ? `${trip.availableSeats} / ${trip.capacity}`
                            : String(trip.availableSeats)}{' '}
                          {tp('availableCount').replace('{count}', '').trim()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleBook(trip)}
                        disabled={trip.availableSeats === 0}
                        className="btn-primary shrink-0 whitespace-nowrap lg:mt-2 lg:w-full"
                      >
                        {tp('bookBus')}
                      </button>
                    </div>
                  </div>

                  {trip.amenities.length > 0 && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-neutral-200 px-5 py-2">
                      {trip.amenities.map((amenity) => {
                        const key = normalizeAmenityKey(amenity);
                        const caption = amenityCaption(key, lang);
                        return (
                          <span key={amenity} className="inline-flex items-center gap-1.5 text-meta text-neutral-600" title={caption}>
                            <AmenityIcon amenity={key} />
                            {caption}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
