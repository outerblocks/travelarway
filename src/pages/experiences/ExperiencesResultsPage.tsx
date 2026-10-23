import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Star, MapPin } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { EXPERIENCES } from '@/data/mockData';
import { GenericResultsSkeleton } from '@/components/shared/Skeletons';
import { LoadingState, EmptyResults, ErrorState, SearchSummaryBar } from '@/components/shared/States';
import { formatCurrency } from '@/utils/format';

const EXP_IMAGES: Record<string, string> = {
  'exp_001': 'https://images.pexels.com/photos/4404518/pexels-photo-4404518.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'exp_002': 'https://images.pexels.com/photos/7292744/pexels-photo-7292744.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'exp_003': 'https://images.pexels.com/photos/15993988/pexels-photo-15993988.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'exp_004': 'https://images.pexels.com/photos/28708299/pexels-photo-28708299.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
};

export function ExperiencesResultsPage() {
  const navigate = useNavigate();
  const { bookingState, setSearchParams } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [results, setResults] = useState<typeof EXPERIENCES>([]);

  const params = bookingState.searchParams;

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      try {
        let r = [...EXPERIENCES];
        if (params.origin) {
          r = r.filter((e) => e.city.toLowerCase().includes(params.origin!.toLowerCase()) || e.name.toLowerCase().includes(params.origin!.toLowerCase()));
        }
        if (r.length === 0 && !params.origin) r = EXPERIENCES;
        setResults(r);
        setLoading(false);
      } catch {
        setError(true);
        setLoading(false);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [params.origin]);

  const handleSelect = (exp: typeof EXPERIENCES[0]) => {
    setSearchParams({ ...params, extras: { ...params.extras, experienceId: exp.id } });
    navigate('/experiences/detail');
  };

  if (loading) return (
    <>
      <SearchSummaryBar><Link to="/" className="btn-ghost text-label"><ArrowLeft size={16} /> Modify search</Link></SearchSummaryBar>
      <GenericResultsSkeleton count={4} />
      <LoadingState message="Searching experiences..." />
    </>
  );

  if (error) return <ErrorState message="Unable to load experiences" onRetry={() => window.location.reload()} />;

  return (
    <>
      <SearchSummaryBar><Link to="/" className="btn-ghost text-label"><ArrowLeft size={16} /> Modify search</Link><span className="text-body font-medium text-neutral-900">Experiences</span></SearchSummaryBar>
      <div className="section-container py-6">
        <h1 className="text-page font-bold text-neutral-900 mb-6">{results.length} experiences found</h1>
        {results.length === 0 ? (
          <EmptyResults message="No experiences found" subMessage="Try a different destination or activity." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((exp) => (
              <div key={exp.id} className="card overflow-hidden hover:shadow-md transition-shadow animate-fade-in cursor-pointer" onClick={() => handleSelect(exp)}>
                <img src={EXP_IMAGES[exp.id]} alt={exp.name} className="w-full h-48 object-cover" loading="lazy" />
                <div className="p-4">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-meta font-medium text-brand-600 uppercase tracking-wide">{exp.category}</span>
                    <span className="text-meta text-neutral-400">·</span>
                    <span className="text-meta text-neutral-500 flex items-center gap-1"><Star size={12} className="text-warning-500 fill-warning-500" /> {exp.rating}</span>
                  </div>
                  <h3 className="text-listing font-bold text-neutral-900 mb-1">{exp.name}</h3>
                  <p className="text-meta text-neutral-500 flex items-center gap-1 mb-2"><MapPin size={12} /> {exp.location}, {exp.city}</p>
                  <p className="text-meta text-neutral-500 flex items-center gap-1 mb-3"><Clock size={12} /> {exp.duration}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                    <p className="text-body font-bold text-brand-600">{formatCurrency(exp.price, exp.currency, 'TSh')}<span className="text-meta text-neutral-500 font-normal"> /person</span></p>
                    <span className="text-meta text-neutral-500">{exp.availableDates.length} dates</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
