import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, MapPin, Star } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { STAY_PROPERTIES } from '@/data/mockData';
import { PassengerForm, createPassenger } from '@/components/shared/PassengerForm';
import { LoadingState, ErrorState, SearchSummaryBar } from '@/components/shared/States';
import { formatCurrency, formatDate, nightsBetween } from '@/utils/format';
import type { PassengerInfo } from '@/types';

const STAY_IMAGES: Record<string, string> = {
  'stay_001': 'https://images.pexels.com/photos/6434592/pexels-photo-6434592.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'stay_002': 'https://images.pexels.com/photos/7507131/pexels-photo-7507131.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'stay_003': 'https://images.pexels.com/photos/6466496/pexels-photo-6466496.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
};

export function StaysReviewPage() {
  const navigate = useNavigate();
  const { bookingState, setPassengers } = useApp();
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<typeof STAY_PROPERTIES[0] | null>(null);
  const [guest, setGuest] = useState<PassengerInfo>(createPassenger('adult'));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const propertyId = bookingState.searchParams.extras?.propertyId;
  const roomId = bookingState.searchParams.extras?.roomId;
  const params = bookingState.searchParams;
  const nights = params.date && params.extras?.checkOut ? nightsBetween(params.date, params.extras.checkOut) : 1;
  const rooms = parseInt(params.extras?.rooms || '1');

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
    if (!guest.fullName) e.name = 'Required';
    if (!guest.email) e.email = 'Required';
    if (!guest.phone) e.phone = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  if (loading) return <><SearchSummaryBar><Link to="/stays/detail" className="btn-ghost text-label"><ArrowLeft size={16} /> Back</Link></SearchSummaryBar><LoadingState /></>;
  if (!property) return <ErrorState message="Property not found" onRetry={() => navigate('/stays/results')} />;

  const room = property.rooms.find((r) => r.id === roomId);
  if (!room) return <ErrorState message="Room not found" onRetry={() => navigate('/stays/detail')} />;

  const totalPrice = room.pricePerNight * nights * rooms;
  const taxes = Math.round(totalPrice * 0.18);
  const grandTotal = totalPrice + taxes;

  return (
    <>
      <SearchSummaryBar><Link to="/stays/detail" className="btn-ghost text-label"><ArrowLeft size={16} /> Back</Link><span className="text-body font-medium text-neutral-900">Review your stay</span></SearchSummaryBar>
      <div className="section-container py-6">
        <h1 className="text-page font-bold text-neutral-900 mb-6">Review your booking</h1>
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
                <div className="flex justify-between py-1"><span className="text-body text-neutral-500">Check-in</span><span className="text-body font-medium text-neutral-900">{formatDate(params.date || '')}</span></div>
                <div className="flex justify-between py-1"><span className="text-body text-neutral-500">Check-out</span><span className="text-body font-medium text-neutral-900">{formatDate(params.extras?.checkOut || '')}</span></div>
                <div className="flex justify-between py-1"><span className="text-body text-neutral-500">Nights</span><span className="text-body font-medium text-neutral-900">{nights}</span></div>
                <div className="flex justify-between py-1"><span className="text-body text-neutral-500">Rooms</span><span className="text-body font-medium text-neutral-900">{rooms}</span></div>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="text-listing font-bold text-neutral-900 mb-4">Guest Information</h3>
              <PassengerForm passenger={guest} index={0} onChange={(u) => setGuest(u)} />
              <div className="mt-6 pt-6 border-t border-neutral-200 flex justify-end">
                <button onClick={() => { if (validate()) { setPassengers([guest]); navigate('/checkout'); } }} className="btn-primary">Proceed to Checkout</button>
              </div>
            </div>
          </div>

          <div>
            <div className="card p-6 sticky top-20">
              <h3 className="text-listing font-bold text-neutral-900 mb-4">Price Summary</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-body"><span className="text-neutral-500">{room.name} × {nights} night{nights > 1 ? 's' : ''}</span><span className="text-neutral-900">{formatCurrency(totalPrice, room.currency, 'TSh')}</span></div>
                <div className="flex justify-between text-body"><span className="text-neutral-500">Taxes (18%)</span><span className="text-neutral-900">{formatCurrency(taxes, room.currency, 'TSh')}</span></div>
              </div>
              <div className="border-t border-neutral-200 pt-4">
                <div className="flex justify-between"><span className="text-listing font-bold text-neutral-900">Total</span><span className="text-listing font-bold text-brand-600">{formatCurrency(grandTotal, room.currency, 'TSh')}</span></div>
              </div>
              <p className="text-meta text-neutral-400 mt-4">{property.cancellationPolicy}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
