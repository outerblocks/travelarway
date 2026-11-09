import { useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate, Link } from '@/router';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { PassengerForm, createPassenger } from '@/components/shared/PassengerForm';
import { TravelerPartyNote } from '@/components/shared/TravelerPartyNote';
import { partyMismatched } from '@/domain/passengers';
import { ErrorState, LoadingState, SearchSummaryBar } from '@/components/shared/States';
import { Select } from '@/components/ui/Select';
import { SeatMapGrid, type SeatMapSeatView, type SeatMapCellView } from '@/components/bus/SeatMapGrid';
import { formatCurrency } from '@/utils/format';
import type { PassengerInfo } from '@/types';

/** Seat as this page renders it; no dependency on the retired mock trip model. */
interface SeatView {
  id: string;
  label: string;
  type: 'seat' | 'aisle' | 'driver';
  status: 'available' | 'occupied';
}

interface SeatMapResponse {
  layout: { name: string; rows: number; cols: number };
  cells: SeatMapCellView[];
  seats: SeatMapSeatView[];
}

/** Exactly the fields the layout below reads, mapped from /api/trip-detail. */
interface TripView {
  operatorName: string;
  passengerOrigin: string;
  passengerDestination: string;
  departureTime: string;
  busClass: string;
  busModel: string;
  registrationNumber: string;
  currency: string;
  segmentFare: number;
  /** The stops the search actually asked for. The defaults must match them, not the
   *  service terminus — defaulting to the last stop is what silently re-priced the trip. */
  originStopId: string;
  destinationStopId: string;
  boardingPoints: { id: string; name: string; time: string }[];
  dropOffPoints: { id: string; name: string; time: string }[];
  seatMap: { layout: SeatView[][] };
}

interface TripDetailResponse {
  tripId: string;
  status: string;
  departureTime: string;
  operatorName: string;
  routeName: string;
  vehicleModel: string | null;
  vehicleRegistration: string | null;
  seatLayout: { name: string; rowCount: number; lanes: string[] } | null;
  stops: { id: string; locationName: string; code: string; sequence: number; offsetMinutes: number; terminalName: string | null }[];
  fares: { fromStopId: string; toStopId: string; fareMinor: number; currency: string }[];
  takenSeats: { seatNo: string; reason: 'hold' | 'sold' }[];
}

