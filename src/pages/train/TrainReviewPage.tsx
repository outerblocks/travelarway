import { useState, useEffect } from 'react';
import { useNavigate } from '@/router';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { LoadingState, ErrorState } from '@/components/shared/States';
import { formatDate } from '@/utils/format';
import { formatMoney } from '@/domain/money';

/**
 * Booking review.
 *
 * The journey details come from the selection the passenger just made; **the price comes
 * from the server again**. That split is deliberate: the description of which train cannot
 * change what they chose, but a total that has been through client state is one a modified
 * client could set to anything, and this is the last number they see before paying.
 */
interface ServerQuote {
  unitFare: number;
  currency: string;
  fareSource: string;
  total: number;
  lines: { label: string; count: number; amount: number }[];
}

function useQuote(tripId: string | undefined, seatClassCode: string | undefined, adults: number, children: number, fromSeq: string, toSeq: string) {
  const [quote, setQuote] = useState<ServerQuote | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!tripId || !seatClassCode) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(
          `/api/sgr/trips/${tripId}/quote?class=${seatClassCode}&adults=${adults}&children=${children}&from=${fromSeq}&to=${toSeq}`,
        );
        if (cancelled) return;
        if (!response.ok) {
          setFailed(true);
          setQuote(null);
          return;
        }
        setQuote((await response.json()) as ServerQuote);
        setFailed(false);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tripId, seatClassCode, adults, children, fromSeq, toSeq]);

  return { quote, failed };
}

