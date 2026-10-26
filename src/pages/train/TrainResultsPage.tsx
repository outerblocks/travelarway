import { useState, useEffect } from 'react';
import { useNavigate, Link } from '@/router';
import { ArrowLeft, Clock, TrainFront, Users } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { TRAIN_SERVICES } from '@/data/mockData';
import { locationMatches } from '@/domain/search';
import { GenericResultsSkeleton } from '@/components/shared/Skeletons';
import { LoadingState, EmptyResults, ErrorState, SearchSummaryBar } from '@/components/shared/States';
import { formatCurrency, formatDate } from '@/utils/format';
import type { TrainService } from '@/types';

export function TrainResultsPage() {
  const navigate = useNavigate();
  const { bookingState, setSearchParams } = useApp();
  const { tp } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [results, setResults] = useState<TrainService[]>([]);

  const params = bookingState.searchParams;

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      try {
        let r = [...TRAIN_SERVICES];
        if (params.origin && params.destination) {
          r = r.filter((t) =>
            locationMatches(params.origin, [t.departureStation]) &&
            locationMatches(params.destination, [t.arrivalStation])
          );
        }
        if (r.length === 0 && !params.origin) r = TRAIN_SERVICES;
        setResults(r);
        setLoading(false);
      } catch {
        setError(true);
        setLoading(false);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [params.origin, params.destination]);

  const handleSelect = (service: TrainService, classId: string) => {
    setSearchParams({ ...params, extras: { ...params.extras, trainId: service.id, classId } });
    navigate('/train/booking');
  };

  if (loading) return (
    <>
      <SearchSummaryBar>
        <Link to="/" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('modifySearch')}</Link>
        <span className="text-body text-neutral-500">
          {params.date ? formatDate(params.date) : ''}
          {params.returnDate ? ` · ${tp('return')} ${formatDate(params.returnDate)}` : ''}
        </span>
      </SearchSummaryBar>
      <GenericResultsSkeleton count={3} />
      <LoadingState message={tp('searchingTrainServices')} />
    </>
  );

  if (error) return <ErrorState message={tp('unableLoadTrains')} onRetry={() => window.location.reload()} />;

  return (
    <>
      <SearchSummaryBar>
        <Link to="/" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('modifySearch')}</Link>
        <span className="text-body font-medium text-neutral-900">
          {tp('trainSearch')}
          {params.date ? ` · ${formatDate(params.date)}` : ''}
          {params.returnDate ? ` · ${tp('return')} ${formatDate(params.returnDate)}` : ''}
        </span>
      </SearchSummaryBar>

      <div className="section-container py-6">
        <h1 className="text-page font-bold text-neutral-900 mb-6">{tp('trainServiceCount').replace('{count}', String(results.length))}</h1>

        {results.length === 0 ? (
          <EmptyResults message={tp('noTrainsFound')} subMessage={tp('tryDifferentDateRoute')} />
        ) : (
          <div className="space-y-3">
            {results.map((service) => (
              <div key={service.id} className="ticket-row animate-fade-in p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-brand-50 rounded-sm flex items-center justify-center">
                    <TrainFront size={20} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="text-body font-bold text-neutral-900">{service.trainName}</p>
                    <p className="text-meta text-neutral-500">{service.operatorName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-meta text-neutral-500 uppercase tracking-wide">{tp('departure')}</p>
                    <p className="text-body font-bold text-neutral-900">{service.departureTime}</p>
                    <p className="text-meta text-neutral-500">{service.departureStation}</p>
                  </div>
                  <div>
                    <p className="text-meta text-neutral-500 uppercase tracking-wide">{tp('arrival')}</p>
                    <p className="text-body font-bold text-neutral-900">{service.arrivalTime}</p>
                    <p className="text-meta text-neutral-500">{service.arrivalStation}</p>
                  </div>
                  <div>
                    <p className="text-meta text-neutral-500 uppercase tracking-wide">{tp('durationLabel')}</p>
                    <p className="text-body font-medium text-neutral-900 flex items-center gap-1"><Clock size={14} /> {service.duration}</p>
                  </div>
                  <div>
                    <p className="text-meta text-neutral-500 uppercase tracking-wide">{tp('ticketDate')}</p>
                    <p className="text-body font-medium text-neutral-900">{formatDate(service.departureDate)}</p>
                  </div>
                </div>

                <div className="border-t border-neutral-200 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {service.classes.map((cls) => (
                      <div key={cls.id} className="border border-neutral-200 rounded-sm p-3 flex items-center justify-between">
                        <div>
                          <p className="text-body font-bold text-neutral-900">{cls.name}</p>
                          <p className="text-meta text-neutral-500 flex items-center gap-1">
                            <Users size={12} /> {cls.availableSeats} seats
                          </p>
                          {!cls.hasSeatSelection && <p className="text-meta text-neutral-400">{tp('seatSelectionUnavailable')}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-body font-bold text-brand-600">{formatCurrency(cls.fare, cls.currency, cls.currency === 'KES' ? 'KSh' : 'TSh')}</p>
                          <button onClick={() => handleSelect(service, cls.id)} className="btn-primary text-meta px-3 py-1.5 mt-1">{tp('bookButton')}</button>
                        </div>
                      </div>
                    ))}
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
