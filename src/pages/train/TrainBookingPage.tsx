import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, TrainFront } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { TRAIN_SERVICES } from '@/data/mockData';
import { PassengerForm, createPassenger } from '@/components/shared/PassengerForm';
import { LoadingState, ErrorState, SearchSummaryBar } from '@/components/shared/States';
import type { PassengerInfo } from '@/types';

export function TrainBookingPage() {
  const navigate = useNavigate();
  const { bookingState, setPassengers } = useApp();
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
  }, [trainId]);

  const handleChange = (i: number, u: PassengerInfo) => setPassengersState((p) => { const n = [...p]; n[i] = u; return n; });

  const validate = () => {
    const e: Record<string, string> = {};
    passengers.forEach((p, i) => {
      if (!p.fullName) e[`name_${i}`] = 'Required';
      if (!p.email) e[`email_${i}`] = 'Required';
      if (!p.phone) e[`phone_${i}`] = 'Required';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  if (loading) return <><SearchSummaryBar><Link to="/train/results" className="btn-ghost text-label"><ArrowLeft size={16} /> Back</Link></SearchSummaryBar><LoadingState /></>;
  if (!service) return <ErrorState message="Train not found" onRetry={() => navigate('/train/results')} />;

  const selectedClass = service.classes.find((c) => c.id === classId);

  return (
    <>
      <SearchSummaryBar>
        <Link to="/train/results" className="btn-ghost text-label"><ArrowLeft size={16} /> Back to results</Link>
        <span className="text-body font-medium text-neutral-900">{service.trainName} · {selectedClass?.name}</span>
      </SearchSummaryBar>

      <div className="section-container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h2 className="text-listing font-bold text-neutral-900 mb-1">Passenger Information</h2>
              <p className="text-meta text-neutral-500 mb-6">
                {selectedClass && !selectedClass.hasSeatSelection && 'Note: This class does not support seat selection. Seats will be assigned automatically.'}
              </p>
              <div className="space-y-6">
                {passengers.map((p, i) => (
                  <div key={p.id} data-error={errors[`name_${i}`] ? 'true' : undefined}>
                    <PassengerForm passenger={p} index={i} onChange={(u) => handleChange(i, u)} />
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-neutral-200 flex justify-end">
                <button onClick={() => { if (validate()) { setPassengers(passengers); navigate('/train/review'); } }} className="btn-primary">Continue to Review</button>
              </div>
            </div>
          </div>
          <div>
            <div className="card p-6 sticky top-20">
              <h3 className="text-listing font-bold text-neutral-900 mb-4">Summary</h3>
              <div className="space-y-2 text-body">
                <div className="flex justify-between"><span className="text-neutral-500">Train</span><span className="font-medium text-neutral-900">{service.trainName}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Route</span><span className="font-medium text-neutral-900 text-meta">{service.departureStation} → {service.arrivalStation}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Class</span><span className="font-medium text-neutral-900">{selectedClass?.name}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Departure</span><span className="font-medium text-neutral-900">{service.departureTime}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Passengers</span><span className="font-medium text-neutral-900">{totalPax}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
