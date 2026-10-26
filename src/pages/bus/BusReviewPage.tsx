import { useState, useEffect } from 'react';
import { useNavigate, Link } from '@/router';
import { ArrowLeft, Pencil, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { getBusTrip } from '@/data/operations';
import { LoadingState, ErrorState, SearchSummaryBar } from '@/components/shared/States';
import { formatDate } from '@/utils/format';
import { formatMoney } from '@/domain/money';
import { quoteBusTrip } from '@/domain/pricing';
import type { BusTrip } from '@/types';

export function BusReviewPage() {
  const navigate = useNavigate();
  const { bookingState } = useApp();
  const { tp } = useI18n();
  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState<BusTrip | null>(null);

  const tripId = bookingState.searchParams.extras?.tripId || bookingState.selectedServiceId;

  useEffect(() => {
    const timer = setTimeout(() => {
      const found = getBusTrip(tripId);
      if (found) setTrip(found);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [tripId]);

  if (loading) return (
    <>
      <SearchSummaryBar>
        <Link to="/bus/booking" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('checkoutBack')}</Link>
        <span className="text-body font-medium text-neutral-900">{tp('reviewYourBooking')}</span>
      </SearchSummaryBar>
      <LoadingState message={tp('preparingBookingReview')} />
    </>
  );

  if (!trip) return (
    <ErrorState
      message={tp('unableLoadBookingReview')}
      subMessage={tp('pleaseGoBackTryAgain')}
      onRetry={() => navigate('/bus/results')}
    />
  );

  const boardingPoint = trip.boardingPoints.find((bp) => bp.id === bookingState.boardingPointId);
  const dropOffPoint = trip.dropOffPoints.find((dp) => dp.id === bookingState.dropOffPointId);
  const quote = quoteBusTrip(trip, bookingState.searchParams.adults, bookingState.searchParams.children);
  const total = quote.total;

  const ReviewSection = ({ title, children, onEdit }: { title: string; children: React.ReactNode; onEdit?: () => void }) => (
    <div className="card p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-listing font-bold text-neutral-900">{title}</h3>
        {onEdit && (
          <button onClick={onEdit} className="btn-ghost text-label">
            <Pencil size={14} /> {tp('editButton')}
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
        <Link to="/bus/booking" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('checkoutBack')}</Link>
        <span className="text-body font-medium text-neutral-900">{tp('bookingReview')}</span>
      </SearchSummaryBar>

      <div className="section-container py-6">
        <h1 className="text-page font-bold text-neutral-900 mb-6">{tp('reviewYourBooking')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ReviewSection title={tp('serviceDetails')} onEdit={() => navigate('/bus/results')}>
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
                <Detail label={tp('passengerJourney')} value={`${trip.passengerOrigin} → ${trip.passengerDestination}`} />
                <Detail label={tp('fullServiceRoute')} value={`${trip.serviceOrigin} → ${trip.serviceDestination}`} />
                <Detail label={tp('departure')} value={`${trip.departureTime} · ${trip.departureTerminal}`} />
                <Detail label={tp('arrival')} value={`${trip.arrivalTime} · ${trip.arrivalTerminal}`} />
                <Detail label={tp('ticketDate')} value={formatDate(trip.departureDate)} />
                <Detail label={tp('durationLabel')} value={trip.duration} />
              </div>
            </ReviewSection>

            <ReviewSection title={tp('boardingSection')} onEdit={() => navigate('/bus/booking')}>
              <div className="grid grid-cols-2 gap-x-6">
                <Detail label={tp('boardingPoint')} value={boardingPoint ? `${boardingPoint.name} · ${boardingPoint.time}` : '-'} />
                <Detail label={tp('dropOffPoint')} value={dropOffPoint ? `${dropOffPoint.name} · ${dropOffPoint.time}` : '-'} />
              </div>
            </ReviewSection>

            <ReviewSection title={tp('passengersCount').replace('{count}', String(bookingState.passengers.length))} onEdit={() => navigate('/bus/booking')}>
              <div className="space-y-3">
                {bookingState.passengers.map((p, i) => (
                  <div key={p.id} className="flex items-start gap-4 py-2 border-b border-neutral-100 last:border-b-0">
                    <div className="w-7 h-7 bg-brand-50 text-brand-600 rounded-sm flex items-center justify-center text-meta font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-body font-medium text-neutral-900">
                        {p.fullName} <span className="text-meta text-neutral-500 capitalize">· {tp(p.category === 'infant' ? 'infant' : p.category)}</span>
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
            <div className="card p-6 sticky top-20">
              <h3 className="text-listing font-bold text-neutral-900 mb-4">{tp('fareSummary')}</h3>
              <div className="space-y-2 mb-4">
                {quote.lines.map((line, i) => (
                  <div key={i} className="flex justify-between text-body">
                    <span className="text-neutral-500">{line.label}</span>
                    <span className="text-neutral-900">{formatMoney(line.amount, quote.currency)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-neutral-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-listing font-bold text-neutral-900">{tp('checkoutTotal')}</span>
                  <span className="text-listing font-bold text-brand-600">
                    {formatMoney(total, quote.currency)}
                  </span>
                </div>
              </div>

              <button onClick={() => navigate('/checkout')} className="btn-primary w-full mt-6">
                <Check size={18} /> {tp('proceedToCheckout')}
              </button>

              <p className="text-meta text-neutral-400 mt-4 text-center">
                {tp('fareRevalidationNote')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
