import { useState, useEffect } from 'react';
import { useNavigate, Link } from '@/router';
import { ArrowLeft, Plane } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { FLIGHT_RESULTS } from '@/data/mockData';
import { PassengerForm, createPassenger } from '@/components/shared/PassengerForm';
import { LoadingState, ErrorState, SearchSummaryBar } from '@/components/shared/States';
import type { FlightResult, PassengerInfo } from '@/types';

export function FlightBookingPage() {
  const navigate = useNavigate();
  const { bookingState, setPassengers, setSearchParams } = useApp();
  const { tp } = useI18n();
  const [loading, setLoading] = useState(true);
  const [flight, setFlight] = useState<FlightResult | null>(null);
  const [passengers, setPassengersState] = useState<PassengerInfo[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const flightId = bookingState.searchParams.extras?.flightId;
  const totalPax = bookingState.searchParams.adults + bookingState.searchParams.children;

  useEffect(() => {
    const timer = setTimeout(() => {
      const found = FLIGHT_RESULTS.find((f) => f.id === flightId);
      if (found) {
        setFlight(found);
        const pax: PassengerInfo[] = [];
        for (let i = 0; i < totalPax; i++) {
          pax.push(createPassenger(i < bookingState.searchParams.adults ? 'adult' : 'child'));
        }
        setPassengersState(pax);
        setLoading(false);
      } else {
        setLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [flightId]);

  const handleChange = (index: number, updated: PassengerInfo) => {
    setPassengersState((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    passengers.forEach((p, i) => {
      if (!p.fullName) e[`name_${i}`] = tp('requiredLabel');
      if (!p.email) e[`email_${i}`] = tp('requiredLabel');
      if (!p.phone) e[`phone_${i}`] = tp('requiredLabel');
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;
    setPassengers(passengers);
    setSearchParams({ ...bookingState.searchParams, extras: { ...bookingState.searchParams.extras, flightId: flightId || '' } });
    navigate('/flights/review');
  };

  if (loading) return (
    <>
      <SearchSummaryBar><Link to="/flights/results" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('checkoutBack')}</Link><span className="text-body font-medium text-neutral-900">{tp('flightBookingTitle')}</span></SearchSummaryBar>
      <LoadingState message={tp('loadingFlightDetails')} />
    </>
  );

  if (!flight) return <ErrorState message={tp('flightNotFound')} onRetry={() => navigate('/flights/results')} />;

  return (
    <>
      <SearchSummaryBar>
        <Link to="/flights/results" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('backToResults')}</Link>
        <span className="text-body font-medium text-neutral-900">{flight.segments[0].airline} · {flight.segments[0].flightNumber}</span>
      </SearchSummaryBar>

      <div className="section-container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h2 className="text-listing font-bold text-neutral-900 mb-1">{tp('passengerInformation')}</h2>
              <p className="text-meta text-neutral-500 mb-6">{tp('enterTravelDocumentDetails')}</p>

              <div className="space-y-4">
                {passengers.map((p, i) => (
                  <div key={p.id} data-error={errors[`name_${i}`] ? 'true' : undefined}>
                    <PassengerForm passenger={p} index={i} onChange={(u) => handleChange(i, u)} requireId errors={{
                      name: errors[`name_${i}`],
                      email: errors[`email_${i}`],
                      phone: errors[`phone_${i}`],
                    }} />
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-neutral-200 flex justify-end">
                <button onClick={handleContinue} className="btn-primary">{tp('continueToReview')}</button>
              </div>
            </div>
          </div>

          <div>
            <div className="card p-6 sticky top-20">
              <h3 className="text-listing font-bold text-neutral-900 mb-4">{tp('flightSummary')}</h3>
              {flight.segments.map((seg, i) => (
                <div key={i} className="mb-4 pb-4 border-b border-neutral-100 last:border-b-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Plane size={16} className="text-brand-600" />
                    <span className="text-body font-medium text-neutral-900">{seg.airline}</span>
                  </div>
                  <p className="text-body text-neutral-900">{seg.originCity} → {seg.destinationCity}</p>
                  <p className="text-meta text-neutral-500">{seg.departureTime} - {seg.arrivalTime} · {seg.duration}</p>
                </div>
              ))}
              <div className="border-t border-neutral-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-listing font-bold text-neutral-900">{tp('checkoutTotal')}</span>
                  <span className="text-listing font-bold text-brand-600">TSh {flight.totalPrice.toLocaleString()}</span>
                </div>
                <p className="text-meta text-neutral-500 mt-1">{flight.cabinClass} · {flight.baggageInfo}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
