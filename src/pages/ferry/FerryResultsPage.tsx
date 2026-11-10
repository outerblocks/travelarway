import { useNavigate } from '@/router';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { useDatabaseOffers } from '@/hooks/useDatabaseOffers';
import { ScheduleStrip } from '@/components/results/ScheduleStrip';
import { EmptyResults, LoadingState, QueryFeedback } from '@/components/shared/States';
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
      loading={<LoadingState />}
    >
      <div className="section-container py-6">
        <h1 className="text-page font-bold text-neutral-900">
          {params.origin || tp('departure')} <span className="text-ink">→</span> {params.destination || tp('arrival')}
        </h1>
        <p className="mb-6 mt-1 text-body text-neutral-500">
          {[
            params.date ? formatDate(params.date) : '',
            params.returnDate ? `${tp('return')} ${formatDate(params.returnDate)}` : '',
            tp('sailingCount').replace('{count}', String(ferrySailings.length)),
          ].filter(Boolean).join(' · ')}
        </p>
        {ferrySailings.length === 0 ? (
          <EmptyResults
            message={tp('noSailingsFound')}
            subMessage={unresolved.length ? tp('tryDifferentDateRoute') : tp('tryDifferentDateRoute')}
          />
        ) : (
          <div className="offer-sheet">
            {ferrySailings.map((sailing) => (
              <article key={sailing.id} className="offer-row">
                <div className="flex flex-col gap-5 px-5 py-5 lg:flex-row lg:items-start lg:gap-10">
                  <div className="lg:w-[14.5rem] lg:shrink-0">
                    <p className="text-body font-semibold text-neutral-900">{sailing.operatorName}</p>
                    <p className="text-meta text-neutral-600">{sailing.vesselName}</p>
                  </div>
                  <ScheduleStrip
                    startTime={sailing.departureTime}
                    startPlace={sailing.departurePort}
                    endTime={sailing.arrivalTime}
                    endPlace={sailing.arrivalPort}
                    duration={sailing.duration}
                  />
                </div>
                <div className="flex flex-wrap gap-2 px-5 pb-5">
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
              </article>
            ))}
          </div>
        )}
      </div>
    </QueryFeedback>
  );
}
