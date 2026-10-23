import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, MapPin, Users, Wifi, Zap, Snowflake, Armchair, Bus as BusIcon, CircleDot, Circle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { BUS_TRIPS } from '@/data/mockData';
import { BusResultsSkeleton } from '@/components/shared/Skeletons';
import { LoadingState, EmptyResults, ErrorState, SearchSummaryBar } from '@/components/shared/States';
import { formatCurrency, formatDate } from '@/utils/format';
import type { BusTrip } from '@/types';

const AMENITY_ICONS: Record<string, typeof Wifi> = {
  'WiFi': Wifi,
  'USB Charging': Zap,
  'Air Conditioning': Snowflake,
  'Reclining Seats': Armchair,
  'Reading Light': CircleDot,
  'Blanket': Circle,
  'Snack Service': Circle,
};

export function BusResultsPage() {
  const navigate = useNavigate();
  const { bookingState, setSelectedServiceId, setSearchParams } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [trips, setTrips] = useState<BusTrip[]>([]);

  const params = bookingState.searchParams;

  useEffect(() => {
    setLoading(true);
    setError(false);
    const timer = setTimeout(() => {
      try {
        let results = [...BUS_TRIPS];

        if (params.origin && params.destination) {
          results = results.filter((t) => {
            const allStops = [t.serviceOrigin, ...t.intermediateStops.map((s) => s.name), t.serviceDestination];
            const originIdx = allStops.findIndex((s) =>
              s.toLowerCase().includes(params.origin!.toLowerCase()) ||
              params.origin!.toLowerCase().includes(s.toLowerCase())
            );
            const destIdx = allStops.findIndex((s) =>
              s.toLowerCase().includes(params.destination!.toLowerCase()) ||
              params.destination!.toLowerCase().includes(s.toLowerCase())
            );
            return originIdx !== -1 && destIdx !== -1 && originIdx < destIdx;
          });
        }

        if (results.length === 0 && !params.origin) {
          setTrips(BUS_TRIPS);
        } else {
          setTrips(results);
        }
        setLoading(false);
      } catch {
        setError(true);
        setLoading(false);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [params.origin, params.destination, params.date]);

  const handleBook = (trip: BusTrip) => {
    setSelectedServiceId(trip.id);
    setSearchParams({
      ...params,
      extras: { ...params.extras, tripId: trip.id },
    });
    navigate('/bus/booking');
  };

  const originName = trips[0]?.passengerOrigin || params.origin || 'Origin';
  const destName = trips[0]?.passengerDestination || params.destination || 'Destination';

  if (loading) return (
    <>
      <SearchSummaryBar>
        <Link to="/" className="btn-ghost text-label"><ArrowLeft size={16} /> Modify search</Link>
        <span className="text-body font-medium text-neutral-900">{originName} → {destName}</span>
        <span className="text-body text-neutral-500">{params.date ? formatDate(params.date) : ''} · {params.adults + params.children} passengers</span>
      </SearchSummaryBar>
      <BusResultsSkeleton />
      <LoadingState message="Finding available buses..." />
    </>
  );

  if (error) return (
    <ErrorState
      message="Unable to load search results"
      subMessage="There was a problem connecting to the booking service. Please try again."
      onRetry={() => window.location.reload()}
    />
  );

  return (
    <>
      <SearchSummaryBar>
        <Link to="/" className="btn-ghost text-label"><ArrowLeft size={16} /> Modify search</Link>
        <span className="text-body font-medium text-neutral-900">{originName} → {destName}</span>
        <span className="text-body text-neutral-500">{params.date ? formatDate(params.date) : ''} · {params.adults + params.children} passengers</span>
      </SearchSummaryBar>

      <main className="section-container py-7">
        <div className="mb-5">
          <h1 className="text-page font-bold text-neutral-900 tracking-tight">{originName} <span className="text-brand-600">→</span> {destName}</h1>
          <p className="text-body text-neutral-500 mt-1">
            {params.date ? formatDate(params.date) : 'Select your travel date'} · {params.adults + params.children} passenger{params.adults + params.children !== 1 ? 's' : ''} · {trips.length} buses
          </p>
        </div>

        {trips.length === 0 ? (
          <EmptyResults
            message="No trips found for this route"
            subMessage="Try a different date or route. Buses may not operate this segment on the selected date."
          />
        ) : (
          <div className="space-y-4">
            {trips.map((trip) => {
              const viaStops = trip.intermediateStops.filter((stop) => stop.name !== trip.passengerDestination);
              return (
                <article key={trip.id} className="border border-neutral-200 rounded-sm bg-white overflow-hidden hover:border-brand-300 transition-colors animate-fade-in">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-3 border-b border-neutral-200 text-meta text-neutral-600">
                    <MapPin size={14} className="text-neutral-500 shrink-0" />
                    <span className="font-medium">Journey:</span>
                    <span>{trip.departureTerminal}</span>
                    <ArrowRight size={14} className="text-neutral-400 shrink-0" />
                    <span>{trip.arrivalTerminal}</span>
                    {viaStops.length > 0 && (
                      <span className="ml-1 inline-flex items-center rounded-sm bg-brand-50 px-2 py-1 text-meta font-medium text-brand-700">
                        Via {viaStops.map((stop) => stop.name).join(', ')}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[minmax(210px,29%)_minmax(360px,1fr)_110px_145px] gap-x-5 gap-y-5 px-4 py-5 lg:px-5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 shrink-0 bg-brand-600 text-white rounded-sm flex items-center justify-center text-body font-bold">{trip.operatorLogo}</div>
                      <div className="min-w-0">
                        <p className="text-body font-bold text-neutral-900 truncate">{trip.operatorName}</p>
                        <p className="text-meta font-medium text-brand-600 uppercase tracking-wide truncate">{trip.busClass}</p>
                        <p className="text-meta text-neutral-500 truncate">{trip.busModel} · {trip.registrationNumber}</p>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-end gap-4">
                        <div className="shrink-0">
                          <p className="text-section font-bold leading-none text-neutral-900">{trip.departureTime}</p>
                          <p className="text-meta text-neutral-500 mt-1">Morning · {formatDate(trip.departureDate)}</p>
                          <p className="text-meta text-neutral-700 mt-1 truncate">{trip.passengerOrigin}</p>
                        </div>
                        <div className="flex-1 min-w-[100px] pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full border-2 border-brand-600 bg-white shrink-0" />
                            <div className="relative h-px flex-1 bg-neutral-300">
                              <span className="absolute left-1/2 -top-2 -translate-x-1/2 whitespace-nowrap text-meta text-neutral-500 flex items-center gap-1"><Clock size={11} /> {trip.duration}</span>
                            </div>
                            <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0" />
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-neutral-200 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        {trip.amenities.slice(0, 5).map((amenity) => {
                          const Icon = AMENITY_ICONS[amenity] || Armchair;
                          return <span key={amenity} className="inline-flex items-center gap-1 text-meta text-neutral-600"><Icon size={13} className="text-brand-600" />{amenity}</span>;
                        })}
                      </div>
                    </div>

                    <div className="flex lg:flex-col justify-center lg:items-center gap-2 lg:border-l lg:border-neutral-200 lg:pl-4">
                      <div className="lg:text-center">
                        <p className="text-section font-bold leading-none text-neutral-900">{trip.arrivalTime}</p>
                        <p className="text-meta text-neutral-500 mt-1">{trip.arrivalDate !== trip.departureDate ? 'Next day' : 'Same day'}</p>
                        <p className="text-meta text-neutral-700 mt-1">{trip.passengerDestination}</p>
                      </div>
                    </div>

                    <div className="flex lg:flex-col items-start lg:items-end justify-between lg:justify-center gap-3 lg:border-l lg:border-neutral-200 lg:pl-4">
                      <div>
                        <p className="text-section font-bold leading-none text-brand-600 whitespace-nowrap">{formatCurrency(trip.segmentFare, trip.currency, 'TSh')}</p>
                        <p className="text-meta text-neutral-500 mt-1 flex items-center gap-1"><Users size={12} /> {trip.availableSeats} seats left</p>
                      </div>
                      <button onClick={() => handleBook(trip)} className="btn-primary whitespace-nowrap">Book Bus</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
