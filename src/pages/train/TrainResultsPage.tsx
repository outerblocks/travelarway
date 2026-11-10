import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '@/router';
import { ScheduleStrip } from '@/components/results/ScheduleStrip';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { LoadingState, EmptyResults, ErrorState, OfflineState } from '@/components/shared/States';
import { queryFailureStatus } from '@/hooks/query-status';
import { useOnlineRetry } from '@/hooks/useOnlineRetry';
import { originToken, destinationToken } from '@/domain/search-tokens';
import { useHydrateSearchFromUrl } from '@/hooks/useHydrateSearchFromUrl';
import { formatCurrency, formatDate } from '@/utils/format';
import { rememberSearchIntent } from '@/utils/search-intent';

/**
 * SGR search results, read from the database.
 *
 * This page used to filter a hardcoded timetable and print a fake seat count derived from a
 * hash of the seat number — a number that looked live and was not. It now asks
 * `/api/sgr/services`, which computes availability from the same seat segments the hold will
 * be written against, so the count on the card and the seat the passenger later takes cannot
 * disagree.
 *
 * A class with no fare on file is shown as pending with its button disabled rather than
 * priced at zero. The alternative — defaulting a missing price — is how a booking site ends
 * up selling a 90,500 seat for nothing.
 */

interface ServiceClass {
  seatClassCode: string;
  name: string;
  fare: number | null;
  currency: string | null;
  fareSource: string | null;
  available: number;
  totalSellable: number;
  soldOut: boolean;
}

interface SgrService {
  tripId: string;
  serviceRef: string;
  tripNumber: string;
  name: string;
  operatorName: string;
  servicePattern: string | null;
  origin: string;
  destination: string;
  /** Null for an intermediate stop: the operator has not published a time for it. */
  departureTime: string | null;
  arrivalTime: string | null;
  departureDate: string;
  duration: string;
  fromSeq: number;
  toSeq: number;
  /** The train's own endpoints, which differ from the pair searched when joining mid-line. */
  serviceOrigin: string;
  serviceDestination: string;
  classes: ServiceClass[];
}

