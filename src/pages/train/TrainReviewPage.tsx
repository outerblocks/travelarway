import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, TrainFront } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { TRAIN_SERVICES } from '@/data/mockData';
import { LoadingState, ErrorState, SearchSummaryBar } from '@/components/shared/States';
import { formatCurrency, formatDate } from '@/utils/format';

export function TrainReviewPage() {
  const navigate = useNavigate();
  const { bookingState } = useApp();
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState<typeof TRAIN_SERVICES[0] | null>(null);

  const trainId = bookingState.searchParams.extras?.trainId;
  const classId = bookingState.searchParams.extras?.classId;

  useEffect(() => {
    const timer = setTimeout(() => {
      const found = TRAIN_SERVICES.find((t) => t.id === trainId);
      if (found) setService(found);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [trainId]);

  if (loading) return <><SearchSummaryBar><Link to="/train/booking" className="btn-ghost text-label"><ArrowLeft size={16} /> Back</Link></SearchSummaryBar><LoadingState /></>;
  if (!service) return <ErrorState message="Train not found" onRetry={() => navigate('/train/results')} />;

  const selectedClass = service.classes.find((c) => c.id === classId);
  if (!selectedClass) return <ErrorState message="Class not found" onRetry={() => navigate('/train/results')} />;

  const totalPax = bookingState.passengers.length;
  const total = selectedClass.fare * totalPax;
  const fareSymbol = selectedClass.currency === 'KES' ? 'KSh' : 'TSh';

  const Detail = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between py-1"><span className="text-body text-neutral-500">{label}</span><span className="text-body font-medium text-neutral-900 text-right">{value}</span></div>
  );

  return (
    <>
      <SearchSummaryBar><Link to="/train/booking" className="btn-ghost text-label"><ArrowLeft size={16} /> Back</Link><span className="text-body font-medium text-neutral-900">Train Booking Review</span></SearchSummaryBar>
      <div className="section-container py-6">
        <h1 className="text-page font-bold text-neutral-900 mb-6">Review your booking</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-5">
              <h3 className="text-listing font-bold text-neutral-900 mb-3">Service Details</h3>
              <div className="flex items-center gap-3 mb-4">
                <TrainFront size={20} className="text-brand-600" />
                <div><p className="text-body font-bold text-neutral-900">{service.trainName}</p><p className="text-meta text-neutral-500">{service.operatorName}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-x-6">
                <Detail label="Route" value={`${service.departureStation} → ${service.arrivalStation}`} />
                <Detail label="Date" value={formatDate(service.departureDate)} />
                <Detail label="Departure" value={service.departureTime} />
                <Detail label="Arrival" value={service.arrivalTime} />
                <Detail label="Duration" value={service.duration} />
                <Detail label="Class" value={selectedClass.name} />
              </div>
            </div>
            <div className="card p-5">
              <h3 className="text-listing font-bold text-neutral-900 mb-3">Passengers ({bookingState.passengers.length})</h3>
              {bookingState.passengers.map((p, i) => (
                <div key={p.id} className="flex items-start gap-3 py-2 border-b border-neutral-100 last:border-b-0">
                  <div className="w-7 h-7 bg-brand-50 text-brand-600 rounded-sm flex items-center justify-center text-meta font-bold">{i + 1}</div>
                  <div><p className="text-body font-medium text-neutral-900">{p.fullName}</p><p className="text-meta text-neutral-500">{p.email} · {p.phoneCountryCode} {p.phone}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="card p-6 sticky top-20">
              <h3 className="text-listing font-bold text-neutral-900 mb-4">Fare Summary</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-body"><span className="text-neutral-500">Fare ({totalPax} pax)</span><span className="text-neutral-900">{formatCurrency(selectedClass.fare * totalPax, selectedClass.currency, fareSymbol)}</span></div>
              </div>
              <div className="border-t border-neutral-200 pt-4">
                <div className="flex justify-between"><span className="text-listing font-bold text-neutral-900">Total</span><span className="text-listing font-bold text-brand-600">{formatCurrency(total, selectedClass.currency, fareSymbol)}</span></div>
              </div>
              <button onClick={() => navigate('/checkout')} className="btn-primary w-full mt-6"><Check size={18} /> Proceed to Checkout</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
