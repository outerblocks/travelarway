import { useState, useEffect } from 'react';
import { useNavigate, Link } from '@/router';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { TRAIN_SERVICES } from '@/data/mockData';
import { PassengerForm, createPassenger } from '@/components/shared/PassengerForm';
import { LoadingState, ErrorState, SearchSummaryBar } from '@/components/shared/States';
import type { PassengerInfo } from '@/types';

export function TrainBookingPage() {
  const navigate = useNavigate();
  const { bookingState, setPassengers } = useApp();
  const { tp } = useI18n();
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState<typeof TRAIN_SERVICES[0] | null>(null);
  const [passengers, setPassengersState] = useState<PassengerInfo[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const trainId = bookingState.searchParams.extras?.trainId;
  const classId = bookingState.searchParams.extras?.classId;
  const totalPax = bookingState.searchParams.adults + bookingState.searchParams.children;

  useEffect(() => {
    const timer = setTimeout(() => {
      const found = TRAIN_SERVICES.find((t) => t.id === trainId);
      if (found) {
        setService(found);
        const pax: PassengerInfo[] = [];
        for (let i = 0; i < totalPax; i++) pax.push(createPassenger(i < bookingState.searchParams.adults ? 'adult' : 'child'));
        setPassengersState(pax);
      }
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [trainId, totalPax, bookingState.searchParams.adults]);

  const handleChange = (i: number, u: PassengerInfo) => setPassengersState((p) => { const n = [...p]; n[i] = u; return n; });

  const validate = () => {
    const e: Record<string, string> = {};
    passengers.forEach((p, i) => {
      if (!p.fullName) e[`name_${i}`] = tp('requiredLabel');
      if (!p.email) e[`email_${i}`] = tp('requiredLabel');
      if (!p.phone) e[`phone_${i}`] = tp('requiredLabel');
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  if (loading) return <><SearchSummaryBar><Link to="/train/results" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('backToResults')}</Link></SearchSummaryBar><LoadingState message={tp('loadingTrainDetails')} /></>;
  if (!service) return <ErrorState message={tp('trainNotFound')} onRetry={() => navigate('/train/results')} />;

  const selectedClass = service.classes.find((c) => c.id === classId);

  return (
    <>
      <SearchSummaryBar>
        <Link to="/train/results" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('backToResults')}</Link>
        <span className="text-body font-medium text-neutral-900">{service.trainName} · {selectedClass?.name}</span>
      </SearchSummaryBar>

      <div className="section-container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h2 className="text-listing font-bold text-neutral-900 mb-1">{tp('passengerInformation')}</h2>
              <p className="text-meta text-neutral-500 mb-6">
                {selectedClass && !selectedClass.hasSeatSelection && tp('trainNoteAutoSeat')}
              </p>
              <div className="space-y-4">
                {passengers.map((p, i) => (
                  <div key={p.id} data-error={errors[`name_${i}`] ? 'true' : undefined}>
                    <PassengerForm passenger={p} index={i} onChange={(u) => handleChange(i, u)} errors={{
                      name: errors[`name_${i}`],
                      email: errors[`email_${i}`],
                      phone: errors[`phone_${i}`],
                    }} />
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-neutral-200 flex justify-end">
                <button onClick={() => { if (validate()) { setPassengers(passengers); navigate('/train/review'); } }} className="btn-primary">{tp('continueToReview')}</button>
              </div>
            </div>
          </div>
          <div>
            <div className="card p-6 sticky top-20">
              <h3 className="text-listing font-bold text-neutral-900 mb-4">{tp('summary')}</h3>
              <div className="space-y-2 text-body">
                <div className="flex justify-between"><span className="text-neutral-500">{tp('trainLabel')}</span><span className="font-medium text-neutral-900">{service.trainName}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">{tp('ticketRoute')}</span><span className="font-medium text-neutral-900 text-meta">{service.departureStation} → {service.arrivalStation}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">{tp('ticketClass')}</span><span className="font-medium text-neutral-900">{selectedClass?.name}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">{tp('ticketDeparts')}</span><span className="font-medium text-neutral-900">{service.departureTime}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">{tp('checkoutPassengers')}</span><span className="font-medium text-neutral-900">{totalPax}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
