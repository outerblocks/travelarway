import { useState, useEffect } from 'react';
import { useNavigate, Link } from '@/router';
import { ArrowLeft, Check, Bus as BusIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { getBusTrip } from '@/data/operations';
import { PassengerForm, createPassenger } from '@/components/shared/PassengerForm';
import { LoadingState, ErrorState, SearchSummaryBar } from '@/components/shared/States';
import { Select } from '@/components/ui/Select';
import { formatCurrency } from '@/utils/format';
import type { BusTrip, BusSeat, PassengerInfo } from '@/types';

export function BusBookingPage() {
  const navigate = useNavigate();
  const {
    bookingState,
    setSelectedSeats,
    setPassengers,
    setBoardingPointId,
    setDropOffPointId,
  } = useApp();
  const { tp } = useI18n();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [trip, setTrip] = useState<BusTrip | null>(null);
  const [selectedSeats, setSelectedSeatsState] = useState<string[]>([]);
  const [passengers, setPassengersState] = useState<PassengerInfo[]>([]);
  const [boardingPoint, setBoardingPoint] = useState('');
  const [dropOffPoint, setDropOffPoint] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const tripId = bookingState.searchParams.extras?.tripId || bookingState.selectedServiceId;
  const totalPassengers = bookingState.searchParams.adults + bookingState.searchParams.children;

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const found = getBusTrip(tripId);
      if (found) {
        setTrip(found);
        setLoading(false);
      } else {
        setError(true);
        setLoading(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [tripId]);

  useEffect(() => {
    if (trip) {
      setBoardingPoint(trip.boardingPoints[0]?.id || '');
      setDropOffPoint(trip.dropOffPoints[trip.dropOffPoints.length - 1]?.id || '');
    }
  }, [trip]);

  const handleSeatClick = (seat: BusSeat) => {
    if (seat.type !== 'seat') return;
    if (seat.status === 'occupied') return;

    setSelectedSeatsState((prev) => {
      if (prev.includes(seat.id)) {
        const next = prev.filter((s) => s !== seat.id);
        setPassengersState((prevP) =>
          prevP.slice(0, next.length).map((p, i) => ({ ...p, seatId: next[i] }))
        );
        return next;
      }

      if (prev.length >= totalPassengers) {
        return prev;
      }

      const next = [...prev, seat.id];
      setPassengersState((prevP) => {
        const updated = [...prevP];
        while (updated.length < next.length) {
          const isChild = updated.length >= bookingState.searchParams.adults;
          updated.push(createPassenger(isChild ? 'child' : 'adult', seat.id));
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
    });

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) {
      const firstError = document.querySelector('[data-error="true"]');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSelectedSeats(selectedSeats);
    setPassengers(passengers);
    setBoardingPointId(boardingPoint);
    setDropOffPointId(dropOffPoint);
    navigate('/bus/review');
  };

  if (loading) return (
    <>
      <SearchSummaryBar>
        <Link to="/bus/results" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('backToResults')}</Link>
        <span className="text-body font-medium text-neutral-900">{tp('selectYourSeats')}</span>
      </SearchSummaryBar>
      <LoadingState message={tp('loadingSeatMap')} />
    </>
  );

  if (error || !trip) return (
    <ErrorState
      message={tp('unableLoadTrip')}
      subMessage={tp('selectedTripMissing')}
      onRetry={() => navigate('/bus/results')}
    />
  );

  return (
    <>
      <SearchSummaryBar>
        <Link to="/bus/results" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('backToResults')}</Link>
        <span className="text-body font-medium text-neutral-900">
          {trip.operatorName} · {trip.passengerOrigin} → {trip.passengerDestination}
        </span>
        <span className="text-body text-neutral-500">{trip.departureTime} · {trip.busClass}</span>
      </SearchSummaryBar>

      <div className="section-container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-8 items-start">
          {/* Seat Selection - Left */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-20">
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-label font-bold text-white">1</span>
                <h2 className="text-listing font-bold text-neutral-900 capitalize">{tp('seats')}</h2>
                <span className="text-meta text-neutral-500">({selectedSeats.length}/{totalPassengers})</span>
              </div>
              <p className="text-meta text-neutral-500 mb-3">
                {tp('selectSeatsForJourney').replace('{count}', String(totalPassengers)).replace('{plural}', totalPassengers > 1 ? 's' : '')}
              </p>

              {/* Seat legend */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-meta text-neutral-600">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-white border border-neutral-300 rounded-sm" /> {tp('seatFree')}</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-brand-600 rounded-sm" /> {tp('seatYours')}</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-error-100 border border-error-200 rounded-sm" /> {tp('seatTaken')}</div>
              </div>

              {errors.seats && (
                <p className="field-error mb-3" data-error="true">{errors.seats}</p>
              )}

              {/* Bus seat map - visual bus body */}
              <div className="overflow-x-auto">
                <div className="mx-auto" style={{ minWidth: '260px' }}>
                  {/* Bus body outline */}
                  <div className="relative bg-neutral-50 rounded-2xl border-2 border-neutral-200 p-4 pt-5 pb-5">
                    {/* Front windshield indicator */}
                    <div className="flex items-center justify-center mb-3">
                      <div className="w-3/4 h-5 bg-brand-100 rounded-t-xl flex items-center justify-center">
                        <span className="text-[10px] text-brand-600 font-medium uppercase tracking-wider">{tp('front')}</span>
                      </div>
                    </div>

                    {/* Seat rows (all rows including driver row) */}
                    <div className="flex flex-col items-center gap-2">
                      {trip.seatMap.layout.map((row, rowIdx) => (
                        <div key={rowIdx} className="flex gap-2 justify-center items-center">
                          {row.map((seat, colIdx) => {
                            if (seat.type === 'aisle') {
                              return <div key={colIdx} className="w-6" />;
                            }
                            if (seat.type === 'driver') {
                              return (
                                <div key={colIdx} className="w-10 h-10 rounded-md bg-neutral-200 flex items-center justify-center" title={tp('driver')}>
                                  <BusIcon size={16} className="text-neutral-400" />
                                </div>
                              );
                            }
                            const isSelected = selectedSeats.includes(seat.id);
                            const isOccupied = seat.status === 'occupied';
                            return (
                              <button
                                key={colIdx}
                                onClick={() => handleSeatClick(seat)}
                                disabled={isOccupied}
                                className={`w-10 h-10 rounded-md text-meta font-medium transition-all flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-brand-600 text-white border-2 border-brand-600 scale-110 shadow-md shadow-brand-200 z-10'
                                    : isOccupied
                                    ? 'bg-error-100 text-error-600 border-2 border-error-200 cursor-not-allowed'
                                    : 'bg-white border-2 border-neutral-300 text-neutral-700 hover:border-brand-500 hover:bg-brand-50'
                                }`}
                                aria-label={`${tp('seatLabel')} ${seat.label} ${isOccupied ? tp('seatOccupied') : isSelected ? tp('seatSelected') : tp('seatAvailable')}`}
                                aria-pressed={isSelected}
                              >
                                {isSelected ? <Check size={15} /> : seat.label}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    {/* Back row indicator */}
                    <div className="mt-3 flex items-center justify-center">
                      <div className="w-3/4 h-1.5 bg-neutral-200 rounded-full" />
                    </div>
                  </div>

                  {/* Bus info below the map */}
                  <div className="flex items-center justify-between mt-3 text-meta text-neutral-400 px-2">
                    <span>{trip.busModel}</span>
                    <span>{trip.registrationNumber}</span>
                  </div>
                </div>
              </div>

              {/* Mini summary */}
              <div className="mt-4 pt-4 border-t border-neutral-200 text-meta">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">{tp('farePerPerson')}</span>
                  <span className="font-medium text-neutral-900">{formatCurrency(trip.segmentFare, trip.currency, 'TSh')}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-neutral-500">{tp('checkoutTotal')}</span>
                  <span className="font-bold text-brand-600">{formatCurrency(trip.segmentFare * totalPassengers, trip.currency, 'TSh')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Boarding/Drop-off + Passenger Information - Right */}
          <div className="lg:col-span-8 space-y-6">
            {/* Boarding & Drop-off */}
            <section className="card">
              <header className="flex items-center gap-3 border-b border-neutral-200 px-5 py-4 sm:px-6">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-label font-bold text-white">2</span>
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
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-label font-bold text-white">3</span>
                <div className="min-w-0">
                  <h2 className="text-listing font-bold text-neutral-900">{tp('passengerInformation')}</h2>
                  <p className="mt-0.5 text-meta text-neutral-500">
                    {tp('enterPassengerDetails').replace('{count}', String(totalPassengers)).replace('{plural}', totalPassengers === 1 ? '' : 's')} {tp('fieldsMarkedRequired')}
                  </p>
                </div>
              </header>

              <div className="px-5 py-5 sm:px-6">
                {selectedSeats.length === 0 ? (
                  <div className="text-center py-12 text-neutral-400">
                    <p className="text-body">{tp('selectSeatsForDetails')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {passengers.map((p, i) => (
                      <div key={p.id} data-error={errors[`name_${i}`] ? 'true' : undefined}>
                        <PassengerForm
                          passenger={p}
                          index={i}
                          onChange={(updated) => handlePassengerChange(i, updated)}
                          showSeatLabel
                          errors={{
                            name: errors[`name_${i}`],
                            email: errors[`email_${i}`],
                            phone: errors[`phone_${i}`],
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
                    <p className="text-listing font-bold text-brand-600">{formatCurrency(trip.segmentFare * totalPassengers, trip.currency, 'TSh')}</p>
                  </div>
                  <button
                    onClick={handleContinue}
                    disabled={selectedSeats.length !== totalPassengers}
                    className="btn-primary px-7"
                  >
                    {tp('reviewYourBooking')}
                  </button>
                </div>
              </footer>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
