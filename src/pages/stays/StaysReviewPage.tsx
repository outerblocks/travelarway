import { useState, useEffect } from 'react';
import { useNavigate, Link } from '@/router';
import { ArrowLeft, MapPin, Star } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { STAY_PROPERTIES } from '@/data/mockData';
import { PassengerForm, createPassenger } from '@/components/shared/PassengerForm';
import { LoadingState, ErrorState, SearchSummaryBar } from '@/components/shared/States';
import { formatDate } from '@/utils/format';
import { formatMoney } from '@/domain/money';
import { quoteStay, stayNightsOf, stayRoomsOf } from '@/domain/pricing';
import type { PassengerInfo } from '@/types';

const STAY_IMAGES: Record<string, string> = {
  'stay_001': 'https://images.pexels.com/photos/6434592/pexels-photo-6434592.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'stay_002': 'https://images.pexels.com/photos/7507131/pexels-photo-7507131.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'stay_003': 'https://images.pexels.com/photos/6466496/pexels-photo-6466496.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
};

export function StaysReviewPage() {
  const navigate = useNavigate();
  const { bookingState, setPassengers } = useApp();
  const { tp } = useI18n();
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<typeof STAY_PROPERTIES[0] | null>(null);
  const [guest, setGuest] = useState<PassengerInfo>(createPassenger('adult'));
  const [, setErrors] = useState<Record<string, string>>({});

  const propertyId = bookingState.searchParams.extras?.propertyId;
  const roomId = bookingState.searchParams.extras?.roomId;
  const params = bookingState.searchParams;
  const nights = stayNightsOf(params);
  const rooms = stayRoomsOf(params);

  useEffect(() => {
    const timer = setTimeout(() => {
      const found = STAY_PROPERTIES.find((p) => p.id === propertyId);
      if (found) setProperty(found);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [propertyId]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!guest.fullName) e.name = tp('requiredField');
    if (!guest.email) e.email = tp('requiredField');
    if (!guest.phone) e.phone = tp('requiredField');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  if (loading) return <><SearchSummaryBar><Link to="/stays/detail" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('checkoutBack')}</Link></SearchSummaryBar><LoadingState message={tp('preparingBookingReview')} /></>;
  if (!property) return <ErrorState message={tp('propertyNotFound')} onRetry={() => navigate('/stays/results')} />;

  const room = property.rooms.find((r) => r.id === roomId);
  if (!room) return <ErrorState message={tp('roomNotFound')} onRetry={() => navigate('/stays/detail')} />;

  const quote = quoteStay(room, nights, rooms);

  return (
    <>
      <SearchSummaryBar><Link to="/stays/detail" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('checkoutBack')}</Link><span className="text-body font-medium text-neutral-900">{tp('reviewStay')}</span></SearchSummaryBar>
      <div className="section-container py-6">
        <h1 className="text-page font-bold text-neutral-900 mb-6">{tp('reviewYourBooking')}</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-5">
              <div className="flex items-start gap-4">
                <img src={STAY_IMAGES[property.id]} alt={property.name} className="w-24 h-24 object-cover rounded-sm flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-listing font-bold text-neutral-900">{property.name}</h3>
                  <p className="text-meta text-neutral-500 flex items-center gap-1"><MapPin size={12} /> {property.location}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: property.starRating }).map((_, i) => <Star key={i} size={12} className="text-warning-500 fill-warning-500" />)}
                  </div>
                  <p className="text-body text-neutral-700 mt-2">{room.name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 mt-4 pt-4 border-t border-neutral-100">
                <div className="flex justify-between py-1"><span className="text-body text-neutral-500">{tp('checkIn')}</span><span className="text-body font-medium text-neutral-900">{formatDate(params.date || '')}</span></div>
                <div className="flex justify-between py-1"><span className="text-body text-neutral-500">{tp('checkOut')}</span><span className="text-body font-medium text-neutral-900">{formatDate(params.extras?.checkOut || '')}</span></div>
                <div className="flex justify-between py-1"><span className="text-body text-neutral-500">{tp('nights')}</span><span className="text-body font-medium text-neutral-900">{nights}</span></div>
                <div className="flex justify-between py-1"><span className="text-body text-neutral-500">{tp('rooms')}</span><span className="text-body font-medium text-neutral-900">{rooms}</span></div>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="text-listing font-bold text-neutral-900 mb-4">{tp('guestInformation')}</h3>
              <PassengerForm passenger={guest} index={0} onChange={(u) => setGuest(u)} />
              <div className="mt-6 pt-6 border-t border-neutral-200 flex justify-end">
                <button onClick={() => { if (validate()) { setPassengers([guest]); navigate('/checkout'); } }} className="btn-primary">{tp('proceedToCheckout')}</button>
              </div>
            </div>
          </div>

          <div>
            <div className="card p-6 sticky top-20">
              <h3 className="text-listing font-bold text-neutral-900 mb-4">{tp('priceSummary')}</h3>
              <div className="space-y-2 mb-4">
                {quote.lines.map((line, i) => (
                  <div key={i} className="flex justify-between text-body"><span className="text-neutral-500">{line.label}</span><span className="text-neutral-900">{formatMoney(line.amount, quote.currency)}</span></div>
                ))}
              </div>
              <div className="border-t border-neutral-200 pt-4">
                <div className="flex justify-between"><span className="text-listing font-bold text-neutral-900">{tp('checkoutTotal')}</span><span className="text-listing font-bold text-brand-600">{formatMoney(quote.total, quote.currency)}</span></div>
              </div>
              <p className="text-meta text-neutral-400 mt-4">{property.cancellationPolicy}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
