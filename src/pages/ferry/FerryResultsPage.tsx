import { useState, useEffect } from 'react';
import { useNavigate, Link } from '@/router';
import { ArrowLeft, Clock, Ship, Users } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { getFerrySailings } from '@/data/operations';
import { locationMatches } from '@/domain/search';
import { FerryResultsSkeleton } from '@/components/shared/Skeletons';
import { LoadingState, EmptyResults, ErrorState, SearchSummaryBar } from '@/components/shared/States';
import { formatCurrency, formatDate } from '@/utils/format';
import type { FerrySailing } from '@/types';

export function FerryResultsPage() {
  const navigate = useNavigate();
  const { bookingState, setSearchParams } = useApp();
  const { tp } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sailings, setSailings] = useState<FerrySailing[]>([]);

  const params = bookingState.searchParams;

  useEffect(() => {
    setLoading(true);
    setError(false);
    const timer = setTimeout(() => {
      try {
        let results = getFerrySailings();
        if (params.origin && params.destination) {
          results = results.filter((s) =>
            locationMatches(params.origin, [s.departurePort]) &&
            locationMatches(params.destination, [s.arrivalPort])
          );
        }
        if (results.length === 0 && !params.origin) results = getFerrySailings();
        setSailings(results);
        setLoading(false);
      } catch {
        setError(true);
        setLoading(false);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [params.origin, params.destination, params.date]);

  const handleBook = (sailing: FerrySailing) => {
    setSearchParams({
      ...params,
      extras: { ...params.extras, sailingId: sailing.id },
    });
    navigate('/ferry/booking');
  };

  if (loading) return (
    <>
      <SearchSummaryBar>
        <Link to="/" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('modifySearch')}</Link>
        <span className="text-body font-medium text-neutral-900">
          {tp('ferrySearch')}
          {params.date ? ` · ${formatDate(params.date)}` : ''}
          {params.returnDate ? ` · ${tp('return')} ${formatDate(params.returnDate)}` : ''}
        </span>
      </SearchSummaryBar>
      <FerryResultsSkeleton />
      <LoadingState message={tp('findingAvailableSailings')} />
    </>
  );

  if (error) return (
    <ErrorState
      message={tp('unableLoadSailings')}
      subMessage={tp('bookingServiceProblem')}
      onRetry={() => window.location.reload()}
    />
  );

  return (
    <>
      <SearchSummaryBar>
        <Link to="/" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('modifySearch')}</Link>
        <span className="text-body font-medium text-neutral-900">
          {sailings[0]?.departurePort || tp('departure')} → {sailings[0]?.arrivalPort || tp('arrival')}
        </span>
        <span className="text-body text-neutral-500">
          {params.date ? formatDate(params.date) : ''}
          {params.returnDate ? ` · ${tp('return')} ${formatDate(params.returnDate)}` : ''}
        </span>
      </SearchSummaryBar>

      <div className="section-container py-6">
        <h1 className="text-page font-bold text-neutral-900 mb-1">
          {tp('sailingCount').replace('{count}', String(sailings.length))}
        </h1>
        <p className="text-body text-neutral-500 mb-6">{tp('selectSailingClass')}</p>

        {sailings.length === 0 ? (
          <EmptyResults
            message={tp('noSailingsFound')}
            subMessage={tp('tryDifferentDateRoute')}
          />
        ) : (
          <div className="space-y-4">
            {sailings.map((sailing) => (
              <div key={sailing.id} className="ticket-row animate-fade-in p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-brand-600 text-white rounded-sm flex items-center justify-center text-body font-bold">
                    {sailing.operatorLogo}
                  </div>
                  <div className="flex-1">
                    <p className="text-body font-bold text-neutral-900">{sailing.operatorName}</p>
                    <p className="text-meta text-neutral-500">
                      <Ship size={12} className="inline mr-1" /> {sailing.vesselName}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-meta text-neutral-500 uppercase tracking-wide">{tp('departure')}</p>
                    <p className="text-body font-bold text-neutral-900">{sailing.departureTime}</p>
                    <p className="text-meta text-neutral-500">{sailing.departurePort}</p>
                  </div>
                  <div>
                    <p className="text-meta text-neutral-500 uppercase tracking-wide">{tp('arrival')}</p>
                    <p className="text-body font-bold text-neutral-900">{sailing.arrivalTime}</p>
                    <p className="text-meta text-neutral-500">{sailing.arrivalPort}</p>
                  </div>
                  <div>
                    <p className="text-meta text-neutral-500 uppercase tracking-wide">{tp('durationLabel')}</p>
                    <p className="text-body font-medium text-neutral-900 flex items-center gap-1">
                      <Clock size={14} /> {sailing.duration}
                    </p>
                  </div>
                  <div>
                    <p className="text-meta text-neutral-500 uppercase tracking-wide">{tp('ticketDate')}</p>
                    <p className="text-body font-medium text-neutral-900">{formatDate(sailing.departureDate)}</p>
                  </div>
                </div>

                <div className="border-t border-neutral-200 pt-4">
                  <p className="text-label font-medium text-neutral-700 mb-3">{tp('availableClasses')}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sailing.classes.map((cls) => (
                      <div key={cls.id} className="border border-neutral-200 rounded-sm p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-body font-bold text-neutral-900">{cls.name}</span>
                          <span className="text-meta text-neutral-500 flex items-center gap-1">
                            <Users size={12} /> {tp('availableCount').replace('{count}', String(cls.availableCapacity))}
                          </span>
                        </div>
                        <p className="text-meta text-neutral-500 mb-2">{cls.description}</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-body font-bold text-brand-600">
                              {formatCurrency(cls.adultFare, cls.currency, cls.currency === 'TZS' ? 'TSh' : '$')}
                            </p>
                            <p className="text-meta text-neutral-500">{tp('perAdult')}</p>
                          </div>
                          <button
                            onClick={() => handleBook(sailing)}
                            className="btn-primary text-label px-4 py-2"
                          >
                            {tp('bookButton')}
                          </button>
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
