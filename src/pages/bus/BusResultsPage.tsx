import { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from '@/router';
import { Wifi, Zap, Snowflake, Droplets, type LucideIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { ScheduleStrip } from '@/components/results/ScheduleStrip';
import { EmptyResults, ErrorState, LoadingState, OfflineState, SearchSummaryBar } from '@/components/shared/States';
import { isAbortError, queryFailureStatus, type QueryStatus } from '@/hooks/query-status';
import { useOnlineRetry } from '@/hooks/useOnlineRetry';
import { originToken, destinationToken } from '@/domain/search-tokens';
import { useHydrateSearchFromUrl } from '@/hooks/useHydrateSearchFromUrl';
import { formatCurrency, formatDate, todayISO } from '@/utils/format';

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


/** Amenity keys are operator-declared; unknown keys render as text, never as a guess. */
const AMENITY_ICONS: Record<string, LucideIcon> = {
  wifi: Wifi,
  charging: Zap,
  aircon: Snowflake,
  toilet: Droplets,
};

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
  const { tp } = useI18n();
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
    setStatus('loading');

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
        return response.json() as Promise<{ data: BusResult[] }>;
      })
      .then((body) => {
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
      <SearchSummaryBar>
        <Link to="/" className="btn-ghost text-label">← {tp('modifySearch')}</Link>
        <span className="hidden text-body font-medium text-neutral-900 sm:inline">{originName} → {destName}</span>
        <span className="text-body text-neutral-500">
          {params.date ? formatDate(params.date) : ''}
          {params.returnDate ? ` · ${tp('return')} ${formatDate(params.returnDate)}` : ''}
          {' · '}{tp('passengerCount').replace('{count}', String(passengerCount)).replace('{plural}', passengerCount === 1 ? '' : 's')}
        </span>
      </SearchSummaryBar>

      <main className="section-container py-7">
        <div className="mb-5">
          <h1 className="text-page font-bold tracking-tight text-neutral-900">
            {originName} <span className="text-brand-600">→</span> {destName}
          </h1>
          <p className="mt-1 text-body text-neutral-500">
            {params.date ? formatDate(params.date) : tp('selectTravelDate')}
            {' · '}{tp('passengerCount').replace('{count}', String(passengerCount)).replace('{plural}', passengerCount === 1 ? '' : 's')}
            {status === 'ready' && ` · ${tp('busCount').replace('{count}', String(trips.length))}`}
          </p>
        </div>

        {status === 'loading' ? (
          <LoadingState />
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
                  <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:gap-8 lg:px-5">
                    <div className="flex min-w-0 items-center gap-3 lg:w-[13.5rem] lg:shrink-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-ink text-body font-semibold text-white">
                        {trip.operatorInitials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-body font-semibold text-neutral-900">{trip.operatorName}</p>
                        <p className="truncate text-meta text-neutral-600">
                          {[trip.classLabel, SERVICE_CLASS_LABELS[trip.serviceClass ?? ''] ?? null, trip.vehicleModel, trip.registrationNumber]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
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

                    <div className="flex items-center justify-between gap-4 border-t border-neutral-200 pt-3 lg:w-40 lg:shrink-0 lg:flex-col lg:items-end lg:border-t-0 lg:pt-0">
                      <div className="lg:text-right">
                        <p className="whitespace-nowrap text-listing font-semibold tabular-nums text-brand-800">
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
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-neutral-200 px-4 py-2 lg:px-5">
                      {trip.amenities.map((amenity) => {
                        const Icon = AMENITY_ICONS[amenity];
                        return (
                          <span key={amenity} className="inline-flex items-center gap-1 text-meta text-neutral-600">
                            {Icon ? <Icon size={13} /> : null}
                            {amenity}
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