export function TrainResultsPage() {
  const navigate = useNavigate();
  const { bookingState, setSearchParams } = useApp();
  const { tp } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(false);
  const [results, setResults] = useState<SgrService[]>([]);
  const [unresolved, setUnresolved] = useState<string[]>([]);
  const [returnSelection, setReturnSelection] = useState(false);

  const params = bookingState.searchParams;
  useHydrateSearchFromUrl();
  const isRoundTrip = params.returnDate !== undefined && params.extras?.tripType === 'return';
  const selectedDate = (returnSelection ? params.returnDate : params.date) ?? '';
  const origin = (returnSelection ? destinationToken(params) : originToken(params)) || '';
  const destination = (returnSelection ? originToken(params) : destinationToken(params)) || '';
  const routeSummary = results[0] ? `${results[0].origin} → ${results[0].destination}` : '';

  const load = useCallback(async () => {
    if (!origin || !destination || !selectedDate) {
      setResults([]);
      setLoading(false);
      return;
    }
    setError(false);
    setOffline(false);
    try {
      const search = new URLSearchParams({ from: origin, to: destination, date: selectedDate });
      const response = await fetch(`/api/sgr/services?${search.toString()}`);
      if (!response.ok) {
        setError(true);
        setResults([]);
        return;
      }
      const payload = (await response.json()) as {
        data?: SgrService[];
        unresolved_places?: string[];
        searchIntent?: string;
      };
      rememberSearchIntent(payload.searchIntent);
      setResults(payload.data ?? []);
      setUnresolved(payload.unresolved_places ?? []);
    } catch (caught: unknown) {
      if (queryFailureStatus(caught) === 'offline') setOffline(true);
      else setError(true);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [origin, destination, selectedDate]);

  useEffect(() => {
    void load();
  }, [load]);
  useOnlineRetry(load);

  const handleSelect = (service: SgrService, selected: ServiceClass) => {
    const extras = params.extras ?? {};
    // Carried as strings because the shared search state is a string map; the booking page
    // reads them back with Number() and refuses the leg if they no longer parse.
    const leg = {
      trainId: service.tripId,
      classId: selected.seatClassCode,
      fromSeq: String(service.fromSeq),
      toSeq: String(service.toSeq),
    };

    /**
     * What the review page prints. These are display strings, not money: the price is asked
     * from the server again at review, because a total that travelled through the client is
     * one the client could have changed. The journey description is safe to carry — it is the
     * same fact the ticket will state either way.
     */
    const legDisplay = {
      trainName: service.name,
      operatorName: service.operatorName,
      legOrigin: service.origin,
      legDestination: service.destination,
      legDeparture: service.departureTime ?? '',
      legArrival: service.arrivalTime ?? '',
      legDuration: service.duration,
      legDate: service.departureDate,
      classLabel: selected.name,
    };

    if (returnSelection) {
      setSearchParams({
        ...params,
        extras: {
          ...extras,
          returnTrainId: leg.trainId,
          returnClassId: leg.classId,
          // The return leg runs between its own pair of stops, which is not the outbound
          // interval mirrored: a trip that starts at seq 0 and ends at 2 has its own numbers.
          returnFromSeq: String(service.fromSeq),
          returnToSeq: String(service.toSeq),
          returnTrainName: legDisplay.trainName,
          returnOperatorName: legDisplay.operatorName,
          returnLegOrigin: legDisplay.legOrigin,
          returnLegDestination: legDisplay.legDestination,
          returnLegDeparture: legDisplay.legDeparture,
          returnLegArrival: legDisplay.legArrival,
          returnLegDuration: legDisplay.legDuration,
          returnLegDate: legDisplay.legDate,
          returnClassLabel: legDisplay.classLabel,
        },
      });
      navigate('/train/booking');
      return;
    }

    const { returnTrainId: _r, returnClassId: _c, ...outboundExtras } = extras;
    setSearchParams({ ...params, extras: { ...outboundExtras, ...leg, ...legDisplay } });

    if (isRoundTrip) {
      setReturnSelection(true);
    } else {
      navigate('/train/booking');
    }
  };

  if (loading && results.length === 0) {
    return <LoadingState count={3} />;
  }

  if (offline) {
    return <OfflineState onRetry={() => void load()} />;
  }

  if (error) {
    return (
      <ErrorState
        message={tp('unableLoadTrains')}
        subMessage={tp('bookingServiceTryAgain')}
        onRetry={() => void load()}
      />
    );
  }

  const anyProvisional = results.some((service) =>
    service.classes.some((entry) => entry.fareSource === 'PROVISIONAL'),
  );

  return (
    <>
      <div className="section-container py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-page font-bold text-neutral-900">
              {returnSelection
                ? `${tp('return')} ${tp('trainSearch')}`
                : tp('trainServiceCount').replace('{count}', String(results.length))}
            </h1>
            <p className="mt-1 text-body text-neutral-500">
              {routeSummary}{routeSummary && selectedDate ? ' · ' : ''}
              {selectedDate ? formatDate(selectedDate) : ''}
            </p>
          </div>
          {returnSelection && (
            <button type="button" onClick={() => setReturnSelection(false)} className="btn-ghost text-label">
              ← {tp('departure')}
            </button>
          )}
        </div>

        {unresolved.length > 0 && (
          <p className="mb-5 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-meta text-error-700">
            {tp('trainUnknownPlace').replace('{places}', unresolved.join(', '))}
          </p>
        )}

        {anyProvisional && (
          <p className="mb-5 rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-meta text-warning-800">
            {tp('trainProvisionalFareNotice')}
          </p>
        )}

        {results.length === 0 ? (
          <EmptyResults message={tp('noTrainsFound')} subMessage={tp('tryDifferentDateRoute')} />
        ) : (
          <div className="offer-sheet">
            {results.map((service) => (
              <article key={service.tripId} className="offer-row">
                <div className="flex flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:gap-10">
                  <div className="flex min-w-0 items-center gap-3 lg:w-[13.5rem] lg:shrink-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-ink text-label font-semibold text-white">SGR</div>
                    <div className="min-w-0">
                      <p className="truncate text-body font-semibold text-neutral-900">{service.name}</p>
                      <p className="truncate text-meta text-neutral-600">
                        {service.operatorName}, {service.tripNumber}
                        {service.serviceOrigin && service.serviceDestination
                          && (service.origin !== service.serviceOrigin || service.destination !== service.serviceDestination)
                          ? `, ${tp('trainViaService').replace('{from}', service.serviceOrigin).replace('{to}', service.serviceDestination)}`
                          : ''}
                      </p>
                    </div>
                  </div>

                  <ScheduleStrip
                    startTime={service.departureTime ?? '—'}
                    startPlace={service.origin}
                    endTime={service.arrivalTime ?? '—'}
                    endPlace={service.destination}
                    duration={service.duration}
                    connection={formatDate(service.departureDate)}
                  />
                </div>

                <table className="w-full border-t border-neutral-200 text-left">
                  <tbody>
                    {service.classes.map((entry) => (
                      <tr key={entry.seatClassCode} className="border-t border-neutral-100 first:border-t-0">
                        <td className="py-3 pl-5 pr-3 text-body font-medium text-neutral-900">{entry.name}</td>
                        <td className="px-2 py-3 text-meta text-neutral-600">
                          {entry.available} {tp('seatsAvailableShort')}
                          {entry.fare === null ? ` · ${tp('trainFarePending')}` : ''}
                        </td>
                        <td className="px-2 py-3 text-right text-body font-semibold tabular-nums text-neutral-900">
                          {entry.fare === null ? '—' : formatCurrency(entry.fare, entry.currency ?? 'TZS', 'TSh')}
                        </td>
                        <td className="py-3 pl-3 pr-5 text-right">
                          <button
                            onClick={() => handleSelect(service, entry)}
                            disabled={entry.soldOut || entry.fare === null}
                            className="btn-primary text-meta px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {entry.soldOut ? tp('soldOut') : tp('bookButton')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
