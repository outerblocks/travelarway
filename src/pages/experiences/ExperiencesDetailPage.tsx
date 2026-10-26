import { useState, useEffect } from 'react';
import { useNavigate, Link } from '@/router';
import { ArrowLeft, Clock, Star, MapPin, Calendar } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { EXPERIENCES } from '@/data/mockData';
import { LoadingState, ErrorState, SearchSummaryBar } from '@/components/shared/States';
import { formatCurrency, formatDate } from '@/utils/format';

const EXP_IMAGES: Record<string, string> = {
  'exp_001': 'https://images.pexels.com/photos/4404518/pexels-photo-4404518.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'exp_002': 'https://images.pexels.com/photos/7292744/pexels-photo-7292744.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'exp_003': 'https://images.pexels.com/photos/15993988/pexels-photo-15993988.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'exp_004': 'https://images.pexels.com/photos/28708299/pexels-photo-28708299.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
};

export function ExperiencesDetailPage() {
  const navigate = useNavigate();
  const { bookingState, setSearchParams } = useApp();
  const { tp } = useI18n();
  const [loading, setLoading] = useState(true);
  const [exp, setExp] = useState<typeof EXPERIENCES[0] | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSession, setSelectedSession] = useState('');

  const expId = bookingState.searchParams.extras?.experienceId;

  useEffect(() => {
    const timer = setTimeout(() => {
      const found = EXPERIENCES.find((e) => e.id === expId);
      if (found) {
        setExp(found);
        setSelectedDate(found.availableDates[0] || '');
        setSelectedSession(found.sessions[0] || '');
      }
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [expId]);

  const handleContinue = () => {
    setSearchParams({ ...bookingState.searchParams, extras: { ...bookingState.searchParams.extras, date: selectedDate, session: selectedSession } });
    navigate('/experiences/review');
  };

  if (loading) return <><SearchSummaryBar><Link to="/experiences/results" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('backToResults')}</Link></SearchSummaryBar><LoadingState message={tp('preparingBookingReview')} /></>;
  if (!exp) return <ErrorState message={tp('experienceNotFound')} onRetry={() => navigate('/experiences/results')} />;

  return (
    <>
      <SearchSummaryBar><Link to="/experiences/results" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('backToResults')}</Link><span className="text-body font-medium text-neutral-900">{exp.name}</span></SearchSummaryBar>
      <div className="section-container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <img src={EXP_IMAGES[exp.id]} alt={exp.name} className="w-full h-72 object-cover rounded-lg mb-4" />
            <div className="flex items-center gap-2 mb-2">
              <span className="text-meta font-medium text-brand-600 uppercase tracking-wide">{exp.category}</span>
              <span className="flex items-center gap-1 text-meta"><Star size={14} className="text-warning-500 fill-warning-500" /> {exp.rating}</span>
            </div>
            <h1 className="text-page font-bold text-neutral-900 mb-2">{exp.name}</h1>
            <p className="text-body text-neutral-500 flex items-center gap-1 mb-4"><MapPin size={14} /> {exp.location}, {exp.city}</p>
            <p className="text-body text-neutral-700 mb-6">{exp.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="card p-4"><p className="text-meta text-neutral-500 uppercase tracking-wide mb-1">{tp('durationLabel')}</p><p className="text-body font-medium text-neutral-900 flex items-center gap-1"><Clock size={14} /> {exp.duration}</p></div>
              <div className="card p-4"><p className="text-meta text-neutral-500 uppercase tracking-wide mb-1">{tp('meetingPoint')}</p><p className="text-body font-medium text-neutral-900">{exp.meetingPoint}</p></div>
              <div className="card p-4"><p className="text-meta text-neutral-500 uppercase tracking-wide mb-1">{tp('cancellationLabel')}</p><p className="text-body font-medium text-neutral-900">{exp.cancellationPolicy}</p></div>
            </div>

            <h2 className="text-section font-bold text-neutral-900 mb-4">{tp('selectDateAndSession')}</h2>
            <div className="space-y-4">
              <div>
                <label className="input-label">{tp('availableDates')}</label>
                <div className="flex flex-wrap gap-2">
                  {exp.availableDates.map((d) => (
                    <button key={d} onClick={() => setSelectedDate(d)} className={`px-4 py-2.5 text-body rounded-sm border transition-colors ${selectedDate === d ? 'border-brand-600 bg-brand-50 text-brand-600 font-medium' : 'border-neutral-300 text-neutral-600 hover:border-neutral-400'}`}>
                      <Calendar size={14} className="inline mr-1" /> {formatDate(d)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="input-label">{tp('availableSessions')}</label>
                <div className="flex flex-wrap gap-2">
                  {exp.sessions.map((s) => (
                    <button key={s} onClick={() => setSelectedSession(s)} className={`px-4 py-2.5 text-body rounded-sm border transition-colors ${selectedSession === s ? 'border-brand-600 bg-brand-50 text-brand-600 font-medium' : 'border-neutral-300 text-neutral-600 hover:border-neutral-400'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="card p-6 sticky top-20">
              <h3 className="text-listing font-bold text-neutral-900 mb-4">{tp('bookingSummary')}</h3>
              <div className="space-y-2 text-body">
                <div className="flex justify-between"><span className="text-neutral-500">{tp('participants')}</span><span className="font-medium text-neutral-900">{bookingState.searchParams.adults}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">{tp('ticketDate')}</span><span className="font-medium text-neutral-900">{selectedDate ? formatDate(selectedDate) : '-'}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">{tp('sessionLabel')}</span><span className="font-medium text-neutral-900">{selectedSession}</span></div>
              </div>
              <div className="border-t border-neutral-200 pt-4 mt-4">
                <div className="flex justify-between"><span className="text-body font-medium text-neutral-500">{tp('pricePerPerson')}</span><span className="text-body font-bold text-neutral-900">{formatCurrency(exp.price, exp.currency, 'TSh')}</span></div>
                <div className="flex justify-between mt-2"><span className="text-listing font-bold text-neutral-900">{tp('checkoutTotal')}</span><span className="text-listing font-bold text-brand-600">{formatCurrency(exp.price * bookingState.searchParams.adults, exp.currency, 'TSh')}</span></div>
              </div>
              <button onClick={handleContinue} className="btn-primary w-full mt-6">{tp('continueToReview')}</button>
              <p className="text-meta text-neutral-400 mt-4">{exp.cancellationPolicy}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
