import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { BUS_TRIPS } from '@/data/mockData';
import { LoadingState, ErrorState, SearchSummaryBar } from '@/components/shared/States';
import { formatCurrency, formatDate } from '@/utils/format';
import type { BusTrip, FareLine } from '@/types';

export function BusReviewPage() {
  const navigate = useNavigate();
  const { bookingState } = useApp();
  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState<BusTrip | null>(null);
  const [fareLines, setFareLines] = useState<FareLine[]>([]);

  const tripId = bookingState.searchParams.extras?.tripId || bookingState.selectedServiceId;
  const totalPassengers = bookingState.searchParams.adults + bookingState.searchParams.children;

  useEffect(() => {
    const timer = setTimeout(() => {
      const found = BUS_TRIPS.find((t) => t.id === tripId);
      if (found) {
        setTrip(found);
        const fare = found.segmentFare;
        const lines: FareLine[] = [
          { label: `Adult fare (${bookingState.searchParams.adults} × ${formatCurrency(fare, found.currency, 'TSh')})`, amount: fare * bookingState.searchParams.adults, type: 'fare' },
        ];
        if (bookingState.searchParams.children > 0) {
          lines.push({ label: `Child fare (${bookingState.searchParams.children} × ${formatCurrency(Math.round(fare * 0.5), found.currency, 'TSh')})`, amount: Math.round(fare * 0.5) * bookingState.searchParams.children, type: 'fare' });
        }
        lines.push({ label: 'Booking fee', amount: 0, type: 'fee' });
        const total = lines.filter((l) => l.type === 'fare').reduce((s, l) => s + l.amount, 0);
        lines.push({ label: 'Total payable', amount: total, type: 'total' });
        setFareLines(lines);
        setLoading(false);
      } else {
        setLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [tripId]);

  if (loading) return (
    <>
      <SearchSummaryBar>
        <Link to="/bus/booking" className="btn-ghost text-label"><ArrowLeft size={16} /> Back</Link>
        <span className="text-body font-medium text-neutral-900">Review your booking</span>
      </SearchSummaryBar>
      <LoadingState message="Preparing your booking review..." />
    </>
  );

  if (!trip) return (
    <ErrorState
      message="Unable to load booking review"
      subMessage="Please go back and try again."
      onRetry={() => navigate('/bus/results')}
    />
  );

  const boardingPoint = trip.boardingPoints.find((bp) => bp.id === bookingState.boardingPointId);
  const dropOffPoint = trip.dropOffPoints.find((dp) => dp.id === bookingState.dropOffPointId);
  const total = fareLines.find((l) => l.type === 'total')?.amount || 0;

  const ReviewSection = ({ title, children, onEdit }: { title: string; children: React.ReactNode; onEdit?: () => void }) => (
    <div className="card p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-listing font-bold text-neutral-900">{title}</h3>
        {onEdit && (
          <button onClick={onEdit} className="btn-ghost text-label">
            <Pencil size={14} /> Edit
          </button>
        )}
      </div>
      {children}
    </div>
  );

  const Detail = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between py-1">
      <span className="text-body text-neutral-500">{label}</span>
      <span className="text-body font-medium text-neutral-900 text-right">{value}</span>
    </div>
  );

  return (
    <>
      <SearchSummaryBar>
        <Link to="/bus/booking" className="btn-ghost text-label"><ArrowLeft size={16} /> Back</Link>
        <span className="text-body font-medium text-neutral-900">Booking Review</span>
      </SearchSummaryBar>

      <div className="section-container py-6">
        <h1 className="text-page font-bold text-neutral-900 mb-6">Review your booking</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ReviewSection title="Service Details" onEdit={() => navigate('/bus/results')}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand-600 text-white rounded-sm flex items-center justify-center text-body font-bold">
                  {trip.operatorLogo}
                </div>
                <div>
                  <p className="text-body font-bold text-neutral-900">{trip.operatorName}</p>
                  <p className="text-meta text-neutral-500">{trip.busClass} · {trip.busModel} · {trip.registrationNumber}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-6">
                <Detail label="Passenger journey" value={`${trip.passengerOrigin} → ${trip.passengerDestination}`} />
                <Detail label="Full service route" value={`${trip.serviceOrigin} → ${trip.serviceDestination}`} />
                <Detail label="Departure" value={`${trip.departureTime} · ${trip.departureTerminal}`} />
                <Detail label="Arrival" value={`${trip.arrivalTime} · ${trip.arrivalTerminal}`} />
                <Detail label="Date" value={formatDate(trip.departureDate)} />
                <Detail label="Duration" value={trip.duration} />
              </div>
            </ReviewSection>

            <ReviewSection title="Boarding & Drop-off" onEdit={() => navigate('/bus/booking')}>
              <div className="grid grid-cols-2 gap-x-6">
                <Detail label="Boarding point" value={boardingPoint ? `${boardingPoint.name} · ${boardingPoint.time}` : '—'} />
                <Detail label="Drop-off point" value={dropOffPoint ? `${dropOffPoint.name} · ${dropOffPoint.time}` : '—'} />
              </div>
            </ReviewSection>

            <ReviewSection title={`Passengers (${bookingState.passengers.length})`} onEdit={() => navigate('/bus/booking')}>
              <div className="space-y-3">
                {bookingState.passengers.map((p, i) => (
                  <div key={p.id} className="flex items-start gap-4 py-2 border-b border-neutral-100 last:border-b-0">
                    <div className="w-7 h-7 bg-brand-50 text-brand-600 rounded-sm flex items-center justify-center text-meta font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-body font-medium text-neutral-900">
                        {p.fullName} <span className="text-meta text-neutral-500 capitalize">· {p.category}</span>
                      </p>
                      <p className="text-meta text-neutral-500">
                        Seat {p.seatId} · {p.email} · {p.phoneCountryCode} {p.phone}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ReviewSection>
          </div>

          <div>
            <div className="card p-6 sticky top-20">
              <h3 className="text-listing font-bold text-neutral-900 mb-4">Fare Summary</h3>
              <div className="space-y-2 mb-4">
                {fareLines.filter((l) => l.type !== 'total').map((line, i) => (
                  <div key={i} className="flex justify-between text-body">
                    <span className="text-neutral-500">{line.label}</span>
                    <span className="text-neutral-900">{formatCurrency(line.amount, trip.currency, 'TSh')}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-neutral-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-listing font-bold text-neutral-900">Total</span>
                  <span className="text-listing font-bold text-brand-600">
                    {formatCurrency(total, trip.currency, 'TSh')}
                  </span>
                </div>
              </div>

              <button onClick={() => navigate('/checkout')} className="btn-primary w-full mt-6">
                <Check size={18} /> Proceed to Checkout
              </button>

              <p className="text-meta text-neutral-400 mt-4 text-center">
                Fare and availability will be revalidated before booking is confirmed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
