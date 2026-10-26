import { useState, useEffect } from 'react';
import { useNavigate, Link } from '@/router';
import { ArrowLeft, Clock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { EXPERIENCES } from '@/data/mockData';
import { PassengerForm, createPassenger } from '@/components/shared/PassengerForm';
import { LoadingState, ErrorState, SearchSummaryBar } from '@/components/shared/States';
import { formatDate } from '@/utils/format';
import { formatMoney } from '@/domain/money';
import { quoteExperience } from '@/domain/pricing';
import type { PassengerInfo } from '@/types';

export function ExperiencesReviewPage() {
  const navigate = useNavigate();
  const { bookingState, setPassengers } = useApp();
  const { tp } = useI18n();
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
  }, [expId, totalPax]);

  const validate = () => {
    const e: Record<string, string> = {};
    participants.forEach((p, i) => {
      if (!p.fullName) e[`name_${i}`] = tp('requiredField');
      if (!p.email) e[`email_${i}`] = tp('requiredField');
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  if (loading) return <><SearchSummaryBar><Link to="/experiences/detail" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('checkoutBack')}</Link></SearchSummaryBar><LoadingState message={tp('preparingBookingReview')} /></>;
  if (!exp) return <ErrorState message={tp('experienceNotFound')} onRetry={() => navigate('/experiences/results')} />;

  const total = quoteExperience(exp, totalPax).total;

  return (
    <>
      <SearchSummaryBar><Link to="/experiences/detail" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('checkoutBack')}</Link><span className="text-body font-medium text-neutral-900">{tp('reviewYourBooking')}</span></SearchSummaryBar>
      <div className="section-container py-6">
        <h1 className="text-page font-bold text-neutral-900 mb-6">{tp('reviewYourBooking')}</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-5">
              <h3 className="text-listing font-bold text-neutral-900 mb-3">{tp('experienceDetails')}</h3>
              <div className="grid grid-cols-2 gap-x-6">
                <div className="flex justify-between py-1"><span className="text-body text-neutral-500">{tp('ticketExperience')}</span><span className="text-body font-medium text-neutral-900 text-right">{exp.name}</span></div>
                <div className="flex justify-between py-1"><span className="text-body text-neutral-500">{tp('locationLabel')}</span><span className="text-body font-medium text-neutral-900 text-right">{exp.location}</span></div>
                <div className="flex justify-between py-1"><span className="text-body text-neutral-500">{tp('ticketDate')}</span><span className="text-body font-medium text-neutral-900">{formatDate(selectedDate)}</span></div>
                <div className="flex justify-between py-1"><span className="text-body text-neutral-500">{tp('sessionLabel')}</span><span className="text-body font-medium text-neutral-900">{selectedSession}</span></div>
                <div className="flex justify-between py-1"><span className="text-body text-neutral-500">{tp('durationLabel')}</span><span className="text-body font-medium text-neutral-900 flex items-center gap-1"><Clock size={12} /> {exp.duration}</span></div>
                <div className="flex justify-between py-1"><span className="text-body text-neutral-500">{tp('meetingPoint')}</span><span className="text-body font-medium text-neutral-900 text-right text-meta">{exp.meetingPoint}</span></div>
              </div>
            </div>
            <div className="card p-5">
              <h3 className="text-listing font-bold text-neutral-900 mb-4">{tp('participantInformation')}</h3>
              <div className="space-y-4">
                {participants.map((p, i) => (
                  <div key={p.id} data-error={errors[`name_${i}`] ? 'true' : undefined}>
                    <PassengerForm passenger={p} index={i} onChange={(u) => setParticipants((prev) => { const n = [...prev]; n[i] = u; return n; })} />
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-neutral-200 flex justify-end">
                <button onClick={() => { if (validate()) { setPassengers(participants); navigate('/checkout'); } }} className="btn-primary">{tp('proceedToCheckout')}</button>
              </div>
            </div>
          </div>
          <div>
            <div className="card p-6 sticky top-20">
              <h3 className="text-listing font-bold text-neutral-900 mb-4">{tp('priceSummary')}</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-body"><span className="text-neutral-500">{exp.name}</span><span className="text-neutral-900">{formatMoney(exp.price, exp.currency)}</span></div>
                <div className="flex justify-between text-body"><span className="text-neutral-500">{tp('participants')}</span><span className="text-neutral-900">{totalPax}</span></div>
              </div>
              <div className="border-t border-neutral-200 pt-4">
                <div className="flex justify-between"><span className="text-listing font-bold text-neutral-900">{tp('checkoutTotal')}</span><span className="text-listing font-bold text-brand-600">{formatMoney(total, exp.currency)}</span></div>
              </div>
              <p className="text-meta text-neutral-400 mt-4">{exp.cancellationPolicy}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
