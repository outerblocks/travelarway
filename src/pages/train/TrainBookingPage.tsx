import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from '@/router';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { PassengerForm, createPassenger } from '@/components/shared/PassengerForm';
import { Select } from '@/components/ui/Select';
import { CoachSeatMap } from '@/components/train/CoachSeatMap';
import { sgrCarsToTrainCoaches, type SgrCarView } from '@/components/train/coach-geometry';
import { ErrorState, LoadingState, SearchSummaryBar } from '@/components/shared/States';
import { formatMoney } from '@/domain/money';
import type { PassengerInfo, TrainCoach, TrainSeat } from '@/types';

/**
 * SGR seat selection and passenger details.
 *
 * The seat map is the trip's own layout from `/api/sgr/trips/:id/classes/:code/cars`, so the
 * geometry, the seats that are not ours to sell, and the seats somebody else is currently
 * holding all come from the same place the hold will be written to.
 *
 * Seats are **held before review**, not at payment. Without that, two passengers can pick the
 * same seat, both pay, and the disagreement is resolved at the platform — which is the one
 * outcome a booking site is not allowed to produce. A 409 refreshes the map rather than
 * guessing which seat went.
 */

interface ServerQuote {
  unitFare: number;
  currency: string;
  fareSource: string;
  total: number;
  lines: { label: string; count: number; amount: number }[];
}

/**
 * The cars of one class on one trip, for one travel interval.
 *
 * A hook rather than inline effect code because a round trip needs two of these, and the
 * loading / not-found / refresh behaviour must be identical for both legs. A return leg that
 * quietly behaved differently is exactly the kind of asymmetry that shows up as a passenger
 * holding one seat and no seat on the way home.
 */
