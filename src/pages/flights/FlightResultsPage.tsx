import { useState, useEffect } from 'react';
import { useNavigate, Link } from '@/router';
import { ArrowLeft, Plane, Clock, Briefcase, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { FLIGHT_RESULTS } from '@/data/mockData';
import { locationMatches } from '@/domain/search';
import { GenericResultsSkeleton } from '@/components/shared/Skeletons';
import { LoadingState, EmptyResults, ErrorState, SearchSummaryBar } from '@/components/shared/States';
import { formatCurrency, formatDate } from '@/utils/format';
import type { FlightResult } from '@/types';

export function FlightResultsPage() {
  const navigate = useNavigate();
  const { bookingState, setSearchParams } = useApp();
  const { tp } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [results, setResults] = useState<FlightResult[]>([]);

  const params = bookingState.searchParams;

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      try {
        let r = [...FLIGHT_RESULTS];
        if (params.origin && params.destination) {
          r = r.filter((f) =>
            f.segments.some((s) =>
              locationMatches(params.origin, [s.origin, s.originCity]) &&
              locationMatches(params.destination, [s.destination, s.destinationCity])
            )
          );
        }
        if (r.length === 0 && !params.origin) r = FLIGHT_RESULTS;
        setResults(r);
        setLoading(false);
      } catch {
        setError(true);
        setLoading(false);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [params.origin, params.destination]);

  const handleSelect = (flight: FlightResult) => {
    setSearchParams({ ...params, extras: { ...params.extras, flightId: flight.id } });
    navigate('/flights/booking');
  };

  if (loading) return (
    <>
      <SearchSummaryBar>
        <Link to="/" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('modifySearch')}</Link>
        <span className="text-body font-medium text-neutral-900">{tp('flightSearch')}</span>
      </SearchSummaryBar>
      <GenericResultsSkeleton count={4} />
      <LoadingState message={tp('searchingFlights')} />
    </>
  );

  if (error) return <ErrorState message={tp('unableLoadFlights')} onRetry={() => window.location.reload()} />;

  return (
    <>
      <SearchSummaryBar>
        <Link to="/" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('modifySearch')}</Link>
        <span className="text-body font-medium text-neutral-900">{params.origin || tp('departure')} → {params.destination || tp('destination')}</span>
        <span className="text-body text-neutral-500">{params.date ? formatDate(params.date) : ''} · {tp('adultCount').replace('{count}', String(params.adults)).replace('{plural}', params.adults === 1 ? '' : 's')}</span>
      </SearchSummaryBar>

      <div className="section-container py-6">
        <h1 className="text-page font-bold text-neutral-900 mb-6">{tp('flightCount').replace('{count}', String(results.length))}</h1>

        {results.length === 0 ? (
          <EmptyResults message={tp('noFlightsFound')} subMessage={tp('tryDifferentDateRoute')} />
        ) : (
          <div className="space-y-3">
            {results.map((flight) => (
              <div key={flight.id} className="ticket-row animate-fade-in p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    {flight.segments.map((seg, i) => (
                      <div key={i} className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 bg-brand-50 rounded-sm flex items-center justify-center">
                          <Plane size={20} className="text-brand-600" />
                        </div>
                        <div>
                          <p className="text-body font-bold text-neutral-900">{seg.airline} · {seg.flightNumber}</p>
                          <p className="text-meta text-neutral-500">{seg.aircraft}</p>
                        </div>
                        <div className="flex-1 ml-4">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-body font-bold text-neutral-900">{seg.departureTime}</p>
                              <p className="text-meta text-neutral-500">{seg.originCity} ({seg.origin})</p>
                            </div>
                            <div className="flex-1 flex items-center gap-2">
                              <div className="flex-1 h-px bg-neutral-300 relative">
                                <Plane size={14} className="absolute left-1/2 -top-2 -translate-x-1/2 text-neutral-400 rotate-0" />
                              </div>
                              <span className="text-meta text-neutral-500 flex items-center gap-1">
                                <Clock size={12} /> {seg.duration}
                              </span>
                              <div className="flex-1 h-px bg-neutral-300" />
                            </div>
                            <div>
                              <p className="text-body font-bold text-neutral-900">{seg.arrivalTime}</p>
                              <p className="text-meta text-neutral-500">{seg.destinationCity} ({seg.destination})</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center gap-3 mt-2 text-meta text-neutral-500">
                      <span className="flex items-center gap-1"><Briefcase size={12} /> {flight.baggageInfo}</span>
                      {flight.refundable ? (
                        <span className="flex items-center gap-1 text-accent-600"><Check size={12} /> {tp('refundable')}</span>
                      ) : (
                        <span>{tp('nonRefundable')}</span>
                      )}
                    </div>
                  </div>

                  <div className="lg:text-right lg:border-l lg:border-neutral-200 lg:pl-6">
                    <p className="text-meta text-neutral-500 uppercase tracking-wide">{tp('totalPrice')}</p>
                    <p className="text-listing font-bold text-brand-600 whitespace-nowrap">
                      {formatCurrency(flight.totalPrice, flight.currency, 'TSh')}
                    </p>
                    <p className="text-meta text-neutral-500">{flight.cabinClass}</p>
                    <button onClick={() => handleSelect(flight)} className="btn-primary mt-2 whitespace-nowrap">
                      {tp('selectFlight')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