const addMinutes = (time: string, minutes: number): string => {
  const [hours, mins] = time.split(':').map(Number);
  const total = (hours * 60 + mins + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

export function BusBookingPage() {
  const navigate = useNavigate();
  const {
    bookingState,
    setSelectedSeats,
    setPassengers,
    setBoardingPointId,
    setDropOffPointId,
    setSearchParams,
  } = useApp();
  const { tp } = useI18n();

  const [selectedSeats, setSelectedSeatsState] = useState<string[]>([]);
  const [passengers, setPassengersState] = useState<PassengerInfo[]>([]);
  const [boardingPoint, setBoardingPoint] = useState('');
  const [dropOffPoint, setDropOffPoint] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [holdError, setHoldError] = useState('');
  const [placingHold, setPlacingHold] = useState(false);

  const tripId = bookingState.searchParams.extras?.tripId || bookingState.selectedServiceId;
  const totalPassengers = bookingState.searchParams.adults + bookingState.searchParams.children;

  // The trip is fetched from the API. There is no fallback: an unknown trip is reported
  // as unavailable rather than silently resolving to a fixture with a similar name.
  const [detail, setDetail] = useState<TripDetailResponse | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error' | 'missing'>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!tripId) {
      setLoadState('missing');
      return;
    }

    const controller = new AbortController();
    setLoadState('loading');

    fetch(`/api/trip-detail?id=${encodeURIComponent(tripId)}`, { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 404) return null;
        if (!response.ok) throw new Error(`trip detail failed: ${response.status}`);
        return (await response.json()) as { data: TripDetailResponse };
      })
      .then((body) => {
        if (!body) {
          setLoadState('missing');
          return;
        }
        setDetail(body.data);
        setLoadState('ready');
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setLoadState('error');
      });

    return () => controller.abort();
  }, [tripId, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  // The seat map comes from the trip, never from a locally generated pattern: the fleet's
  // configured layout is the only geometry that exists.
  const [seatMap, setSeatMap] = useState<SeatMapResponse | null>(null);

  useEffect(() => {
    if (!tripId) return;

    const controller = new AbortController();
    fetch(`/api/seat-map?tripId=${encodeURIComponent(tripId)}`, { signal: controller.signal, cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { data?: SeatMapResponse } | null) => setSeatMap(body?.data ?? null))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setSeatMap(null);
      });

    return () => controller.abort();
  }, [tripId]);

  const trip = useMemo<TripView | null>(() => {
    if (!detail) return null;

    // Resolve the searched segment by display name or code. Never fall back to the route's
    // first and last stop: that silently re-prices the journey (29,000 searched, 41,000
    // charged) and is exactly the mismatch this used to produce.
    const originParam =
      bookingState.searchParams.extras?.originName || bookingState.searchParams.origin || '';
    const destinationParam =
      bookingState.searchParams.extras?.destinationName || bookingState.searchParams.destination || '';
    const matchesStop = (stop: { locationName: string; code: string }, needle: string) =>
      stop.locationName.toLowerCase() === needle.toLowerCase() ||
      stop.code.toUpperCase() === needle.toUpperCase();

    const originStop = detail.stops.find((stop) => matchesStop(stop, originParam));
    const destinationStop = detail.stops.find((stop) => matchesStop(stop, destinationParam));
    if (!originStop || !destinationStop || destinationStop.sequence <= originStop.sequence) return null;

    const toPoint = (stop: typeof originStop) => ({
      id: stop.id,
      name: stop.terminalName ?? stop.locationName,
      time: addMinutes(detail.departureTime, stop.offsetMinutes),
    });

    const fare = detail.fares.find(
      (candidate) =>
        candidate.fromStopId === originStop.id && candidate.toStopId === destinationStop.id,
    );
    const taken = new Set(detail.takenSeats.map((seat) => seat.seatNo));

    const layout: SeatView[][] = [];
    if (detail.seatLayout) {
      for (let rowNumber = 1; rowNumber <= detail.seatLayout.rowCount; rowNumber += 1) {
        const row: SeatView[] = [];
        detail.seatLayout.lanes.forEach((lane, laneIndex) => {
          // A 2+2 coach reads as two pairs; the gap is presentational only.
          if (laneIndex === 2) row.push({ id: `aisle-${rowNumber}`, label: '', type: 'aisle', status: 'available' });
          const id = `${rowNumber}${lane}`;
          row.push({
            id,
            label: id,
            type: 'seat',
            status: taken.has(id) ? 'occupied' : 'available',
          });
        });
        layout.push(row);
      }
    }

    return {
      operatorName: detail.operatorName,
      passengerOrigin: originStop.locationName,
      passengerDestination: destinationStop.locationName,
      departureTime: addMinutes(detail.departureTime, originStop.offsetMinutes),
      busClass: detail.seatLayout?.name ?? '',
      busModel: detail.vehicleModel ?? '',
      registrationNumber: detail.vehicleRegistration ?? '',
      currency: fare?.currency ?? detail.fares[0]?.currency ?? 'TZS',
      segmentFare: fare?.fareMinor ?? 0,
      originStopId: originStop.id,
      destinationStopId: destinationStop.id,
      boardingPoints: detail.stops
        .filter((stop) => stop.sequence <= destinationStop.sequence)
        .map(toPoint),
      dropOffPoints: detail.stops
        .filter((stop) => stop.sequence >= originStop.sequence)
        .map(toPoint),
      seatMap: { layout },
    };
  }, [detail, bookingState.searchParams.origin, bookingState.searchParams.destination]);

  // Boarding and drop-off deliberately start empty. Between them they set the price, so
  // pre-filling them from the search had the customer confirm a pair of stops they never
  // chose. The fare line reads '—' until both are stated.

  // Price the pair that is actually selected, from the fare table the API already returned.
  // Changing the drop-off to the terminus must change the price on screen immediately,
  // not at the review step.
  const selectedFare = useMemo(() => {
    if (!detail) return null;
    const match = detail.fares.find(
      (candidate) => candidate.fromStopId === boardingPoint && candidate.toStopId === dropOffPoint,
    );
    return match?.fareMinor ?? null;
  }, [detail, boardingPoint, dropOffPoint]);

  const handleSeatClick = (seat: SeatMapSeatView) => {
    if (seat.status !== 'available') return;

    setSelectedSeatsState((prev) => {
      if (prev.includes(seat.label)) {
        const next = prev.filter((s) => s !== seat.label);
        setPassengersState((prevP) =>
          prevP.slice(0, next.length).map((p, i) => ({ ...p, seatId: next[i] }))
        );
        return next;
      }

      if (prev.length >= totalPassengers) {
        return prev;
      }

      const next = [...prev, seat.label];
      setPassengersState((prevP) => {
        const updated = [...prevP];
        while (updated.length < next.length) {
          updated.push({ ...createPassenger(), seatId: seat.label });
        }
        return updated.map((p, i) => ({ ...p, seatId: next[i] }));
      });
      return next;
    });
  };

  const handlePassengerChange = (index: number, updated: PassengerInfo) => {
    setPassengersState((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (selectedSeats.length !== totalPassengers) {
      e.seats = tp('seatSelectionError').replace('{count}', String(totalPassengers)).replace('{plural}', totalPassengers > 1 ? 's' : '').replace('{selected}', String(selectedSeats.length));
    }

    if (!boardingPoint) e.boarding = tp('selectBoardingPoint');
    if (!dropOffPoint) e.dropOff = tp('selectDropOffPoint');

    passengers.forEach((p, i) => {
      if (!p.fullName) e[`name_${i}`] = tp('requiredLabel');
      if (!p.email) e[`email_${i}`] = tp('requiredLabel');
      if (!p.phone) e[`phone_${i}`] = tp('requiredLabel');
      if (!p.gender) e[`gender_${i}`] = tp('requiredLabel');
      if (!p.category) e[`category_${i}`] = tp('requiredLabel');
    });

    // Only worth saying once every field is filled: with blank fare types the mix cannot
    // match anything, and complaining about both at once buries the real problem.
    if (
      Object.keys(e).length === 0 &&
      partyMismatched(passengers, bookingState.searchParams.adults, bookingState.searchParams.children)
    ) {
      e.party = tp('partyMixMismatch')
        .replace('{adults}', String(bookingState.searchParams.adults))
        .replace('{children}', String(bookingState.searchParams.children));
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = async () => {
    if (!validate()) {
      const firstError = document.querySelector('[data-error="true"]');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!tripId) return;

    // Reserve the seats in the database before review. Without this, a seat can be sold
    // between choosing it and paying, and the customer discovers it at the end.
    setHoldError('');
    setPlacingHold(true);
    try {
      const response = await fetch('/api/holds', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tripId, seats: selectedSeats }),
      });

      if (response.status === 409) {
        setHoldError(tp('seatsTakenError'));
        setAttempt((value) => value + 1); // refresh availability so the map tells the truth
        return;
      }
      if (!response.ok) {
        setHoldError(tp('bookingServiceTryAgain'));
        return;
      }

      const boardingName = trip?.boardingPoints.find((point) => point.id === boardingPoint)?.name ?? '';
      const dropOffName = trip?.dropOffPoints.find((point) => point.id === dropOffPoint)?.name ?? '';
      setSearchParams({
        ...bookingState.searchParams,
        extras: {
          ...bookingState.searchParams.extras,
          ...(trip
            ? {
                operatorName: trip.operatorName,
                legOrigin: trip.passengerOrigin,
                legDestination: trip.passengerDestination,
                legDeparture: trip.departureTime,
                busModel: trip.busModel,
                registrationNumber: trip.registrationNumber,
                busClass: trip.busClass,
                boardingPointName: boardingName,
                dropOffPointName: dropOffName,
              }
            : {}),
        },
      });
      setSelectedSeats(selectedSeats);
      setPassengers(passengers);
      setBoardingPointId(boardingPoint);
      setDropOffPointId(dropOffPoint);
      navigate('/bus/review');
    } catch {
      setHoldError(tp('bookingServiceTryAgain'));
    } finally {
      setPlacingHold(false);
    }
  };

  if (loadState === 'loading') {
    return (
      <>
        <SearchSummaryBar>
          <Link to="/bus/results" className="btn-ghost text-label">← {tp('backToResults')}</Link>
        </SearchSummaryBar>
        <LoadingState />
      </>
    );
  }

  if (loadState === 'missing' || !trip) return (
    <ErrorState
      message={tp('unableLoadTrip')}
      subMessage={tp('selectedTripMissing')}
      onRetry={() => navigate('/bus/results')}
    />
  );

  if (loadState === 'error') return (
    <ErrorState
      message={tp('unableLoadTrip')}
      subMessage={tp('bookingServiceTryAgain')}
      onRetry={retry}
    />
  );

  return (
    <>
      <SearchSummaryBar>
        <Link to="/bus/results" className="btn-ghost text-label">← {tp('backToResults')}</Link>
        <span className="text-body font-medium text-neutral-900">
          {trip.operatorName} · {trip.passengerOrigin} → {trip.passengerDestination}
        </span>
        <span className="text-body text-neutral-500">{trip.departureTime} · {trip.busClass}</span>
      </SearchSummaryBar>

      <div className="section-container py-6">
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-12 lg:gap-y-8 items-start">
          {/* Seat Selection - Left */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-20">
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-brand-600 text-label font-bold text-white">1</span>
                <h2 className="text-listing font-bold text-neutral-900 capitalize">{tp('seats')}</h2>
                <span className="text-meta text-neutral-500">({selectedSeats.length}/{totalPassengers})</span>
              </div>
              <p className="text-meta text-neutral-500 mb-3">
                {tp('selectSeatsForJourney').replace('{count}', String(totalPassengers)).replace('{plural}', totalPassengers > 1 ? 's' : '')}
              </p>

              {/* Seat legend */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3 text-meta text-neutral-600">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-white border border-neutral-300 rounded-sm" /> {tp('seatFree')}</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-brand-600 rounded-sm" /> {tp('seatYours')}</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-error-100 border border-error-200 rounded-sm" /> {tp('seatTaken')}</div>
              </div>

              {errors.seats && (
                <p className="field-error mb-3" data-error="true">{errors.seats}</p>
              )}

              {/* Seat map is the fleet's configured layout, fetched from the trip. */}
              {seatMap && (
                <SeatMapGrid
                  layout={seatMap.layout}
                  cells={seatMap.cells}
                  seats={seatMap.seats}
                  selectedLabels={selectedSeats}
                  onToggleSeat={handleSeatClick}
                />
              )}

              {/* Mini summary */}
              <div className="mt-4 pt-4 border-t border-neutral-200 text-meta">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">{tp('farePerPerson')}</span>
                  <span className="font-medium text-neutral-900">
                    {selectedFare === null ? '—' : formatCurrency(selectedFare, trip.currency, 'TSh')}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-neutral-500">{tp('checkoutTotal')}</span>
                  <span className="font-bold text-brand-600">
                    {selectedFare === null ? '—' : formatCurrency(selectedFare * totalPassengers, trip.currency, 'TSh')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Boarding/Drop-off + Passenger Information - Right */}
          <div className="lg:col-span-8 space-y-6">
            {/* Boarding & Drop-off */}
            <section className="card">
              <header className="flex items-center gap-3 border-b border-neutral-200 px-5 py-4 sm:px-6">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-brand-600 text-label font-bold text-white">2</span>
                <div className="min-w-0">
                  <h2 className="text-listing font-bold text-neutral-900">{tp('boardingAndDropoff')}</h2>
                  <p className="mt-0.5 text-meta text-neutral-500">{tp('chooseBoardingDropoff')}</p>
                </div>
              </header>
              <div className="px-5 py-5 sm:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Select
                    id="boarding_point"
                    label={tp('boardingPoint')}
                    value={boardingPoint}
                    onChange={(v) => { setBoardingPoint(v); setErrors((p) => ({ ...p, boarding: '' })); }}
                    options={trip.boardingPoints.map((bp) => ({
                      value: bp.id,
                      label: `${bp.name} · ${bp.time}`,
                    }))}
                    required
                    placeholder={tp('selectBoardingPoint')}
                  />
                  {errors.boarding && <p className="field-error -mt-2">{errors.boarding}</p>}

                  <Select
                    id="dropoff_point"
                    label={tp('dropOffPoint')}
                    value={dropOffPoint}
                    onChange={(v) => { setDropOffPoint(v); setErrors((p) => ({ ...p, dropOff: '' })); }}
                    options={trip.dropOffPoints.map((dp) => ({
                      value: dp.id,
                      label: `${dp.name} · ${dp.time}`,
                    }))}
                    required
                    placeholder={tp('selectDropOffPoint')}
                  />
                  {errors.dropOff && <p className="field-error -mt-2">{errors.dropOff}</p>}
                </div>
              </div>
            </section>

            {/* Passenger Information */}
            <section className="card">
              <header className="flex items-center gap-3 border-b border-neutral-200 px-5 py-4 sm:px-6">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-brand-600 text-label font-bold text-white">3</span>
                <div className="min-w-0">
                  <h2 className="text-listing font-bold text-neutral-900">{tp('passengerInformation')}</h2>
                  <p className="mt-0.5 text-meta text-neutral-500">
                    {tp('enterPassengerDetails').replace('{count}', String(totalPassengers)).replace('{plural}', totalPassengers === 1 ? '' : 's')} {tp('fieldsMarkedRequired')}
                  </p>
                </div>
              </header>

              <div className="px-5 py-5 sm:px-6">
                <div className="mb-5">
                  <TravelerPartyNote
                    adults={bookingState.searchParams.adults}
                    children={bookingState.searchParams.children}
                  />
                </div>
                {errors.party && (
                  <p role="alert" className="mb-5 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-meta text-error-700">
                    {errors.party}
                  </p>
                )}
                {selectedSeats.length === 0 ? (
                  <div className="text-center py-12 text-neutral-400">
                    <p className="text-body">{tp('selectSeatsForDetails')}</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {passengers.map((p, i) => (
                      <div key={p.id} className="passenger-block" data-error={errors[`name_${i}`] ? 'true' : undefined}>
                        <PassengerForm
                          passenger={p}
                          index={i}
                          onChange={(updated) => handlePassengerChange(i, updated)}
                          showSeatLabel
                          errors={{
                            name: errors[`name_${i}`],
                            email: errors[`email_${i}`],
                            phone: errors[`phone_${i}`],
                            gender: errors[`gender_${i}`],
                            category: errors[`category_${i}`],
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <footer className="flex flex-col gap-4 rounded-b-xl border-t border-neutral-200 bg-neutral-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <span className="text-meta text-neutral-600">{tp('pricesIn').replace('{currency}', trip.currency)}</span>
                <div className="flex w-full items-center justify-between gap-5 sm:w-auto sm:justify-end">
                  <div className="text-left sm:text-right">
                    <p className="text-meta text-neutral-500">{tp('checkoutTotal')}</p>
                    <p className="text-listing font-bold text-brand-600">
                      {selectedFare === null ? '—' : formatCurrency(selectedFare * totalPassengers, trip.currency, 'TSh')}
                    </p>
                  </div>
                  <button
                    onClick={() => void handleContinue()}
                    disabled={selectedSeats.length !== totalPassengers || placingHold}
                    className="btn-primary px-7"
                  >
                    {placingHold ? tp('checkoutStateProcessing') : tp('reviewYourBooking')}
                  </button>
                </div>
              </footer>
              {holdError && (
                <p className="px-5 pb-4 text-meta font-medium text-error-700 sm:px-6" role="alert">
                  {holdError}
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
