import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from '@/router';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { ErrorState, LoadingState, SearchSummaryBar } from '@/components/shared/States';
import { formatDate } from '@/utils/format';
import { formatMoney } from '@/domain/money';

interface Stop {
  id: string;
  locationName: string;
  code: string;
  sequence: number;
  offsetMinutes: number;
  terminalName: string | null;
}

interface QuoteLine {
  kind: 'adult' | 'child';
  unitMinor: number;
  quantity: number;
  amountMinor: number;
}

interface TripDetail {
  tripId: string;
  serviceDate: string;
  status: string;
  departureTime: string;
  operatorName: string;
  operatorSource: string;
  routeName: string;
  vehicleRegistration: string | null;
  vehicleModel: string | null;
  classLabel: string | null;
  stops: Stop[];
  quote: {
    currency: string;
    grossMinor: number;
    lines: QuoteLine[];
  } | null;
  segment: { fromStopId: string; toStopId: string } | null;
}

const addMinutes = (time: string, minutes: number): string => {
  const [hours, mins] = time.split(':').map(Number);
  const total = (hours * 60 + mins + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const durationLabel = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
};

const initials = (name: string): string =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]?.toUpperCase() ?? '').join('');

export function BusReviewPage() {
  const navigate = useNavigate();
  const { bookingState } = useApp();
  const { tp } = useI18n();

  const params = bookingState.searchParams;
  const tripId = params.extras?.tripId || bookingState.selectedServiceId;
  const [detail, setDetail] = useState<TripDetail | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!tripId || !params.origin || !params.destination) {
      setState('missing');
      return;
    }

    const controller = new AbortController();
    setState('loading');

    // Price the segment the passenger is actually travelling: the boarding and drop-off
    // stops chosen on the seat page. The searched origin is only a fallback — using it
    // alone quoted the whole route when somebody boarded later.
    const search = new URLSearchParams({
      id: tripId,
      from: bookingState.boardingPointId ?? params.extras?.originName ?? params.origin,
      to: bookingState.dropOffPointId ?? params.extras?.destinationName ?? params.destination,
      adults: String(params.adults),
      children: String(params.children),
    });

    fetch(`/api/trip-detail?${search.toString()}`, { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 404) return null;
        if (!response.ok) throw new Error(`trip detail failed: ${response.status}`);
        return (await response.json()) as { data: TripDetail };
      })
      .then((body) => {
        if (!body) {
          setState('missing');
          return;
        }
        setDetail(body.data);
        setState('ready');
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setState('error');
      });

    return () => controller.abort();
  }, [tripId, params.origin, params.destination, params.adults, params.children, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  const view = useMemo(() => {
    if (!detail) return null;

    const fromStop = detail.stops.find((stop) => stop.id === detail.segment?.fromStopId);
    const toStop = detail.stops.find((stop) => stop.id === detail.segment?.toStopId);
    if (!fromStop || !toStop) return null;

    const at = (stop: Stop) => addMinutes(detail.departureTime, stop.offsetMinutes);
    const boarding = detail.stops.find((stop) => stop.id === bookingState.boardingPointId);
    const dropOff = detail.stops.find((stop) => stop.id === bookingState.dropOffPointId);

    return {
      at,
      fromStop,
      toStop,
      boarding,
      dropOff,
      duration: durationLabel(toStop.offsetMinutes - fromStop.offsetMinutes),
      currency: detail.quote?.currency ?? 'TZS',
      grossMinor: detail.quote?.grossMinor ?? 0,
      lines: detail.quote?.lines ?? [],
    };
  }, [detail, bookingState.boardingPointId, bookingState.dropOffPointId]);

  if (state === 'loading') return <LoadingState />;

  if (state === 'error') {
    return (
      <ErrorState
        message={tp('unableLoadBookingReview')}
        subMessage={tp('bookingServiceTryAgain')}
        onRetry={retry}
      />
    );
  }

  if (state === 'missing' || !detail || !view) {
    return (
      <ErrorState
        message={tp('unableLoadBookingReview')}
        subMessage={tp('pleaseGoBackTryAgain')}
        onRetry={() => navigate('/bus/results')}
      />
    );
  }

  const ReviewSection = ({ title, children, onEdit }: { title: string; children: React.ReactNode; onEdit?: () => void }) => (
    <div className="card mb-4 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-listing font-bold text-neutral-900">{title}</h3>
        {onEdit && (
          <button onClick={onEdit} className="btn-ghost text-label">
            {tp('editButton')}
          </button>
        )}
      </div>
      {children}
    </div>
  );

  const Detail = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between py-1">
      <span className="text-body text-neutral-500">{label}</span>
      <span className="text-right text-body font-medium text-neutral-900">{value}</span>
    </div>
  );

  return (
    <>
      <SearchSummaryBar>
        <Link to="/bus/booking" className="btn-ghost text-label">← {tp('checkoutBack')}</Link>
        <span className="text-body font-medium text-neutral-900">{tp('bookingReview')}</span>
      </SearchSummaryBar>

      <div className="section-container py-6">
        <h1 className="text-page mb-6 font-bold text-neutral-900">{tp('reviewYourBooking')}</h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ReviewSection title={tp('serviceDetails')} onEdit={() => navigate('/bus/results')}>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-brand-600 text-body font-bold text-white">
                  {initials(detail.operatorName)}
                </div>
                <div className="min-w-0">
                  <p className="text-body font-bold text-neutral-900">{detail.operatorName}</p>
                  <p className="truncate text-meta text-neutral-500">
                    {[detail.classLabel, detail.vehicleModel, detail.vehicleRegistration]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                <Detail label={tp('passengerJourney')} value={`${view.fromStop.locationName} → ${view.toStop.locationName}`} />
                <Detail
                  label={tp('fullServiceRoute')}
                  value={`${detail.stops[0]?.locationName ?? ''} → ${detail.stops[detail.stops.length - 1]?.locationName ?? ''}`}
                />
                <Detail label={tp('departure')} value={`${view.at(view.fromStop)} · ${view.fromStop.terminalName ?? view.fromStop.locationName}`} />
                <Detail label={tp('arrival')} value={`${view.at(view.toStop)} · ${view.toStop.terminalName ?? view.toStop.locationName}`} />
                <Detail label={tp('ticketDate')} value={formatDate(detail.serviceDate)} />
                <Detail label={tp('durationLabel')} value={view.duration} />
              </div>
              {detail.operatorSource === 'fixture' && (
                <p className="mt-3 text-meta text-neutral-500">{tp('fixtureInventory')}</p>
              )}
            </ReviewSection>

            <ReviewSection title={tp('boardingSection')} onEdit={() => navigate('/bus/booking')}>
              <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                <Detail
                  label={tp('boardingPoint')}
                  value={view.boarding ? `${view.boarding.terminalName ?? view.boarding.locationName} · ${view.at(view.boarding)}` : '-'}
                />
                <Detail
                  label={tp('dropOffPoint')}
                  value={view.dropOff ? `${view.dropOff.terminalName ?? view.dropOff.locationName} · ${view.at(view.dropOff)}` : '-'}
                />
              </div>
            </ReviewSection>

            <ReviewSection title={tp('passengersCount').replace('{count}', String(bookingState.passengers.length))} onEdit={() => navigate('/bus/booking')}>
              <div className="space-y-3">
                {bookingState.passengers.map((p, i) => (
                  <div key={p.id} className="flex items-start gap-4 border-b border-neutral-100 py-2 last:border-b-0">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm bg-brand-50 text-meta font-bold text-brand-600">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-body font-medium text-neutral-900">
                        {p.fullName}{' '}
                        {p.category && (
                          <span className="text-meta capitalize text-neutral-500">
                            · {tp(p.category === 'infant' ? 'infant' : p.category)}
                          </span>
                        )}
                      </p>
                      <p className="text-meta text-neutral-500">
                        {tp('seatLabel')} {p.seatId} · {p.email} · {p.phoneCountryCode} {p.phone}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ReviewSection>
          </div>

          <div>
            <div className="card p-5 sm:p-6 lg:sticky lg:top-20">
              <h3 className="text-listing mb-4 font-bold text-neutral-900">{tp('fareSummary')}</h3>

              {view.lines.length === 0 ? (
                <p className="text-body text-neutral-500">{tp('checkoutQuoteUnavailable')}</p>
              ) : (
                <div className="mb-4 space-y-2">
                  {view.lines.map((line) => (
                    <div key={line.kind} className="flex justify-between text-body">
                      <span className="text-neutral-500">
                        {tp(line.kind)} ({line.quantity} × {formatMoney(line.unitMinor, view.currency)})
                      </span>
                      <span className="text-neutral-900">{formatMoney(line.amountMinor, view.currency)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-neutral-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-listing font-bold text-neutral-900">{tp('checkoutTotal')}</span>
                  <span className="text-listing font-bold text-brand-600">
                    {formatMoney(view.grossMinor, view.currency)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                disabled={view.grossMinor <= 0}
                className="btn-primary mt-6 w-full"
              >
                {tp('proceedToCheckout')}
              </button>

              <p className="mt-4 text-center text-meta text-neutral-400">{tp('fareRevalidationNote')}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
