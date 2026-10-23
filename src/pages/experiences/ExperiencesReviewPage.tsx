import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, Clock, MapPin } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { EXPERIENCES } from '@/data/mockData';
import { PassengerForm, createPassenger } from '@/components/shared/PassengerForm';
import { LoadingState, ErrorState, SearchSummaryBar } from '@/components/shared/States';
import { formatCurrency, formatDate } from '@/utils/format';
import type { PassengerInfo } from '@/types';

export function ExperiencesReviewPage() {
  const navigate = useNavigate();
  const { bookingState, setPassengers } = useApp();
  const [loading, setLoading] = useState(true);
  const [exp, setExp] = useState<typeof EXPERIENCES[0] | null>(null);
  const [participants, setParticipants] = useState<PassengerInfo[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const expId = bookingState.searchParams.extras?.experienceId;
  const selectedDate = bookingState.searchParams.extras?.date || '';
  const selectedSession = bookingState.searchParams.extras?.session || '';
  const totalPax = bookingState.searchParams.adults;

  useEffect(() => {
    const timer = setTimeout(() => {
      const found = EXPERIENCES.find((e) => e.id === expId);
      if (found) {
        setExp(found);
        const pax: PassengerInfo[] = [];
        for (let i = 0; i < totalPax; i++) pax.push(createPassenger('adult'));
        setParticipants(pax);
      }
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [expId]);

  const validate = () => {
    const e: Record<string, string> = {};
    participants.forEach((p, i) => {
      if (!p.fullName) e[`name_${i}`] = 'Required';
      if (!p.email) e[`email_${i}`] = 'Required';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  if (loading) return <><SearchSummaryBar><Link to="/experiences/detail" className="btn-ghost text-label"><ArrowLeft size={16} /> Back</Link></SearchSummaryBar><LoadingState /></>;
  if (!exp) return <ErrorState message="Experience not found" onRetry={() => navigate('/experiences/results')} />;

  const total = exp.price * totalPax;

  return (
    <>
      <SearchSummaryBar><Link to="/experiences/detail" className="btn-ghost text-label"><ArrowLeft size={16} /> Back</Link><span className="text-body font-medium text-neutral-900">Review</span></SearchSummaryBar>
      <div className="section-container py-6">
        <h1 className="text-page font-bold text-neutral-900 mb-6">Review your booking</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-5">
              <h3 className="text-listing font-bold text-neutral-900 mb-3">Experience Details</h3>
              <div className="grid grid-cols-2 gap-x-6">
                <div className="flex justify-between py-1"><span className="text-body text-neutral-500">Experience</span><span className="text-body font-medium text-neutral-900 text-right">{exp.name}</span></div>
                <div className="flex justify-between py-1"><span className="text-body text-neutral-500">Location</span><span className="text-body font-medium text-neutral-900 text-right">{exp.location}</span></div>
                <div className="flex justify-between py-1"><span className="text-body text-neutral-500">Date</span><span className="text-body font-medium text-neutral-900">{formatDate(selectedDate)}</span></div>
                <div className="flex justify-between py-1"><span className="text-body text-neutral-500">Session</span><span className="text-body font-medium text-neutral-900">{selectedSession}</span></div>
                <div className="flex justify-between py-1"><span className="text-body text-neutral-500">Duration</span><span className="text-body font-medium text-neutral-900 flex items-center gap-1"><Clock size={12} /> {exp.duration}</span></div>
                <div className="flex justify-between py-1"><span className="text-body text-neutral-500">Meeting</span><span className="text-body font-medium text-neutral-900 text-right text-meta">{exp.meetingPoint}</span></div>
              </div>
            </div>
            <div className="card p-5">
              <h3 className="text-listing font-bold text-neutral-900 mb-4">Participant Information</h3>
              <div className="space-y-6">
                {participants.map((p, i) => (
                  <div key={p.id} data-error={errors[`name_${i}`] ? 'true' : undefined}>
                    <PassengerForm passenger={p} index={i} onChange={(u) => setParticipants((prev) => { const n = [...prev]; n[i] = u; return n; })} />
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-neutral-200 flex justify-end">
                <button onClick={() => { if (validate()) { setPassengers(participants); navigate('/checkout'); } }} className="btn-primary">Proceed to Checkout</button>
              </div>
            </div>
          </div>
          <div>
            <div className="card p-6 sticky top-20">
              <h3 className="text-listing font-bold text-neutral-900 mb-4">Price Summary</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-body"><span className="text-neutral-500">{exp.name}</span><span className="text-neutral-900">{formatCurrency(exp.price, exp.currency, 'TSh')}</span></div>
                <div className="flex justify-between text-body"><span className="text-neutral-500">Participants</span><span className="text-neutral-900">{totalPax}</span></div>
              </div>
              <div className="border-t border-neutral-200 pt-4">
                <div className="flex justify-between"><span className="text-listing font-bold text-neutral-900">Total</span><span className="text-listing font-bold text-brand-600">{formatCurrency(total, exp.currency, 'TSh')}</span></div>
              </div>
              <p className="text-meta text-neutral-400 mt-4">{exp.cancellationPolicy}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
