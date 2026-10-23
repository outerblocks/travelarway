import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, BedDouble } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { STAY_PROPERTIES } from '@/data/mockData';
import { GenericResultsSkeleton } from '@/components/shared/Skeletons';
import { LoadingState, EmptyResults, ErrorState, SearchSummaryBar } from '@/components/shared/States';
import { formatCurrency, formatDate, nightsBetween } from '@/utils/format';
import type { StayProperty } from '@/types';

const STAY_IMAGES: Record<string, string> = {
  'stay_001': 'https://images.pexels.com/photos/6434592/pexels-photo-6434592.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'stay_002': 'https://images.pexels.com/photos/7507131/pexels-photo-7507131.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'stay_003': 'https://images.pexels.com/photos/6466496/pexels-photo-6466496.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
};

export function StaysResultsPage() {
  const navigate = useNavigate();
  const { bookingState, setSearchParams } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [results, setResults] = useState<StayProperty[]>([]);

  const params = bookingState.searchParams;
  const nights = params.date && params.extras?.checkOut ? nightsBetween(params.date, params.extras.checkOut) : 1;

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      try {
        let r = [...STAY_PROPERTIES];
        if (params.origin) {
          r = r.filter((s) => s.city.toLowerCase().includes(params.origin!.toLowerCase()) || s.location.toLowerCase().includes(params.origin!.toLowerCase()));
        }
        if (r.length === 0 && !params.origin) r = STAY_PROPERTIES;
        setResults(r);
        setLoading(false);
      } catch {
        setError(true);
        setLoading(false);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [params.origin]);

  const handleSelect = (prop: StayProperty) => {
    setSearchParams({ ...params, extras: { ...params.extras, propertyId: prop.id } });
    navigate('/stays/detail');
  };

  if (loading) return (
    <>
      <SearchSummaryBar><Link to="/" className="btn-ghost text-label"><ArrowLeft size={16} /> Modify search</Link></SearchSummaryBar>
      <GenericResultsSkeleton count={3} />
      <LoadingState message="Searching accommodations..." />
    </>
  );

  if (error) return <ErrorState message="Unable to load stays" onRetry={() => window.location.reload()} />;

  return (
    <>
      <SearchSummaryBar>
        <Link to="/" className="btn-ghost text-label"><ArrowLeft size={16} /> Modify search</Link>
        <span className="text-body font-medium text-neutral-900">{params.origin || 'All destinations'}</span>
        <span className="text-body text-neutral-500">
          {params.date ? formatDate(params.date) : ''} · {nights} night{nights > 1 ? 's' : ''} · {params.adults} adults
        </span>
      </SearchSummaryBar>

      <div className="section-container py-6">
        <h1 className="text-page font-bold text-neutral-900 mb-6">{results.length} properties found</h1>

        {results.length === 0 ? (
          <EmptyResults message="No properties found" subMessage="Try a different destination or date." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((prop) => {
              const minPrice = Math.min(...prop.rooms.map((r) => r.pricePerNight));
              return (
                <div key={prop.id} className="card overflow-hidden hover:shadow-md transition-shadow animate-fade-in cursor-pointer" onClick={() => handleSelect(prop)}>
                  <img src={STAY_IMAGES[prop.id]} alt={prop.name} className="w-full h-48 object-cover" loading="lazy" />
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="text-listing font-bold text-neutral-900">{prop.name}</h3>
                        <p className="text-meta text-neutral-500 flex items-center gap-1">
                          <MapPin size={12} /> {prop.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-meta">
                        <Star size={14} className="text-warning-500 fill-warning-500" />
                        <span className="font-medium text-neutral-700">{prop.starRating}</span>
                      </div>
                    </div>
                    <p className="text-meta text-neutral-500 mb-3">{prop.type} · {prop.distanceFromCenter}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {prop.amenities.slice(0, 3).map((a) => (
                        <span key={a} className="text-meta text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-sm">{a}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                      <div>
                        <p className="text-meta text-neutral-500">from</p>
                        <p className="text-body font-bold text-brand-600">{formatCurrency(minPrice, prop.rooms[0].currency, 'TSh')}<span className="text-meta text-neutral-500 font-normal">/night</span></p>
                      </div>
                      <span className="text-meta text-neutral-500">{prop.rooms.reduce((s, r) => s + r.available, 0)} rooms left</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
