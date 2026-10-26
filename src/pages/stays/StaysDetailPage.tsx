import { useState, useEffect } from 'react';
import { useNavigate, Link } from '@/router';
import { ArrowLeft, Star, MapPin, Check, BedDouble } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { STAY_PROPERTIES } from '@/data/mockData';
import { LoadingState, ErrorState, SearchSummaryBar } from '@/components/shared/States';
import { formatCurrency, formatDate, nightsBetween } from '@/utils/format';

const STAY_IMAGES: Record<string, string> = {
  'stay_001': 'https://images.pexels.com/photos/6434592/pexels-photo-6434592.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'stay_002': 'https://images.pexels.com/photos/7507131/pexels-photo-7507131.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'stay_003': 'https://images.pexels.com/photos/6466496/pexels-photo-6466496.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
};

export function StaysDetailPage() {
  const navigate = useNavigate();
  const { bookingState, setSearchParams } = useApp();
  const { tp } = useI18n();
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<typeof STAY_PROPERTIES[0] | null>(null);
  const [selectedRoom, setSelectedRoom] = useState('');

  const propertyId = bookingState.searchParams.extras?.propertyId;
  const params = bookingState.searchParams;
  const nights = params.date && params.extras?.checkOut ? nightsBetween(params.date, params.extras.checkOut) : 1;
  const rooms = parseInt(params.extras?.rooms || '1');

  useEffect(() => {
    const timer = setTimeout(() => {
      const found = STAY_PROPERTIES.find((p) => p.id === propertyId);
      if (found) setProperty(found);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [propertyId]);

  const handleContinue = () => {
    if (!selectedRoom) return;
    setSearchParams({ ...params, extras: { ...params.extras, roomId: selectedRoom } });
    navigate('/stays/review');
  };

  if (loading) return <><SearchSummaryBar><Link to="/stays/results" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('backToResults')}</Link></SearchSummaryBar><LoadingState message={tp('loadingStayDetails')} /></>;
  if (!property) return <ErrorState message={tp('propertyNotFound')} onRetry={() => navigate('/stays/results')} />;

  return (
    <>
      <SearchSummaryBar>
        <Link to="/stays/results" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('backToResults')}</Link>
        <span className="text-body font-medium text-neutral-900">{property.name}</span>
      </SearchSummaryBar>

      <div className="section-container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <img src={STAY_IMAGES[property.id]} alt={property.name} className="w-full h-64 object-cover rounded-lg mb-4" />
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-page font-bold text-neutral-900">{property.name}</h1>
              <div className="flex items-center gap-1">
                {Array.from({ length: property.starRating }).map((_, i) => (
                  <Star key={i} size={14} className="text-warning-500 fill-warning-500" />
                ))}
              </div>
            </div>
            <p className="text-body text-neutral-500 flex items-center gap-1 mb-2"><MapPin size={14} /> {property.location} · {property.distanceFromCenter}</p>
            <p className="text-body text-neutral-500 mb-4">{property.type}</p>

            <div className="flex flex-wrap gap-2 mb-6">
              {property.amenities.map((a) => (
                <span key={a} className="inline-flex items-center gap-1 text-meta text-neutral-600 bg-neutral-100 px-2 py-1 rounded-sm">
                  <Check size={12} /> {a}
                </span>
              ))}
            </div>

            <h2 className="text-section font-bold text-neutral-900 mb-4">{tp('availableRooms')}</h2>
            <div className="space-y-3">
              {property.rooms.map((room) => {
                const isSelected = selectedRoom === room.id;
                const totalPrice = room.pricePerNight * nights * rooms;
                return (
                  <div key={room.id} className={`card p-4 cursor-pointer transition-all ${isSelected ? 'border-brand-600 ring-1 ring-brand-600' : 'hover:border-brand-300'}`} onClick={() => setSelectedRoom(room.id)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-listing font-bold text-neutral-900">{room.name}</h3>
                        <p className="text-body text-neutral-500 mt-1">{room.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-meta text-neutral-500">
                          <span><BedDouble size={12} className="inline mr-1" /> {tp('maxOccupancy').replace('{count}', String(room.maxOccupancy))}</span>
                          <span>{tp('roomAvailable').replace('{count}', String(room.available))}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {room.includedServices.map((s) => (
                            <span key={s} className="text-meta text-accent-600 bg-accent-50 px-2 py-0.5 rounded-sm">{s}</span>
                          ))}
                        </div>
                        <p className="text-meta text-neutral-400 mt-2">{room.cancellationPolicy}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-body font-bold text-brand-600">{formatCurrency(room.pricePerNight, room.currency, 'TSh')}</p>
                        <p className="text-meta text-neutral-500">{tp('perNight')}</p>
                        <p className="text-body font-medium text-neutral-900 mt-2">{formatCurrency(totalPrice, room.currency, 'TSh')}</p>
                        <p className="text-meta text-neutral-500">{tp('stayDuration')
                          .replace('{nights}', `${nights} ${tp(nights === 1 ? 'nightSingular' : 'nights')}`)
                          .replace('{rooms}', `${rooms} ${tp(rooms === 1 ? 'roomSingular' : 'rooms')}`)}</p>
                        {isSelected && <p className="text-meta text-brand-600 font-medium mt-1 flex items-center gap-1 justify-end"><Check size={12} /> {tp('selected')}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="card p-6 sticky top-20">
              <h3 className="text-listing font-bold text-neutral-900 mb-4">{tp('yourStay')}</h3>
              <div className="space-y-2 text-body">
                <div className="flex justify-between"><span className="text-neutral-500">{tp('checkIn')}</span><span className="font-medium text-neutral-900">{params.date ? formatDate(params.date) : '-'}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">{tp('checkOut')}</span><span className="font-medium text-neutral-900">{params.extras?.checkOut ? formatDate(params.extras.checkOut) : '-'}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">{tp('nights')}</span><span className="font-medium text-neutral-900">{nights}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">{tp('guests')}</span><span className="font-medium text-neutral-900">{params.adults + params.children}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">{tp('rooms')}</span><span className="font-medium text-neutral-900">{rooms}</span></div>
              </div>
              <button onClick={handleContinue} disabled={!selectedRoom} className="btn-primary w-full mt-6">
                {selectedRoom ? tp('continueToReview') : tp('selectRoom')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
