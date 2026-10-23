import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, Plane, Briefcase } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { FLIGHT_RESULTS } from '@/data/mockData';
import { LoadingState, ErrorState, SearchSummaryBar } from '@/components/shared/States';
import { formatCurrency, formatDate } from '@/utils/format';

export function FlightReviewPage() {
  const navigate = useNavigate();
  const { bookingState } = useApp();
  const [loading, setLoading] = useState(true);
  const [flight, setFlight] = useState<typeof FLIGHT_RESULTS[0] | null>(null);

  const flightId = bookingState.searchParams.extras?.flightId;

  useEffect(() => {
    const timer = setTimeout(() => {
      const found = FLIGHT_RESULTS.find((f) => f.id === flightId);
      if (found) setFlight(found);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [flightId]);

  if (loading) return (
    <>
      <SearchSummaryBar><Link to="/flights/booking" className="btn-ghost text-label"><ArrowLeft size={16} /> Back</Link></SearchSummaryBar>
      <LoadingState message="Preparing review..." />
    </>
  );

  if (!flight) return <ErrorState message="Flight not found" onRetry={() => navigate('/flights/results')} />;

  const Detail = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between py-1">
      <span className="text-body text-neutral-500">{label}</span>
      <span className="text-body font-medium text-neutral-900 text-right">{value}</span>
    </div>
  );

  return (
    <>
      <SearchSummaryBar>
        <Link to="/flights/booking" className="btn-ghost text-label"><ArrowLeft size={16} /> Back</Link>
        <span className="text-body font-medium text-neutral-900">Flight Booking Review</span>
      </SearchSummaryBar>

      <div className="section-container py-6">
        <h1 className="text-page font-bold text-neutral-900 mb-6">Review your booking</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-5">
              <h3 className="text-listing font-bold text-neutral-900 mb-3">Flight Details</h3>
              {flight.segments.map((seg, i) => (
                <div key={i} className="mb-3 pb-3 border-b border-neutral-100 last:border-b-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Plane size={16} className="text-brand-600" />
                    <span className="text-body font-bold text-neutral-900">{seg.airline} · {seg.flightNumber}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6">
                    <Detail label="From" value={`${seg.originCity} (${seg.origin})`} />
                    <Detail label="To" value={`${seg.destinationCity} (${seg.destination})`} />
                    <Detail label="Departure" value={seg.departureTime} />
                    <Detail label="Arrival" value={seg.arrivalTime} />
                    <Detail label="Duration" value={seg.duration} />
                    <Detail label="Aircraft" value={seg.aircraft} />
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 text-meta text-neutral-500">
                <span className="flex items-center gap-1"><Briefcase size={12} /> {flight.baggageInfo}</span>
                <span>{flight.fareConditions}</span>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="text-listing font-bold text-neutral-900 mb-3">Passengers ({bookingState.passengers.length})</h3>
              {bookingState.passengers.map((p, i) => (
                <div key={p.id} className="flex items-start gap-3 py-2 border-b border-neutral-100 last:border-b-0">
                  <div className="w-7 h-7 bg-brand-50 text-brand-600 rounded-sm flex items-center justify-center text-meta font-bold">{i + 1}</div>
                  <div>
                    <p className="text-body font-medium text-neutral-900">{p.fullName}</p>
                    <p className="text-meta text-neutral-500">{p.email} · ID: {p.idType?.replace('_', ' ')} {p.idNumber}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="card p-4 bg-warning-50 border-warning-100">
              <p className="text-body text-neutral-700">
                <strong>Note:</strong> A reservation will be created first. Ticket issuance is confirmed only after the airline/supplier confirms it. A reservation is not an issued ticket.
              </p>
            </div>
          </div>

          <div>
            <div className="card p-6 sticky top-20">
              <h3 className="text-listing font-bold text-neutral-900 mb-4">Fare Summary</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-body">
                  <span className="text-neutral-500">Base fare ({bookingState.passengers.length} pax)</span>
                  <span className="text-neutral-900">{formatCurrency(flight.totalPrice, flight.currency, 'TSh')}</span>
                </div>
                <div className="flex justify-between text-body">
                  <span className="text-neutral-500">Taxes & fees</span>
                  <span className="text-neutral-900">Included</span>
                </div>
              </div>
              <div className="border-t border-neutral-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-listing font-bold text-neutral-900">Total</span>
                  <span className="text-listing font-bold text-brand-600">{formatCurrency(flight.totalPrice, flight.currency, 'TSh')}</span>
                </div>
              </div>
              <button onClick={() => navigate('/checkout')} className="btn-primary w-full mt-6">
                <Check size={18} /> Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
