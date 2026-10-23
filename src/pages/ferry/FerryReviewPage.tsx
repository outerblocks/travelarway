import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { FERRY_SAILINGS } from '@/data/mockData';
import { LoadingState, ErrorState, SearchSummaryBar } from '@/components/shared/States';
import { formatCurrency, formatDate } from '@/utils/format';
import type { FerrySailing } from '@/types';

export function FerryReviewPage() {
  const navigate = useNavigate();
  const { bookingState } = useApp();
  const [loading, setLoading] = useState(true);
  const [sailing, setSailing] = useState<FerrySailing | null>(null);

  const sailingId = bookingState.searchParams.extras?.sailingId;
  const selectedClassId = bookingState.searchParams.extras?.selectedClassId || bookingState.selectedClassId;
  const residency = (bookingState.searchParams.extras?.residency || 'resident') as 'resident' | 'non_resident';

  useEffect(() => {
    const timer = setTimeout(() => {
      const found = FERRY_SAILINGS.find((s) => s.id === sailingId);
      if (found) {
        setSailing(found);
        setLoading(false);
      } else {
        setLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [sailingId]);

  if (loading) return (
    <>
      <SearchSummaryBar>
        <Link to="/ferry/booking" className="btn-ghost text-label"><ArrowLeft size={16} /> Back</Link>
        <span className="text-body font-medium text-neutral-900">Review</span>
      </SearchSummaryBar>
      <LoadingState message="Preparing review..." />
    </>
  );

  if (!sailing) return (
    <ErrorState message="Unable to load review" onRetry={() => navigate('/ferry/results')} />
  );

  const selectedClass = sailing.classes.find((c) => c.id === selectedClassId);
  if (!selectedClass) return (
    <ErrorState message="No class selected" onRetry={() => navigate('/ferry/booking')} />
  );

  const adultFare = residency === 'resident' ? selectedClass.residentAdultFare : selectedClass.adultFare;
  const childFare = residency === 'resident' ? selectedClass.residentChildFare : selectedClass.childFare;
  const adultCount = bookingState.searchParams.adults;
  const childCount = bookingState.searchParams.children;
  const total = adultFare * adultCount + childFare * childCount;
  const fareSymbol = selectedClass.currency === 'TZS' ? 'TSh' : '$';

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
            <Pencil size={14} /> Edit
          </button>
        )}
      </div>
      {children}
    </div>
  );

  return (
    <>
      <SearchSummaryBar>
        <Link to="/ferry/booking" className="btn-ghost text-label"><ArrowLeft size={16} /> Back</Link>
        <span className="text-body font-medium text-neutral-900">Ferry Booking Review</span>
      </SearchSummaryBar>

      <div className="section-container py-6">
        <h1 className="text-page font-bold text-neutral-900 mb-6">Review your booking</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ReviewCard title="Sailing Details" onEdit={() => navigate('/ferry/results')}>
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
                <Detail label="Route" value={`${sailing.departurePort} → ${sailing.arrivalPort}`} />
                <Detail label="Date" value={formatDate(sailing.departureDate)} />
                <Detail label="Departure" value={sailing.departureTime} />
                <Detail label="Arrival" value={sailing.arrivalTime} />
                <Detail label="Duration" value={sailing.duration} />
                <Detail label="Class" value={selectedClass.name} />
                <Detail label="Residency" value={residency.replace('_', ' ')} />
              </div>
            </ReviewCard>

            <ReviewCard title={`Passengers (${bookingState.passengers.length})`} onEdit={() => navigate('/ferry/booking')}>
              <div className="space-y-3">
                {bookingState.passengers.map((p, i) => (
                  <div key={p.id} className="flex items-start gap-4 py-2 border-b border-neutral-100 last:border-b-0">
                    <div className="w-7 h-7 bg-brand-50 text-brand-600 rounded-sm flex items-center justify-center text-meta font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-body font-medium text-neutral-900">
                        {p.fullName} <span className="text-meta text-neutral-500 capitalize">· {p.category}</span>
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
              <h3 className="text-listing font-bold text-neutral-900 mb-4">Fare Summary</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-body">
                  <span className="text-neutral-500">Adult ({adultCount})</span>
                  <span className="text-neutral-900">{formatCurrency(adultFare * adultCount, selectedClass.currency, fareSymbol)}</span>
                </div>
                {childCount > 0 && (
                  <div className="flex justify-between text-body">
                    <span className="text-neutral-500">Child ({childCount})</span>
                    <span className="text-neutral-900">{formatCurrency(childFare * childCount, selectedClass.currency, fareSymbol)}</span>
                  </div>
                )}
                <div className="flex justify-between text-body">
                  <span className="text-neutral-500">Booking fee</span>
                  <span className="text-neutral-900">{formatCurrency(0, selectedClass.currency, fareSymbol)}</span>
                </div>
              </div>
              <div className="border-t border-neutral-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-listing font-bold text-neutral-900">Total</span>
                  <span className="text-listing font-bold text-brand-600">
                    {formatCurrency(total, selectedClass.currency, fareSymbol)}
                  </span>
                </div>
              </div>
              <button onClick={() => navigate('/checkout')} className="btn-primary w-full mt-6">
                <Check size={18} /> Proceed to Checkout
              </button>
              <p className="text-meta text-neutral-400 mt-4 text-center">
                Class capacity will be revalidated before booking confirmation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