function useSgrClassCars(
  tripId: string | undefined,
  seatClassCode: string | undefined,
  fromSeq: number,
  toSeq: number,
  refresh: number,
): { cars: SgrCarView[]; loading: boolean; error: 'none' | 'map' | 'trip' } {
  const [cars, setCars] = useState<SgrCarView[]>([]);
  const [loading, setLoading] = useState(Boolean(tripId));
  const [error, setError] = useState<'none' | 'map' | 'trip'>('none');

  useEffect(() => {
    if (!tripId || !seatClassCode) {
      // Not applicable rather than not found: a one-way booking has no return leg, and
      // reporting its absent trip as an error would fail the whole page.
      setCars([]);
      setLoading(false);
      setError('none');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('none');
    (async () => {
      try {
        const response = await fetch(
          `/api/sgr/trips/${tripId}/classes/${seatClassCode}/cars?from=${fromSeq}&to=${toSeq}`,
        );
        if (cancelled) return;
        if (response.status === 404) {
          setError('trip');
          setCars([]);
          return;
        }
        if (!response.ok) {
          setError('map');
          setCars([]);
          return;
        }
        const payload = (await response.json()) as { cars?: SgrCarView[] };
        setCars(payload.cars ?? []);
      } catch {
        if (!cancelled) {
          setError('map');
          setCars([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tripId, seatClassCode, fromSeq, toSeq, refresh]);

  return { cars, loading, error };
}

/**
 * The server's price for a leg, asked again here rather than carried over from the results
 * list. A total that has travelled through the client is one the client could have changed.
 */
function useSgrQuote(
  tripId: string | undefined,
  seatClassCode: string | undefined,
  adults: number,
  children: number,
  fromSeq: number,
  toSeq: number,
): { quote: ServerQuote | null; error: string | null } {
  const [quote, setQuote] = useState<ServerQuote | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId || !seatClassCode) {
      setQuote(null);
      setError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(
          `/api/sgr/trips/${tripId}/quote?class=${seatClassCode}&adults=${adults}&children=${children}&from=${fromSeq}&to=${toSeq}`,
        );
        if (cancelled) return;
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          setQuote(null);
          setError(body.error ?? 'quote_failed');
          return;
        }
        setQuote((await response.json()) as ServerQuote);
        setError(null);
      } catch {
        if (!cancelled) setError('quote_failed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tripId, seatClassCode, adults, children, fromSeq, toSeq]);

  return { quote, error };
}

function seatKeyOf(seatId: string): { coachNo: number; seatNumber: number } | null {
  const [coach, seat] = seatId.split('-');
  const coachNo = Number(coach);
  const seatNumber = Number(seat);
  if (!Number.isInteger(coachNo) || !Number.isInteger(seatNumber)) return null;
  return { coachNo, seatNumber };
}

/**
 * A hold key derived from what is being asked for, not from a clock.
 *
 * A random or time-based key breaks in both directions: retrying the same request would take
 * a *second* block of seats, while changing the selection and continuing would re-join the
 * *first* block and hand back seats the passenger no longer wants. Deriving it from the trip,
 * the interval and the sorted seat set gives the one behaviour that is right — same request,
 * same answer; different request, different hold.
 */
function holdKeyFor(tripId: string, fromSeq: number, toSeq: number, seats: string[]): string {
  const sorted = [...seats].sort().join('.');
  return `sgr:${tripId}:${fromSeq}-${toSeq}:${sorted}`;
}

export function TrainBookingPage() {
  const navigate = useNavigate();
  const { bookingState, setPassengers, setSearchParams } = useApp();
  const { tp } = useI18n();

  const [passengers, setPassengersState] = useState<PassengerInfo[]>([]);
  const [outboundSeats, setOutboundSeats] = useState<string[]>([]);
  const [returnSeats, setReturnSeats] = useState<string[]>([]);
  const [outboundCoach, setOutboundCoach] = useState(0);
  const [returnCoach, setReturnCoach] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [placingHold, setPlacingHold] = useState(false);
  const [holdError, setHoldError] = useState('');
  const [holdRefresh, setHoldRefresh] = useState(0);

  const extras = bookingState.searchParams.extras ?? {};
  const tripId = extras.trainId;
  const seatClassCode = extras.classId;
  const fromSeq = Number(extras.fromSeq);
  const toSeq = Number(extras.toSeq);
  const returnTripId = extras.returnTrainId;
  const returnClassCode = extras.returnClassId;
  const returnFromSeq = Number(extras.returnFromSeq ?? extras.fromSeq);
  const returnToSeq = Number(extras.returnToSeq ?? extras.toSeq);
  const totalPax = bookingState.searchParams.adults + bookingState.searchParams.children;

  const haveSelection = Boolean(tripId && seatClassCode && Number.isInteger(fromSeq) && Number.isInteger(toSeq) && toSeq > fromSeq);
  const isRoundTrip = Boolean(returnTripId && returnClassCode);

  const outbound = useSgrClassCars(tripId, seatClassCode, fromSeq, toSeq, holdRefresh);
  const returnLeg = useSgrClassCars(returnTripId, returnClassCode, returnFromSeq, returnToSeq, holdRefresh);
  const outboundQuote = useSgrQuote(tripId, seatClassCode, bookingState.searchParams.adults, bookingState.searchParams.children, fromSeq, toSeq);
  const returnQuote = useSgrQuote(returnTripId, returnClassCode, bookingState.searchParams.adults, bookingState.searchParams.children, returnFromSeq, returnToSeq);

  const loading = outbound.loading || (isRoundTrip && returnLeg.loading);
  const loadError: 'none' | 'map' | 'trip' = outbound.error !== 'none' ? outbound.error : returnLeg.error;
  const quote = outboundQuote.quote;
  const quoteError = outboundQuote.error ?? (isRoundTrip ? returnQuote.error : null);
  const total = (outboundQuote.quote?.total ?? 0) + (isRoundTrip ? returnQuote.quote?.total ?? 0 : 0);
  const currency = outboundQuote.quote?.currency ?? 'TZS';

  useEffect(() => {
    if (bookingState.passengers.length === totalPax) {
      setPassengersState(bookingState.passengers);
      return;
    }
    setPassengersState((previous) =>
      previous.length === totalPax ? previous : Array.from({ length: totalPax }, () => createPassenger()),
    );
  }, [totalPax, bookingState.passengers]);

  const coaches: TrainCoach[] = useMemo(() => sgrCarsToTrainCoaches(outbound.cars), [outbound.cars]);
  const returnCoaches: TrainCoach[] = useMemo(() => sgrCarsToTrainCoaches(returnLeg.cars), [returnLeg.cars]);
  const activeCoach = outboundCoach || coaches[0]?.number || 0;
  const activeReturnCoach = returnCoach || returnCoaches[0]?.number || 0;

  const handleChange = (index: number, updated: PassengerInfo) => {
    setPassengersState((current) => current.map((passenger, i) => (i === index ? updated : passenger)));
  };

  const handleResidencyChange = (index: number, value: string) => {
    if (value !== 'resident' && value !== 'non_resident') {
      throw new Error(`Unsupported train residency value: ${value}`);
    }
    const passenger = passengers[index];
    if (!passenger) throw new Error(`Train passenger at index ${index} does not exist.`);
    handleChange(index, { ...passenger, trainResidency: value });
  };

  const toggleSeat = (leg: 'outbound' | 'return', seat: TrainSeat) => {
    const selected = leg === 'outbound' ? outboundSeats : returnSeats;
    const setSelected = leg === 'outbound' ? setOutboundSeats : setReturnSeats;
    if (selected.includes(seat.id)) {
      setSelected(selected.filter((id) => id !== seat.id));
      setErrors((previous) => ({ ...previous, seats: '' }));
      return;
    }
    if (selected.length >= totalPax) return;
    setSelected([...selected, seat.id]);
    setErrors((previous) => ({ ...previous, seats: '' }));
    setHoldError('');
  };

  const seatLabel = (seatId?: string) => {
    if (!seatId) return '';
    const [coach, seat] = seatId.split('-');
    return `${tp('trainCoachLabel').replace('{number}', coach)} · ${tp('trainSeatLabel')} ${seat}`;
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    passengers.forEach((passenger, index) => {
      if (!passenger.fullName.trim()) nextErrors[`name_${index}`] = tp('requiredLabel');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passenger.email.trim())) {
        nextErrors[`email_${index}`] = tp('validEmailRequired');
      }
      if (passenger.phone.replace(/\D/g, '').length < 7) {
        nextErrors[`phone_${index}`] = tp('validPhoneRequired');
      }
      if (!passenger.idNumber?.trim()) nextErrors[`identity_${index}`] = tp('requiredLabel');
      if (!passenger.category) nextErrors[`category_${index}`] = tp('requiredLabel');
      if (!passenger.trainResidency) nextErrors[`residency_${index}`] = tp('requiredLabel');
      if (passenger.trainHasLuggage === undefined) nextErrors[`luggage_${index}`] = tp('requiredLabel');
      if (passenger.trainRequiresWheelchair === undefined) nextErrors[`wheelchair_${index}`] = tp('requiredLabel');
    });
    if (outboundSeats.length < totalPax) nextErrors.seats = tp('trainSeatRequired');
    if (isRoundTrip && returnSeats.length < totalPax) nextErrors.seats = tp('trainSeatRequired');
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  /** One hold per leg; a round trip that only held the outward seats is not a round trip. */
  async function placeHold(legTripId: string, legClassCode: string, legFrom: number, legTo: number, seatIds: string[]) {
    const seats = seatIds.map(seatKeyOf).filter(Boolean) as { coachNo: number; seatNumber: number }[];
    const response = await fetch('/api/sgr/holds', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        tripId: legTripId,
        holdKey: holdKeyFor(legTripId, legFrom, legTo, seatIds),
        seats,
        fromSeq: legFrom,
        toSeq: legTo,
      }),
    });
    if (response.status === 409) {
      const body = (await response.json().catch(() => ({}))) as { seats?: unknown[] };
      throw Object.assign(new Error('seats_unavailable'), { seats: body.seats });
    }
    if (!response.ok) throw new Error('hold_failed');
    return (await response.json()) as { holdId: string; releaseToken?: string };
  }

  const handleContinue = async () => {
    if (!validate() || !tripId) return;

    setHoldError('');
    setPlacingHold(true);
    try {
      const outboundHold = await placeHold(tripId, seatClassCode as string, fromSeq, toSeq, outboundSeats);
      let returnHoldId: string | undefined;
      let returnHoldReleaseToken: string | undefined;
      if (isRoundTrip) {
        const returnHold = await placeHold(
          returnTripId as string,
          returnClassCode as string,
          returnFromSeq,
          returnToSeq,
          returnSeats,
        );
        returnHoldId = returnHold.holdId;
        returnHoldReleaseToken = returnHold.releaseToken;
      }

      // A hold from an earlier attempt that the passenger has since changed. Releasing it here
      // stops abandoned selections squatting seats until the expiry sweeper runs.
      if (extras.holdId && extras.holdId !== outboundHold.holdId) {
        void fetch(`/api/sgr/holds?holdId=${extras.holdId}`, {
          method: 'DELETE',
          headers: extras.holdReleaseToken ? { 'x-hold-release': extras.holdReleaseToken } : {},
        }).catch(() => undefined);
      }

      setSearchParams({
        ...bookingState.searchParams,
        extras: {
          ...extras,
          holdId: outboundHold.holdId,
          ...(outboundHold.releaseToken ? { holdReleaseToken: outboundHold.releaseToken } : {}),
          returnHoldId: returnHoldId ?? extras.returnHoldId,
          ...(returnHoldReleaseToken ? { returnHoldReleaseToken } : {}),
        },
      });
      setPassengers(
        passengers.map((passenger, index) => ({
          ...passenger,
          seatId: outboundSeats[index],
          ...(isRoundTrip ? { returnSeatId: returnSeats[index] } : {}),
        })),
      );
      navigate('/train/review');
    } catch (error) {
      if ((error as Error).message === 'seats_unavailable') {
        setHoldError(tp('trainHoldFailed'));
        // Whichever leg failed, both maps are redrawn: the outbound hold that just succeeded
        // changed the return train's availability too, and a stale map invites a second failure.
        setHoldRefresh((value) => value + 1);
      } else {
        setHoldError(tp('bookingServiceTryAgain'));
      }
    } finally {
      setPlacingHold(false);
    }
  };

  if (!haveSelection) {
    return (
      <ErrorState
        message={tp('trainNotFound')}
        subMessage={tp('selectedTripMissing')}
        onRetry={() => navigate('/train/results')}
      />
    );
  }

  if (loading) {
    return (
      <>
        <SearchSummaryBar>
          <Link to="/train/results" className="btn-ghost text-label">← {tp('backToResults')}</Link>
        </SearchSummaryBar>
        <LoadingState message={tp('loadingTrainDetails')} />
      </>
    );
  }

  if (loadError === 'trip') {
    return <ErrorState message={tp('trainNotFound')} onRetry={() => navigate('/train/results')} />;
  }
  if (loadError === 'map' || coaches.length === 0) {
    return (
      <ErrorState
        message={tp('trainSeatMapUnavailable')}
        onRetry={() => setHoldRefresh((value) => value + 1)}
      />
    );
  }

  return (
    <>
      <SearchSummaryBar>
        <Link to="/train/results" className="btn-ghost text-label">← {tp('backToResults')}</Link>
        <span className="text-body font-medium text-neutral-900">
          {bookingState.searchParams.origin} → {bookingState.searchParams.destination} · {seatClassCode}
        </span>
      </SearchSummaryBar>

      <div className="section-container py-6">
        <nav aria-label={tp('trainBookingProgress')} className="mb-6">
          <ol className="flex flex-wrap items-center gap-2 text-meta sm:gap-4">
            {[tp('trainJourneyStep'), tp('trainPassengerStep'), tp('trainReviewStep')].map((step, index) => (
              <li key={step} className="flex items-center gap-2 sm:gap-4">
                <span className={`flex items-center gap-2 ${index === 1 ? 'font-semibold text-brand-700' : index < 1 ? 'font-medium text-neutral-700' : 'text-neutral-400'}`}>
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${index < 1 ? 'bg-brand-100 text-brand-700' : index === 1 ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                    {index + 1}
                  </span>
                  {step}
                </span>
                {index < 2 && <span aria-hidden="true" className="h-px w-5 bg-neutral-200 sm:w-10" />}
              </li>
            ))}
          </ol>
        </nav>

        <div className="grid grid-cols-1 items-start gap-x-8 gap-y-6 lg:grid-cols-12 lg:gap-y-8">
          <div className="lg:col-span-5">
          <section className="card overflow-visible lg:sticky lg:top-20">
            <header className="border-b border-neutral-200 px-5 py-5 sm:px-6">
              <h1 className="text-listing font-bold text-neutral-900">{tp('trainSeatsStep')}</h1>
              <p className="mt-1 text-meta text-neutral-500">{tp('trainSeatIntro')}</p>
            </header>
            <div className="px-5 py-5 sm:px-6">
              <CoachSeatMap
                coaches={coaches}
                coachNumber={activeCoach}
                onCoachChange={setOutboundCoach}
                selectedSeatIds={outboundSeats}
                onToggleSeat={(seat) => toggleSeat('outbound', seat)}
                disabled={placingHold}
              />
              {errors.seats && <p className="field-error mt-3">{errors.seats}</p>}

              {isRoundTrip && returnCoaches.length > 0 && (
                <div className="mt-8 border-t border-neutral-200 pt-6">
                  <h2 className="mb-3 text-listing font-bold text-neutral-900">{tp('trainReturnSeats')}</h2>
                  <CoachSeatMap
                    coaches={returnCoaches}
                    coachNumber={activeReturnCoach}
                    onCoachChange={setReturnCoach}
                    selectedSeatIds={returnSeats}
                    onToggleSeat={(seat) => toggleSeat('return', seat)}
                    disabled={placingHold}
                  />
                </div>
              )}

              {holdError && (
                <p className="mt-3 rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-meta text-error-700" role="alert">
                  {holdError}
                </p>
              )}
            </div>
          </section>
          </div>

          <div className="lg:col-span-7">
          <section className="card overflow-visible">
            <header className="border-b border-neutral-200 px-5 py-5 sm:px-6">
              <h1 className="text-listing font-bold text-neutral-900">{tp('passengerInformation')}</h1>
              <p className="mt-1 text-meta text-neutral-500">{tp('trainPassengerIntro')}</p>
            </header>

            <div className="space-y-8 px-5 py-5 sm:px-6">
              <p className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-meta text-brand-800">
                {tp('trainGuestBooking')}
              </p>

              {passengers.map((passenger, index) => (
                <article key={passenger.id} className="passenger-block space-y-4">
                  <div className="flex flex-wrap items-center gap-2 rounded-lg bg-neutral-50 px-4 py-2 text-meta text-neutral-700">
                    <span className="font-semibold text-neutral-900">
                      {outboundSeats[index] ? seatLabel(outboundSeats[index]) : tp('trainSeatPending')}
                    </span>
                    {isRoundTrip && (
                      <span className="text-neutral-500">
                        · {tp('return')}: {returnSeats[index] ? seatLabel(returnSeats[index]) : tp('trainSeatPending')}
                      </span>
                    )}
                  </div>
                  <PassengerForm
                    passenger={passenger}
                    index={index}
                    onChange={(updated) => handleChange(index, updated)}
                    showGender={false}
                    showCountryOfResidence={false}
                    showIdentification={false}
                    categoryLabel={tp('trainTicketType')}
                    categoryOptionLabels={{
                      adult: tp('trainAdultTicket'),
                      child: tp('trainChildTicket'),
                    }}
                    errors={{
                      name: errors[`name_${index}`],
                      email: errors[`email_${index}`],
                      phone: errors[`phone_${index}`],
                      category: errors[`category_${index}`],
                    }}
                  />

                  <div className="grid grid-cols-1 gap-4 px-1 sm:grid-cols-2 sm:px-5">
                    <div>
                      <label htmlFor={`train_identity_${passenger.id}`} className="input-label">
                        {tp('trainIdentityNumber')}<span className="ml-0.5 text-error-600">*</span>
                      </label>
                      <input
                        id={`train_identity_${passenger.id}`}
                        type="text"
                        autoComplete="off"
                        className="input-field"
                        value={passenger.idNumber ?? ''}
                        onChange={(event) => handleChange(index, { ...passenger, idNumber: event.target.value })}
                        aria-invalid={Boolean(errors[`identity_${index}`])}
                        aria-describedby={errors[`identity_${index}`] ? `train_identity_error_${passenger.id}` : undefined}
                        required
                      />
                      {errors[`identity_${index}`] && (
                        <p id={`train_identity_error_${passenger.id}`} className="field-error">{errors[`identity_${index}`]}</p>
                      )}
                    </div>
                    <Select
                      id={`train_residency_${passenger.id}`}
                      label={tp('trainNationality')}
                      value={passenger.trainResidency ?? ''}
                      onChange={(value) => handleResidencyChange(index, value)}
                      options={[
                        { value: 'resident', label: tp('resident') },
                        { value: 'non_resident', label: tp('nonResident') },
                      ]}
                      required
                      placeholder={tp('trainSelectAnswer')}
                      error={errors[`residency_${index}`]}
                    />
                    <Select
                      id={`train_luggage_${passenger.id}`}
                      label={tp('trainLuggage')}
                      value={passenger.trainHasLuggage === undefined ? '' : passenger.trainHasLuggage ? 'yes' : 'no'}
                      onChange={(value) => {
                        if (value !== 'yes' && value !== 'no') {
                          throw new Error(`Unsupported train luggage value: ${value}`);
                        }
                        handleChange(index, { ...passenger, trainHasLuggage: value === 'yes' });
                      }}
                      options={[
                        { value: 'no', label: tp('no') },
                        { value: 'yes', label: tp('yes') },
                      ]}
                      required
                      placeholder={tp('trainSelectAnswer')}
                      error={errors[`luggage_${index}`]}
                    />
                    <fieldset
                      aria-required="true"
                      aria-invalid={Boolean(errors[`wheelchair_${index}`])}
                      aria-describedby={errors[`wheelchair_${index}`] ? `train_wheelchair_error_${passenger.id}` : undefined}
                    >
                      <legend className="input-label">
                        {tp('trainWheelchair')}<span className="ml-0.5 text-error-600">*</span>
                      </legend>
                      <div className="flex min-h-[3.25rem] items-center gap-5">
                        {(['no', 'yes'] as const).map((value) => (
                          <label key={value} className="flex cursor-pointer items-center gap-2 text-body text-neutral-700">
                            <input
                              type="radio"
                              name={`train_wheelchair_${passenger.id}`}
                              value={value}
                              checked={passenger.trainRequiresWheelchair === (value === 'yes')}
                              onChange={() => handleChange(index, { ...passenger, trainRequiresWheelchair: value === 'yes' })}
                              className="h-4 w-4 accent-brand-600"
                              required
                            />
                            {tp(value)}
                          </label>
                        ))}
                      </div>
                      {errors[`wheelchair_${index}`] && (
                        <p id={`train_wheelchair_error_${passenger.id}`} className="field-error">{errors[`wheelchair_${index}`]}</p>
                      )}
                    </fieldset>
                  </div>
                </article>
              ))}

            </div>
            <footer className="flex flex-col gap-4 rounded-b-xl border-t border-neutral-200 bg-neutral-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-meta text-neutral-600">
                {quote ? tp('pricesIn').replace('{currency}', currency) : tp('trainFarePending')}
              </span>
              <div className="flex w-full items-center justify-between gap-5 sm:w-auto sm:justify-end">
                <div className="text-left sm:text-right">
                  <p className="text-meta text-neutral-500">{tp('checkoutTotal')}</p>
                  <p className="text-listing font-bold text-brand-600">
                    {quote && (!isRoundTrip || returnQuote.quote) ? formatMoney(total, currency) : '—'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleContinue()}
                  disabled={placingHold || !quote || (isRoundTrip && !returnQuote.quote) || quoteError !== null}
                  className="btn-primary px-7 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {placingHold ? tp('trainSeatsHeld') : tp('continueToReview')}
                </button>
              </div>
            </footer>
            {quoteError === 'child_fare_unavailable' && (
              <p className="border-t border-warning-200 bg-warning-50 px-5 py-3 text-meta text-warning-800" role="alert">
                {tp('trainFarePending')} — {tp('trainProvisionalFareNotice')}
              </p>
            )}
          </section>
          </div>
        </div>
      </div>
    </>
  );
}
