import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, Bus as BusIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { BUS_TRIPS } from '@/data/mockData';
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
      const found = BUS_TRIPS.find((t) => t.id === tripId);
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
      e.seats = `Please select ${totalPassengers} seat${totalPassengers > 1 ? 's' : ''}. You have selected ${selectedSeats.length}.`;
    }

    if (!boardingPoint) e.boarding = 'Please select a boarding point';
    if (!dropOffPoint) e.dropOff = 'Please select a drop-off point';

    passengers.forEach((p, i) => {
      if (!p.fullName) e[`name_${i}`] = 'Required';
      if (!p.email) e[`email_${i}`] = 'Required';
      if (!p.phone) e[`phone_${i}`] = 'Required';
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
        <Link to="/bus/results" className="btn-ghost text-label"><ArrowLeft size={16} /> Back to results</Link>
        <span className="text-body font-medium text-neutral-900">Select your seats</span>
      </SearchSummaryBar>
      <LoadingState message="Loading seat map..." />
    </>
  );

  if (error || !trip) return (
    <ErrorState
      message="Unable to load this trip"
      subMessage="The selected trip could not be found. Please go back and try again."
      onRetry={() => navigate('/bus/results')}
    />
  );

  return (
    <>
      <SearchSummaryBar>
        <Link to="/bus/results" className="btn-ghost text-label"><ArrowLeft size={16} /> Back to results</Link>
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
              <div className="flex items-baseline gap-2 mb-3">
                <h2 className="text-listing font-bold text-neutral-900">1 · Seats</h2>
                <span className="text-meta text-neutral-500">({selectedSeats.length}/{totalPassengers})</span>
              </div>
              <p className="text-meta text-neutral-500 mb-3">
                Select {totalPassengers} seat{totalPassengers > 1 ? 's' : ''} for your journey
              </p>

              {/* Seat legend */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-meta text-neutral-600">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-white border border-neutral-300 rounded-sm" /> Free</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-brand-600 rounded-sm" /> Yours</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-neutral-300 rounded-sm" /> Taken</div>
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
                        <span className="text-[10px] text-brand-600 font-medium uppercase tracking-wider">Front</span>
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
                                <div key={colIdx} className="w-10 h-10 rounded-md bg-neutral-200 flex items-center justify-center" title="Driver">
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
                                    ? 'bg-neutral-300 text-neutral-400 cursor-not-allowed'
                                    : 'bg-white border-2 border-neutral-300 text-neutral-700 hover:border-brand-500 hover:bg-brand-50'
                                }`}
                                aria-label={`Seat ${seat.label} ${isOccupied ? 'occupied' : isSelected ? 'selected' : 'available'}`}
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
                  <span className="text-neutral-500">Fare per person</span>
                  <span className="font-medium text-neutral-900">{formatCurrency(trip.segmentFare, trip.currency, 'TSh')}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-neutral-500">Total</span>
                  <span className="font-bold text-brand-600">{formatCurrency(trip.segmentFare * totalPassengers, trip.currency, 'TSh')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Boarding/Drop-off + Passenger Information - Right */}
          <div className="lg:col-span-8 space-y-8">
            {/* Boarding & Drop-off */}
            <section>
              <h2 className="text-listing font-bold text-neutral-900 mb-1">2 · Boarding &amp; drop-off</h2>
              <p className="text-meta text-neutral-500 mb-4">Choose where you get on and off for this bus journey.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Select
                  id="boarding_point"
                  label="Boarding point"
                  value={boardingPoint}
                  onChange={(v) => { setBoardingPoint(v); setErrors((p) => ({ ...p, boarding: '' })); }}
                  options={trip.boardingPoints.map((bp) => ({
                    value: bp.id,
                    label: `${bp.name} · ${bp.time}`,
                  }))}
                  required
                  placeholder="Select boarding point"
                />
                {errors.boarding && <p className="field-error -mt-2">{errors.boarding}</p>}

                <Select
                  id="dropoff_point"
                  label="Drop-off point"
                  value={dropOffPoint}
                  onChange={(v) => { setDropOffPoint(v); setErrors((p) => ({ ...p, dropOff: '' })); }}
                  options={trip.dropOffPoints.map((dp) => ({
                    value: dp.id,
                    label: `${dp.name} · ${dp.time}`,
                  }))}
                  required
                  placeholder="Select drop-off point"
                />
                {errors.dropOff && <p className="field-error -mt-2">{errors.dropOff}</p>}
              </div>

            {/* Passenger Information */}
            </section>
            <section>
              <h2 className="text-listing font-bold text-neutral-900 mb-1">3 · Passenger information</h2>
              <p className="text-meta text-neutral-500 mb-5">
                Enter details for {totalPassengers} passenger{totalPassengers > 1 ? 's' : ''}. Fields marked * are required.
              </p>

              {selectedSeats.length === 0 ? (
                <div className="text-center py-12 text-neutral-400">
                  <p className="text-body">Select seats on the left to enter passenger details.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {passengers.map((p, i) => (
                    <div key={p.id} data-error={errors[`name_${i}`] ? 'true' : undefined}>
                      <PassengerForm
                        passenger={p}
                        index={i}
                        onChange={(updated) => handlePassengerChange(i, updated)}
                        showSeatLabel
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-5 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
                <span className="text-meta text-neutral-600">Prices in {trip.currency}</span>
                <button
                  onClick={handleContinue}
                  disabled={selectedSeats.length !== totalPassengers}
                  className="btn-primary px-7"
                >
                  Review booking
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