export function TrainReviewPage() {
  const navigate = useNavigate();
  const { bookingState } = useApp();
  const { tp } = useI18n();

  const extras = bookingState.searchParams.extras ?? {};
  const trainId = extras.trainId;
  const classId = extras.classId;
  const returnTrainId = extras.returnTrainId;
  const returnClassId = extras.returnClassId;
  const adults = bookingState.searchParams.adults;
  const children = bookingState.searchParams.children;

  const outboundQuote = useQuote(trainId, classId, adults, children, extras.fromSeq ?? '0', extras.toSeq ?? '1');
  const returnQuote = useQuote(returnTrainId, returnClassId, adults, children, extras.returnFromSeq ?? '0', extras.returnToSeq ?? '1');

  const loading = !outboundQuote.quote && !outboundQuote.failed;

  if (loading) return <LoadingState message={tp('preparingBookingReview')} />;

  // The selection carried no trip, or the server cannot price it. Both are shown as a failure
  // to continue rather than a review page with a zero total on it.
  if (!trainId || !classId || outboundQuote.failed || !outboundQuote.quote) {
    return <ErrorState message={tp('classNotFound')} onRetry={() => navigate('/train/results')} />;
  }
  if (returnTrainId && (returnQuote.failed || !returnQuote.quote)) {
    return <ErrorState message={tp('classNotFound')} onRetry={() => navigate('/train/results')} />;
  }

  const quote = outboundQuote.quote;
  const combinedTotal = quote.total + (returnQuote.quote?.total ?? 0);
  const leg = {
    name: extras.trainName ?? `${bookingState.searchParams.origin} → ${bookingState.searchParams.destination}`,
    operator: extras.operatorName ?? 'Tanzania Railways Corporation',
    route: extras.legOrigin && extras.legDestination ? `${extras.legOrigin} → ${extras.legDestination}` : '—',
    departure: extras.legDeparture ?? '—',
    arrival: extras.legArrival ?? '—',
    duration: extras.legDuration ?? '—',
    date: extras.legDate ?? bookingState.searchParams.date,
    className: extras.classLabel ?? classId,
  };
  const ret = returnTrainId ? {
    name: extras.returnTrainName ?? tp('return'),
    operator: extras.returnOperatorName ?? 'Tanzania Railways Corporation',
    route: extras.returnLegOrigin && extras.returnLegDestination ? `${extras.returnLegOrigin} → ${extras.returnLegDestination}` : '—',
    departure: extras.returnLegDeparture ?? '—',
    arrival: extras.returnLegArrival ?? '—',
    duration: extras.returnLegDuration ?? '—',
    date: extras.returnLegDate ?? bookingState.searchParams.returnDate,
    className: extras.returnClassLabel ?? returnClassId ?? '',
  } : null;

  const Detail = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between py-1"><span className="text-body text-neutral-500">{label}</span><span className="text-body font-medium text-neutral-900 text-right">{value}</span></div>
  );

  return (
    <>
      <div className="section-container py-6">
        <nav aria-label={tp('trainBookingProgress')} className="mb-6">
          <ol className="flex flex-wrap items-center gap-2 text-meta sm:gap-4">
            {[tp('trainJourneyStep'), tp('trainPassengerStep'), tp('trainReviewStep')].map((step, index) => (
              <li key={step} className="flex items-center gap-2 sm:gap-4">
                <span
                  aria-current={index === 2 ? 'step' : undefined}
                  className={`flex items-center gap-2 ${index === 2 ? 'font-semibold text-brand-700' : 'font-medium text-neutral-700'}`}
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${index < 2 ? 'bg-brand-100 text-brand-700' : 'bg-brand-600 text-white'}`}>
                    {index + 1}
                  </span>
                  {step}
                </span>
                {index < 2 && <span aria-hidden="true" className="h-px w-5 bg-neutral-200 sm:w-10" />}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="text-page font-bold text-neutral-900 mb-6">{tp('reviewYourBooking')}</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-5">
              <h3 className="text-listing font-bold text-neutral-900 mb-3">{tp('serviceDetails')}</h3>
              <div className="mb-4">
                <div><p className="text-body font-bold text-neutral-900">{leg.name}</p><p className="text-meta text-neutral-500">{leg.operator}</p></div>
              </div>
              <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                <Detail label={tp('ticketRoute')} value={leg.route} />
                <Detail label={tp('ticketDate')} value={leg.date ? formatDate(leg.date) : '—'} />
                <Detail label={tp('departure')} value={leg.departure} />
                <Detail label={tp('arrival')} value={leg.arrival} />
                <Detail label={tp('durationLabel')} value={leg.duration} />
                <Detail label={tp('ticketClass')} value={leg.className} />
              </div>
              <p className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-meta text-neutral-700">
                {tp('trainSeatAssignment')}
              </p>
            </div>
            {ret && (
              <div className="card p-5">
                <h3 className="text-listing font-bold text-neutral-900 mb-3">{tp('return')} {tp('serviceDetails')}</h3>
                <div className="mb-4">
                  <div>
                    <p className="text-body font-bold text-neutral-900">{ret.name}</p>
                    <p className="text-meta text-neutral-500">{ret.operator}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                  <Detail label={tp('ticketRoute')} value={ret.route} />
                  <Detail label={tp('ticketDate')} value={ret.date ? formatDate(ret.date) : '—'} />
                  <Detail label={tp('departure')} value={ret.departure} />
                  <Detail label={tp('arrival')} value={ret.arrival} />
                  <Detail label={tp('durationLabel')} value={ret.duration} />
                  <Detail label={tp('ticketClass')} value={ret.className} />
                </div>
                <p className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-meta text-neutral-700">
                  {tp('trainSeatAssignment')}
                </p>
              </div>
            )}
            <div className="card p-5">
              <h3 className="text-listing font-bold text-neutral-900 mb-3">{tp('passengersCount').replace('{count}', String(bookingState.passengers.length))}</h3>
              {bookingState.passengers.map((p, i) => (
                <div key={p.id} className="flex items-start gap-3 py-2 border-b border-neutral-100 last:border-b-0">
                  <div className="w-7 h-7 bg-brand-50 text-brand-600 rounded-sm flex items-center justify-center text-meta font-bold">{i + 1}</div>
                  <div className="min-w-0">
                    <p className="text-body font-medium text-neutral-900">{p.fullName}</p>
                    <p className="text-meta text-neutral-500">{p.email} · {p.phoneCountryCode} {p.phone}</p>
                    <p className="mt-1 text-meta text-neutral-600">
                      {p.category === 'adult' ? tp('trainAdultTicket') : tp('trainChildTicket')}
                      {' · '}{p.trainResidency ? tp(p.trainResidency === 'non_resident' ? 'nonResident' : 'resident') : '—'}
                      {p.idNumber && <> · {tp('trainIdentityNumber')}: {maskIdentityNumber(p.idNumber)}</>}
                    </p>
                    <p className="text-meta text-neutral-500">
                      {tp('trainLuggage')}: {p.trainHasLuggage === undefined ? '—' : tp(p.trainHasLuggage ? 'yes' : 'no')}
                      {' · '}{tp('trainWheelchair')}: {p.trainRequiresWheelchair === undefined ? '—' : tp(p.trainRequiresWheelchair ? 'yes' : 'no')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="card p-5 sm:p-6 lg:sticky lg:top-20">
              <h3 className="text-listing font-bold text-neutral-900 mb-4">{tp('fareSummary')}</h3>
              <div className="space-y-2 mb-4">
                {[...quote.lines, ...(returnQuote.quote?.lines ?? [])].map((line, index) => (
                  <div key={`${line.label}-${index}`} className="flex justify-between text-body">
                    <span className="text-neutral-500">
                      {line.label === 'adult' ? tp('trainAdultTicket') : tp('trainChildTicket')} ×{line.count}
                    </span>
                    <span className="text-neutral-900">{formatMoney(line.amount * line.count, quote.currency)}</span>
                  </div>
                ))}
                {quote.fareSource === 'PROVISIONAL' && (
                  <p className="text-meta text-warning-700">{tp('trainProvisionalFareNotice')}</p>
                )}
              </div>
              <div className="border-t border-neutral-200 pt-4">
                <div className="flex justify-between"><span className="text-listing font-bold text-neutral-900">{tp('checkoutTotal')}</span><span className="text-listing font-bold text-neutral-900">{formatMoney(combinedTotal, quote.currency)}</span></div>
              </div>
              <button onClick={() => navigate('/checkout')} className="btn-primary w-full mt-6">{tp('proceedToCheckout')}</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function maskIdentityNumber(value: string) {
  return value.length > 4 ? `****${value.slice(-4)}` : value;
}
