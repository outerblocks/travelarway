import { Link, useNavigate } from '@/router';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { useDatabaseOffers } from '@/hooks/useDatabaseOffers';
import { EmptyResults, LoadingState, QueryFeedback, SearchSummaryBar } from '@/components/shared/States';
import { formatDate } from '@/utils/format';
import { formatMoney } from '@/domain/money';
import type { FerrySailing, FerryVesselClass } from '@/types';

export function FerryResultsPage() {
  const navigate = useNavigate();
  const { bookingState, setSearchParams, setSelectedClassId } = useApp();
  const { tp } = useI18n();
  const { status, retry, params, unresolved, ferrySailings } = useDatabaseOffers('ferry');
  const residency = (params.extras?.residency || 'resident') as 'resident' | 'non_resident';

  const choose = (sailing: FerrySailing, fareClass: FerryVesselClass) => {
    if (residency === 'resident' && fareClass.hasResidentFare === false) return;
    setSelectedClassId(fareClass.id);
    setSearchParams({
      ...bookingState.searchParams,
      extras: {
        ...bookingState.searchParams.extras,
        sailingId: sailing.id,
        selectedClassId: fareClass.id,
        operatorName: sailing.operatorName,
        vesselName: sailing.vesselName,
      },
    });
    navigate('/ferry/booking');
  };

  return (
    <QueryFeedback
      status={status}
      onRetry={retry}
      errorMessage={tp('unableLoadSailings')}
      errorSubMessage={tp('bookingServiceProblem')}
      loading={(
        <>
          <SearchSummaryBar>
            <Link to="/" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('modifySearch')}</Link>
            <span className="text-body font-medium text-neutral-900">{tp('ferry')}</span>
          </SearchSummaryBar>
          <LoadingState />
        </>
      )}
    >
    <>
      <SearchSummaryBar>
        <Link to="/" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('modifySearch')}</Link>
        <span className="text-body font-medium text-neutral-900">
          {params.origin || tp('departure')} → {params.destination || tp('arrival')}
        </span>
        <span className="text-body text-neutral-500">
          {params.date ? formatDate(params.date) : ''}
          {params.returnDate ? ` · ${tp('return')} ${formatDate(params.returnDate)}` : ''}
        </span>
      </SearchSummaryBar>

      <div className="section-container py-6">
        <h1 className="text-page font-bold text-neutral-900 mb-1">
          {tp('sailingCount').replace('{count}', String(ferrySailings.length))}
        </h1>
        {ferrySailings.length === 0 ? (
          <EmptyResults
            message={tp('noSailingsFound')}
            subMessage={unresolved.length ? tp('tryDifferentDateRoute') : tp('tryDifferentDateRoute')}
          />
        ) : (
          <div className="offer-sheet">
            {ferrySailings.map((sailing) => (
              <article key={sailing.id} className="offer-row">
                <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-5">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{sailing.operatorName}</p>
                    <p className="text-xs text-neutral-500">{sailing.vesselName} · {sailing.duration}</p>
                    <p className="mt-1 text-sm text-neutral-700">
                      {sailing.departurePort} {sailing.departureTime} → {sailing.arrivalPort} {sailing.arrivalTime}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sailing.classes.map((fareClass) => {
                      const residentBlocked = residency === 'resident' && fareClass.hasResidentFare === false;
                      const adult = residency === 'resident' && fareClass.hasResidentFare
                        ? fareClass.residentAdultFare
                        : fareClass.adultFare;
                      const currency = residency === 'resident' && fareClass.hasResidentFare
                        ? 'TZS'
                        : fareClass.currency;
                      return (
                        <button
                          key={fareClass.id}
                          type="button"
                          className="btn-secondary px-3 py-2 text-xs"
                          disabled={residentBlocked || fareClass.availableCapacity < 1}
                          onClick={() => choose(sailing, fareClass)}
                        >
                          {fareClass.name} · {residentBlocked ? 'resident fare unpublished' : formatMoney(adult, currency)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
    </QueryFeedback>
  );
}
