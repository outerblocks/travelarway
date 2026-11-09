import { useNavigate, Link } from '@/router';
import { ArrowLeft, Pencil, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { useFerrySailing } from '@/hooks/useFerrySailing';
import { ErrorState, LoadingState, SearchSummaryBar } from '@/components/shared/States';
import { formatDate } from '@/utils/format';
import { formatMoney } from '@/domain/money';
import { quoteFerrySailing } from '@/domain/pricing';

export function FerryReviewPage() {
  const navigate = useNavigate();
  const { bookingState } = useApp();
  const { tp } = useI18n();
  const sailingId = bookingState.searchParams.extras?.sailingId;
  const selectedClassId = bookingState.searchParams.extras?.selectedClassId || bookingState.selectedClassId;
  const residency = (bookingState.searchParams.extras?.residency || 'resident') as 'resident' | 'non_resident';

  const { sailing, status } = useFerrySailing(sailingId);

  if (status === 'loading') return <LoadingState />;
  if (!sailing) return (
    <ErrorState message={tp('unableLoadBookingReview')} onRetry={() => navigate('/ferry/results')} />
  );

  const selectedClass = sailing.classes.find((c) => c.id === selectedClassId);
  if (!selectedClass) return (
    <ErrorState message={tp('classNotSelected')} onRetry={() => navigate('/ferry/booking')} />
  );

  const quote = quoteFerrySailing(
    selectedClass,
    residency,
    bookingState.searchParams.adults,
    bookingState.searchParams.children,
  );

  const Detail = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between py-1">
      <span className="text-body text-neutral-500">{label}</span>
      <span className="text-body font-medium text-neutral-900 text-right">{value}</span>
    </div>
  );

  const ReviewCard = ({ title, children, onEdit }: { title: string; children: React.ReactNode; onEdit?: () => void }) => (
    <div className="card p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-listing font-bold text-neutral-900">{title}</h3>
        {onEdit && (
          <button onClick={onEdit} className="btn-ghost text-label">
            <Pencil size={14} /> {tp('editButton')}
          </button>
        )}
      </div>
      {children}
    </div>
  );

  return (
    <>
      <SearchSummaryBar>
        <Link to="/ferry/booking" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('checkoutBack')}</Link>
        <span className="text-body font-medium text-neutral-900">{tp('ferryBookingReview')}</span>
      </SearchSummaryBar>

      <div className="section-container py-6">
        <h1 className="text-page font-bold text-neutral-900 mb-6">{tp('reviewYourBooking')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ReviewCard title={tp('sailingDetails')} onEdit={() => navigate('/ferry/results')}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand-600 text-white rounded-sm flex items-center justify-center text-body font-bold">
                  {sailing.operatorLogo}
                </div>
                <div>
                  <p className="text-body font-bold text-neutral-900">{sailing.operatorName}</p>
                  <p className="text-meta text-neutral-500">{sailing.vesselName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-6">
                <Detail label={tp('ticketRoute')} value={`${sailing.departurePort} → ${sailing.arrivalPort}`} />
                <Detail label={tp('ticketDate')} value={formatDate(sailing.departureDate)} />
                <Detail label={tp('departure')} value={sailing.departureTime} />
                <Detail label={tp('arrival')} value={sailing.arrivalTime} />
                <Detail label={tp('durationLabel')} value={sailing.duration} />
                <Detail label={tp('ticketClass')} value={selectedClass.name} />
                <Detail label={tp('residency')} value={tp(residency === 'non_resident' ? 'nonResident' : 'resident')} />
              </div>
            </ReviewCard>

            <ReviewCard title={tp('passengersCount').replace('{count}', String(bookingState.passengers.length))} onEdit={() => navigate('/ferry/booking')}>
              <div className="space-y-3">
                {bookingState.passengers.map((p, i) => (
                  <div key={p.id} className="flex items-start gap-4 py-2 border-b border-neutral-100 last:border-b-0">
                    <div className="w-7 h-7 bg-brand-50 text-brand-600 rounded-sm flex items-center justify-center text-meta font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-body font-medium text-neutral-900">
                        {p.fullName}{' '}
                        {p.category && (
                          <span className="text-meta text-neutral-500 capitalize">· {tp(p.category === 'infant' ? 'infant' : p.category)}</span>
                        )}
                      </p>
                      <p className="text-meta text-neutral-500">
                        {p.email} · {p.phoneCountryCode} {p.phone}
                      </p>
                      <p className="text-meta text-neutral-500">
                        ID: {p.idType?.replace('_', ' ')} · {p.idNumber}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ReviewCard>
          </div>

          <div>
            <div className="card p-6 sticky top-20">
              <h3 className="text-listing font-bold text-neutral-900 mb-4">{tp('fareSummary')}</h3>
              <div className="space-y-2 mb-4">
                {quote.lines.map((line, i) => (
                  <div key={i} className="flex justify-between text-body">
                    <span className="text-neutral-500">{line.label}</span>
                    <span className="text-neutral-900">{formatMoney(line.amount, quote.currency)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-neutral-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-listing font-bold text-neutral-900">{tp('checkoutTotal')}</span>
                  <span className="text-listing font-bold text-brand-600">
                    {formatMoney(quote.total, quote.currency)}
                  </span>
                </div>
              </div>
              <button onClick={() => navigate('/checkout')} className="btn-primary w-full mt-6">
                <Check size={18} /> {tp('proceedToCheckout')}
              </button>
              <p className="text-meta text-neutral-400 mt-4 text-center">
                {tp('classCapacityRevalidationNote')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
